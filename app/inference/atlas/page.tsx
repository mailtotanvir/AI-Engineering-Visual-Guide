import Link from "next/link";
import InfAtlasBrowser from "@/components/inference/InfAtlasBrowser";

export const metadata = { title: "Inference Atlas — Visual Encyclopedia" };

export default function AtlasPage() {
  return (
    <main>
      <section className="sceneSec" aria-label="Inference atlas">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/inference/" className="">INFERENCE</Link> <i>/</i> <b>ATLAS</b>
          </nav>
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>THE ATLAS</b> · EIGHT DOMAINS</p>
              <h2 className="sec-title">The AI Inference Architecture Handbook, mapped.</h2>
            </div>
          </div>
          <InfAtlasBrowser />
        </div>
      </section>
    </main>
  );
}
