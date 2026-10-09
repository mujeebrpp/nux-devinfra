import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:3091";

test.describe("NuxWell web app", () => {
  test("homepage loads with hero, nav and API health badge", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "NuxWell", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Sign in" }),
    ).toBeVisible();

    // Live API health check rendered on the homepage.
    await expect(page.getByText("API connected")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("homepage lists seeded facilities from the API", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Wellness Center Gym" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Ground Floor, Tower A")).toBeVisible();
  });

  test("dashboard renders the live facilities table", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Wellness Center Gym/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("login page validates the form (or explains local mode)", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    // With Neon Auth configured the form renders and validates
    // input client-side before any request is made.
    const emailField = page.getByLabel("Email");
    if (await emailField.isVisible()) {
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByText("Enter a valid email address")).toBeVisible();
      await expect(page.getByText("Password is required")).toBeVisible();
      return;
    }

    // Local development mode (default): auth is optional and the
    // page explains how to enable it.
    await expect(
      page.getByText("Sign-in is not configured yet"),
    ).toBeVisible();
  });

  test("registration page validates the form (or explains local mode)", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();

    const emailField = page.getByLabel("Email");
    if (await emailField.isVisible()) {
      await emailField.fill("not-an-email");
      await page.getByLabel("Password").fill("short");
      await page.getByLabel("Confirm password").fill("short");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByText("Enter a valid email address")).toBeVisible();
      await expect(
        page.getByText("Password must be at least 8 characters"),
      ).toBeVisible();
      return;
    }

    // Local development mode (default): auth is optional and the
    // page explains how to enable it.
    await expect(
      page.getByText("Registration is not configured yet"),
    ).toBeVisible();
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    await page.goto("/no-such-page");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});

test.describe("NuxWell API", () => {
  test("health endpoint reports a working database", async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      status: "ok",
      database: "ok",
    });
  });

  test("facilities endpoint returns paginated facilities", async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/facilities`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
    });
  });

  test("facilities endpoint rejects invalid query parameters", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/facilities?limit=not-a-number`,
    );

    expect(response.status()).toBe(400);
  });
});
