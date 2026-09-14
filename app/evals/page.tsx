import Link from "next/link";
import { EVAL_JOURNEY, EVAL_MODULES } from "@/content/evals/journey";
import WorldHeroSignal from "@/components/world/WorldHeroSignal";

export const metadata = { title: "Evaluation — Visual Encyclopedia" };

export default function EvalsHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Evaluation landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="worldHeroLayout">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">WORLDS</Link> <i>/</i> <b>EVALUATION</b></nav>
              <p className="kicker" style={{ marginTop: "var(--s3)" }}><b>WORLD 05</b>&nbsp;&nbsp;EVALUATION</p>
              <h1 className="heroTitle">Turn model behavior into <em>evidence you can trust</em>.</h1>
              <p className="lede">
                From benchmark design to regression gates across 8 modules: the measurement loop,
                contamination, scoring, judges, agreement, statistics, and production monitoring.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/evals/scenes/eval-loop/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
                <Link className="btn btnSecondary" href="/evals/atlas/">OPEN THE ATLAS</Link>
                <Link className="btn btnGhost" href="/">ALL WORLDS →</Link>
              </div>
            </div>
            <WorldHeroSignal worldId="evals" />
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · 8 MODULES · {EVAL_JOURNEY.length} SCENES</p>
              <h2 className="sec-title">From a claim about a model to evidence that holds.</h2>
            </div>
          </div>

          {EVAL_MODULES.map((m) => {
            const scenes = EVAL_JOURNEY.filter((j) => j.module === m.id);
            return (
              <div key={m.id} style={{ marginBottom: "var(--s5)" }}>
                <div style={{ marginBottom: "var(--s3)", borderBottom: "1px solid var(--hair2)", paddingBottom: "var(--s2)" }}>
                  <span className="kicker" style={{ color: "var(--rose)" }}>MODULE 0{m.id}</span>
                  <h3 style={{ fontSize: 22, margin: "4px 0" }}>{m.name}</h3>
                  <p className="hint" style={{ margin: 0 }}>{m.tagline}</p>
                </div>

                <div className="galleryGrid">
                  {scenes.map((j) => (
                    <Link key={j.id} href={`/evals/scenes/${j.id}/`}
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
          <Link href="/evals/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--rose)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — eight domains, every evaluation concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
