import type { Verdict as V, Video } from "@/lib/types";
import Timeline from "./Timeline";

/** Minimum similar Shorts needed to compare breakouts and timing. */
export const MIN_SIMILAR = 3;

export default function Verdict({
  verdict,
  original,
  videos,
  onTryAnother,
}: {
  verdict: V;
  original: Video;
  videos: Video[];
  /** Optional. Without it, the empty state links to "/" (a fresh start). */
  onTryAnother?: () => void;
}) {
  if (videos.length < MIN_SIMILAR) {
    return <EmptyVerdict found={videos.length} onTryAnother={onTryAnother} />;
  }

  return (
    <section className="verdict">
      <div className="verdict-grid">
        <div className="card card-pad rise d1">
          <span className="eyebrow">Why it's moving</span>
          <h4 className="serif">The current</h4>
          <p className="muted" style={{ margin: 0 }}>{verdict.trend.summary}</p>
          {verdict.trend.sources.length > 0 && (
            <div className="sources">
              {verdict.trend.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" title={s.snippet}>
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad rise d2">
          <span className="eyebrow">What made waves</span>
          <h4 className="serif">The breakouts</h4>
          <ul>
            {verdict.breakoutPatterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="card card-pad rise d3">
          <span className="eyebrow">Timing</span>
          <h4 className="serif">When it landed</h4>
          <p className="muted" style={{ marginTop: 0 }}>{verdict.timing}</p>
          <Timeline original={original} videos={videos} />
        </div>
      </div>

      <div className="card card-pad rise d4" style={{ marginTop: 20 }}>
        <span className="eyebrow">Honest about the gaps</span>
        <h4 className="serif">What public data can't tell us</h4>
        <ul>
          {verdict.unknowns.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </div>

      <div className="next rise d5">
        <span className="eyebrow">Your next experiment</span>
        <h4 className="serif">Make a bigger wave</h4>
        <p>{verdict.nextExperiment}</p>
      </div>
    </section>
  );
}

function EmptyVerdict({ found, onTryAnother }: { found: number; onTryAnother?: () => void }) {
  const count = found === 1 ? "1 similar Short" : `${found} similar Shorts`;
  return (
    <section className="verdict">
      <div className="card card-pad empty rise d1">
        <span className="eyebrow">Not enough company yet</span>
        <h4 className="serif">We need a few more to compare.</h4>
        <p className="muted">
          We found {found === 0 ? "no similar Shorts" : count} for this idea. Breakouts and timing need at least{" "}
          {MIN_SIMILAR} to show a real pattern, so we'd rather not guess.
        </p>
        {onTryAnother ? (
          <button className="btn" onClick={onTryAnother}>
            Try another Short
          </button>
        ) : (
          <a className="btn" href="/">
            Try another Short
          </a>
        )}
      </div>
    </section>
  );
}

/** Placeholder with the same grid as the verdict, shown while the analysis loads. */
export function VerdictSkeleton() {
  return (
    <section className="verdict" aria-busy="true" aria-label="Loading verdict">
      <div className="verdict-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`card card-pad rise d${i}`}>
            <span className="skel skel-eyebrow" />
            <span className="skel skel-title" />
            <span className="skel skel-line" />
            <span className="skel skel-line" />
            <span className="skel skel-line short" />
          </div>
        ))}
      </div>
      <div className="card card-pad rise d4" style={{ marginTop: 20 }}>
        <span className="skel skel-eyebrow" />
        <span className="skel skel-title" />
        <span className="skel skel-line" />
        <span className="skel skel-line short" />
      </div>
    </section>
  );
}
