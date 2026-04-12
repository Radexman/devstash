import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

const emailVerificationEnabled =
  process.env.EMAIL_VERIFICATION_ENABLED === "true";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (
    emailVerificationEnabled &&
    isProtected &&
    isLoggedIn &&
    !req.auth?.user?.emailVerified
  ) {
    const email = req.auth?.user?.email ?? "";
    return Response.redirect(
      new URL(`/verify-email?email=${encodeURIComponent(email)}`, req.nextUrl)
    );
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
