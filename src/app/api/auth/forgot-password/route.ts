import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generatePasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ success: true });
    }

    const token = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
