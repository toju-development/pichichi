import {
  Body,
  Controller,
  Get,
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

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { MatchSyncService } from './match-sync.service.js';
import { SyncResultDto } from './dto/trigger-sync.dto.js';
import { ToggleSyncDto } from './dto/toggle-sync.dto.js';

@ApiTags('match-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('match-sync')
export class MatchSyncController {
  constructor(private readonly matchSyncService: MatchSyncService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger a match sync cycle' })
  @ApiResponse({ status: 200, description: 'Sync completed', type: SyncResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async triggerSync(): Promise<SyncResultDto> {
    const result = await this.matchSyncService.triggerManualSync();

    return {
      syncedMatches: result.matchesUpdated,
      errors: result.errors,
      message: `Synced ${result.matchesUpdated} matches with ${result.errors.length} errors`,
      syncEnabled: this.matchSyncService.isSyncEnabled(),
    };
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable automatic match sync' })
  @ApiResponse({ status: 200, description: 'Sync toggle updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleSync(
    @Body() dto: ToggleSyncDto,
  ): Promise<{ syncEnabled: boolean; message: string }> {
    this.matchSyncService.setSyncEnabled(dto.enabled);

    return {
      syncEnabled: dto.enabled,
      message: `Automatic sync ${dto.enabled ? 'enabled' : 'disabled'}`,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current match sync status' })
  @ApiResponse({ status: 200, description: 'Current sync status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(): Promise<{ syncEnabled: boolean }> {
    return {
      syncEnabled: this.matchSyncService.isSyncEnabled(),
    };
  }
}
