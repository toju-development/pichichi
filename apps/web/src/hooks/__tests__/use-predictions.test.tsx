/**
 * Smoke tests para los hooks de predictions. Cubren paridad con mobile en lo
 * crítico:
 *   - `usePredictions(groupId)` consume `predictionsApi.getMyPredictions(groupId)`
 *     y guarda con la query key `queryKeys.predictions.byGroup`.
 *   - `useGroupPredictions(groupId, matchId)` consume
 *     `getGroupPredictions(groupId, matchId)` y queda gated mientras alguno
 *     esté vacío.
 *   - `usePredictionStats(groupId)` y `useMemberPredictions(groupId, userId)`
 *     ídem (gate por id).
 *   - `useUpsertPrediction` invalida las 6 queries previstas (paridad mobile):
 *     predictions.byGroup, predictions.groupMatch, predictions.stats,
 *     leaderboard.byGroup, dashboard.all, groups.upcomingPredictions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type {
  PredictionDto,
  PredictionStatsDto,
  UserPredictionDto,
} from "@pichichi/shared";

const getMyPredictionsMock = vi.fn();
const getGroupPredictionsMock = vi.fn();
const getMyStatsMock = vi.fn();
const getMemberPredictionsMock = vi.fn();
const upsertPredictionMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    predictionsApi: {
      ...actual.predictionsApi,
      getMyPredictions: (...args: unknown[]) => getMyPredictionsMock(...args),
      getGroupPredictions: (...args: unknown[]) =>
        getGroupPredictionsMock(...args),
      getMyStats: (...args: unknown[]) => getMyStatsMock(...args),
      getMemberPredictions: (...args: unknown[]) =>
        getMemberPredictionsMock(...args),
      upsertPrediction: (...args: unknown[]) => upsertPredictionMock(...args),
    },
  };
});

import { queryKeys } from "@/hooks/query-keys";
import {
  useGroupPredictions,
  useMemberPredictions,
  usePredictions,
  usePredictionStats,
  useUpsertPrediction,
} from "@/hooks/use-predictions";

const predictionFixture: PredictionDto = {
  id: "p-1",
  userId: "u-1",
  matchId: "m-1",
  groupId: "g-1",
  predictedHome: 2,
  predictedAway: 1,
  pointsEarned: 0,
  pointType: null,
  createdAt: "2026-06-11T12:00:00.000Z",
  updatedAt: "2026-06-11T12:00:00.000Z",
};

const userPredictionFixture: UserPredictionDto = {
  id: "p-1",
  userId: "u-1",
  displayName: "Tester",
  avatarUrl: null,
  predictedHome: 2,
  predictedAway: 1,
  pointsEarned: 0,
  pointType: null,
};

const statsFixture: PredictionStatsDto = {
  totalPoints: 12,
  totalPredictions: 5,
  exactCount: 1,
  goalDiffCount: 1,
  winnerCount: 2,
  missCount: 1,
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { qc, Wrapper };
}

describe("usePredictions", () => {
  beforeEach(() => {
    getMyPredictionsMock.mockReset();
  });

  it("no dispara la fetch cuando groupId es vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => usePredictions(""), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMyPredictionsMock).not.toHaveBeenCalled();
  });

  it("consume getMyPredictions(groupId) y guarda con query key byGroup", async () => {
    getMyPredictionsMock.mockResolvedValue([predictionFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => usePredictions("g-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMyPredictionsMock).toHaveBeenCalledWith("g-1");
    expect(qc.getQueryData(queryKeys.predictions.byGroup("g-1"))).toEqual([
      predictionFixture,
    ]);
  });
});

describe("useGroupPredictions", () => {
  beforeEach(() => {
    getGroupPredictionsMock.mockReset();
  });

  it("no dispara la fetch cuando groupId o matchId está vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result: r1 } = renderHook(() => useGroupPredictions("", "m-1"), {
      wrapper: Wrapper,
    });
    const { result: r2 } = renderHook(() => useGroupPredictions("g-1", ""), {
      wrapper: Wrapper,
    });
    expect(r1.current.fetchStatus).toBe("idle");
    expect(r2.current.fetchStatus).toBe("idle");
    expect(getGroupPredictionsMock).not.toHaveBeenCalled();
  });

  it("consume getGroupPredictions(groupId, matchId) y guarda con query key groupMatch", async () => {
    getGroupPredictionsMock.mockResolvedValue([userPredictionFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useGroupPredictions("g-1", "m-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getGroupPredictionsMock).toHaveBeenCalledWith("g-1", "m-1");
    expect(
      qc.getQueryData(queryKeys.predictions.groupMatch("g-1", "m-1")),
    ).toEqual([userPredictionFixture]);
  });
});

describe("usePredictionStats", () => {
  beforeEach(() => {
    getMyStatsMock.mockReset();
  });

  it("no dispara la fetch cuando groupId es vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => usePredictionStats(""), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMyStatsMock).not.toHaveBeenCalled();
  });

  it("consume getMyStats(groupId) y guarda con query key stats", async () => {
    getMyStatsMock.mockResolvedValue(statsFixture);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => usePredictionStats("g-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMyStatsMock).toHaveBeenCalledWith("g-1");
    expect(qc.getQueryData(queryKeys.predictions.stats("g-1"))).toEqual(
      statsFixture,
    );
  });
});

describe("useMemberPredictions", () => {
  beforeEach(() => {
    getMemberPredictionsMock.mockReset();
  });

  it("no dispara la fetch cuando groupId o userId está vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result: r1 } = renderHook(() => useMemberPredictions("", "u-1"), {
      wrapper: Wrapper,
    });
    const { result: r2 } = renderHook(() => useMemberPredictions("g-1", ""), {
      wrapper: Wrapper,
    });
    expect(r1.current.fetchStatus).toBe("idle");
    expect(r2.current.fetchStatus).toBe("idle");
    expect(getMemberPredictionsMock).not.toHaveBeenCalled();
  });

  it("consume getMemberPredictions(groupId, userId) y guarda con query key memberPredictions", async () => {
    getMemberPredictionsMock.mockResolvedValue([predictionFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useMemberPredictions("g-1", "u-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMemberPredictionsMock).toHaveBeenCalledWith("g-1", "u-1");
    expect(
      qc.getQueryData(queryKeys.predictions.memberPredictions("g-1", "u-1")),
    ).toEqual([predictionFixture]);
  });
});

describe("useUpsertPrediction", () => {
  beforeEach(() => {
    upsertPredictionMock.mockReset();
  });

  it("invalida las 6 queries previstas tras success (paridad mobile)", async () => {
    upsertPredictionMock.mockResolvedValue(predictionFixture);
    const { qc, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useUpsertPrediction(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      matchId: "m-1",
      groupId: "g-1",
      predictedHome: 2,
      predictedAway: 1,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(upsertPredictionMock).toHaveBeenCalledTimes(1);
    expect(upsertPredictionMock.mock.calls[0]?.[0]).toEqual({
      matchId: "m-1",
      groupId: "g-1",
      predictedHome: 2,
      predictedAway: 1,
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: unknown }).queryKey,
    );

    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        queryKeys.predictions.byGroup("g-1"),
        queryKeys.predictions.groupMatch("g-1", "m-1"),
        queryKeys.predictions.stats("g-1"),
        queryKeys.leaderboard.byGroup("g-1"),
        queryKeys.dashboard.all,
        queryKeys.groups.upcomingPredictions("g-1"),
      ]),
    );
  });
});
