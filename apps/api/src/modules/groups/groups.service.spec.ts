import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '@prisma/client';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../config/prisma.service';
import { PlansService } from '../plans/plans.service';
import { NotificationsService } from '../notifications/notifications.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  group: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  groupMember: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  prediction: { count: jest.fn() },
  bonusPrediction: { count: jest.fn() },
  $transaction: jest.fn(),
};

const mockPlansService = {
  enforceCanCreateGroup: jest.fn(),
  enforceCanJoinGroup: jest.fn(),
  getMaxMembersPerGroup: jest.fn(),
  getUserPlan: jest.fn(),
};

const mockNotificationsService = {
  createMany: jest.fn(),
};

async function createService(): Promise<{
  service: GroupsService;
  prisma: typeof mockPrisma;
  plans: typeof mockPlansService;
  notifications: typeof mockNotificationsService;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GroupsService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: PlansService, useValue: mockPlansService },
      { provide: NotificationsService, useValue: mockNotificationsService },
    ],
  }).compile();

  return {
    service: module.get<GroupsService>(GroupsService),
    prisma: mockPrisma,
    plans: mockPlansService,
    notifications: mockNotificationsService,
  };
}

// =============================================================================
// GroupsService — joinByCode & GROUP_JOIN notifications
// =============================================================================

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: typeof mockPrisma;
  let plans: typeof mockPlansService;
  let notifications: typeof mockNotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service, prisma, plans, notifications } = await createService());
  });

  // ---------------------------------------------------------------------------
  // joinByCode — GROUP_JOIN notifications
  // ---------------------------------------------------------------------------

  describe('joinByCode — GROUP_JOIN notifications', () => {
    const userId = 'joining-user-id';
    const inviteCode = 'ABCD1234';
    const groupId = 'group-1';
    const groupName = 'Los Pibes';

    const baseGroup = {
      id: groupId,
      name: groupName,
      description: null,
      inviteCode,
      createdBy: 'creator-id',
      maxMembers: 20,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      _count: { members: 3 },
    };

    const txMock = {
      group: {
        findUnique: jest.fn(),
      },
      groupMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    beforeEach(() => {
      plans.enforceCanJoinGroup.mockResolvedValue(undefined);
      plans.getUserPlan.mockResolvedValue({ maxMembersPerGroup: 20 });
      notifications.createMany.mockResolvedValue({ count: 0 });

      // Set up transaction to call the callback with our tx mock
      prisma.$transaction.mockImplementation(
        (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
      );

      txMock.group.findUnique.mockResolvedValue(baseGroup);
      txMock.groupMember.findUnique.mockResolvedValue(null); // not a member
      txMock.groupMember.create.mockResolvedValue({ id: 'member-1' });
      txMock.groupMember.count.mockResolvedValue(4); // after join
    });

    it('should notify all 3 existing members when user joins (excluding joiner)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        displayName: 'Carlos Tevez',
      });
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
        { userId: 'member-2' },
        { userId: 'member-3' },
      ]);

      await service.joinByCode(userId, inviteCode);

      // Wait for fire-and-forget promise to settle
      await new Promise((resolve) => setImmediate(resolve));

      expect(notifications.createMany).toHaveBeenCalledTimes(1);
      const notifs = notifications.createMany.mock.calls[0][0];
      expect(notifs).toHaveLength(3);
      expect(notifs[0]).toEqual({
        userId: 'member-1',
        type: 'GROUP_JOIN',
        title: 'Carlos Tevez se unió a tu grupo',
        body: 'Los Pibes',
        data: { groupId },
      });
      expect(notifs[1]).toEqual({
        userId: 'member-2',
        type: 'GROUP_JOIN',
        title: 'Carlos Tevez se unió a tu grupo',
        body: 'Los Pibes',
        data: { groupId },
      });
      expect(notifs[2]).toEqual({
        userId: 'member-3',
        type: 'GROUP_JOIN',
        title: 'Carlos Tevez se unió a tu grupo',
        body: 'Los Pibes',
        data: { groupId },
      });
    });

    it('should exclude the joining user from notification recipients', async () => {
      prisma.user.findUnique.mockResolvedValue({
        displayName: 'Nuevo',
      });
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: 'creator-id' },
      ]);

      await service.joinByCode(userId, inviteCode);
      await new Promise((resolve) => setImmediate(resolve));

      // Verify the query excludes the joining user
      expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
        where: {
          groupId,
          isActive: true,
          userId: { not: userId },
        },
        select: { userId: true },
      });

      // Verify the joiner is NOT in the notifications
      const notifs = notifications.createMany.mock.calls[0][0];
      const recipientIds = notifs.map(
        (n: { userId: string }) => n.userId,
      );
      expect(recipientIds).not.toContain(userId);
    });

    it('should not create notifications when there are no other members', async () => {
      prisma.user.findUnique.mockResolvedValue({
        displayName: 'Solo Player',
      });
      prisma.groupMember.findMany.mockResolvedValue([]); // no other members

      await service.joinByCode(userId, inviteCode);
      await new Promise((resolve) => setImmediate(resolve));

      expect(notifications.createMany).not.toHaveBeenCalled();
    });

    it('should NOT block joinByCode when notification creation fails', async () => {
      prisma.user.findUnique.mockResolvedValue({
        displayName: 'Error User',
      });
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
      ]);
      notifications.createMany.mockRejectedValue(
        new Error('Notification service down'),
      );

      // joinByCode MUST complete successfully even when notifications fail
      const result = await service.joinByCode(userId, inviteCode);

      expect(result).toBeDefined();
      expect(result.id).toBe(groupId);
      expect(result.name).toBe(groupName);

      // Wait for fire-and-forget to settle (error is caught internally)
      await new Promise((resolve) => setImmediate(resolve));
    });

    it('should use correct title/body/data format', async () => {
      prisma.user.findUnique.mockResolvedValue({
        displayName: 'Juan Román Riquelme',
      });
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
      ]);

      await service.joinByCode(userId, inviteCode);
      await new Promise((resolve) => setImmediate(resolve));

      const notif = notifications.createMany.mock.calls[0][0][0];
      expect(notif.type).toBe('GROUP_JOIN');
      expect(notif.title).toBe('Juan Román Riquelme se unió a tu grupo');
      expect(notif.body).toBe(groupName);
      expect(notif.data).toEqual({ groupId });
    });

    it('should fallback to "Alguien" when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // user not found
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
      ]);

      await service.joinByCode(userId, inviteCode);
      await new Promise((resolve) => setImmediate(resolve));

      const notif = notifications.createMany.mock.calls[0][0][0];
      expect(notif.title).toBe('Alguien se unió a tu grupo');
    });

    it('should still throw NotFoundException for invalid invite code', async () => {
      txMock.group.findUnique.mockResolvedValue(null);

      await expect(
        service.joinByCode(userId, 'INVALID'),
      ).rejects.toThrow(NotFoundException);

      // No notifications should be created
      expect(notifications.createMany).not.toHaveBeenCalled();
    });

    it('should still throw ConflictException if already a member', async () => {
      txMock.groupMember.findUnique.mockResolvedValue({
        isActive: true,
      });

      await expect(
        service.joinByCode(userId, inviteCode),
      ).rejects.toThrow(ConflictException);

      expect(notifications.createMany).not.toHaveBeenCalled();
    });

    it('should still throw ForbiddenException when group is full', async () => {
      txMock.group.findUnique.mockResolvedValue({
        ...baseGroup,
        _count: { members: 20 },
      });

      await expect(
        service.joinByCode(userId, inviteCode),
      ).rejects.toThrow(ForbiddenException);

      expect(notifications.createMany).not.toHaveBeenCalled();
    });
  });
});
