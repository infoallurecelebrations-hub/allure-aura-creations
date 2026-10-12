import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, createSessionToken, hasValidOrigin, SESSION_DURATION_SECONDS, verifyAdminCredentials } from "@/lib/server/admin-auth";
import { checkLoginRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkLoginRateLimit(client);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 512) : "";
    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createSessionToken(email), {
      httpOnly: true,
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    console.error("Admin login configuration error", error);
    return NextResponse.json({ error: "Admin sign-in is not configured yet." }, { status: 503 });
  }
}
