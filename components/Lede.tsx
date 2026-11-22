import type { AnalyzeResponse } from "@/lib/types";
import { formatX } from "@/lib/score";
import type { Mode } from "./RippleMap";

// Editorial headline over the canvas: the one thing worth knowing, computed from the numbers.
export default function Lede({ data, mode, away }: { data: AnalyzeResponse; mode: Mode; away?: boolean }) {
  const { original, similar } = data;
  const ranked = similar
    .filter((v) => v.outperformance != null)
    .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0));
  const top = ranked[0];
  const breakouts = ranked.filter((v) => (v.outperformance ?? 0) >= 1.5).length;
  const yours = original.outperformance;

  return (
    <div className={`cv-lede ${away ? "away" : ""}`} key={mode}>
      <span className="lede-eyebrow">
        {similar.length} Shorts · same idea{data.source === "mock" ? " · illustrative" : ""}
      </span>
      <h1 className="lede-title serif">
        {top ? (
          <>
            One version did <em>{formatX(top.outperformance)}</em> its usual.
            <br />
            {yours != null ? (
              <>
                Yours did <span className="lede-you">{formatX(yours)}</span>.
              </>
            ) : (
              <>{breakouts} broke out.</>
            )}
          </>
        ) : (
          <>Same idea. Different outcomes.</>
        )}
      </h1>
    </div>
  );
}
