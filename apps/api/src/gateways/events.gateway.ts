import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
  // Broadcast — single event for all match-related updates
  // ---------------------------------------------------------------------------

  emitMatchUpdated(matchId: string): void {
    this.server.emit('match:updated', { matchId });
    this.logger.debug(`Broadcast match:updated for match ${matchId}`);
  }
}
