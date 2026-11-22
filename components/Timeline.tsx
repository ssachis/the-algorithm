import type { Video } from "@/lib/types";

// When each version was posted (x) and how far it beat its creator's reach (dot size).
export default function Timeline({ original, videos }: { original: Video; videos: Video[] }) {
  const all = [original, ...videos];
  const ts = all.map((v) => new Date(v.publishedAt).getTime());
  const lo = Math.min(...ts);
  const hi = Math.max(...ts);
  const maxOp = Math.max(...all.map((v) => v.outperformance ?? 0), 1e-6);
  const x = (t: number) => 12 + ((t - lo) / Math.max(hi - lo, 1)) * 576;

  return (
    <div className="timeline">
      <svg viewBox="0 0 600 70" preserveAspectRatio="none" aria-label="Posting timeline">
        <line className="tl-axis" x1={12} x2={588} y1={40} y2={40} />
        {videos.map((v) => (
          <circle
            key={v.id}
            className="tl-dot"
            cx={x(new Date(v.publishedAt).getTime())}
            cy={40}
            r={3 + 12 * Math.sqrt((v.outperformance ?? 0) / maxOp)}
            fill="#293a32"
            fillOpacity={0.25}
          >
            <title>{v.title}</title>
          </circle>
        ))}
        <circle cx={x(new Date(original.publishedAt).getTime())} cy={40} r={6} fill="#fff" stroke="#6f8f7d" strokeWidth={2.5} />
      </svg>
      <div className="faint" style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span>earliest</span>
        <span>most recent</span>
      </div>
    </div>
  );
}
