import { test, expect } from "./fixtures/api-mocks";
import { MOCK_GROUP_PRIMARY } from "./mocks/groups";
import { MOCK_LEADERBOARD_ENTRIES } from "./mocks/leaderboard";
import { MOCK_USER } from "./mocks/users";

/**
 * T8.5 — Leaderboard flow.
 *
 * The group detail page (`/app/groups/{id}`) mounts `<LeaderboardList>` once
 * the group loads. We verify:
 *   - The list renders all 5 mocked entries.
 *   - The podium block renders (top 3).
 *   - The current user's row carries `data-current-user="true"` (the
 *     highlight contract from `leaderboard-entry.tsx`).
 */

test("group detail renders the leaderboard with current user highlighted", async ({
  authedPage,
  apiMocks,
}) => {
  void apiMocks;
  await authedPage.goto(`/app/groups/${MOCK_GROUP_PRIMARY.id}`);

  await expect(authedPage.getByTestId("page-group-detail")).toBeVisible();
  await expect(authedPage.getByTestId("leaderboard-list")).toBeVisible();
  await expect(authedPage.getByTestId("podium")).toBeVisible();

  const entries = authedPage.getByTestId("leaderboard-entry");
  await expect(entries).toHaveCount(MOCK_LEADERBOARD_ENTRIES.length);

  const currentUserRow = authedPage.locator(
    '[data-testid="leaderboard-entry"][data-current-user="true"]',
  );
  await expect(currentUserRow).toHaveCount(1);
  await expect(currentUserRow).toContainText(MOCK_USER.displayName);
});
