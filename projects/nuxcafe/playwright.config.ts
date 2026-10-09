import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the NuxCafe web dashboard.
 *
 * Boots both servers for the test run:
 *  - the NestJS API on port 3095 (PostgreSQL on 5433)
 *  - the Next.js dashboard on port 3094
 * Set reuseExistingServer so a running dev server is reused.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3094",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm --prefix apps/api run start:dev",
      url: "http://localhost:3095/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "ignore",
    },
    {
      command: "npm --prefix apps/web run dev",
      url: "http://localhost:3094",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "ignore",
    },
  ],
});
