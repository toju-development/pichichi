import type {
  AuthResponseDto,
  DashboardResponseDto,
  GroupDto,
} from "@pichichi/shared";
import type { Page, Route } from "@playwright/test";

import { MOCK_GROUP_CREATED, MOCK_GROUP_MEMBERS, MOCK_GROUP_PRIMARY, MOCK_GROUPS } from "../mocks/groups";
import { MOCK_LEADERBOARD } from "../mocks/leaderboard";
import { MOCK_MATCHES } from "../mocks/matches";
import { MOCK_NOTIFICATIONS, MOCK_UNREAD_COUNT } from "../mocks/notifications";
import {
  MOCK_GROUP_PREDICTIONS_EMPTY,
  MOCK_PREDICTION_CREATED,
  MOCK_PREDICTION_STATS,
  MOCK_PREDICTIONS_EMPTY,
} from "../mocks/predictions";
import { MOCK_TOURNAMENT, MOCK_TOURNAMENTS } from "../mocks/tournaments";
import { MOCK_TOKENS, MOCK_USER } from "../mocks/users";
import { test as authTest } from "./auth";

/**
 * API mocks fixture — intercepts every `**\/api/v1/**` call and returns
 * deterministic JSON. We DO NOT boot the backend in E2E (per design.md §5).
 *
 * Architecture:
 *  - `defaultHandlers`: a route-pattern → handler map covering every endpoint
 *    a "happy path" first-render touches.
 *  - Tests can override a single route via `apiMocks.override(pattern, handler)`
 *    BEFORE the page navigates (e.g. to force a 403 on `POST /groups`).
 *  - `lastRequests`: tests can assert which endpoints were called and inspect
 *    the request bodies (used by the prediction spec to verify the POST).
 *
 * Matching strategy:
 *  - Patterns are URL substrings ("/groups/group-1") matched against the path
 *    (no querystring) + an optional method filter ("POST /groups").
 *  - More specific patterns win — handlers are tried in registration order,
 *    so overrides (registered later) take precedence over defaults.
 */

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

interface MockResponse {
  status?: number;
  body?: unknown;
}

interface RecordedRequest {
  method: string;
  url: string;
  pathname: string;
  body: unknown;
}

type Handler = (req: RecordedRequest) => MockResponse | Promise<MockResponse>;

interface RouteRule {
  pattern: string;
  method?: Method;
  handler: Handler;
}

export interface ApiMocks {
  /** Override or add a handler. Patterns added later win over earlier ones. */
  override: (patternOrMethodAndPath: string, handler: Handler) => void;
  /** Replace the entire ruleset (rare — only used by edge tests). */
  setRules: (rules: RouteRule[]) => void;
  /** Recorded requests in chronological order. */
  lastRequests: RecordedRequest[];
  /** Find the first recorded request matching method + path substring. */
  findRequest: (method: Method, pathContains: string) => RecordedRequest | undefined;
}

