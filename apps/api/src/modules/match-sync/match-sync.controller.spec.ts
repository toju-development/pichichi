import { Test, TestingModule } from '@nestjs/testing';

import { MatchSyncController } from './match-sync.controller';
import { MatchSyncService } from './match-sync.service';
import type { SyncResult } from './match-sync.service';

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockMatchSyncService = {
  triggerManualSync: jest.fn(),
  setSyncEnabled: jest.fn(),
  isSyncEnabled: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createController(): Promise<MatchSyncController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [MatchSyncController],
    providers: [
      { provide: MatchSyncService, useValue: mockMatchSyncService },
    ],
  }).compile();

  return module.get<MatchSyncController>(MatchSyncController);
}

// =============================================================================
// Tests
// =============================================================================

describe('MatchSyncController', () => {
  let controller: MatchSyncController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  // ---------------------------------------------------------------------------
  // POST /match-sync/trigger
  // ---------------------------------------------------------------------------

  describe('triggerSync', () => {
    it('should call matchSyncService.triggerManualSync()', async () => {
      const syncResult: SyncResult = {
        matchesChecked: 5,
        matchesUpdated: 3,
        tournamentsFinished: 0,
        apiCallsMade: 1,
        errors: [],
      };

      mockMatchSyncService.triggerManualSync.mockResolvedValue(syncResult);
      mockMatchSyncService.isSyncEnabled.mockReturnValue(true);

      await controller.triggerSync();

      expect(mockMatchSyncService.triggerManualSync).toHaveBeenCalledTimes(1);
    });

    it('should map service result to SyncResultDto correctly', async () => {
      const syncResult: SyncResult = {
        matchesChecked: 10,
        matchesUpdated: 7,
        tournamentsFinished: 1,
        apiCallsMade: 2,
        errors: [],
      };

      mockMatchSyncService.triggerManualSync.mockResolvedValue(syncResult);
      mockMatchSyncService.isSyncEnabled.mockReturnValue(true);

      const result = await controller.triggerSync();

      expect(result).toEqual({
        syncedMatches: 7,
        errors: [],
        message: 'Synced 7 matches with 0 errors',
        syncEnabled: true,
      });
    });

    it('should include errors in the response when present', async () => {
      const syncResult: SyncResult = {
        matchesChecked: 5,
        matchesUpdated: 2,
        tournamentsFinished: 0,
        apiCallsMade: 1,
        errors: ['Failed to fetch fixture 123: timeout'],
      };

      mockMatchSyncService.triggerManualSync.mockResolvedValue(syncResult);
      mockMatchSyncService.isSyncEnabled.mockReturnValue(false);

      const result = await controller.triggerSync();

      expect(result).toEqual({
        syncedMatches: 2,
        errors: ['Failed to fetch fixture 123: timeout'],
        message: 'Synced 2 matches with 1 errors',
        syncEnabled: false,
      });
    });

    it('should reflect syncEnabled=false when sync is disabled', async () => {
      const syncResult: SyncResult = {
        matchesChecked: 0,
        matchesUpdated: 0,
        tournamentsFinished: 0,
        apiCallsMade: 0,
        errors: [],
      };

      mockMatchSyncService.triggerManualSync.mockResolvedValue(syncResult);
      mockMatchSyncService.isSyncEnabled.mockReturnValue(false);

      const result = await controller.triggerSync();

      expect(result.syncEnabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /match-sync/toggle
  // ---------------------------------------------------------------------------

  describe('toggleSync', () => {
    it('should call setSyncEnabled(true) when body is { enabled: true }', async () => {
      const result = await controller.toggleSync({ enabled: true });

      expect(mockMatchSyncService.setSyncEnabled).toHaveBeenCalledWith(true);
      expect(result).toEqual({
        syncEnabled: true,
        message: 'Automatic sync enabled',
      });
    });

    it('should call setSyncEnabled(false) when body is { enabled: false }', async () => {
      const result = await controller.toggleSync({ enabled: false });

      expect(mockMatchSyncService.setSyncEnabled).toHaveBeenCalledWith(false);
      expect(result).toEqual({
        syncEnabled: false,
        message: 'Automatic sync disabled',
      });
    });

    it('should return proper response shape with message', async () => {
      const result = await controller.toggleSync({ enabled: true });

      expect(result).toHaveProperty('syncEnabled');
      expect(result).toHaveProperty('message');
      expect(typeof result.syncEnabled).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /match-sync/status
  // ---------------------------------------------------------------------------

  describe('getStatus', () => {
    it('should return { syncEnabled: true } when sync is enabled', async () => {
      mockMatchSyncService.isSyncEnabled.mockReturnValue(true);

      const result = await controller.getStatus();

      expect(result).toEqual({ syncEnabled: true });
      expect(mockMatchSyncService.isSyncEnabled).toHaveBeenCalledTimes(1);
    });

    it('should return { syncEnabled: false } when sync is disabled', async () => {
      mockMatchSyncService.isSyncEnabled.mockReturnValue(false);

      const result = await controller.getStatus();

      expect(result).toEqual({ syncEnabled: false });
      expect(mockMatchSyncService.isSyncEnabled).toHaveBeenCalledTimes(1);
    });
  });
});
