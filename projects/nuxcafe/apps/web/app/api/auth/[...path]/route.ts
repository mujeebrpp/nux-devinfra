import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth/server";

/**
 * Auth API proxy. All auth traffic (sign-in, sign-up, sessions, OAuth)
 * goes through this same-origin route to Neon Managed Better Auth, so
 * session cookies are set on the app's own domain.
 * Returns 503 when auth is not configured (local development mode).
 */

function unconfigured(): Response {
  return NextResponse.json(
    {
      error:
        "Authentication is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in .env.local.",
    },
    { status: 503 },
  );
}

type AuthHandler = (
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) => Promise<Response> | Response;

let handler: Record<string, AuthHandler> | null = null;

function getHandler(): Record<string, AuthHandler> | null {
  const auth = getServerAuth();
  if (!auth) {
    return null;
  }

  if (!handler) {
    handler = auth.handler() as Record<string, AuthHandler>;
  }

  return handler;
}

function delegate(method: string): AuthHandler {
  return async (request, context) => {
    const activeHandler = getHandler();
    if (!activeHandler) {
      return unconfigured();
    }

    const fn = activeHandler[method];
    if (!fn) {
      return unconfigured();
    }

    return fn(request, context);
  };
}

export const GET = delegate("GET");
export const POST = delegate("POST");
export const PUT = delegate("PUT");
export const PATCH = delegate("PATCH");
export const DELETE = delegate("DELETE");
