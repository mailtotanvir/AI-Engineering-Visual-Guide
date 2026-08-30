import Link from "next/link";
import { TRAIN_JOURNEY, TRAIN_MODULES } from "@/content/training/journey";
import WorldHeroSignal from "@/components/world/WorldHeroSignal";

export const metadata = { title: "Training at Scale — Visual Encyclopedia" };

export default function TrainingHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Training at scale landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="worldHeroLayout">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">WORLDS</Link> <i>/</i> <b>TRAINING</b></nav>
              <p className="kicker" style={{ marginTop: "var(--s3)" }}><b>WORLD 03</b>&nbsp;&nbsp;TRAINING AT SCALE</p>
              <h1 className="heroTitle">Watch information become a <em>change</em> in the model.</h1>
              <p className="lede">
                Pre-training across 6 comprehensive modules: from self-supervised objectives and web-scale data curation,
                to 3D parallelism, precision numerics, and run diagnostics.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/training/scenes/token-diet/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
                <Link className="btn btnSecondary" href="/training/atlas/">OPEN THE ATLAS</Link>
                <Link className="btn btnGhost" href="/">ALL WORLDS →</Link>
              </div>
            </div>
            <WorldHeroSignal worldId="training-scale" />
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · 6 MODULES · 21 SCENES</p>
              <h2 className="sec-title">From random noise to a trained foundation model.</h2>
            </div>
          </div>

          {TRAIN_MODULES.map((m) => {
            const scenes = TRAIN_JOURNEY.filter((j) => j.module === m.id);
            return (
              <div key={m.id} style={{ marginBottom: "var(--s5)" }}>
                <div style={{ marginBottom: "var(--s3)", borderBottom: "1px solid var(--hair2)", paddingBottom: "var(--s2)" }}>
                  <span className="kicker" style={{ color: "var(--gold)" }}>MODULE 0{m.id}</span>
                  <h3 style={{ fontSize: 22, margin: "4px 0" }}>{m.name}</h3>
                  <p className="hint" style={{ margin: 0 }}>{m.tagline}</p>
                </div>

                <div className="galleryGrid">
                  {scenes.map((j) => (
                    <Link key={j.id} href={`/training/scenes/${j.id}/`}
                      className="card concept" style={{ textDecoration: "none", color: "inherit" }}>
                      <h4>{j.num} · {j.kicker}</h4>
                      <h3>{j.title}</h3>
                      <p>{j.blurb}</p>
                      <span className="link-arrow">OPEN EXHIBIT →</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Link href="/training/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--gold)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — six domains, every pre-training concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
