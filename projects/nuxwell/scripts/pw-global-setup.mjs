/**
 * Playwright global setup for NuxWell.
 *
 * Runs once before the test servers start. Prepares the isolated
 * nuxwell_test database (see README.md - environment contract):
 * creates it when missing, replays migrations and re-seeds it so
 * e2e tests always run against known data.
 *
 * The automated-test database is never nuxwell_dev.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const apiDir = path.join(projectRoot, "apps", "api");

function loadEnvFile(file) {
  const values = {};
  if (!existsSync(file)) {
    return values;
  }

  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    // Real environment variables always win over the file.
    if (!(key in process.env)) {
      values[key] = value;
    }
  }
  return values;
}

export default async function globalSetup() {
  const env = loadEnvFile(path.join(projectRoot, ".env.test"));
  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set and .env.test does not define it",
    );
  }

  const databaseName = databaseUrl.split("/").pop().split("?")[0];

  // Create the test database when it is missing (local Docker
  // Postgres). In environments without Docker (e.g. CI with a
  // managed database) the check is skipped and the database is
  // assumed to exist.
  try {
    const exists = execSync(
      `docker exec nux-dev-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${databaseName}'"`,
      { encoding: "utf8" },
    ).trim();

    if (exists !== "1") {
      execSync(
        `docker exec nux-dev-postgres psql -U postgres -c "CREATE DATABASE ${databaseName}"`,
        { stdio: "inherit" },
      );
      console.log(`[pw-global-setup] created database ${databaseName}`);
    }
  } catch (error) {
    console.warn(
      `[pw-global-setup] docker database check skipped: ${error.message}`,
    );
  }

  const runEnv = {
    ...process.env,
    ...env,
    DATABASE_URL: databaseUrl,
    NODE_ENV: "test",
  };

  console.log(`[pw-global-setup] migrating ${databaseName}`);
  execSync("npx prisma migrate deploy", {
    cwd: apiDir,
    env: runEnv,
    stdio: "inherit",
  });

  console.log(`[pw-global-setup] seeding ${databaseName}`);
  execSync("npx tsx prisma/seed.ts", {
    cwd: apiDir,
    env: runEnv,
    stdio: "inherit",
  });
}
