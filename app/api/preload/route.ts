import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { analyze } from "@/lib/pipeline";
import { parseVideoId } from "@/lib/youtube";

// Dev only: GET /api/preload?url=<shorts url> runs the live pipeline once and saves demo/<id>.json.
// Commit those files: they are served instantly with zero quota, even offline.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Preload only runs locally (npm run dev)." }, { status: 403 });
  }
  const url = new URL(req.url).searchParams.get("url") ?? "";
  const id = parseVideoId(url);
  if (!id) return NextResponse.json({ error: "Add ?url=<YouTube Shorts link>" }, { status: 400 });
  try {
    const data = await analyze(url);
    const dir = path.join(process.cwd(), "demo");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.json`), JSON.stringify({ ...data, source: "cache" }, null, 2));
    return NextResponse.json({ saved: `demo/${id}.json`, similar: data.similar.length, query: data.query });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
