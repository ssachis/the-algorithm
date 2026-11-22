"use client";
import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { formatCount, formatX, perfLevel, PERF_LABEL } from "@/lib/score";

export type Mode = "views" | "reach";

const W = 640;
const C = W / 2;
const MIN_ORBIT = 92;
const MAX_ORBIT = 270;
const MIN_R = 9;
const MAX_R = 36;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// soft mist -> deep forest, by log10(relative performance) from 0.1x to 100x
export function perfColor(op: number | null): string {
  if (op == null) return "#d3ddd6";
  const t = Math.min(Math.max((Math.log10(op) + 1) / 3, 0), 1);
  const a = [222, 231, 225];
  const b = [41, 58, 50];
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;
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

    // Closest to the drop = most similar (computed similarity score).
    const placed = videos
      .slice()
      .sort((a, b) => b.similarity - a.similarity)
      .map((v, i) => {
        const s = hi > lo ? (v.similarity - lo) / (hi - lo) : 0.5;
        const orbit = MIN_ORBIT + (1 - s) * (MAX_ORBIT - MIN_ORBIT);
        const angle = i * GOLDEN - Math.PI / 2;
        return { v, i, x: C + orbit * Math.cos(angle), y: C + orbit * Math.sin(angle), r: radius(v) };
      });

    const top = placed
      .slice()
      .sort((a, b) =>
        mode === "views" ? b.v.views - a.v.views : (b.v.outperformance ?? 0) - (a.v.outperformance ?? 0)
      )
      .slice(0, 3)
      .map((p) => p.v.id);

    return { placed, originR: Math.max(radius(original), 16), top };
  }, [videos, original, mode]);

  return (
    <div className="map">
      <svg viewBox={`0 0 ${W} ${W}`} role="img" aria-label="Ripple map of similar Shorts">
        <defs>
          {layout.placed.map(({ v, x, y, r }) => (
            <clipPath key={v.id} id={`clip-${v.id}`}>
              <circle cx={x} cy={y} r={r} style={{ transition: "r .8s cubic-bezier(.22,1,.36,1)" }} />
            </clipPath>
          ))}
        </defs>

        {[MIN_ORBIT, (MIN_ORBIT + MAX_ORBIT) / 2, MAX_ORBIT].map((r) => (
          <circle key={r} className="ring" cx={C} cy={C} r={r} />
        ))}
        <circle className="ring-pulse" cx={C} cy={C} r={MAX_ORBIT + 24} />
        <circle className="ring-pulse d2" cx={C} cy={C} r={MAX_ORBIT + 24} />

        {layout.placed.map(({ v, i, x, y, r }) => {
          const color = perfColor(v.outperformance);
          return (
            <g
              key={v.id}
              className={`node ${selectedId === v.id ? "selected" : ""}`}
              style={{ animationDelay: `${300 + i * 45}ms` }}
              onClick={() => onSelect(v.id)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={mode === "views" ? "#c9d6cd" : color}
                style={{ transition: "r .8s cubic-bezier(.22,1,.36,1), fill .8s" }}
              />
              {v.thumbnail && (
                <image
                  href={v.thumbnail}
                  x={x - MAX_R}
                  y={y - MAX_R}
                  width={MAX_R * 2}
                  height={MAX_R * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#clip-${v.id})`}
                  opacity={mode === "views" ? 1 : 0.9}
                />
              )}
              <circle
                className="ring-perf"
                cx={x}
                cy={y}
                r={r + 3}
                stroke={mode === "reach" ? color : "transparent"}
                strokeWidth={2.5}
                strokeDasharray={v.outperformance == null ? "3 3" : undefined}
              />
              <title>{`${v.channelTitle}: ${v.title}`}</title>
              {layout.top.includes(v.id) && (
                <text className="label" x={x} y={y + r + 17} textAnchor="middle">
                  <tspan fontWeight={600}>
                    {mode === "views" ? formatCount(v.views) : formatX(v.outperformance)}
                  </tspan>
                  <tspan> {mode === "views" ? "views" : "subscribers"}</tspan>
                </text>
              )}
            </g>
          );
        })}

        <g className="drop-origin" onClick={() => onSelect(original.id)} style={{ cursor: "pointer" }}>
          <circle className="origin" cx={C} cy={C} r={layout.originR} />
          <circle className="origin-core" cx={C} cy={C} r={5} />
          <text className="label" x={C} y={C + layout.originR + 18} textAnchor="middle">
            <tspan fontWeight={600}>your Short</tspan>
          </text>
        </g>
      </svg>
      <div className="map-foot">
        <span className="hover-caption">
          {hover
            ? `${hover.channelTitle} · ${formatCount(hover.views)} views · ${PERF_LABEL[perfLevel(hover.outperformance)]}`
            : "Closer to the centre = more similar idea. Tap a ripple."}
        </span>
        <span className="legend">
          {mode === "reach" ? (
            <>
              below usual <span className="bar" /> outlier
            </>
          ) : (
            <>size = raw views</>
          )}
        </span>
      </div>
    </div>
  );
}
