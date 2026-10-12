import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, hasValidOrigin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { expires: new Date(0), httpOnly: true, path: "/", sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  return response;
}
