import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

// Absolute base for Open Graph / Twitter images. Vercel sets VERCEL_PROJECT_PRODUCTION_URL;
// without it, link previews point at localhost and show no image.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Wave — Same idea. Different outcomes.",
  description:
    "Paste a YouTube Short, see where your idea travels, and learn why some versions took off.",
  openGraph: {
    title: "Wave — Same idea. Different outcomes.",
    description: "Paste a YouTube Short, see where your idea travels, and learn why some versions took off.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wave — Same idea. Different outcomes.",
    description: "Paste a YouTube Short, see where your idea travels, and learn why some versions took off.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
