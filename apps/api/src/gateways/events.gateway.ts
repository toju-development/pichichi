import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

interface SocketJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@WebSocketGateway({
  cors:
    process.env.NODE_ENV === 'production'
      ? {
          origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
          ) => {
            if (!origin || origin === 'null') return callback(null, true);
            const allowed = process.env.CORS_ORIGINS?.split(',') ?? [];
            if (allowed.includes(origin)) return callback(null, true);
            callback(new Error('Not allowed by CORS'));
          },
          credentials: true,
        }
      : true,
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------------

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn(
        `Rejecting socket ${client.id}: missing handshake auth token`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      if (!payload?.sub || !payload.email) {
        this.logger.warn(
          `Rejecting socket ${client.id}: invalid token payload`,
        );
        client.disconnect(true);
        return;
      }

      const data = client.data as Record<string, unknown>;
      data.userId = payload.sub;
      data.user = { sub: payload.sub, email: payload.email };

      this.logger.log(`Client connected: ${client.id} (user ${payload.sub})`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(
        `Rejecting socket ${client.id}: token verification failed (${reason})`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---------------------------------------------------------------------------
  // Broadcast — single event for all match-related updates
  // ---------------------------------------------------------------------------

  emitMatchUpdated(matchId: string): void {
    this.server.emit('match:updated', { matchId });
    this.logger.debug(`Broadcast match:updated for match ${matchId}`);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract the JWT from the socket handshake.
   * Primary source: `handshake.auth.token` (used by both mobile and web).
   * Fallback: `Authorization: Bearer <token>` header.
   */
  private extractToken(client: Socket): string | null {
    const authToken: unknown = client.handshake?.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header: unknown = client.handshake?.headers?.authorization;
    if (
      typeof header === 'string' &&
      header.toLowerCase().startsWith('bearer ')
    ) {
      const value = header.slice(7).trim();
      if (value.length > 0) return value;
    }

    return null;
  }
}
