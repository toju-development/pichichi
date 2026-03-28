/**
 * PlanService — centralized plan limit enforcement.
 *
 * Every module that needs to check a plan limit injects this service
 * and calls a single method. The service resolves the user's plan
 * and compares current usage against the limit.
 *
 * Adding a new limit:
 *   1. Add a column to the Plan model (Prisma migration with DEFAULT)
 *   2. Add a method here (e.g. canDoX)
 *   3. Call it from the relevant service
 */

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Plan } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { PlanResponseDto } from './dto/plan-response.dto.js';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  async findAll(): Promise<PlanResponseDto[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return plans.map((p) => this.toDto(p));
  }

  async findById(planId: string): Promise<PlanResponseDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.toDto(plan);
  }

  async getUserPlan(userId: string): Promise<Plan> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.plan;
  }

  // ---------------------------------------------------------------------------
  // Limit enforcement — Groups
  // ---------------------------------------------------------------------------

  /**
   * Check if user can create a new group.
   * Throws ForbiddenException if the limit is reached.
   */
  async enforceCanCreateGroup(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);

    const groupsCreated = await this.prisma.group.count({
      where: { createdBy: userId, isActive: true },
    });

    if (groupsCreated >= plan.maxGroupsCreated) {
      throw new ForbiddenException(
        `Tu plan ${plan.name} permite crear hasta ${plan.maxGroupsCreated} grupos. ` +
        `Ya tenés ${groupsCreated}.`,
      );
    }
  }

  /**
   * Check if user can join another group (total memberships).
   * Throws ForbiddenException if the limit is reached.
   */
  async enforceCanJoinGroup(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);

    const memberships = await this.prisma.groupMember.count({
      where: { userId, isActive: true },
    });

    if (memberships >= plan.maxMemberships) {
      throw new ForbiddenException(
        `Tu plan ${plan.name} permite participar en hasta ${plan.maxMemberships} grupos. ` +
        `Ya estás en ${memberships}.`,
      );
    }
  }

  /**
   * Get the max members per group allowed by the creator's plan.
   * Used to cap `maxMembers` when creating or updating a group.
   */
  async getMaxMembersPerGroup(userId: string): Promise<number> {
    const plan = await this.getUserPlan(userId);
    return plan.maxMembersPerGroup;
  }

  /**
   * Check if a group can accept more members based on the creator's plan.
   * Throws ForbiddenException if the group is at capacity.
   */
  async enforceGroupMemberCapacity(
    groupId: string,
    creatorId: string,
  ): Promise<void> {
    const plan = await this.getUserPlan(creatorId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: { where: { isActive: true } } } } },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // The effective limit is the MINIMUM of the group's maxMembers and the plan limit
    const effectiveLimit = Math.min(group.maxMembers, plan.maxMembersPerGroup);

    if (group._count.members >= effectiveLimit) {
      throw new ForbiddenException(
        `El grupo alcanzó el máximo de ${effectiveLimit} miembros.`,
      );
    }
  }

  /**
   * Check if a group can add another tournament based on the creator's plan.
   * Throws ForbiddenException if the limit is reached.
   */
  async enforceCanAddTournament(
    groupId: string,
    creatorId: string,
  ): Promise<void> {
    const plan = await this.getUserPlan(creatorId);

    const tournamentCount = await this.prisma.groupTournament.count({
      where: { groupId },
    });

    if (tournamentCount >= plan.maxTournamentsPerGroup) {
      throw new ForbiddenException(
        `El plan ${plan.name} permite hasta ${plan.maxTournamentsPerGroup} ` +
        `torneos por grupo. Este grupo ya tiene ${tournamentCount}.`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toDto(plan: Plan): PlanResponseDto {
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
