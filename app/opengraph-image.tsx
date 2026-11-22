import { ImageResponse } from "next/og";

export const alt = "Wave — Same idea. Different outcomes.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori needs a TTF/OTF file; Google Fonts serves TTF to clients without a browser user agent.
async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/url\(([^)]+)\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const tagline = "Same idea. Different outcomes.";
  const [serif, sans] = await Promise.all([loadFont("Instrument+Serif", "wave."), loadFont("Inter", tagline)]);
  const rings = [100, 170, 240, 310, 380];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#FBFCFD",
          position: "relative",
        }}
      >
        {rings.map((r) => (
          <div
            key={r}
            style={{
              position: "absolute",
              left: 1020 - r,
              top: 315 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: "2px solid #D5DDE6",
            }}
          />
        ))}
        <div
          style={{
            display: "flex",
            fontFamily: serif ? "Instrument Serif" : "serif",
            fontSize: 200,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#0D1B2A",
          }}
        >
          wave<span style={{ color: "#3B7DD8", marginLeft: -4 }}>.</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontFamily: sans ? "Inter" : "sans-serif", fontSize: 36, color: "#4A5868" }}>
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(sans ? [{ name: "Inter", data: sans, weight: 400 as const, style: "normal" as const }] : []),
        ...(serif ? [{ name: "Instrument Serif", data: serif, weight: 400 as const, style: "normal" as const }] : []),
      ],
    }
  );
}
