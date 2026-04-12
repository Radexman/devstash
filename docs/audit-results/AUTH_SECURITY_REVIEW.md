# Auth Security Review

**Last audited:** 2026-04-12
**Scope:** Authentication, authorization, email verification, password reset, profile management
**Framework:** NextAuth v5 with credentials + GitHub OAuth

---

## Summary

**5 issues found: 1 Critical, 1 High, 2 Medium, 1 Low.**

The most severe finding is that all route protection is completely bypassed — the middleware that enforces auth is defined but never wired up. This is an auth bypass allowing unauthenticated access to every "protected" route. Additionally, every unauthenticated API endpoint (register, forgot-password, resend-verification, reset-password) lacks rate limiting, making them trivially abusable.

---

## Issues Found

### 🔴 Critical

**[Authorization] Route protection middleware is dead code — all protected routes are publicly accessible**

📁 File: `src/proxy.ts` (all lines)

🔍 Problem: `src/proxy.ts` exports a `proxy` function (a NextAuth auth handler) that enforces login-gating for `/dashboard` and `/profile`. However, **Next.js only runs middleware from a file named `middleware.ts` (or `middleware.js`) placed in the `src/` directory or project root**. There is no `middleware.ts` in this project. `proxy.ts` is never imported anywhere — it is dead code. As a result, **`/dashboard` and `/profile` are completely unauthenticated routes** — any visitor can access them without being signed in.

🎯 Attack scenario: An attacker visits `https://devstash.app/dashboard` or `https://devstash.app/profile` in a browser with no session cookie. They see the full dashboard and profile of whichever user's data is loaded server-side, or in the best case get an error — but they are never redirected to `/sign-in`. Server components do have their own `redirect()` guards, but those rely on the page-level code executing correctly. If any page-level guard is missed in future, there is zero middleware backstop.

💡 Fix: Rename `src/proxy.ts` to `src/middleware.ts` and re-export the handler with the correct Next.js middleware export signature:

```ts
// src/middleware.ts
export { proxy as middleware } from "./proxy";

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

Or, consolidate everything into `src/middleware.ts` directly and delete `src/proxy.ts`.

---

### 🟠 High

**[Rate Limiting] No rate limiting on any auth endpoint**

📁 Files:
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/resend-verification/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/users/change-password/route.ts`

🔍 Problem: Every auth-adjacent API route accepts unlimited requests from any IP with no throttling. The login endpoint (`/api/auth/callback/credentials`) is handled by NextAuth itself and does not have application-level rate limiting either.

🎯 Attack scenarios:
- **Credential stuffing / brute force:** An attacker can POST to `/api/auth/callback/credentials` (the NextAuth credentials endpoint) or craft scripts targeting the credentials `authorize` handler with no delay or lockout.
- **Email bombing:** POST `/api/auth/resend-verification` or `/api/auth/forgot-password` with a victim's email address in a tight loop, sending thousands of emails at Resend's expense and harassing the target user.
- **Password reset token exhaustion:** Repeatedly calling `/api/auth/forgot-password` invalidates the previous token (the code does `deleteMany` before creating a new one), so an attacker can race a legitimate user's reset by requesting new tokens faster than the user can click their link.
- **Registration spam:** POST `/api/auth/register` to create unlimited accounts and exhaust the free-tier item/collection quota table, or inflate user counts.

