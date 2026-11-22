// YouTube Data API v3 client. Server only. Key: process.env.YOUTUBE_API_KEY.
// Quota: search.list = 100 units, videos.list / channels.list = 1 unit (10,000 units/day default).
import { cached } from "./cache";
import { parseDuration } from "./score";

const BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeError extends Error {
  constructor(message: string, public kind: "no_key" | "quota" | "not_found" | "http") {
    super(message);
  }
}

export type RawVideo = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  durationSec: number;
  views: number;
  likes: number | null;
  comments: number | null;
  thumbnail: string | null;
};

let quotaUsed = 0;
export const quota = () => quotaUsed;

async function call(endpoint: string, params: Record<string, string>, cost: number): Promise<any> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new YouTubeError("YOUTUBE_API_KEY is missing in .env.local", "no_key");
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`${BASE}/${endpoint}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  quotaUsed += cost;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason ?? "";
    if (res.status === 403 && /quota/i.test(reason)) throw new YouTubeError("YouTube quota exceeded", "quota");
    throw new YouTubeError(`YouTube ${endpoint} failed (${res.status}) ${reason}`, "http");
  }
  return res.json();
}

const num = (x: unknown): number | null => (x == null || x === "" ? null : Number(x));

/** Handles youtube.com/shorts/ID, youtu.be/ID, watch?v=ID, embed/ID, or a bare 11-char id. */
export function parseVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1, 12) || null;
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    const m = u.pathname.match(/\/(shorts|embed|live|v)\/([\w-]{11})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

/** videos.list in batches of 50. Missing stats come back as null. */
export async function getVideos(ids: string[]): Promise<RawVideo[]> {
  const out: RawVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { value } = await cached(`videos:${batch.join(",")}`, () =>
      call("videos", { part: "snippet,statistics,contentDetails", id: batch.join(","), maxResults: "50" }, 1)
    );
    for (const it of value.items ?? []) {
      const t = it.snippet?.thumbnails ?? {};
      out.push({
        id: it.id,
        title: it.snippet?.title ?? "",
        description: it.snippet?.description ?? "",
        channelId: it.snippet?.channelId ?? "",
        channelTitle: it.snippet?.channelTitle ?? "",
        publishedAt: it.snippet?.publishedAt ?? new Date().toISOString(),
        durationSec: parseDuration(it.contentDetails?.duration ?? ""),
        views: num(it.statistics?.viewCount) ?? 0,
        likes: num(it.statistics?.likeCount),
        comments: num(it.statistics?.commentCount),
        thumbnail: (t.high ?? t.medium ?? t.default)?.url ?? null,
      });
    }
  }
  return out;
}

/** search.list for short videos. 100 quota units per call, so it is always cached. */
export async function searchShorts(query: string, max = 25): Promise<string[]> {
  const { value } = await cached(`search:${query}:${max}`, () =>
    call(
      "search",
      {
        part: "snippet",
        type: "video",
        videoDuration: "short",
        order: "relevance",
        relevanceLanguage: "en",
        maxResults: String(max),
        q: `${query} #shorts`,
      },
      100
    )
  );
  return (value.items ?? []).map((it: any) => it.id?.videoId).filter(Boolean);
}

/** channels.list in batches of 50. Hidden subscriber counts become null. Also returns uploads playlists. */
export async function getChannels(
  channelIds: string[]
): Promise<{ subs: Record<string, number | null>; uploads: Record<string, string> }> {
  const ids = Array.from(new Set(channelIds.filter(Boolean)));
  const subs: Record<string, number | null> = {};
  const uploads: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { value } = await cached(`channels2:${batch.join(",")}`, () =>
      call("channels", { part: "statistics,contentDetails", id: batch.join(","), maxResults: "50" }, 1)
    );
    for (const it of value.items ?? []) {
      subs[it.id] = it.statistics?.hiddenSubscriberCount ? null : num(it.statistics?.subscriberCount);
      const up = it.contentDetails?.relatedPlaylists?.uploads;
      if (up) uploads[it.id] = up;
    }
  }
  return { subs, uploads };
}

export async function getSubscribers(channelIds: string[]): Promise<Record<string, number | null>> {
  return (await getChannels(channelIds)).subs;
}

/** Most recent upload ids from a channel's uploads playlist (1 quota unit). */
export async function getRecentUploadIds(playlistId: string, max = 15): Promise<string[]> {
  try {
    const { value } = await cached(`uploads:${playlistId}:${max}`, () =>
      call("playlistItems", { part: "contentDetails", playlistId, maxResults: String(max) }, 1)
    );
    return (value.items ?? []).map((it: any) => it.contentDetails?.videoId).filter(Boolean);
  } catch {
    return []; // a missing/private uploads playlist just means no baseline
  }
}
