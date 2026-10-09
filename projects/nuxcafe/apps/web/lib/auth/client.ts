import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Managed Better Auth (Neon) - browser client instance.
 *
 * The client talks to the same-origin /api/auth proxy routes,
 * which forward traffic to Neon. In local development mode
 * (auth not configured) the sign-in forms degrade gracefully.
 */

let authClient: ReturnType<typeof createAuthClient> | null = null;

export function getAuthClient() {
  if (authClient) {
    return authClient;
  }

  authClient = createAuthClient();
  return authClient;
}