💡 Fix: Add a rate-limiting layer. The recommended approach for Next.js/Vercel is [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) with Redis, or the lighter [`next-rate-limit`] package. Suggested limits:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/forgot-password` | 3 requests / 15 min per IP |
| `POST /api/auth/resend-verification` | 3 requests / 15 min per IP |
| `POST /api/auth/register` | 10 requests / hour per IP |
| `POST /api/auth/reset-password` | 5 requests / hour per IP |
| Login (NextAuth credentials) | 10 attempts / 15 min per IP |

---

### 🟡 Medium

**[Password Policy] Inconsistent minimum password length between registration and reset-password**

📁 Files:
- `src/app/api/auth/register/route.ts` — no server-side minimum length check
- `src/app/api/auth/reset-password/route.ts` (line 23) — enforces `>= 6` characters
- `src/app/api/users/change-password/route.ts` (line 22) — enforces `>= 8` characters
- `src/app/register/page.tsx` (line 37) — client-side check: `>= 6`
- `src/app/reset-password/page.tsx` (line 65) — client-side check: `>= 6`

🔍 Problem: Three different minimum lengths are in use (6, 6, 8), and the registration API route has **no server-side password length validation at all**. Client-side validation in `register/page.tsx` enforces 6 characters, but an attacker calling `POST /api/auth/register` directly can register with a 1-character password (or empty) since `bcryptjs` will hash it without complaint. Additionally, 6 characters is below the NIST SP 800-63B minimum recommendation of 8 characters.

🎯 Attack scenario: A user registers via a direct API call with `password: "a"`. bcrypt hashes it, the account is created, and the user or attacker can sign in with a trivially guessable password.

💡 Fix:
1. Add a server-side minimum check in `src/app/api/auth/register/route.ts` (after the confirmPassword check):
```ts
if (password.length < 8) {
  return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
}
```
2. Standardize all minimums to 8 characters across all endpoints and client-side forms.

---

**[Input Validation] Email format is not validated server-side on any endpoint**

📁 Files:
- `src/app/api/auth/register/route.ts` (line 27)
- `src/app/api/auth/forgot-password/route.ts` (line 19)
- `src/app/api/auth/resend-verification/route.ts` (line 19)

🔍 Problem: These endpoints accept any string as an `email` parameter and pass it directly to `prisma.user.findUnique({ where: { email } })`. While Prisma parameterizes the query (no SQL injection risk), there is no validation that the value is actually a valid email address. The only validation is the HTML `type="email"` attribute on client-side inputs, which is bypassable by direct API calls.

🎯 Attack scenario: Submitting a garbage value like `"<script>alert(1)</script>"` as the email won't cause SQL injection but will: (a) result in a Resend API call with an invalid `to:` address if a matching DB record existed, potentially triggering Resend errors; (b) pollute logs; (c) in future if emails are ever rendered without escaping, create a stored XSS vector. More practically, it bypasses business logic around "valid accounts only."

💡 Fix: Add a simple email format check. The project already uses zod for validation in principle (mentioned in coding-standards.md). Add to each affected route:
```ts
import { z } from "zod";
const emailSchema = z.string().email();
const parsed = emailSchema.safeParse(email);
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
}
```

---

### 🟢 Low

**[Token Reuse] Password reset tokens share the NextAuth `VerificationToken` table**

📁 Files:
- `src/lib/email.ts` (lines 51–67) — `generatePasswordResetToken` writes to `VerificationToken`
- `src/app/api/auth/reset-password/route.ts` (line 30) — reads from `VerificationToken`
- `prisma/schema.prisma` (lines 43–49) — `VerificationToken` model

🔍 Problem: The app uses NextAuth's built-in `VerificationToken` table (originally designed for magic-link email sign-in) to store password reset tokens. This is a repurposing that works correctly today, but creates subtle risks:

1. **Token namespace collision:** NextAuth may write its own records to this table if magic-link or email provider features are ever added. Those records have the same schema (`identifier`, `token`, `expires`) and could be mistakenly consumed as password reset tokens (or vice versa), depending on the token value distribution.
2. **No type field:** There is no `type` or `purpose` column to distinguish "password reset" tokens from any other use of the table. This makes the intent opaque and accident-prone if the table is reused.

🎯 Attack scenario: Low likelihood today given the app only uses the table for password resets, but adding any NextAuth email provider in the future would silently share the table without obvious code-level warning.

💡 Fix: Create a dedicated `PasswordResetToken` model in the Prisma schema (mirroring the `EmailVerificationToken` model already present). This is a minor refactor with clear separation of concerns:
```prisma
model PasswordResetToken {
  id         String   @id @default(cuid())
  token      String   @unique
  identifier String   // email address
  expires    DateTime
  createdAt  DateTime @default(now())

  @@index([identifier])
}
```

---

## Passed Checks ✅

- ✅ **[Password Hashing] bcrypt with cost factor 12** — `bcryptjs` is used throughout (`register`, `reset-password`, `change-password`) with a work factor of 12, which is above the minimum recommended 10 and provides strong resistance to offline cracking. `compare()` from bcryptjs is timing-safe by design.

- ✅ **[Token Generation] Cryptographically secure token entropy** — Both `generateVerificationToken` and `generatePasswordResetToken` in `src/lib/email.ts` use `randomBytes(32).toString("hex")`, producing 256 bits of entropy. This is well above the minimum for security tokens.

- ✅ **[Token Expiry] Tokens have appropriate expiration windows** — Email verification tokens expire in 24 hours (`TOKEN_EXPIRY_HOURS = 24`), password reset tokens in 1 hour (`RESET_TOKEN_EXPIRY_HOURS = 1`). Both are checked server-side before use, and expired tokens are deleted from the database on detection.

- ✅ **[Single-Use Tokens] Tokens are deleted after use** — `src/app/api/auth/verify/route.ts` (line 35) and `src/app/api/auth/reset-password/route.ts` (line 69) both delete the token immediately after successful verification/reset. Previous tokens are also cleared before generating new ones (`deleteMany` in `src/lib/email.ts`).

- ✅ **[Email Enumeration Prevention] Forgot-password and resend-verification return uniform responses** — `src/app/api/auth/forgot-password/route.ts` (lines 22–24) returns `{ success: true }` regardless of whether the email exists. `src/app/api/auth/resend-verification/route.ts` (lines 22–24) does the same. The UI copy also uses neutral phrasing ("If an account exists for that email...").

- ✅ **[Session Authentication] Profile and change-password API routes verify session** — `src/app/api/users/change-password/route.ts` and `src/app/api/users/delete-account/route.ts` both call `auth()` and return 401 if no session is present. The session `user.id` is used (not a client-supplied value) for all DB operations.

- ✅ **[Password Change] Current password re-verification required** — `src/app/api/users/change-password/route.ts` (lines 48–53) verifies the user's current password with `bcryptjs.compare()` before allowing the update. This prevents session hijacking from enabling a password takeover.

- ✅ **[OAuth Account Guard] Password operations blocked for OAuth-only accounts** — `change-password` correctly checks for `hashedPassword` presence (line 41–44) and returns a clear error for OAuth accounts, preventing a crash or unintended state mutation.

- ✅ **[Cascade Deletion] Account deletion removes all user data** — The Prisma schema uses `onDelete: Cascade` on all user-owned relations (`Account`, `Session`, `EmailVerificationToken`, `Item`, `Collection`, `ItemType`), so `prisma.user.delete()` atomically removes all associated data.

- ✅ **[Page-Level Auth Guard] Server components have their own redirect guards** — `src/app/profile/page.tsx` (lines 14–18) calls `auth()` and `redirect('/sign-in')` if no session exists. This is a defence-in-depth layer (though not a substitute for middleware, as noted in the Critical finding).

- ✅ **[bcrypt] Password hashing on correct side** — Password hashing always occurs server-side in API routes. Client-side code never hashes or inspects password values beyond validation length checks.

- ✅ **[Email Verification Bypass Safety] Email verification is a feature-flag** — The `EMAIL_VERIFICATION_ENABLED` flag is evaluated both in the proxy (middleware) and in the register route, so enabling/disabling it is consistent and doesn't create an inconsistent state.

---

## Recommendations Summary

| Priority | Issue | Severity | Effort |
|----------|-------|----------|--------|
| 1 | Rename `proxy.ts` → `middleware.ts` and wire up route protection | Critical | Very Low (rename + add export) |
| 2 | Add rate limiting to all auth endpoints | High | Medium (add Upstash Redis or similar) |
| 3 | Add server-side password minimum length (≥8) to register endpoint | Medium | Very Low (one if-check) |
| 4 | Add server-side email format validation with Zod | Medium | Low (add zod schema to 3 routes) |
| 5 | Migrate password reset tokens to a dedicated Prisma model | Low | Low (new model + migration) |
