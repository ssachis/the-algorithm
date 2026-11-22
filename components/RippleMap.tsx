"use client";
import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { formatCount, formatX } from "@/lib/score";

export type Mode = "views" | "reach";

const W = 640;
const C = W / 2;
const MIN_ORBIT = 78;
const MAX_ORBIT = 272;
const MIN_R = 5;
const MAX_R = 34;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// pale mist -> deep water, by log10(outperformance) from 0.1x to 100x
function waterColor(op: number | null): string {
  if (op == null) return "#d5dde6";
  const t = Math.min(Math.max((Math.log10(op) + 1) / 3, 0), 1);
  const a = [213, 221, 230];
  const b = [11, 61, 145];
  const mix = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${mix.join(",")})`;
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

    const radius = (v: Video) => {
      const t = mode === "views" ? v.views / maxViews : (v.outperformance ?? 0) / maxOp;
      return MIN_R + (MAX_R - MIN_R) * Math.sqrt(Math.max(t, 0));
    };

    // Most similar sit closest to the drop.
    const placed = videos
      .slice()
      .sort((a, b) => b.similarity - a.similarity)
      .map((v, i) => {
        const s = hi > lo ? (v.similarity - lo) / (hi - lo) : 0.5;
        const orbit = MIN_ORBIT + (1 - s) * (MAX_ORBIT - MIN_ORBIT);
        const angle = i * GOLDEN - Math.PI / 2;
        return { v, x: C + orbit * Math.cos(angle), y: C + orbit * Math.sin(angle), r: radius(v) };
      });

    const top = placed
      .slice()
      .sort((a, b) =>
        mode === "views" ? b.v.views - a.v.views : (b.v.outperformance ?? 0) - (a.v.outperformance ?? 0)
      )
      .slice(0, 3)
      .map((p) => p.v.id);

    return { placed, originR: Math.max(radius(original), 12), top };
  }, [videos, original, mode]);

  return (
    <div className="map">
      <svg viewBox={`0 0 ${W} ${W}`} role="img" aria-label="Ripple map of similar Shorts">
        {[MIN_ORBIT, (MIN_ORBIT + MAX_ORBIT) / 2, MAX_ORBIT].map((r) => (
          <circle key={r} className="ring" cx={C} cy={C} r={r} />
        ))}
        <circle className="ring-pulse" cx={C} cy={C} r={MAX_ORBIT + 20} />
        <circle className="ring-pulse d2" cx={C} cy={C} r={MAX_ORBIT + 20} />

        {layout.placed.map(({ v, x, y, r }) => (
          <g key={v.id}>
            <circle
              className={`dot ${selectedId === v.id ? "selected" : ""} ${
                mode === "reach" && v.outperformance == null ? "hidden-subs" : ""
              }`}
              cx={x}
              cy={y}
              r={r}
              fill={mode === "views" ? "#9fb6cf" : waterColor(v.outperformance)}
              onClick={() => onSelect(v.id)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{v.title}</title>
            </circle>
            {layout.top.includes(v.id) && (
              <text className="label" x={x} y={y + r + 14} textAnchor="middle">
                <tspan fontWeight={600}>
                  {mode === "views" ? formatCount(v.views) : formatX(v.outperformance)}
                </tspan>
                <tspan> {mode === "views" ? "views" : "their reach"}</tspan>
              </text>
            )}
          </g>
        ))}

        <circle
          className="origin"
          cx={C}
          cy={C}
          r={layout.originR}
          onClick={() => onSelect(original.id)}
          onMouseEnter={() => setHover(original)}
          onMouseLeave={() => setHover(null)}
        >
          <title>Your Short</title>
        </circle>
        <circle className="origin-core" cx={C} cy={C} r={4} />
        <text className="label" x={C} y={C + layout.originR + 16} textAnchor="middle">
          <tspan fontWeight={600}>you</tspan>
        </text>
      </svg>
      <div className="map-foot">
        <span className="hover-caption">
          {hover ? `${hover.channelTitle} — ${hover.title}` : "Closer to the centre = closer to your idea. Tap a ripple."}
        </span>
        <span className="legend">
          {mode === "reach" ? (
            <>
              below usual <span className="bar" /> far above
            </>
          ) : (
            <>size = raw views</>
          )}
        </span>
      </div>
    </div>
  );
}
