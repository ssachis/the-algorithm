import type { Verdict as V, Video } from "@/lib/types";
import { observedFacts } from "@/lib/insights";
import Timeline from "./Timeline";

/** Minimum similar Shorts needed before breakouts and timing can show a real pattern. */
export const MIN_SIMILAR = 3;

// Evidence discipline: observed (computed from numbers) / might explain (hypotheses) / can't know.
export default function Verdict({
  verdict,
  original,
  videos,
  onTryAnother,
}: {
  verdict: V;
  original: Video;
  videos: Video[];
  /** Optional in-page reset. Without it, the empty state links to "/". */
  onTryAnother?: () => void;
}) {
  if (videos.length < MIN_SIMILAR) {
    return <EmptyVerdict found={videos.length} onTryAnother={onTryAnother} />;
  }

  const facts = observedFacts(original, videos);
  return (
    <section className="verdict">
      <div className="results-head" style={{ marginTop: 56 }}>
        <div>
          <span className="eyebrow">The comparison</span>
          <h2 className="serif">What changed between similar videos.</h2>
        </div>
      </div>

      <div className="buckets">
        <div className="card card-pad rise d1">
          <span className="bucket-tag observed">Observed</span>
          <h4 className="serif">What we measured</h4>
          <ul>
            {facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="card card-pad rise d2">
          <span className="bucket-tag hypothesis">Hypotheses</span>
          <h4 className="serif">What might explain it</h4>
          <ul>
            {verdict.breakoutPatterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            <li>{verdict.timing}</li>
          </ul>
        </div>

        <div className="card card-pad rise d3">
          <span className="bucket-tag unknown">Unknown</span>
          <h4 className="serif">What public data can't tell us</h4>
          <ul>
            {verdict.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="trend">
        <div className="card card-pad rise d4">
          <span className="eyebrow">Why it's moving now · via You.com</span>
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
        <div className="card card-pad rise d5">
          <span className="eyebrow">Timing</span>
          <h4 className="serif">When each version landed</h4>
          <Timeline original={original} videos={videos} />
          <div className="definition">Dot size = views ÷ subscribers. Outlined dot = your Short.</div>
        </div>
      </div>

      <div className="next rise d6">
        <span className="eyebrow">One next experiment</span>
        <h4 className="serif">Make a bigger wave</h4>
        <p>{verdict.nextExperiment}</p>
      </div>
    </section>
  );
}

function EmptyVerdict({ found, onTryAnother }: { found: number; onTryAnother?: () => void }) {
  return (
    <section className="verdict">
      <div className="card card-pad empty rise d1">
        <span className="eyebrow">Not enough company yet</span>
        <h4 className="serif">We need a few more to compare.</h4>
        <p className="muted">
          We found {found === 0 ? "no similar Shorts" : found === 1 ? "1 similar Short" : `${found} similar Shorts`} for
          this idea. Breakouts and timing need at least {MIN_SIMILAR} to show a real pattern, so we'd rather not guess.
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

/** Placeholder with the same bucket grid, shown while the analysis loads. */
export function VerdictSkeleton() {
  return (
    <section className="verdict" aria-busy="true" aria-label="Loading verdict">
      <div className="buckets">
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
      <div className="trend">
        <div className="card card-pad rise d4">
          <span className="skel skel-eyebrow" />
          <span className="skel skel-title" />
          <span className="skel skel-line" />
          <span className="skel skel-line short" />
        </div>
        <div className="card card-pad rise d5">
          <span className="skel skel-eyebrow" />
          <span className="skel skel-title" />
          <span className="skel skel-line" />
        </div>
      </div>
    </section>
  );
}
