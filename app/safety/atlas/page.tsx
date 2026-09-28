import Link from "next/link";
import SafetyAtlasBrowser from "@/components/safety/SafetyAtlasBrowser";

export const metadata = {
  title: "AI Safety Atlas — 8 Domains & 32 Concepts",
  description: "Comprehensive taxonomy of adversarial attacks, representation engineering, refusal mechanics, guardrails, and frontier risk governance.",
};

export default function SafetyAtlasPage() {
  return (
    <main>
      <section className="heroSec" style={{ borderBottom: "1px solid var(--hair2)" }}>
        <div className="heroGridBg" />
        <div className="wrap">
          <nav className="crumbs">
            <Link href="/">ENCYCLOPEDIA</Link> <i>/</i>
            <Link href="/safety/">SAFETY &amp; ALIGNMENT</Link> <i>/</i>
            <b>ATLAS TAXONOMY</b>
          </nav>

          <div style={{ marginTop: "var(--s3)", marginBottom: "var(--s3)" }}>
            <span className="statusChip" style={{ borderColor: "rgba(123, 228, 149, 0.4)", color: "var(--lime)" }}>
              <i className="statusDot" style={{ background: "var(--lime)", boxShadow: "0 0 10px rgba(123, 228, 149, 0.7)" }} />
              SAFETY &amp; ALIGNMENT TAXONOMY
            </span>
          </div>

          <h1 className="heroTitle" style={{ fontSize: "clamp(30px, 5vw, 48px)", margin: "0 0 var(--s3)" }}>
            Safety &amp; Alignment Atlas
          </h1>
          <p className="lede" style={{ fontSize: 16, maxWidth: 840, margin: 0, color: "var(--ink2)" }}>
            The definitive engineering index of AI safety: 8 domains, 32+ concepts, threat surfaces, internal representation probes, guardrail topologies, differential privacy budgets, and verifiable governance cases.
          </p>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <SafetyAtlasBrowser />
        </div>
      </section>
    </main>
  );
}
