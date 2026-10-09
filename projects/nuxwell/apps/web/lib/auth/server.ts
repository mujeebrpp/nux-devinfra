import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Managed Better Auth (Neon) - server instance.
 *
 * Auth is optional during local development: when NEON_AUTH_BASE_URL or
 * NEON_AUTH_COOKIE_SECRET are unset the app runs in local development
 * mode (see docs/setup.md) and every route is accessible. Never commit
 * real values - generate a cookie secret locally with
 * `openssl rand -base64 32`.
 */

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
  );
}

let serverAuth: ReturnType<typeof createNeonAuth> | null = null;

export function getServerAuth() {
  if (!isAuthConfigured()) {
    return null;
  }

  if (!serverAuth) {
    serverAuth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }

  return serverAuth;
}
