const path = require("path");
const dotenv = require("dotenv");
const { execSync } = require("child_process");

/**
 * Jest global setup for the NuxCafe API.
 *
 * Safety contract: automated tests must only ever run against the isolated
 * `*_test` database. This setup refuses to run when DATABASE_URL does not
 * point at a database whose name ends in `_test`.
 */
module.exports = async function globalSetup() {
  // __dirname = apps/api/test -> walk up to the project root
  // (apps/api/test -> apps/api -> apps -> project root).
  dotenv.config({
    path: path.resolve(__dirname, "..", "..", "..", ".env.test"),
  });
  process.env.NODE_ENV = "test";

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Jest globalSetup: DATABASE_URL is not set. Copy .env.test.example to .env.test.",
    );
  }

  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    throw new Error(
      `Jest globalSetup refused to run: DATABASE_URL points at "${dbName}". ` +
        "Automated tests must never run against a development or production database. " +
        'The test database name must end with "_test" (e.g. nuxcafe_test).',
    );
  }

  console.log(`Jest globalSetup: migrating test database "${dbName}"...`);
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("Jest globalSetup: test database is ready.");
};
