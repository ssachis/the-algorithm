import Link from "next/link";
import { WaveMotif } from "@/components/WaveMotif";

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-rings">
        <WaveMotif width={420} height={220} />
      </div>
      <div className="nf-inner rise">
        <span className="eyebrow">404</span>
        <h1 className="nf-title serif">This wave went nowhere.</h1>
        <p className="nf-line">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn nf-btn">
          Back to Wave
        </Link>
      </div>
    </main>
  );
}
