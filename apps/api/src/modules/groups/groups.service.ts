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
import type { CreateGroupDto } from './dto/create-group.dto.js';
import type { UpdateGroupDto } from './dto/update-group.dto.js';
import type { GroupResponseDto } from './dto/group-response.dto.js';
import type { GroupMemberResponseDto } from './dto/group-member-response.dto.js';

const MAX_GROUP_MEMBERS = 50;

// Characters that avoid ambiguity: no 0/O, 1/I/L
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Create group
  // ---------------------------------------------------------------------------

  async create(
    userId: string,
    dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const inviteCode = await this.generateUniqueInviteCode();

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        inviteCode,
        createdBy: userId,
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
        inviteCode: m.group.inviteCode,
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
      inviteCode: group.inviteCode,
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

    const group = await this.prisma.group.update({
      where: { id: groupId, isActive: true },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
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
  // Delete group (soft delete, admin only)
  // ---------------------------------------------------------------------------

  async delete(groupId: string, userId: string): Promise<void> {
    await this.requireAdmin(groupId, userId);

    await this.prisma.group.update({
      where: { id: groupId },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Join group by invite code
  // ---------------------------------------------------------------------------

  async joinByCode(
    userId: string,
    inviteCode: string,
  ): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode, isActive: true },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    if (!group) {
      throw new NotFoundException('Invalid invite code or group no longer active');
    }

    // Check if already a member (active or inactive)
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existing?.isActive) {
      throw new ConflictException('You are already a member of this group');
    }

    if (group._count.members >= group.maxMembers) {
      throw new BadRequestException(
        `Group has reached the maximum of ${group.maxMembers} members`,
      );
    }

    // Re-activate or create membership
    if (existing && !existing.isActive) {
      await this.prisma.groupMember.update({
        where: { id: existing.id },
        data: { isActive: true, role: GroupMemberRole.MEMBER },
      });
    } else {
      await this.prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: GroupMemberRole.MEMBER,
        },
      });
    }

    // Re-count after join
    const memberCount = await this.prisma.groupMember.count({
      where: { groupId: group.id, isActive: true },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      createdBy: group.createdBy,
      maxMembers: group.maxMembers,
      memberCount,
      userRole: GroupMemberRole.MEMBER,
      userPoints: 0,
      createdAt: group.createdAt,
    };
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
  // Update member role (admin only)
  // ---------------------------------------------------------------------------

  async updateMemberRole(
    groupId: string,
    adminId: string,
    targetUserId: string,
    role: GroupMemberRole,
  ): Promise<GroupMemberResponseDto> {
    await this.requireAdmin(groupId, adminId);

    const targetMembership = await this.findActiveMembership(
      groupId,
      targetUserId,
    );

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this group');
    }

    // When promoting to ADMIN, transfer: demote the current admin
    if (role === GroupMemberRole.ADMIN && adminId !== targetUserId) {
      await this.prisma.$transaction([
        this.prisma.groupMember.updateMany({
          where: { groupId, userId: adminId, isActive: true },
          data: { role: GroupMemberRole.MEMBER },
        }),
        this.prisma.groupMember.update({
          where: { id: targetMembership.id },
          data: { role: GroupMemberRole.ADMIN },
        }),
      ]);
    } else {
      await this.prisma.groupMember.update({
        where: { id: targetMembership.id },
        data: { role },
      });
    }

    const updated = await this.prisma.groupMember.findUnique({
      where: { id: targetMembership.id },
      include: { user: true },
    });

    if (!updated) {
      throw new NotFoundException('Member not found');
    }

    return {
      id: updated.id,
      userId: updated.user.id,
      displayName: updated.user.displayName,
      username: updated.user.username,
      avatarUrl: updated.user.avatarUrl,
      role: updated.role,
      joinedAt: updated.joinedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Leave group
  // ---------------------------------------------------------------------------

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const membership = await this.findActiveMembership(groupId, userId);

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    // If user is admin, check they're not the only admin
    if (membership.role === GroupMemberRole.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupMemberRole.ADMIN,
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot leave the group as the sole admin. Transfer admin role first',
        );
      }
    }

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
