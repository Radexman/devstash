import { Resend } from "resend";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const TOKEN_EXPIRY_HOURS = 24;

export async function generateVerificationToken(userId: string) {
  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { token, userId, expires },
  });

  return token;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "DevStash <noreply@devstash.app>",
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f5f5f5; background: #18181b; padding: 16px 24px; border-radius: 8px; text-align: center;">
          DevStash
        </h2>
        <p>Thanks for signing up! Click the button below to verify your email address:</p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;"
        >
          Verify Email
        </a>
        <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
          This link expires in ${TOKEN_EXPIRY_HOURS} hours. If you didn&apos;t create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
