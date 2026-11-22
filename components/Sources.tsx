import type { Source, Twin } from "@/lib/types";

// Source chips over the canvas: where the trend summary came from (You.com).
export function SourceChips({ sources }: { sources: Source[] }) {
  const shown = sources.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div className="src-chips" aria-label="Trend sources">
      <span className="src-label">via You.com</span>
      {shown.map((s, i) => (
        <a key={`${i}-${s.url}`} className="src-chip" href={s.url} target="_blank" rel="noreferrer" title={s.title}>
          {s.title || "Source"}
        </a>
      ))}
    </div>
  );
}

// "Meet your twin": the same idea showing up on other platforms. Hidden when empty.
export function TwinCard({ twins, live = true }: { twins?: Twin[]; live?: boolean }) {
  const items = (twins ?? []).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className="twin-card" aria-label="Meet your twin">
      <h3 className="serif twin-title">Meet your twin</h3>
      <p className="twin-sub">Same idea, other platforms. {live ? "Live from You.com." : "Example data, not live."}</p>
      <ul className="twin-list">
        {items.map((t, i) => (
          <li key={`${i}-${t.url}`}>
            <span className="twin-tag">{t.platform}</span>
            <a href={t.url} target="_blank" rel="noreferrer" className="twin-link">
              {t.title}
            </a>
            {t.snippet && <p className="twin-snip">{t.snippet}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
