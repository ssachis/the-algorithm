"use client";
// "Share your wave": downloads a 1080×1350 PNG (LinkedIn / X) of the performance lanes,
// the headline, the top outperformer and the wordmark. Owner: Khyati (issue #5, redone for #25 item 2).
//
// Usage: <ShareCard data={data} mode={mode} />
import { useState } from "react";
import type { AnalyzeResponse, Video } from "@/lib/types";
import { formatCount, formatX, perfLevel, PERF_LABEL, type PerfLevel } from "@/lib/score";
import type { Mode } from "./RippleMap";

// ---- card geometry ----
const CARD_W = 1080;
const CARD_H = 1350;
const MAP_SCALE = 1.05;
const MAP_W = 640;
const MAP_SIZE = MAP_W * MAP_SCALE;
const MAP_X = (CARD_W - MAP_SIZE) / 2;
const MAP_Y = 425;

// ---- Wave kit palette (same tokens as app/globals.css) ----
const PAPER = "#fafbfc";
const INK = "#203a56";
const INK_2 = "#718096";
const INK_3 = "#8a96a3";
const LINE = "#e5ebf1";
const FOAM = "#dceaf6";
const SEA = "#a8c9c0";
const CURRENT = "#4d8fd6";
const DEEP = "#203a56";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

// Lanes from strongest to weakest, then videos with no baseline.
const LANES: { level: PerfLevel; y: number; fill: string; stroke: string }[] = [
  { level: "outlier", y: 70, fill: DEEP, stroke: DEEP },
  { level: "strong", y: 188, fill: CURRENT, stroke: CURRENT },
  { level: "around", y: 306, fill: SEA, stroke: SEA },
  { level: "below", y: 424, fill: FOAM, stroke: FOAM },
  { level: "na", y: 542, fill: "#ffffff", stroke: INK_3 },
];

const CARD = { w: 36, h: 60, rx: 7 };
const X_ORIGIN = 130;
const X_NEAR = 170;   // most similar edge of each lane
const X_MAX = 610;    // right edge for the last card in a lane

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Places cards in their lane. Closer to the origin = more similar. Each lane is spaced evenly
 * between X_NEAR and X_MAX, keeping similarity order, so cards never overlap or leave the card.
 */
function placeCards(videos: Video[]) {
  const sims = videos.map((v) => v.similarity);
  const lo = Math.min(...sims);
  const hi = Math.max(...sims);
  const placed: { v: Video; x: number; y: number; level: PerfLevel; w: number }[] = [];

  for (const lane of LANES) {
    const inLane = videos
      .filter((v) => perfLevel(v.outperformance) === lane.level)
      .sort((a, b) => b.similarity - a.similarity);
    const n = inLane.length;
    if (!n) continue;
    const span = X_MAX - X_NEAR - CARD.w;
    const pitch = n > 1 ? span / (n - 1) : 0;
    const w = Math.min(CARD.w, pitch > 0 ? pitch - 4 : CARD.w);
    inLane.forEach((v, i) => {
      placed.push({ v, x: X_NEAR + i * pitch, y: lane.y, level: lane.level, w });
    });
  }
  return { placed, lo, hi };
}

