import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/events' })
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  // ---------------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------------

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---------------------------------------------------------------------------
  // Room management
  // ---------------------------------------------------------------------------

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ): void {
    const { room } = payload;
    void client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ): void {
    const { room } = payload;
    void client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  // ---------------------------------------------------------------------------
  // Emit methods (called by services)
  // ---------------------------------------------------------------------------

  emitMatchScoreUpdate(matchId: string, data: unknown): void {
    this.server.to(`match:${matchId}`).emit('match:score_update', data);
    this.logger.debug(`Emitted match:score_update to match:${matchId}`);
  }

  emitMatchStatusUpdate(matchId: string, data: unknown): void {
    this.server.to(`match:${matchId}`).emit('match:status_update', data);
    this.logger.debug(`Emitted match:status_update to match:${matchId}`);
  }

  emitLeaderboardUpdate(groupId: string, data: unknown): void {
    this.server.to(`group:${groupId}`).emit('leaderboard:update', data);
    this.logger.debug(`Emitted leaderboard:update to group:${groupId}`);
  }

  emitPredictionPointsCalculated(
    groupId: string,
    matchId: string,
    data: unknown,
  ): void {
    this.server
      .to(`group:${groupId}`)
      .emit('prediction:points_calculated', { ...Object(data), matchId });
    this.logger.debug(
      `Emitted prediction:points_calculated to group:${groupId} for match:${matchId}`,
    );
  }

  emitNewNotification(userId: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit('notification:new', data);
    this.logger.debug(`Emitted notification:new to user:${userId}`);
  }
}
