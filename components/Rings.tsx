// Decorative concentric water rings with a slow outward pulse.
export default function Rings({ size = 900, pulse = true }: { size?: number; pulse?: boolean }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[0.18, 0.32, 0.47, 0.63, 0.8].map((f) => (
        <circle key={f} className="ring" cx={c} cy={c} r={c * f} opacity={1 - f * 0.8} />
      ))}
      {pulse && (
        <>
          <circle className="ring-pulse" cx={c} cy={c} r={c * 0.95} />
          <circle className="ring-pulse d2" cx={c} cy={c} r={c * 0.95} />
          <circle className="ring-pulse d3" cx={c} cy={c} r={c * 0.95} />
        </>
      )}
    </svg>
  );
}
