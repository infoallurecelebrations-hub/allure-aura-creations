import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";
import { GithubContentError, readProductImage } from "@/lib/server/github-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const image = await readProductImage(request.nextUrl.searchParams.get("path") || "", request.nextUrl.searchParams.get("revision") || "");
    return new NextResponse(new Uint8Array(image.bytes), {
      headers: { "Content-Type": image.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    const status = error instanceof GithubContentError && [400, 404, 413].includes(error.status) ? error.status : 502;
    return NextResponse.json({ error: "Image is unavailable." }, { status });
  }
}
