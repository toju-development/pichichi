import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';
import { PlansModule } from '../plans/plans.module.js';

@Module({
  imports: [PlansModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
