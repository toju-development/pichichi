import { test, expect } from "./fixtures/api-mocks";
import { MOCK_GROUP_PRIMARY } from "./mocks/groups";
import { MOCK_MATCH_SCHEDULED } from "./mocks/matches";
import { MOCK_TOURNAMENT } from "./mocks/tournaments";

/**
 * T8.4 — Prediction flow.
 *
 * 1. Land on the group's tournament page (default tab is "pronosticos").
 * 2. Click the match card → score modal opens (portal-rendered to body).
 * 3. Fill the two score inputs and submit.
 * 4. Modal closes, `POST /predictions` was called with the right payload.
 *
 * Match `MOCK_MATCH_SCHEDULED` is dated in 2099, so `isMatchLocked` (which
 * locks 5 minutes before kickoff) returns false and the card is clickable.
 */

test("user can create a prediction from the tournament page", async ({
  authedPage,
  apiMocks,
}) => {
  const url = `/app/groups/${MOCK_GROUP_PRIMARY.id}/tournament/${MOCK_TOURNAMENT.slug}`;
  await authedPage.goto(url);

  await expect(authedPage.getByTestId("page-group-tournament")).toBeVisible();
  await expect(
    authedPage.getByTestId("group-tournament-panel-pronosticos"),
  ).toBeVisible();

  const card = authedPage.getByTestId(`prediction-match-card-${MOCK_MATCH_SCHEDULED.id}`);
  await expect(card).toBeVisible();
  await card.click();

  const modal = authedPage.getByTestId("score-prediction-modal");
  await expect(modal).toBeVisible();

  await authedPage.getByTestId("score-input-home").fill("2");
  await authedPage.getByTestId("score-input-away").fill("1");

  await authedPage.getByTestId("score-prediction-modal-submit").click();

  await expect(modal).toBeHidden();

  const post = apiMocks.findRequest("POST", "/predictions");
  expect(post).toBeDefined();
  expect(post?.body).toMatchObject({
    matchId: MOCK_MATCH_SCHEDULED.id,
    groupId: MOCK_GROUP_PRIMARY.id,
    predictedHome: 2,
    predictedAway: 1,
  });
});