function jsonResponse(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function parsePatternKey(key: string): { method?: Method; pattern: string } {
  const match = /^(GET|POST|PATCH|DELETE|PUT)\s+(.+)$/.exec(key);
  if (match) {
    return { method: match[1] as Method, pattern: match[2] };
  }
  return { pattern: key };
}

function buildDefaultRules(): RouteRule[] {
  const authResponse: AuthResponseDto = {
    accessToken: MOCK_TOKENS.accessToken,
    refreshToken: MOCK_TOKENS.refreshToken,
    user: MOCK_USER,
  } as AuthResponseDto;

  const dashboard: DashboardResponseDto = {
    todayMatches: [],
    stats: {
      totalPoints: 90,
      totalPredictions: 12,
      exactCount: 3,
      accuracy: 75,
      groupCount: 1,
    },
    groups: [
      {
        groupId: MOCK_GROUP_PRIMARY.id,
        groupName: MOCK_GROUP_PRIMARY.name,
        userPosition: 3,
        totalMembers: 5,
        userPoints: 90,
        topEntries: [
          { userId: "user-leader", position: 1, displayName: "Sofía Vega", avatarUrl: null, totalPoints: 120 },
          { userId: "user-second", position: 2, displayName: "Lucas Romero", avatarUrl: null, totalPoints: 105 },
          { userId: MOCK_USER.id, position: 3, displayName: MOCK_USER.displayName, avatarUrl: null, totalPoints: 90 },
        ],
      },
    ],
  } as DashboardResponseDto;

  return [
    // ─── Auth ────────────────────────────────────────────────────────────
    { method: "POST", pattern: "/auth/google", handler: () => ({ body: authResponse }) },
    { method: "POST", pattern: "/auth/refresh", handler: () => ({ body: authResponse }) },
    { method: "POST", pattern: "/auth/logout", handler: () => ({ status: 204, body: {} }) },

    // ─── Users ───────────────────────────────────────────────────────────
    { method: "GET", pattern: "/users/me", handler: () => ({ body: MOCK_USER }) },
    { method: "PATCH", pattern: "/users/me", handler: () => ({ body: MOCK_USER }) },

    // ─── Dashboard ───────────────────────────────────────────────────────
    { method: "GET", pattern: "/dashboard", handler: () => ({ body: dashboard }) },

    // ─── Groups ──────────────────────────────────────────────────────────
    { method: "POST", pattern: "/groups/join", handler: () => ({ body: MOCK_GROUP_PRIMARY }) },
    { method: "POST", pattern: "/groups", handler: () => ({ body: MOCK_GROUP_CREATED }) },
    { method: "GET", pattern: "/groups", handler: ({ pathname }) => {
        // /groups/:id, /groups/:id/members, /groups/:id/tournaments, etc.
        if (pathname.endsWith("/members")) return { body: MOCK_GROUP_MEMBERS };
        if (pathname.endsWith("/tournaments")) return { body: [MOCK_TOURNAMENT] };
        if (pathname.endsWith("/upcoming-predictions")) return { body: [] };
        if (pathname.includes("/check-remove")) {
          return { body: { canRemove: true, predictionsCount: 0, reason: null } };
        }
        // /groups (list) vs /groups/:id (detail)
        const tail = pathname.split("/groups").pop() ?? "";
        const segments = tail.split("/").filter(Boolean);
        if (segments.length === 0) return { body: MOCK_GROUPS };
        if (segments.length === 1) {
          const group = MOCK_GROUPS.find((g) => g.id === segments[0]) ?? MOCK_GROUP_PRIMARY;
          return { body: group satisfies GroupDto };
        }
        return { body: MOCK_GROUP_PRIMARY };
      },
    },
    { method: "POST", pattern: "/tournaments", handler: () => ({ body: { groupId: MOCK_GROUP_PRIMARY.id, tournamentId: MOCK_TOURNAMENT.id } }) },

    // ─── Leaderboard ─────────────────────────────────────────────────────
    { method: "GET", pattern: "/leaderboard/group", handler: ({ pathname }) => {
        if (pathname.endsWith("/me")) {
          return { body: MOCK_LEADERBOARD.entries.find((e) => e.userId === MOCK_USER.id) };
        }
        return { body: MOCK_LEADERBOARD };
      },
    },
    { method: "GET", pattern: "/leaderboard/global", handler: () => ({ body: { entries: [], total: 0, currentUserEntry: null } }) },

    // ─── Tournaments ─────────────────────────────────────────────────────
    { method: "GET", pattern: "/tournaments", handler: ({ pathname }) => {
        const tail = pathname.split("/tournaments").pop() ?? "";
        const segments = tail.split("/").filter(Boolean);
        if (segments.length === 0) return { body: MOCK_TOURNAMENTS };
        if (segments.length === 1) return { body: MOCK_TOURNAMENT };
        if (pathname.endsWith("/teams")) return { body: [] };
        if (pathname.endsWith("/players")) return { body: [] };
        return { body: MOCK_TOURNAMENT };
      },
    },

    // ─── Matches ─────────────────────────────────────────────────────────
    { method: "GET", pattern: "/matches", handler: ({ pathname }) => {
        if (pathname.endsWith("/upcoming")) return { body: MOCK_MATCHES };
        if (pathname.endsWith("/live")) return { body: [] };
        const tail = pathname.split("/matches").pop() ?? "";
        const segments = tail.split("/").filter(Boolean);
        if (segments.length === 1 && segments[0] !== "upcoming" && segments[0] !== "live") {
          return { body: MOCK_MATCHES.find((m) => m.id === segments[0]) ?? MOCK_MATCHES[0] };
        }
        return { body: MOCK_MATCHES };
      },
    },

    // ─── Predictions ─────────────────────────────────────────────────────
    { method: "POST", pattern: "/predictions", handler: () => ({ body: MOCK_PREDICTION_CREATED }) },
    { method: "GET", pattern: "/predictions/group", handler: ({ pathname }) => {
        if (pathname.includes("/match/")) return { body: MOCK_GROUP_PREDICTIONS_EMPTY };
        if (pathname.endsWith("/stats")) return { body: MOCK_PREDICTION_STATS };
        if (pathname.includes("/member/")) {
          return {
            body: {
              userId: MOCK_USER.id,
              displayName: MOCK_USER.displayName,
              avatarUrl: null,
              totalPoints: 0,
              predictions: [],
            },
          };
        }
        return { body: MOCK_PREDICTIONS_EMPTY };
      },
    },

    // ─── Bonus Predictions ───────────────────────────────────────────────
    { method: "GET", pattern: "/bonus-predictions/group", handler: ({ pathname }) => {
        if (pathname.endsWith("/all")) {
          return {
            body: {
              groupId: MOCK_GROUP_PRIMARY.id,
              tournamentId: MOCK_TOURNAMENT.id,
              revealed: false,
              predictions: [],
            },
          };
        }
        return { body: [] };
      },
    },
    { method: "POST", pattern: "/bonus-predictions", handler: () => ({ status: 201, body: { id: "bonus-new" } }) },

    // ─── Notifications ───────────────────────────────────────────────────
    { method: "GET", pattern: "/notifications/unread-count", handler: () => ({ body: MOCK_UNREAD_COUNT }) },
    { method: "GET", pattern: "/notifications", handler: () => ({ body: MOCK_NOTIFICATIONS }) },
    { method: "PATCH", pattern: "/notifications/read-all", handler: () => ({ status: 204, body: {} }) },
    { method: "PATCH", pattern: "/notifications", handler: () => ({ body: { id: "n-1", isRead: true } }) },
  ];
}

async function readRequestBody(route: Route): Promise<unknown> {
  const post = route.request().postData();
  if (!post) return null;
  try {
    return JSON.parse(post);
  } catch {
    return post;
  }
}

export async function installApiMocks(page: Page, mocks: ApiMocks): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method().toUpperCase();
    const body = await readRequestBody(route);
    const recorded: RecordedRequest = {
      method,
      url: route.request().url(),
      pathname: url.pathname,
      body,
    };
    mocks.lastRequests.push(recorded);

    // Iterate in REVERSE so overrides (registered later) win over defaults.
    const rules = (mocks as unknown as { _rules: RouteRule[] })._rules;
    for (let i = rules.length - 1; i >= 0; i -= 1) {
      const rule = rules[i];
      if (rule.method && rule.method !== method) continue;
      if (!url.pathname.includes(rule.pattern)) continue;
      const result = await rule.handler(recorded);
      const status = result.status ?? 200;
      const responseBody = result.body ?? {};
      await jsonResponse(route, status, responseBody);
      return;
    }

    // No rule matched — fail loudly so missing mocks surface in CI.
    await jsonResponse(route, 501, {
      statusCode: 501,
      message: `[E2E] No mock for ${method} ${url.pathname}`,
      error: "NotImplemented",
    });
  });
}

interface ApiMocksFixtures {
  apiMocks: ApiMocks;
}

export const test = authTest.extend<ApiMocksFixtures>({
  apiMocks: async ({ page }, use) => {
    const rules: RouteRule[] = buildDefaultRules();
    const lastRequests: RecordedRequest[] = [];

    const mocks: ApiMocks & { _rules: RouteRule[] } = {
      _rules: rules,
      lastRequests,
      override: (patternOrKey, handler) => {
        const { method, pattern } = parsePatternKey(patternOrKey);
        rules.push({ method, pattern, handler });
      },
      setRules: (next) => {
        rules.length = 0;
        rules.push(...next);
      },
      findRequest: (method, pathContains) =>
        lastRequests.find((r) => r.method === method && r.pathname.includes(pathContains)),
    };

    await installApiMocks(page, mocks);
    await use(mocks);
  },
});

export { expect } from "@playwright/test";
