import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { DashboardService } from './dashboard.service.js';
import type { DashboardResponseDto } from '@pichichi/shared';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get home screen dashboard data' })
  @ApiQuery({
    name: 'tz',
    required: false,
    description: 'IANA timezone (e.g. America/Argentina/Buenos_Aires). Defaults to UTC.',
    example: 'America/Argentina/Buenos_Aires',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @CurrentUser() user: JwtUserPayload,
    @Query('tz') tz?: string,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard(user.sub, tz);
  }
}
