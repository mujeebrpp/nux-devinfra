import * as fs from "fs";
import * as path from "path";

/**
 * Environment file resolution for the NuxCafe API.
 *
 * The project keeps its environment contract at the project root
 * (projects/nuxcafe/.env.local and .env.test). The API process may be
 * started from apps/api (npm --prefix), from the project root, or from a
 * bundled dist/ directory, so we walk up from the working directory to
 * locate the project root and its env file.
 *
 * In production (Render) all values are injected as real environment
 * variables and no env file is required - resolveEnvFiles() then
 * returns an empty list and ConfigModule falls back to process.env.
 */

const ENV_FILES_BY_NODE_ENV: Record<string, string> = {
  development: ".env.local",
  test: ".env.test",
  production: ".env.local",
};

export function resolveEnvFiles(): string[] {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const envFileName = ENV_FILES_BY_NODE_ENV[nodeEnv] ?? ".env.local";

  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, envFileName);
    if (fs.existsSync(candidate)) {
      return [candidate];
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return [];
}
