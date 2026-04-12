import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/email";
import { rateLimiters, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = await checkRateLimit(
      rateLimiters.resendVerification,
      rateLimitKey(req)
    );
    if (limited) return limited;

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal whether the user exists
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = await generateVerificationToken(user.id);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
