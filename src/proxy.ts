import { auth } from "./auth";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (isOnDashboard && isLoggedIn && !req.auth?.user?.emailVerified) {
    const email = req.auth?.user?.email ?? "";
    return Response.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(email)}`, req.nextUrl)
    );
  }
});
