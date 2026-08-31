import Link from "next/link";
import { INF_JOURNEY, INF_MODULES, infModuleJourney } from "@/content/inference/journey";
import WorldHeroSignal from "@/components/world/WorldHeroSignal";

export const metadata = { title: "Inference Engineering — Visual Encyclopedia" };

export default function InferenceHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Inference engineering landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="worldHeroLayout">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">WORLDS</Link> <i>/</i> <b>INFERENCE</b></nav>
              <p className="kicker" style={{ marginTop: "var(--s3)" }}><b>WORLD 04</b>&nbsp;&nbsp;INFERENCE ENGINEERING</p>
              <h1 className="heroTitle">Watch every token <em>earn</em> its place.</h1>
              <p className="lede">
                The AI Inference Architecture Handbook, animated. From silicon and quantization to
                serving engines, distributed scale and FinOps — 24 scenes across 8 modules.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/inference/scenes/decode-loop/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
                <Link className="btn btnSecondary" href="/inference/atlas/">OPEN THE ATLAS</Link>
                <Link className="btn btnGhost" href="/">ALL WORLDS →</Link>
              </div>
            </div>
            <WorldHeroSignal worldId="inference" />
          </div>
        </div>
      </section>

      {INF_MODULES.map((m) => {
        const scenes = infModuleJourney(m.id);
        return (
          <section key={m.id} className="sceneSec" id={`m-${m.id}`}>
            <div className="wrap">
              <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
                <div>
                  <p className="kicker"><b>MODULE {m.num}</b> · {scenes.length} SCENES</p>
                  <h2 className="sec-title">{m.name}</h2>
                  <p className="sec-sub">{m.blurb}</p>
                </div>
              </div>
              <div className="galleryGrid">
                {scenes.map((j) => (
                  <Link key={j.id} href={`/inference/scenes/${j.id}/`}
                    className="card concept" style={{ textDecoration: "none", color: "inherit" }}>
                    <h4>{j.num} · {j.kicker}</h4>
                    <h3>{j.title}</h3>
                    <p>{j.blurb}</p>
                    <span className="link-arrow">OPEN →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Link href="/inference/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--lime)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — eight domains, every inference concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
