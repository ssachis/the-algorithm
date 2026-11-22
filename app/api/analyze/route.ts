import { NextResponse } from "next/server";
import { mockResponse } from "@/lib/mock-data";
import type { AnalyzeResponse } from "@/lib/types";

// POST /api/analyze  { url: string }  ->  AnalyzeResponse
// Backend owner: Melody. Today this returns mock data; see issues for the live pipeline:
//   1. lib/youtube.ts  — videos.list / search.list / channels.list (+ file cache)
//   2. lib/youcom.ts   — trend context + verdict with citations
//   3. lib/score.ts    — similarity, outperformance (already written)

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim() ?? "";

  if (!url) {
    return NextResponse.json({ error: "Paste a YouTube Shorts link." }, { status: 400 });
  }

  if (process.env.USE_MOCK !== "0") {
    // Small delay so the loading state is visible in demos.
    await new Promise((r) => setTimeout(r, 1200));
    const res: AnalyzeResponse = { ...mockResponse, source: "mock" };
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Live pipeline not wired yet. Set USE_MOCK=1." }, { status: 501 });
}