/** Builds the standalone 1080×1350 SVG. System fonts only, so the canvas render needs no network. */
export function buildShareSvg(data: AnalyzeResponse, mode: Mode): string {
  const { original, similar, query } = data;
  const { placed } = placeCards(similar);
  const top = similar
    .filter((v) => v.outperformance != null)
    .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0))[0];

  const laneGuides = LANES.map(
    (l) =>
      `<line x1="${X_ORIGIN - 12}" x2="${MAP_W - 8}" y1="${l.y + CARD.h / 2}" y2="${l.y + CARD.h / 2}" stroke="${LINE}" stroke-width="1.5"/>` +
      `<text x="8" y="${l.y + CARD.h / 2 + 4}" font-family="${SANS}" font-size="13" fill="${INK_2}">${escapeXml(PERF_LABEL[l.level])}</text>`
  ).join("");

  // Mode decides the reading: "views" lanes still use the performance grouping, but the card's
  // label shows raw views; "reach" shows views ÷ subscribers. Both sit on the same lanes.
  const cards = placed
    .map(({ v, x, y, level, w }) => {
      const lane = LANES.find((l) => l.level === level)!;
      const dashed = level === "na" ? ` stroke-dasharray="4 4"` : "";
      const label = mode === "views" ? formatCount(v.views) : formatX(v.outperformance);
      return (
        `<rect x="${x}" y="${y}" width="${w}" height="${CARD.h}" rx="${CARD.rx}" fill="${lane.fill}" stroke="${lane.stroke}" stroke-width="1.5"${dashed}/>` +
        `<text x="${x + w / 2}" y="${y + CARD.h + 16}" text-anchor="middle" font-family="${SANS}" font-size="11" fill="${INK_2}">${escapeXml(label)}</text>`
      );
    })
    .join("");

  const originLane = LANES.find((l) => l.level === perfLevel(original.outperformance)) ?? LANES[4];
  const originMarker =
    `<rect x="${X_ORIGIN}" y="${originLane.y}" width="${CARD.w}" height="${CARD.h}" rx="${CARD.rx}" fill="#ffffff" stroke="${CURRENT}" stroke-width="2.5"/>` +
    `<text x="${X_ORIGIN + CARD.w / 2}" y="${originLane.y + CARD.h + 16}" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="600" fill="${INK}">you</text>`;

  const headlineTop = `Same idea.`;
  const headlineBottom = `Different outcomes.`;
  const queryLine = `${similar.length} Shorts on “${query}”`;
  const topLine = top ? `${formatX(top.outperformance)} their usual reach` : "Public metrics, no guesswork";
  const topSub = top
    ? `${escapeXml(top.channelTitle)} · ${formatCount(top.views)} views on ${formatCount(top.subscribers)} subscribers`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" fill="${PAPER}"/>
  <text x="80" y="118" font-family="${SANS}" font-size="22" letter-spacing="4" fill="${INK_3}">CREATOR INTELLIGENCE</text>
  <text x="80" y="250" font-family="${SERIF}" font-size="92" fill="${INK}" letter-spacing="-1">${headlineTop}</text>
  <text x="80" y="345" font-family="${SERIF}" font-size="92" font-style="italic" fill="${CURRENT}" letter-spacing="-1">${headlineBottom}</text>
  <text x="80" y="402" font-family="${SANS}" font-size="28" fill="${INK_2}">${escapeXml(queryLine)}</text>

  <g transform="translate(${MAP_X} ${MAP_Y}) scale(${MAP_SCALE})">
    ${laneGuides}
    ${cards}
    ${originMarker}
  </g>

  <text x="${CARD_W / 2}" y="1150" text-anchor="middle" font-family="${SANS}" font-size="20" letter-spacing="4" fill="${INK_3}">TOP OUTPERFORMER</text>
  <text x="${CARD_W / 2}" y="1215" text-anchor="middle" font-family="${SERIF}" font-size="60" fill="${DEEP}">${escapeXml(topLine)}</text>
  ${topSub ? `<text x="${CARD_W / 2}" y="1255" text-anchor="middle" font-family="${SANS}" font-size="22" fill="${INK_2}">${topSub}</text>` : ""}

  <line x1="80" x2="${CARD_W - 80}" y1="1290" y2="1290" stroke="${LINE}" stroke-width="2"/>
  <text x="80" y="1338" font-family="${SERIF}" font-size="34" fill="${INK}">wave<tspan fill="${CURRENT}">.</tspan></text>
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
      a.download = `wave-${data.query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "wave"}.png`;
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
        {busy ? "Making your card…" : <>Share<span className="share-long"> your wave</span></>}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
