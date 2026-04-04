import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { NotificationResponseDto } from './dto/notification-response.dto.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create notification + emit via WebSocket + push (if fcmToken)
  // ---------------------------------------------------------------------------

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    const responseDto = this.toResponseDto(notification);

    // Attempt push notification if user has an FCM token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      this.sendPush(user.fcmToken, title, body, data);
    }

    return responseDto;
  }

  // ---------------------------------------------------------------------------
  // List user notifications (paginated)
  // ---------------------------------------------------------------------------

  async findByUser(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications.map((n) => this.toResponseDto(n));
  }

  // ---------------------------------------------------------------------------
  // Mark single notification as read (validate ownership)
  // ---------------------------------------------------------------------------

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return this.toResponseDto(updated);
  }

  // ---------------------------------------------------------------------------
  // Mark all user notifications as read
  // ---------------------------------------------------------------------------

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  // ---------------------------------------------------------------------------
  // Register device FCM token
  // ---------------------------------------------------------------------------

  async registerDevice(userId: string, fcmToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    this.logger.log(`FCM token registered for user ${userId}`);
  }

  // ---------------------------------------------------------------------------
  // Get unread notification count
  // ---------------------------------------------------------------------------

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private sendPush(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): void {
    // TODO: Implement actual FCM push notification when Firebase is configured.
    // This will use firebase-admin SDK to send the notification.
    this.logger.debug(
      `[FCM STUB] Push to token=${fcmToken.substring(0, 10)}... title="${title}" body="${body}" data=${JSON.stringify(data)}`,
    );
  }

  private toResponseDto(
    notification: {
      id: string;
      type: NotificationType;
      title: string;
      body: string;
      data: unknown;
      isRead: boolean;
      createdAt: Date;
    },
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
