// Live pipeline: one Short URL -> AnalyzeResponse. Server only.
import type { AnalyzeResponse, Video } from "./types";
import { extractHashtags, keywords, outperformance, similarity, viewsPerDay } from "./score";
import { getSubscribers, getVideos, parseVideoId, quota, searchShorts, YouTubeError, type RawVideo } from "./youtube";
import { buildVerdict } from "./youcom";
import { cached, readDemo } from "./cache";

const MAX_SIMILAR = 20;
const MAX_SHORT_SEC = 180;

function toVideo(r: RawVideo, subs: number | null, ref: Pick<Video, "title" | "hashtags" | "durationSec"> | null): Video {
  const hashtags = extractHashtags(`${r.title} ${r.description}`).slice(0, 8);
  const base = { title: r.title, hashtags, durationSec: r.durationSec };
  return {
    id: r.id,
    url: `https://www.youtube.com/shorts/${r.id}`,
    title: r.title,
    channelTitle: r.channelTitle,
    channelId: r.channelId,
    thumbnail: r.thumbnail,
    publishedAt: r.publishedAt,
    durationSec: r.durationSec,
    views: r.views,
    likes: r.likes,
    comments: r.comments,
    subscribers: subs,
    hashtags,
    similarity: ref ? similarity(ref, base) : 1,
    outperformance: outperformance(r.views, subs),
    viewsPerDay: viewsPerDay(r.views, r.publishedAt),
  };
}

/** Two deliberate search phrases: title keywords, and top hashtag + main keywords. */
export function buildQueries(title: string, hashtags: string[]): string[] {
  const words = Array.from(keywords(title));
  const q1 = words.slice(0, 3).join(" ");
  const tag = hashtags.find((h) => !/^#(shorts?|viral|fyp|trending)$/.test(h))?.slice(1);
  const q2 = tag ? `${tag} ${words.slice(0, 2).join(" ")}`.trim() : words.slice(1, 5).join(" ");
  return Array.from(new Set([q1, q2].filter((q) => q.length > 2)));
}

export class AnalyzeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function analyze(url: string): Promise<AnalyzeResponse> {
  const id = parseVideoId(url);
  if (!id) throw new AnalyzeError("That doesn't look like a YouTube link. Paste a Shorts URL.", 400);

  // 1. Preloaded demo file wins (zero quota, works offline).
  const demo = await readDemo<AnalyzeResponse>(id);
  if (demo) return { ...demo, source: "cache" };

  // 2. Whole-response cache.
  try {
    const { value, hit } = await cached(`analyze:${id}`, () => runLive(id));
    console.log(`[analyze] ${id} ${hit ? "cache" : "live"} · quota used this process: ${quota()}`);
    return { ...value, source: hit ? "cache" : "live" };
  } catch (e) {
    if (e instanceof AnalyzeError) throw e;
    if (e instanceof YouTubeError) {
      if (e.kind === "quota") throw new AnalyzeError("YouTube's daily limit is used up. Try the example instead.", 503);
      if (e.kind === "no_key") throw new AnalyzeError("Server is missing its YouTube key.", 500);
    }
    console.error("[analyze]", e);
    throw new AnalyzeError("Couldn't reach YouTube right now. Try the example instead.", 502);
  }
}

async function runLive(id: string): Promise<AnalyzeResponse> {
  const [orig] = await getVideos([id]);
  if (!orig) throw new AnalyzeError("That video is private, deleted or unavailable.", 404);

  const origTags = extractHashtags(`${orig.title} ${orig.description}`);
  const queries = buildQueries(orig.title, origTags);
  if (!queries.length) throw new AnalyzeError("Couldn't find enough words in the title to search with.", 422);

  const ids = new Set<string>();
  for (const q of queries) (await searchShorts(q)).forEach((x) => x !== id && ids.add(x));

  const candidates = (await getVideos(Array.from(ids))).filter(
    (v) => v.durationSec > 0 && v.durationSec <= MAX_SHORT_SEC
  );
  const subs = await getSubscribers([orig.channelId, ...candidates.map((c) => c.channelId)]);

  const original = toVideo(orig, subs[orig.channelId] ?? null, null);
  const similar = candidates
    .map((c) => toVideo(c, subs[c.channelId] ?? null, original))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_SIMILAR);

  if (similar.length < 3) throw new AnalyzeError("We found too few similar Shorts for this one. Try another.", 404);

  const query = queries[0];
  const verdict = await buildVerdict({ query, original, similar });

  return { query, original, similar, verdict, generatedAt: new Date().toISOString(), source: "live" };
}
