import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationResponseDto } from './dto/notification-response.dto.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items to return (default 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Items to skip (default 0)' })
  @ApiResponse({ status: 200, description: 'List of notifications', type: [NotificationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMine(
    @CurrentUser() user: JwtUserPayload,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findByUser(user.sub, limit, offset);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: NotificationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device for push notifications (FCM)' })
  @ApiResponse({ status: 200, description: 'Device registered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerDevice(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: RegisterDeviceDto,
  ): Promise<void> {
    return this.notificationsService.registerDevice(user.sub, dto.fcmToken);
  }
}
