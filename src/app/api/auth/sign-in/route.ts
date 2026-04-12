import { NextResponse } from "next/server";
import { rateLimiters, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const key = rateLimitKey(req, email);
    const limited = await checkRateLimit(rateLimiters.login, key);
    if (limited) return limited;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
