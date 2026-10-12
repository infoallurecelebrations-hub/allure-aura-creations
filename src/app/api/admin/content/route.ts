import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";
import { GithubContentError, readAdminContent } from "@/lib/server/github-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const response = NextResponse.json(await readAdminContent());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Unable to load admin content", error);
    const status = error instanceof GithubContentError && error.status === 404 ? 404 : 502;
    return NextResponse.json({ error: "Unable to load the latest content from GitHub." }, { status });
  }
}
