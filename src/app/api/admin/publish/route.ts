import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, hasValidOrigin, verifySessionToken } from "@/lib/server/admin-auth";
import { GithubContentError, publishAdminContent } from "@/lib/server/github-content";
import { validatePublishRequest, ValidationError } from "@/lib/server/admin-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_000_000) return NextResponse.json({ error: "This publish request is too large." }, { status: 413 });

  try {
    const payload = validatePublishRequest(await request.json());
    const published = await publishAdminContent(payload.baseSha, payload.content, payload.images, payload.deletions);
    return NextResponse.json({ ok: true, ...published });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof GithubContentError && (error.status === 400 || error.status === 409)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid publish request." }, { status: 400 });
    console.error("Unable to publish admin content", error);
    return NextResponse.json({ error: "Publishing could not be confirmed. Your edits remain open; check the latest revision before retrying." }, { status: 502 });
  }
}
