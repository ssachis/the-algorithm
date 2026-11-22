// Tiny JSON file cache so repeat demos cost zero API quota.
// Local: ./.cache (gitignored). Vercel: /tmp/.cache (the only writable place).
import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DIR = process.env.VERCEL ? "/tmp/.cache" : path.join(process.cwd(), ".cache");

function file(key: string) {
  return path.join(DIR, createHash("sha1").update(key).digest("hex").slice(0, 16) + ".json");
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file(key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await mkdir(DIR, { recursive: true });
    await writeFile(file(key), JSON.stringify(value));
  } catch {
    // Cache is best-effort; never fail a request because of it.
  }
}

/** Returns the cached value for `key`, or runs `fn`, stores and returns its result. */
export async function cached<T>(key: string, fn: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
  const hit = await readCache<T>(key);
  if (hit != null) {
    console.log(`[cache] hit ${key.slice(0, 60)}`);
    return { value: hit, hit: true };
  }
  const value = await fn();
  await writeCache(key, value);
  return { value, hit: false };
}

/** Committed, preloaded demo results: demo/<videoId>.json */
export async function readDemo<T>(videoId: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "demo", `${videoId}.json`), "utf8")) as T;
  } catch {
    return null;
  }
}
