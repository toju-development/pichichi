import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createPublicKey, type JsonWebKeyInput } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import * as jsonwebtoken from 'jsonwebtoken';
import { PrismaService } from '../../config/prisma.service.js';
import { UsersService, type UserWithPlan } from '../users/users.service.js';
import type { AuthResponseDto } from './dto/auth-response.dto.js';

interface AppleJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  email?: string;
  email_verified?: string | boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const BCRYPT_SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY = '30d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;
  private readonly appleClientId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.appleClientId = this.configService.get<string>('APPLE_CLIENT_ID', '');
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async loginWithGoogle(token: string): Promise<AuthResponseDto> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: this.googleClientId,
    }).catch(() => {
      throw new UnauthorizedException('Invalid Google token');
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const displayName = payload.name ?? payload.email.split('@')[0] ?? 'User';
    const avatarUrl = payload.picture;

    const user = await this.findOrCreateUser(
      AuthProvider.GOOGLE,
      payload.sub,
      payload.email,
      displayName,
      avatarUrl,
    );

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(tokens, user);
  }

  async loginWithApple(
    token: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthResponseDto> {
    const applePayload = await this.verifyAppleToken(token);

    if (!applePayload.sub) {
      throw new UnauthorizedException('Invalid Apple token payload');
    }

    const email = applePayload.email ?? `${applePayload.sub}@privaterelay.appleid.com`;
    const nameParts = [firstName, lastName].filter(Boolean).join(' ');
    const displayName = nameParts || (email.split('@')[0] ?? 'User');

    const user = await this.findOrCreateUser(
      AuthProvider.APPLE,
      applePayload.sub,
      email,
      displayName,
    );

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(tokens, user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    let payload: { sub: string; email: string };

    try {
      payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { plan: true },
    });

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const isTokenValid = await this.validateRefreshToken(
      refreshToken,
      user.refreshToken,
    );

    if (!isTokenValid) {
      // Potential token reuse detected — revoke all tokens for safety
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });

      this.logger.warn(
        `Refresh token reuse detected for user ${user.id}. All tokens revoked.`,
      );

      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(tokens, user);
  }

  async devLogin(email: string, displayName?: string): Promise<AuthResponseDto> {
    const name = displayName ?? email.split('@')[0] ?? 'Dev User';
    const syntheticProviderId = `dev-${email}`;

    const user = await this.findOrCreateUser(
      AuthProvider.GOOGLE,
      syntheticProviderId,
      email,
      name,
    );

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(tokens, user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async generateTokens(userId: string): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);
    const jwtPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async findOrCreateUser(
    provider: AuthProvider,
    providerId: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
  ): Promise<UserWithPlan> {
    // First try to find by provider + providerId (unique constraint)
    const existingByProvider = await this.usersService.findByProviderAndId(
      provider,
      providerId,
    );

    if (existingByProvider) {
      return existingByProvider;
    }

    // Then try to find by email — they might have signed up with a different provider
    const existingByEmail = await this.usersService.findByEmail(email);

    if (existingByEmail) {
      // Update provider info if they're using a new provider
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authProvider: provider,
          authProviderId: providerId,
          avatarUrl: avatarUrl ?? existingByEmail.avatarUrl,
        },
        include: { plan: true },
      });
    }

    // Create new user
    const username = await this.generateUsername(displayName);

    return this.prisma.user.create({
      data: {
        email,
        displayName,
        username,
        avatarUrl: avatarUrl ?? null,
        authProvider: provider,
        authProviderId: providerId,
      },
      include: { plan: true },
    });
  }

  private async generateUsername(displayName: string): Promise<string> {
    const base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'user';

    const MAX_RETRIES = 10;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const suffix = Math.floor(1000 + Math.random() * 9000).toString();
      const candidate = `${base}${suffix}`;

      const existing = await this.prisma.user.findUnique({
        where: { username: candidate },
      });

      if (!existing) {
        return candidate;
      }
    }

    // Fallback: use timestamp-based suffix
    return `${base}${Date.now().toString(36)}`;
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedToken = await this.hashRefreshToken(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, BCRYPT_SALT_ROUNDS);
  }

  private async validateRefreshToken(
    token: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  private async verifyAppleToken(token: string): Promise<AppleJwtPayload> {
    try {
      // Apple's public keys endpoint for JWT verification
      const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';

      // Decode the JWT header to get the key ID (kid)
      const decoded = jsonwebtoken.decode(token, { complete: true });

      if (!decoded?.header?.kid) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      // Fetch Apple's public keys
      const response = await fetch(APPLE_KEYS_URL);
      const { keys } = (await response.json()) as { keys: Record<string, unknown>[] };

      // Find the matching key
      const matchingKey = keys.find(
        (key) => key['kid'] === decoded.header.kid,
      );

      if (!matchingKey) {
        throw new UnauthorizedException('Apple token signing key not found');
      }

      // Convert JWK to PEM using Node.js crypto
      const publicKey = createPublicKey({
        key: matchingKey as JsonWebKeyInput['key'],
        format: 'jwk',
      });

      const pem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

      // Verify the token
      const payload = jsonwebtoken.verify(token, pem, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: this.appleClientId,
      }) as AppleJwtPayload;

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Apple token verification failed', error);
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  /**
   * Build the standard auth response from tokens + user entity.
   * Single source of truth — avoids inline user-object duplication.
   */
  private buildAuthResponse(
    tokens: TokenPair,
    user: UserWithPlan,
  ): AuthResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: AuthService.toUserDto(user),
    };
  }

  /**
   * Map a Prisma User+Plan entity to the shared UserDto shape.
   * Static so it can be reused from other modules if needed.
   */
  static toUserDto(user: UserWithPlan) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      plan: {
        id: user.plan.id,
        name: user.plan.name,
        maxGroupsCreated: user.plan.maxGroupsCreated,
        maxMemberships: user.plan.maxMemberships,
        maxMembersPerGroup: user.plan.maxMembersPerGroup,
        maxTournamentsPerGroup: user.plan.maxTournamentsPerGroup,
      },
      createdAt: user.createdAt,
    };
  }

}
