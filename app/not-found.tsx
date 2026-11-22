import Link from "next/link";
import Rings from "@/components/Rings";

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-rings">
        <Rings size={420} />
      </div>
      <div className="nf-inner rise">
        <span className="eyebrow">404</span>
        <h1 className="nf-title serif">This ripple went nowhere.</h1>
        <p className="nf-line">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn nf-btn">
          Back to Wave
        </Link>
      </div>
    </main>
  );
}
