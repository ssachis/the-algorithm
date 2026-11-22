"use client";
import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { formatCount, formatX, perfLevel, PERF_LABEL } from "@/lib/score";

export type Mode = "views" | "reach";

const W = 640;
const C = W / 2;
const MIN_ORBIT = 122;
const MAX_ORBIT = 272;
const MIN_H = 40; // card height range (9:16 portrait cards)
const MAX_H = 92;
const BASE_H = 100; // cards are drawn at this size, then scaled (smooth CSS transform transition)
const BASE_W = (BASE_H * 9) / 16;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// soft mist -> deep blue, by log10(relative performance) from 0.1x to 100x
export function perfColor(op: number | null): string {
  if (op == null) return "#d5dde6";
  const t = Math.min(Math.max((Math.log10(op) + 1) / 3, 0), 1);
  const a = [213, 221, 230];
  const b = [11, 61, 145];
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;
}

/** Heat glow strength (Snap Map style): only for videos that beat their usual reach. */
function glow(op: number | null): number {
  if (op == null || op < 1.5) return 0;
  return Math.min(0.15 + Math.log10(op) * 0.28, 0.6);
}

function Card({ v, color, selected, isOrigin }: { v: Video; color: string; selected: boolean; isOrigin?: boolean }) {
  return (
    <>
      <rect x={-BASE_W / 2} y={-BASE_H / 2} width={BASE_W} height={BASE_H} rx={9} fill={color} />
      {v.thumbnail && (
        <image
          href={v.thumbnail}
          x={-BASE_W / 2}
          y={-BASE_H / 2}
          width={BASE_W}
          height={BASE_H}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#card-clip)"
        />
      )}
      <rect
        x={-BASE_W / 2}
        y={-BASE_H / 2}
        width={BASE_W}
        height={BASE_H}
        rx={9}
        fill="none"
        className={`card-frame ${selected ? "selected" : ""} ${isOrigin ? "origin-frame" : ""}`}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

export default function RippleMap({
  original,
  videos,
  mode,
  selectedId,
  onSelect,
}: {
  original: Video;
  videos: Video[];
  mode: Mode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<Video | null>(null);

  const layout = useMemo(() => {
    const sims = videos.map((v) => v.similarity);
    const lo = Math.min(...sims);
    const hi = Math.max(...sims);
    const maxViews = Math.max(original.views, ...videos.map((v) => v.views));
    const maxOp = Math.max(original.outperformance ?? 0, ...videos.map((v) => v.outperformance ?? 0), 1e-6);

    const height = (v: Video) => {
      const t = mode === "views" ? v.views / maxViews : (v.outperformance ?? 0) / maxOp;
      return MIN_H + (MAX_H - MIN_H) * Math.sqrt(Math.max(t, 0));
    };

    // Closest to the drop = most similar (computed similarity score).
    const placed = videos
      .slice()
      .sort((a, b) => b.similarity - a.similarity)
      .map((v, i) => {
        const s = hi > lo ? (v.similarity - lo) / (hi - lo) : 0.5;
        const orbit = MIN_ORBIT + (1 - s) * (MAX_ORBIT - MIN_ORBIT);
        const angle = i * GOLDEN - Math.PI / 2;
        return { v, i, x: C + orbit * Math.cos(angle), y: C + orbit * Math.sin(angle), h: height(v) };
      });

    const top = placed
      .slice()
      .sort((a, b) =>
        mode === "views" ? b.v.views - a.v.views : (b.v.outperformance ?? 0) - (a.v.outperformance ?? 0)
      )
      .slice(0, 3)
      .map((p) => p.v.id);

    return { placed, top };
  }, [videos, original, mode]);

  const originH = 92;

  return (
    <div className="map">
      <svg viewBox={`0 0 ${W} ${W}`} role="img" aria-label="Ripple map of similar Shorts">
        <defs>
          <clipPath id="card-clip">
            <rect x={-BASE_W / 2} y={-BASE_H / 2} width={BASE_W} height={BASE_H} rx={9} />
          </clipPath>
          <filter id="heat" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="lift" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0d1b2a" floodOpacity="0.18" />
          </filter>
          <radialGradient id="pool" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#eef3f8" stopOpacity="1" />
            <stop offset="100%" stopColor="#eef3f8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* still water */}
        <circle cx={C} cy={C} r={MAX_ORBIT + 40} fill="url(#pool)" />
        {[MIN_ORBIT, (MIN_ORBIT + MAX_ORBIT) / 2, MAX_ORBIT].map((r) => (
          <circle key={r} className="ring" cx={C} cy={C} r={r} />
        ))}
        <circle className="ring-pulse" cx={C} cy={C} r={MAX_ORBIT + 24} />
        <circle className="ring-pulse d2" cx={C} cy={C} r={MAX_ORBIT + 24} />

        {/* heat: breakouts glow once creator size is removed */}
        <g filter="url(#heat)" className="heat-layer" style={{ opacity: mode === "reach" ? 1 : 0 }}>
          {layout.placed.map(({ v, x, y, h }) =>
            glow(v.outperformance) > 0 ? (
              <circle key={v.id} cx={x} cy={y} r={h * 0.75} fill="#3b7dd8" opacity={glow(v.outperformance)} />
            ) : null
          )}
        </g>

        {layout.placed.map(({ v, i, x, y, h }) => {
          const color = perfColor(v.outperformance);
          return (
            <g key={v.id} transform={`translate(${x} ${y})`}>
              <g
                className="node"
                style={{ animationDelay: `${300 + i * 45}ms` }}
                onClick={() => onSelect(v.id)}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(null)}
              >
                <g className="card-scale" style={{ transform: `scale(${h / BASE_H})` }} filter="url(#lift)">
                  <Card v={v} color={mode === "reach" ? color : "#c9d6e3"} selected={selectedId === v.id} />
                </g>
                {mode === "reach" && v.outperformance != null && (
                  <circle
                    className="perf-dot"
                    cx={(h * 9) / 32}
                    cy={-h / 2}
                    r={4.5}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                )}
                <title>{`${v.channelTitle}: ${v.title}`}</title>
              </g>
              {layout.top.includes(v.id) && (
                <text className="label" x={0} y={h / 2 + 15} textAnchor="middle">
                  <tspan fontWeight={600}>
                    {mode === "views" ? formatCount(v.views) : formatX(v.outperformance)}
                  </tspan>
                  <tspan> {mode === "views" ? "views" : "subscribers"}</tspan>
                </text>
              )}
            </g>
          );
        })}

        <g transform={`translate(${C} ${C})`}>
          <g className="drop-origin" onClick={() => onSelect(original.id)} style={{ cursor: "pointer" }}>
            <circle r={originH * 0.62} className="origin-halo" />
            <g style={{ transform: `scale(${originH / BASE_H})` }} filter="url(#lift)">
              <Card v={original} color="#ffffff" selected={selectedId === original.id} isOrigin />
            </g>
          </g>
          <text className="label" x={0} y={originH / 2 + 18} textAnchor="middle">
            <tspan fontWeight={600}>your Short</tspan>
          </text>
        </g>
      </svg>
      <div className="map-foot">
        <span className="hover-caption">
          {hover
            ? `${hover.channelTitle} · ${formatCount(hover.views)} views · ${PERF_LABEL[perfLevel(hover.outperformance)]}`
            : "Closer to the centre = more similar idea. Tap a Short to play it."}
        </span>
        <span className="legend">
          {mode === "reach" ? (
            <>
              below usual <span className="bar" /> outlier · glow = breakout
            </>
          ) : (
            <>size = raw views</>
          )}
        </span>
      </div>
    </div>
  );
}
