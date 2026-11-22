// Wave wordmark: small ripples that surge into one breakout wave, then "wave".
// Sized by font-size (1em tall), so it drops in wherever the old text wordmark was.
export default function Logo() {
  return (
    <span className="logo" aria-label="wave">
      <svg className="logo-mark" viewBox="0 0 64 28" aria-hidden>
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7cc4f5" />
            <stop offset=".55" stopColor="#3b7dd8" />
            <stop offset="1" stopColor="#1f4fc0" />
          </linearGradient>
        </defs>
        <path
          d="M2 21 C8 21 10 16 15 16 S21 22 26 21 S33 13 38 15 S44 23 49 19 S55 5 62 3"
          fill="none"
          stroke="url(#logo-g)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo-word">wave</span>
    </span>
  );
}
