"use client";
// "Share your wave": downloads a 1080×1350 PNG (LinkedIn / X) of the ripple map,
// the headline, the top outperformer and the wordmark. Owner: Khyati (issue #5).
//
// Usage (Sachi, app/page.tsx):
//   import ShareCard from "@/components/ShareCard";
//   <ShareCard data={data} mode={mode} />
import { useState } from "react";
import type { AnalyzeResponse, Video } from "@/lib/types";
import { formatCount, formatX } from "@/lib/score";
import type { Mode } from "./RippleMap";

// ---- layout constants (mirrors components/RippleMap.tsx; that file is not modified) ----
const MAP_W = 640;
const MAP_C = MAP_W / 2;
const MIN_ORBIT = 78;
const MAX_ORBIT = 272;
const MIN_R = 5;
const MAX_R = 34;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// ---- card geometry ----
const CARD_W = 1080;
const CARD_H = 1350;
const MAP_SCALE = 1.05;
const MAP_SIZE = MAP_W * MAP_SCALE;
const MAP_X = (CARD_W - MAP_SIZE) / 2;
const MAP_Y = 425;

// ---- palette (same tokens as app/globals.css) ----
const INK = "#0d1b2a";
const INK_2 = "#4a5868";
const INK_3 = "#8a96a3";
const LINE = "#e6ebf0";
const PALE = "#d5dde6";
const MIST = "#eef3f8";
const WATER = "#3b7dd8";
const DEEP = "#0b3d91";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

