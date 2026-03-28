import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PlansService } from './plans.service.js';
import { PlanResponseDto } from './dto/plan-response.dto.js';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all available plans' })
  @ApiResponse({ status: 200, description: 'List of plans', type: [PlanResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<PlanResponseDto[]> {
    return this.plansService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current user plan with limits' })
  @ApiResponse({ status: 200, description: 'User plan', type: PlanResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPlan(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<PlanResponseDto> {
    const plan = await this.plansService.getUserPlan(user.sub);
    return {
      id: plan.id,
      name: plan.name,
      maxGroupsCreated: plan.maxGroupsCreated,
      maxMemberships: plan.maxMemberships,
      maxMembersPerGroup: plan.maxMembersPerGroup,
      maxTournamentsPerGroup: plan.maxTournamentsPerGroup,
    };
  }
}
