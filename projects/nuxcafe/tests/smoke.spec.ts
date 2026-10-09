import { expect, test } from "@playwright/test";

/**
 * Smoke tests: every dashboard page renders against the
 * seeded dev database. The Playwright config boots both the
 * API (3095) and the web app (3094).
 */

const PAGES = [
  { path: "/", heading: "NuxCafe" },
  { path: "/dashboard", heading: "Overview" },
  { path: "/dashboard/menu", heading: "Menu" },
  { path: "/dashboard/ingredients", heading: "Ingredients" },
  { path: "/dashboard/recipes", heading: "Recipes" },
  { path: "/dashboard/stock", heading: "Stock" },
  { path: "/dashboard/kitchen", heading: "Kitchen" },
  { path: "/dashboard/orders", heading: "Orders" },
  { path: "/dashboard/sales", heading: "Sales" },
];

for (const page of PAGES) {
  test(`${page.path} renders`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    await expect(
      browserPage.getByRole("heading", {
        name: page.heading,
        level: 1,
      }),
    ).toBeVisible();
  });
}

test("home links to every dashboard section", async ({ page }) => {
  await page.goto("/");
  for (const section of PAGES.slice(1)) {
    await expect(
      page.getByRole("link", { name: section.heading, exact: true }),
    ).toBeVisible();
  }
});

test("overview shows today's revenue card", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Revenue today")).toBeVisible();
  await expect(page.getByText("Kitchen queue")).toBeVisible();
});

test("menu lists seeded items", async ({ page }) => {
  await page.goto("/dashboard/menu");
  await expect(page.getByRole("table")).toBeVisible();
});

test("sales shows the 7-day chart", async ({ page }) => {
  await page.goto("/dashboard/sales");
  await expect(page.getByText("Revenue — last 7 days")).toBeVisible();
});
