# Setting up Neon Managed Better Auth

NuxWell integrates Neon Managed Better Auth for real authentication.
The integration is **optional** — the whole environment works without
it in local development mode.

## 1. Create a Neon project and enable Auth

1. Create a project at [console.neon.tech](https://console.neon.tech)
   (or use an existing one).
2. Open **Auth** in the project dashboard and click **Enable Auth**.
3. Copy the **Auth Base URL** from the **Configuration** tab
   (looks like `https://ep-xxx.neonauth.us-east-1.aws.neon.build/neondb/auth`).

## 2. Configure the environment

Add the two variables to `.env.local` in this project's root:

```bash
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.build/neondb/auth
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>
```

Generate a cookie secret with `openssl rand -base64 32`
(minimum 32 characters). Never commit real values.

## 3. What happens next

- `apps/web/app/api/auth/[...path]/route.ts` proxies all auth
  traffic through the app's own origin, so session cookies are
  first-party.
- `apps/web/proxy.ts` (Next.js 16 route protection) requires a
  valid session for `/dashboard/*` and redirects to `/login`.
- `apps/web/lib/auth/server.ts` and `lib/auth/client.ts` expose the
  server and browser auth instances.
- Local user profiles live in the API database (`users` table); the
  `authSubjectId` column links a profile to the Neon Auth subject.

## Branching

Neon Auth is branch-scoped. Each Neon branch has its own Auth
environment and its own Auth Base URL — switch the URL in `.env.local`
when working against a different branch.

## Reference

- [Next.js quick start (API methods)](https://neon.com/docs/auth/quick-start/nextjs-api-only)
- [JavaScript SDK reference](https://neon.com/docs/reference/javascript-sdk)
- [Auth troubleshooting](https://neon.com/docs/auth/troubleshooting)
