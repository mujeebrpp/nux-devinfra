import { defineConfig, devices } from "@playwright/test";

/**
 * NuxWell end-to-end tests.
 *
 * Starts both the Next.js web app (:3090) and the NestJS API (:3091).
 * The API runs with NODE_ENV=test so the e2e suite exercises the
 * isolated nuxwell_test database - never nuxwell_dev.
 */
export default defineConfig({
  testDir: "tests",
  globalSetup: "./scripts/pw-global-setup.mjs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3090",
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
      url: "http://localhost:3091/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { NODE_ENV: "test" },
    },
    {
      command: "npm --prefix apps/web run dev",
      url: "http://localhost:3090",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
