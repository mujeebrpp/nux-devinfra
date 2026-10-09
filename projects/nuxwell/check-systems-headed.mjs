/**
 * Headed-mode Playwright smoke check for the 3 local systems:
 *   NuxWell (web :3090 / api :3091)
 *   NuxFarm (web :3092 / api :3093)
 *   NuxCafe (web :3094 / api :3095)
 *
 * Launches visible (headed) Chromium; falls back to headless only if the
 * desktop session cannot display a window. Writes a JSON report + PNG
 * screenshots to the repo root (c:/dev/infrastructure).
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "c:/dev/infrastructure";
const systems = [
  {
    name: "NuxWell",
    web: "http://localhost:3090",
    pages: ["/", "/dashboard"],
    api: "http://localhost:3091/api/health",
  },
  {
    name: "NuxFarm",
    web: "http://localhost:3092",
    pages: ["/", "/farms"],
    api: "http://localhost:3093/health/live",
  },
  {
    name: "NuxCafe",
    web: "http://localhost:3094",
    pages: ["/", "/dashboard/menu"],
    api: "http://localhost:3095/api/health",
  },
];

async function launch(headless) {
  return chromium.launch({ headless, slowMo: 250 });
}

let browser;
let mode = "headed";
try {
  browser = await launch(false);
} catch (err) {
  console.error(`[launch] HEADED mode failed: ${err.message}`);
  console.error("[launch] falling back to headless");
  mode = "headless";
  browser = await launch(true);
}
console.log(`[launch] Chromium launched in ${mode.toUpperCase()} mode`);

const results = { mode, checkedAt: new Date().toISOString(), systems: [] };

for (const sys of systems) {
  const out = { system: sys.name, api: {}, pages: [] };

  try {
    const res = await fetch(sys.api, { headers: { accept: "application/json" } });
    out.api = { url: sys.api, status: res.status, body: (await res.text()).slice(0, 300) };
  } catch (e) {
    out.api = { url: sys.api, error: e.message };
  }

  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  for (const path of sys.pages) {
    const p = { path, url: sys.web + path };
    try {
      const response = await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      p.status = response?.status() ?? null;
      p.title = await page.title();
      const h1 = await page.locator("h1").first().textContent({ timeout: 10000 }).catch(() => null);
      p.h1 = h1 ? h1.trim().slice(0, 120) : null;
      const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
      p.bodyPreview = bodyText.replace(/\s+/g, " ").trim().slice(0, 240);
      const slug = path.replace(/^\//, "").replace(/\//g, "-") || "home";
      const shot = `${BASE}/shot-${sys.name.toLowerCase()}-${slug}.png`;
      await page.screenshot({ path: shot, fullPage: true });
      p.screenshot = shot;
    } catch (e) {
      p.error = (e.message ?? String(e)).slice(0, 300);
    }
    p.consoleErrors = consoleErrors.splice(0);
    out.pages.push(p);
  }

  await context.close();
  results.systems.push(out);
  console.log(`[ok] ${sys.name} checked`);
}

await browser.close();
writeFileSync(`${BASE}/system-check-report.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
