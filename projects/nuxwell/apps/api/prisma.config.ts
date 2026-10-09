import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

/**
 * Prisma configuration for NuxWell (see projects/README.md).
 *
 * Prisma skips its own .env loading when a config file is present,
 * so the project-level environment contract is loaded here instead.
 * Values already present in the real environment (e.g. DATABASE_URL
 * exported for automated tests) always take precedence.
 */
function resolveProjectEnvFile(fileName: string): string | null {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

if (!process.env.DATABASE_URL) {
  const envFile = resolveProjectEnvFile(".env.local");
  if (envFile) {
    dotenv.config({ path: envFile });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
