import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { DevOnlyGuard } from '../../common/guards/dev-only.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { AppleAuthDto } from './dto/apple-auth.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { DevLoginDto } from './dto/dev-login.dto.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DevOnlyGuard)
  @ApiOperation({ summary: 'Dev-only login (bypasses OAuth, disabled in production)' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 403, description: 'Not available in production' })
  async devLogin(
    @Body() dto: DevLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.devLogin(dto.email, dto.displayName);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth token' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async loginWithGoogle(
    @Body() dto: GoogleAuthDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(dto.token);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Apple OAuth token' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Apple token' })
  async loginWithApple(
    @Body() dto: AppleAuthDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithApple(dto.token, dto.firstName, dto.lastName);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.sub);
    return { message: 'Logged out' };
  }
}
