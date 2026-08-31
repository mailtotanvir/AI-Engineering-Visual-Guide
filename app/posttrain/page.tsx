import Link from "next/link";
import { POST_JOURNEY, POST_MODULES } from "@/content/posttrain/journey";
import WorldHeroSignal from "@/components/world/WorldHeroSignal";

export const metadata = { title: "Post-Training & Distillation — Visual Encyclopedia" };

export default function PostTrainHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Post-training landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="worldHeroLayout">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">WORLDS</Link> <i>/</i> <b>POST-TRAINING</b></nav>
              <p className="kicker" style={{ marginTop: "var(--s3)" }}><b>WORLD 04</b>&nbsp;&nbsp;POST-TRAINING &amp; DISTILLATION</p>
              <h1 className="heroTitle">Watch raw capability become <em>useful behavior</em>.</h1>
              <p className="lede">
                From base weights to a steerable, safe assistant across 8 modules: SFT, synthetic data,
                LoRA math, RLHF / DPO, verifiable-reward reasoning, safety, evals, and deployment.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/posttrain/scenes/sft-basics/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
                <Link className="btn btnSecondary" href="/posttrain/atlas/">OPEN THE ATLAS</Link>
                <Link className="btn btnGhost" href="/">ALL WORLDS →</Link>
              </div>
            </div>
            <WorldHeroSignal worldId="post-training" />
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · 8 MODULES · {POST_JOURNEY.length} SCENES</p>
              <h2 className="sec-title">From a raw base model to a deployed, aligned system.</h2>
            </div>
          </div>

          {POST_MODULES.map((m) => {
            const scenes = POST_JOURNEY.filter((j) => j.module === m.id);
            return (
              <div key={m.id} style={{ marginBottom: "var(--s5)" }}>
                <div style={{ marginBottom: "var(--s3)", borderBottom: "1px solid var(--hair2)", paddingBottom: "var(--s2)" }}>
                  <span className="kicker" style={{ color: "var(--cyan)" }}>MODULE 0{m.id}</span>
                  <h3 style={{ fontSize: 22, margin: "4px 0" }}>{m.name}</h3>
                  <p className="hint" style={{ margin: 0 }}>{m.tagline}</p>
                </div>

                <div className="galleryGrid">
                  {scenes.map((j) => (
                    <Link key={j.id} href={`/posttrain/scenes/${j.id}/`}
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
          <Link href="/posttrain/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--cyan)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — eight domains, every post-training concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
