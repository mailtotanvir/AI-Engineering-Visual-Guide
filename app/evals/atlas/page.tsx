import Link from "next/link";
import EvalAtlasBrowser from "@/components/evals/EvalAtlasBrowser";

export const metadata = { title: "Evaluation Atlas — Visual Encyclopedia" };

export default function EvalsAtlas() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Evaluation atlas landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">WORLDS</Link> <i>/</i> <Link href="/evals/">EVALUATION</Link> <i>/</i> <b>ATLAS</b>
          </nav>
          <p className="kicker" style={{ marginTop: "var(--s3)" }}><b>REFERENCE</b>&nbsp;&nbsp;EIGHT DOMAINS</p>
          <h1 className="heroTitle" style={{ fontSize: "clamp(36px,4.6vw,58px)" }}>Every evaluation concept, <em>on one map</em>.</h1>
          <p className="lede" style={{ maxWidth: 720 }}>
            Browse by domain. Scenes open the animated exhibits; entries are the distilled reference points.
          </p>
        </div>
      </section>
      <section className="sceneSec">
        <div className="wrap">
          <EvalAtlasBrowser />
          <div className="journeyFoot" style={{ maxWidth: 320 }}>
            <Link className="btn btnGhost btnSm" href="/evals/">← WORLD HOME</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
