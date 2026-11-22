import { NextResponse } from "next/server";
import { mockResponse } from "@/lib/mock-data";
import { analyze, AnalyzeError } from "@/lib/pipeline";
import type { AnalyzeResponse } from "@/lib/types";

// POST /api/analyze  { url: string }  ->  AnalyzeResponse
// USE_MOCK=1, or the "see an example" link, serves lib/mock-data.ts (no keys, no quota).

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim() ?? "";

  if (!url) {
    return NextResponse.json({ error: "Paste a YouTube Shorts link." }, { status: 400 });
  }

  if (process.env.USE_MOCK === "1" || url.endsWith("/shorts/demo")) {
    await new Promise((r) => setTimeout(r, 1200)); // let the loading ripple show
    const res: AnalyzeResponse = { ...mockResponse, source: "mock" };
    return NextResponse.json(res);
  }

  try {
    return NextResponse.json(await analyze(url));
  } catch (e) {
    const status = e instanceof AnalyzeError ? e.status : 500;
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status });
  }
}
