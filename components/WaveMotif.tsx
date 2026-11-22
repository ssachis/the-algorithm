// Quiet wave motif that replaces the orbit rings (Wave design kit, issue #25).
// WaveMotif: thin horizontal sine lines with one slow drifting wave, decorative (aria-hidden).
// WaveLoader: a thin travelling wave line for loading. No percentages.

function sinePath(width: number, y: number, amp: number, wavelength: number, phase: number): string {
  const step = 8;
  const pts: string[] = [];
  for (let x = 0; x <= width; x += step) {
    const yy = y + amp * Math.sin((x / wavelength) * Math.PI * 2 + phase);
    pts.push(`${x === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`);
  }
  return pts.join(" ");
}

export function WaveMotif({ width = 980, height = 420 }: { width?: number; height?: number }) {
  const lines = [
    { y: height * 0.35, amp: 14, wl: width * 0.9, phase: 0.2, cls: "" },
    { y: height * 0.55, amp: 22, wl: width * 0.7, phase: 1.4, cls: "" },
    { y: height * 0.75, amp: 10, wl: width * 0.5, phase: 2.6, cls: "" },
  ];
  // The drifting wave is drawn twice as wide so it can loop without a gap.
  const drift = sinePath(width * 2, height * 0.5, 30, width * 0.8, 0.6);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="wave-motif">
      {lines.map((l, i) => (
        <path key={i} d={sinePath(width, l.y, l.amp, l.wl, l.phase)} fill="none" stroke="var(--pale)" strokeWidth={1} />
      ))}
      <g className="wave-drift">
        <path d={drift} fill="none" stroke="var(--water)" strokeWidth={1.25} opacity={0.35} />
      </g>
    </svg>
  );
}

export function WaveLoader({ width = 260 }: { width?: number }) {
  const height = 60;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="wave-loader">
      <path d={sinePath(width, height / 2, 10, width * 0.8, 0)} fill="none" stroke="var(--pale)" strokeWidth={1} />
      <path
        className="wave-travel"
        d={sinePath(width, height / 2, 10, width * 0.8, 0)}
        fill="none"
        stroke="var(--water)"
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={100}
      />
    </svg>
  );
}
