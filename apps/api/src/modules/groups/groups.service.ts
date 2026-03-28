import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import { PlansService } from '../plans/plans.service.js';
import type { CreateGroupDto } from './dto/create-group.dto.js';
import type { UpdateGroupDto } from './dto/update-group.dto.js';
import type { GroupResponseDto } from './dto/group-response.dto.js';
import type { GroupMemberResponseDto } from './dto/group-member-response.dto.js';

// Characters that avoid ambiguity: no 0/O, 1/I/L
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create group
  // ---------------------------------------------------------------------------

  async create(
    userId: string,
    dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    // Plan limit checks
    await this.plansService.enforceCanCreateGroup(userId);

    // Cap maxMembers to the plan's limit
    const planMaxMembers = await this.plansService.getMaxMembersPerGroup(userId);
    const effectiveMaxMembers = dto.maxMembers !== undefined
      ? Math.min(dto.maxMembers, planMaxMembers)
      : planMaxMembers;

    const inviteCode = await this.generateUniqueInviteCode();

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        inviteCode,
        createdBy: userId,
        maxMembers: effectiveMaxMembers,
        members: {
          create: {
            userId,
            role: GroupMemberRole.ADMIN,
          },
        },
        ...(dto.tournamentId
          ? {
              groupTournaments: {
                create: { tournamentId: dto.tournamentId },
              },
            }
          : {}),
      },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      createdBy: group.createdBy,
      maxMembers: group.maxMembers,
      memberCount: group._count.members,
      userRole: GroupMemberRole.ADMIN,
      userPoints: 0,
      createdAt: group.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // List user's groups
  // ---------------------------------------------------------------------------

  async findAllByUser(userId: string): Promise<GroupResponseDto[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId, isActive: true },
      include: {
        group: {
          include: {
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships
      .filter((m) => m.group.isActive)
      .map((m) => ({
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        inviteCode:
          m.role === GroupMemberRole.ADMIN ? m.group.inviteCode : null,
        createdBy: m.group.createdBy,
        maxMembers: m.group.maxMembers,
        memberCount: m.group._count.members,
        userRole: m.role,
        userPoints: 0,
        createdAt: m.group.createdAt,
      }));
  }

  // ---------------------------------------------------------------------------
  // Get group by ID
  // ---------------------------------------------------------------------------

  async findById(groupId: string, userId: string): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.findActiveMembership(groupId, userId);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode:
        membership.role === GroupMemberRole.ADMIN ? group.inviteCode : null,
      createdBy: group.createdBy,
      maxMembers: group.maxMembers,
      memberCount: group._count.members,
      userRole: membership.role,
      userPoints: 0,
      createdAt: group.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Update group (admin only)
  // ---------------------------------------------------------------------------

  async update(
    groupId: string,
    userId: string,
    dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    await this.requireAdmin(groupId, userId);

    // Validate maxMembers if provided
    let effectiveMaxMembers: number | undefined;

    if (dto.maxMembers !== undefined) {
      // Cannot set below current active member count
      const currentMembers = await this.prisma.groupMember.count({
        where: { groupId, isActive: true },
      });

      if (dto.maxMembers < currentMembers) {
        throw new BadRequestException(
          `No podés establecer el máximo en ${dto.maxMembers} porque el grupo ` +
          `ya tiene ${currentMembers} miembros activos.`,
        );
      }

      // Cap to plan limit
      const group = await this.prisma.group.findUnique({
        where: { id: groupId, isActive: true },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      const planMaxMembers = await this.plansService.getMaxMembersPerGroup(
        group.createdBy,
      );
      effectiveMaxMembers = Math.min(dto.maxMembers, planMaxMembers);
    }

    const group = await this.prisma.group.update({
      where: { id: groupId, isActive: true },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(effectiveMaxMembers !== undefined
          ? { maxMembers: effectiveMaxMembers }
          : {}),
      },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      createdBy: group.createdBy,
      maxMembers: group.maxMembers,
      memberCount: group._count.members,
      userRole: GroupMemberRole.ADMIN,
      userPoints: 0,
      createdAt: group.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Delete group (conditional: soft-delete or archive, admin only)
  // ---------------------------------------------------------------------------

  async delete(
    groupId: string,
    userId: string,
  ): Promise<{ action: 'deleted' | 'archived' }> {
    await this.requireAdmin(groupId, userId);

    // Check if the group has any predictions or bonus predictions
    const [predictionCount, bonusPredictionCount] = await Promise.all([
      this.prisma.prediction.count({ where: { groupId } }),
      this.prisma.bonusPrediction.count({ where: { groupId } }),
    ]);

    const hasData = predictionCount > 0 || bonusPredictionCount > 0;

    await this.prisma.$transaction([
      this.prisma.groupMember.updateMany({
        where: { groupId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.group.update({
        where: { id: groupId, isActive: true },
        data: { isActive: false },
      }),
    ]);

    return { action: hasData ? 'archived' : 'deleted' };
  }

  // ---------------------------------------------------------------------------
  // Join group by invite code
  // ---------------------------------------------------------------------------

  async joinByCode(
    userId: string,
    inviteCode: string,
  ): Promise<GroupResponseDto> {
    // Check user's membership limit before anything else (outside tx is fine —
    // worst case they get a slightly stale count and the tx catches the real limit)
    await this.plansService.enforceCanJoinGroup(userId);

    return this.prisma.$transaction(
      async (tx) => {
        const group = await tx.group.findUnique({
          where: { inviteCode, isActive: true },
          include: {
            _count: {
              select: { members: { where: { isActive: true } } },
            },
          },
        });

        if (!group) {
          throw new NotFoundException(
            'Invalid invite code or group no longer active',
          );
        }

        // Check if already a member (active or inactive)
        const existing = await tx.groupMember.findUnique({
          where: { groupId_userId: { groupId: group.id, userId } },
        });

        if (existing?.isActive) {
          throw new ConflictException(
            'You are already a member of this group',
          );
        }

        // Check group capacity against creator's plan limit — inside tx
        const creatorPlan = await this.plansService.getUserPlan(group.createdBy);
        const effectiveLimit = Math.min(
          group.maxMembers,
          creatorPlan.maxMembersPerGroup,
        );

        if (group._count.members >= effectiveLimit) {
          throw new ForbiddenException(
            `El grupo alcanzó el máximo de ${effectiveLimit} miembros.`,
          );
        }

        // Re-activate or create membership
        if (existing && !existing.isActive) {
          await tx.groupMember.update({
            where: { id: existing.id },
            data: { isActive: true, role: GroupMemberRole.MEMBER },
          });
        } else {
          await tx.groupMember.create({
            data: {
              groupId: group.id,
              userId,
              role: GroupMemberRole.MEMBER,
            },
          });
        }

        // Re-count after join
        const memberCount = await tx.groupMember.count({
          where: { groupId: group.id, isActive: true },
        });

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          inviteCode: null,
          createdBy: group.createdBy,
          maxMembers: group.maxMembers,
          memberCount,
          userRole: GroupMemberRole.MEMBER,
          userPoints: 0,
          createdAt: group.createdAt,
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Get group members
  // ---------------------------------------------------------------------------

  async getMembers(
    groupId: string,
    userId: string,
  ): Promise<GroupMemberResponseDto[]> {
    await this.requireMembership(groupId, userId);

    const members = await this.prisma.groupMember.findMany({
      where: { groupId, isActive: true },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      displayName: m.user.displayName,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  // ---------------------------------------------------------------------------
  // Remove member (admin only)
  // ---------------------------------------------------------------------------

  async removeMember(
    groupId: string,
    adminId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.requireAdmin(groupId, adminId);

    if (adminId === targetUserId) {
      throw new BadRequestException(
        'Cannot remove yourself. Use the leave endpoint instead',
      );
    }

    const targetMembership = await this.findActiveMembership(
      groupId,
      targetUserId,
    );

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this group');
    }

    await this.prisma.groupMember.update({
      where: { id: targetMembership.id },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Leave group
  // ---------------------------------------------------------------------------

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const membership = await this.findActiveMembership(groupId, userId);

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    // Count all active members (not just admins)
    const activeMemberCount = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    // Case 1: Last member leaving → deactivate membership AND group
    if (activeMemberCount <= 1) {
      await this.prisma.$transaction([
        this.prisma.groupMember.update({
          where: { id: membership.id },
          data: { isActive: false },
        }),
        this.prisma.group.update({
          where: { id: groupId },
          data: { isActive: false },
        }),
      ]);
      return;
    }

    // Case 2: Sole admin but other members exist → auto-promote oldest member
    if (membership.role === GroupMemberRole.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupMemberRole.ADMIN,
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        // Find the oldest active non-admin member to promote
        const nextAdmin = await this.prisma.groupMember.findFirst({
          where: {
            groupId,
            isActive: true,
            userId: { not: userId },
            role: GroupMemberRole.MEMBER,
          },
          orderBy: { joinedAt: 'asc' },
        });

        if (nextAdmin) {
          await this.prisma.$transaction([
            this.prisma.groupMember.update({
              where: { id: nextAdmin.id },
              data: { role: GroupMemberRole.ADMIN },
            }),
            this.prisma.groupMember.update({
              where: { id: membership.id },
              data: { isActive: false },
            }),
          ]);
          return;
        }
      }
    }

    // Case 3: Not sole admin, or not admin at all → just leave
    await this.prisma.groupMember.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Add tournament to group (admin only)
  // ---------------------------------------------------------------------------

  async addTournament(
    groupId: string,
    userId: string,
    tournamentId: string,
  ): Promise<{ groupId: string; tournamentId: string }> {
    await this.requireAdmin(groupId, userId);

    // Get group creator to check their plan limits
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.plansService.enforceCanAddTournament(groupId, group.createdBy);

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, isActive: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const existing = await this.prisma.groupTournament.findUnique({
      where: { groupId_tournamentId: { groupId, tournamentId } },
    });

    if (existing) {
      throw new ConflictException(
        'Tournament is already associated with this group',
      );
    }

    const gt = await this.prisma.groupTournament.create({
      data: { groupId, tournamentId },
    });

    return { groupId: gt.groupId, tournamentId: gt.tournamentId };
  }

  // ---------------------------------------------------------------------------
  // Get group tournaments
  // ---------------------------------------------------------------------------

  async getGroupTournaments(groupId: string, userId: string) {
    await this.requireMembership(groupId, userId);

    const groupTournaments = await this.prisma.groupTournament.findMany({
      where: { groupId },
      include: { tournament: true },
      orderBy: { tournament: { startDate: 'asc' } },
    });

    return groupTournaments.map((gt) => ({
      id: gt.tournament.id,
      name: gt.tournament.name,
      slug: gt.tournament.slug,
      type: gt.tournament.type,
      description: gt.tournament.description,
      logoUrl: gt.tournament.logoUrl,
      startDate: gt.tournament.startDate,
      endDate: gt.tournament.endDate,
      status: gt.tournament.status,
    }));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async generateUniqueInviteCode(): Promise<string> {
    const MAX_RETRIES = 10;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let code = '';

      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        const idx = Math.floor(Math.random() * INVITE_CODE_CHARS.length);
        code += INVITE_CODE_CHARS[idx];
      }

      const existing = await this.prisma.group.findUnique({
        where: { inviteCode: code },
      });

      if (!existing) {
        return code;
      }
    }

    // Fallback: timestamp-based
    const fallback = Date.now()
      .toString(36)
      .toUpperCase()
      .slice(-INVITE_CODE_LENGTH)
      .padStart(INVITE_CODE_LENGTH, 'A');

    this.logger.warn('Invite code generation exhausted retries, using fallback');
    return fallback;
  }

  private async findActiveMembership(groupId: string, userId: string) {
    return this.prisma.groupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });
  }

  private async requireMembership(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.findActiveMembership(groupId, userId);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  private async requireAdmin(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.findActiveMembership(groupId, userId);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (membership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can perform this action');
    }
  }
}
