import { NextResponse, type NextRequest } from "next/server";
import { getServerAuth, isAuthConfigured } from "@/lib/auth/server";

/**
 * Next.js 16 route protection (replaces middleware.ts).
 *
 * Local development mode (auth not configured): every route is open.
 * With Managed Better Auth enabled, /dashboard and its children
 * require a valid session; everything else is public.
 */

const PROTECTED_PREFIXES = ["/dashboard"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthConfigured() || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const auth = getServerAuth();
  if (!auth) {
    return NextResponse.next();
  }

  // Official Neon Auth middleware: validates the session cookie
  // and redirects to the login page when it is missing or expired.
  const middleware = auth.middleware({ loginUrl: "/login" });
  return middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
