import { NextResponse } from "next/server";
import { getVideos } from "@/lib/youtube";
import { trendContext } from "@/lib/youcom";

// GET /api/health -> { youtube, youcom } so we know the keys work before going on stage.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, string> = {};
  if (!process.env.YOUTUBE_API_KEY) out.youtube = "missing key";
  else {
    try {
      const v = await getVideos(["dQw4w9WgXcQ"]);
      out.youtube = v.length ? "ok" : "no data";
    } catch (e) {
      out.youtube = `failed: ${e instanceof Error ? e.message : "error"}`;
    }
  }
  if (!process.env.YOUCOM_API_KEY) out.youcom = "missing key";
  else {
    const t = await trendContext("morning routine");
    out.youcom = t.summary ? `ok (${t.sources.length} sources)` : "failed or empty";
  }
  out.mock = process.env.USE_MOCK === "1" ? "on (demo data only)" : "off (live)";
  return NextResponse.json(out);
}
