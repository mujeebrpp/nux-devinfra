import { test, expect } from "@playwright/test";

test.describe("NuxFarm web", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("farms list loads", async ({ page }) => {
    await page.goto("/farms");
    await expect(
      page.getByRole("heading", { name: "Farms" }),
    ).toBeVisible();
  });

  test("farm detail loads", async ({ page }) => {
    await page.goto("/farms");
    const farmLink = page.locator("a[href^='/farms/']").first();
    await farmLink.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
