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
  // Each line is drawn twice as wide and drifts sideways at its own speed, so the water feels alive.
  const lines = [
    { y: height * 0.3, amp: 12, wl: width * 0.9, phase: 0.2, dur: 46, op: 0.55 },
    { y: height * 0.52, amp: 22, wl: width * 0.7, phase: 1.4, dur: 34, op: 0.7 },
    { y: height * 0.74, amp: 10, wl: width * 0.5, phase: 2.6, dur: 58, op: 0.5 },
  ];
  // wavelength divides the drift distance evenly so the loop is seamless
  const main = sinePath(width * 2, height * 0.5, 30, width / 1.25, 0.6);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="wave-motif">
      {lines.map((l, i) => (
        <g key={i} className="wm-drift" style={{ animationDuration: `${l.dur}s`, animationDirection: i % 2 ? "reverse" : "normal" }}>
          <path d={sinePath(width * 2, l.y, l.amp, width / Math.round(width / l.wl), l.phase)} fill="none" stroke="#b9c3d1" strokeWidth={1.1} opacity={l.op} />
        </g>
      ))}
      <g className="wm-drift wm-main">
        <path d={main} fill="none" stroke="var(--water)" strokeWidth={1.6} opacity={0.55} />
        <path className="wm-pulse" d={main} fill="none" stroke="var(--water)" strokeWidth={2.6} strokeLinecap="round" pathLength={100} />
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
