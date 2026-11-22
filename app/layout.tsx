import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
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
