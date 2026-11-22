const STEPS = [
  { title: "Drop in a Short", body: "Paste any YouTube Shorts link." },
  {
    title: "See the waves",
    body: "Similar Shorts flow out from yours, in lanes by views or by how far they beat their creator's usual reach.",
  },
  {
    title: "Make a bigger wave",
    body: "See what we measured, what might explain it, what public data can't tell us, and one experiment to try.",
  },
];

export default function HowItWorks() {
  return (
    <section className="how" aria-label="How it works">
      <ol className="how-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="how-step">
            <span className="how-num" aria-hidden>
              {i + 1}
            </span>
            <h3 className="how-title serif">{s.title}</h3>
          </li>
        ))}
      </ol>
    </section>
  );
}
