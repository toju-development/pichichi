import { test, expect } from "./fixtures/api-mocks";
import { MOCK_GROUP_CREATED } from "./mocks/groups";

/**
 * T8.3 — Create group flow.
 *
 * Happy path: fill the form, submit, expect a redirect to
 * `/app/groups/{newId}` and a `POST /groups` call captured by the mocks
 * fixture.
 *
 * Plan-limit variant: override `POST /groups` to 403 and assert the
 * `group-form-error` shows the server message (mirrors
 * `apps/web/src/app/app/(authed)/groups/create/page.tsx:60-67`).
 */

test.describe("create group", () => {
  test("submits the form and navigates to the new group detail", async ({
    authedPage,
    apiMocks,
  }) => {
    await authedPage.goto("/app/groups/create");
    await expect(authedPage.getByTestId("page-groups-create")).toBeVisible();
    await expect(authedPage.getByTestId("group-form")).toBeVisible();

    await authedPage.locator("#group-name").fill("Grupo nuevo E2E");
    await authedPage.locator("#group-description").fill("Creado desde Playwright");

    await authedPage.getByTestId("group-form-submit").click();

    await expect(authedPage).toHaveURL(
      new RegExp(`/app/groups/${MOCK_GROUP_CREATED.id}$`),
    );

    const created = apiMocks.findRequest("POST", "/groups");
    expect(created).toBeDefined();
    expect(created?.body).toMatchObject({ name: "Grupo nuevo E2E" });
  });

  test("renders the plan-limit error when the API responds 403", async ({
    authedPage,
    apiMocks,
  }) => {
    apiMocks.override("POST /groups", () => ({
      status: 403,
      body: {
        statusCode: 403,
        message: "Alcanzaste el límite de grupos de tu plan.",
        error: "Forbidden",
      },
    }));

    await authedPage.goto("/app/groups/create");
    await authedPage.locator("#group-name").fill("Grupo bloqueado");
    await authedPage.getByTestId("group-form-submit").click();

    await expect(authedPage.getByTestId("group-form-error")).toBeVisible();
    await expect(authedPage.getByTestId("group-form-error")).toContainText(
      "Alcanzaste el límite",
    );
    await expect(authedPage).toHaveURL(/\/app\/groups\/create$/);
  });
});
