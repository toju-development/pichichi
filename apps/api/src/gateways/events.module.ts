import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module.js';
import { EventsGateway } from './events.gateway.js';

@Global()
@Module({
  imports: [AuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
