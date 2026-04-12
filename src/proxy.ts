import { auth } from "./auth";

const emailVerificationEnabled =
  process.env.EMAIL_VERIFICATION_ENABLED === "true";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (
    emailVerificationEnabled &&
    isOnDashboard &&
    isLoggedIn &&
    !req.auth?.user?.emailVerified
  ) {
    const email = req.auth?.user?.email ?? "";
    return Response.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(email)}`, req.nextUrl)
    );
  }
});