// Same mapping as RippleMap: pale mist -> deep water, log10 from 0.1x to 100x.
function waterColor(op: number | null): string {
  if (op == null) return PALE;
  const t = Math.min(Math.max((Math.log10(op) + 1) / 3, 0), 1);
  const a = [213, 221, 230];
  const b = [11, 61, 145];
  const mix = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${mix.join(",")})`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Same placement as RippleMap: most similar sit closest to the centre, golden-angle spacing. */
function placeRipples(videos: Video[], mode: Mode, original: Video) {
  const sims = videos.map((v) => v.similarity);
  const lo = Math.min(...sims);
  const hi = Math.max(...sims);
  const maxViews = Math.max(original.views, ...videos.map((v) => v.views));
  const maxOp = Math.max(original.outperformance ?? 0, ...videos.map((v) => v.outperformance ?? 0), 1e-6);

  const radius = (v: Video) => {
    const t = mode === "views" ? v.views / maxViews : (v.outperformance ?? 0) / maxOp;
    return MIN_R + (MAX_R - MIN_R) * Math.sqrt(Math.max(t, 0));
  };

  return videos
    .slice()
    .sort((a, b) => b.similarity - a.similarity)
    .map((v, i) => {
      const s = hi > lo ? (v.similarity - lo) / (hi - lo) : 0.5;
      const orbit = MIN_ORBIT + (1 - s) * (MAX_ORBIT - MIN_ORBIT);
      const angle = i * GOLDEN - Math.PI / 2;
      return { v, x: MAP_C + orbit * Math.cos(angle), y: MAP_C + orbit * Math.sin(angle), r: radius(v) };
    });
}

/** Builds the standalone 1080×1350 SVG. Fonts are system fonts so the canvas render needs no network. */
export function buildShareSvg(data: AnalyzeResponse, mode: Mode): string {
  const { original, similar, query } = data;
  const placed = placeRipples(similar, mode, original);
  const maxViews = Math.max(original.views, ...similar.map((v) => v.views));
  const maxOp = Math.max(original.outperformance ?? 0, ...similar.map((v) => v.outperformance ?? 0), 1e-6);
  const originT = mode === "views" ? original.views / maxViews : (original.outperformance ?? 0) / maxOp;
  const originR = Math.max(MIN_R + (MAX_R - MIN_R) * Math.sqrt(Math.max(originT, 0)), 12);

  const top = similar
    .filter((v) => v.outperformance != null)
    .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0))[0];

  const rings = [MIN_ORBIT, (MIN_ORBIT + MAX_ORBIT) / 2, MAX_ORBIT]
    .map((r) => `<circle cx="${MAP_C}" cy="${MAP_C}" r="${r}" fill="none" stroke="${PALE}" stroke-width="1.5"/>`)
    .join("");

  const dots = placed
    .map(({ v, x, y, r }) => {
      const hidden = mode === "reach" && v.outperformance == null;
      const fill = mode === "views" ? "#9fb6cf" : waterColor(v.outperformance);
      return hidden
        ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${INK_3}" stroke-width="1.5" stroke-dasharray="3 3"/>`
        : `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
    })
    .join("");

  const headlineTop = `Same idea.`;
  const headlineBottom = `Different outcomes.`;
  const queryLine = `${similar.length} Shorts on “${query}”`;
  const topLine = top
    ? `${formatX(top.outperformance)} their usual reach`
    : "Public metrics, no guesswork";
  const topSub = top
    ? `${escapeXml(top.channelTitle)} · ${formatCount(top.views)} views on ${formatCount(top.subscribers)} subscribers`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" fill="#ffffff"/>
  <text x="80" y="118" font-family="${SANS}" font-size="22" letter-spacing="4" fill="${INK_3}">CREATOR INTELLIGENCE</text>
  <text x="80" y="250" font-family="${SERIF}" font-size="92" fill="${INK}" letter-spacing="-1">${headlineTop}</text>
  <text x="80" y="345" font-family="${SERIF}" font-size="92" font-style="italic" fill="${WATER}" letter-spacing="-1">${headlineBottom}</text>
  <text x="80" y="402" font-family="${SANS}" font-size="28" fill="${INK_2}">${escapeXml(queryLine)}</text>

  <g transform="translate(${MAP_X} ${MAP_Y}) scale(${MAP_SCALE})">
    ${rings}
    ${dots}
    <circle cx="${MAP_C}" cy="${MAP_C}" r="${originR}" fill="#ffffff" stroke="${WATER}" stroke-width="2.5"/>
    <circle cx="${MAP_C}" cy="${MAP_C}" r="4" fill="${WATER}"/>
  </g>

  <text x="${CARD_W / 2}" y="1150" text-anchor="middle" font-family="${SANS}" font-size="20" letter-spacing="4" fill="${INK_3}">TOP OUTPERFORMER</text>
  <text x="${CARD_W / 2}" y="1215" text-anchor="middle" font-family="${SERIF}" font-size="60" fill="${DEEP}">${escapeXml(topLine)}</text>
  ${topSub ? `<text x="${CARD_W / 2}" y="1255" text-anchor="middle" font-family="${SANS}" font-size="22" fill="${INK_2}">${topSub}</text>` : ""}

  <line x1="80" x2="${CARD_W - 80}" y1="1290" y2="1290" stroke="${LINE}" stroke-width="2"/>
  <text x="80" y="1338" font-family="${SERIF}" font-size="34" fill="${INK}">wave<tspan fill="${WATER}">.</tspan></text>
  <text x="${CARD_W - 80}" y="1338" text-anchor="end" font-family="${SANS}" font-size="20" fill="${INK_3}">Public metrics only</text>
</svg>`;
}

/** Renders the SVG to a PNG blob via an offscreen canvas. */
export async function renderSharePng(data: AnalyzeResponse, mode: Mode): Promise<Blob> {
  const svg = buildShareSvg(data, mode);
  const img = new Image();
  img.decoding = "sync";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(img, 0, 0, CARD_W, CARD_H);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png")
  );
}

export default function ShareCard({ data, mode }: { data: AnalyzeResponse; mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const blob = await renderSharePng(data, mode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wave-${data.query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "waves"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share">
      <button className="btn share-btn" onClick={download} disabled={busy}>
        {busy ? "Making your card…" : "Share your wave"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
