import Link from "next/link";
import { INFRA_JOURNEY, INFRA_MODULES } from "@/content/infra/journey";
import WorldHeroSignal from "@/components/world/WorldHeroSignal";

export const metadata = { title: "Infrastructure — Visual Encyclopedia" };

export default function InfraHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Infrastructure landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="worldHeroLayout">
            <div>
              <nav className="crumbs" aria-label="Breadcrumb">
                <Link href="/">WORLDS</Link> <i>/</i> <b>INFRASTRUCTURE</b>
              </nav>
              <p className="kicker" style={{ marginTop: "var(--s3)" }}>
                <b>WORLD 06</b>&nbsp;&nbsp;INFRASTRUCTURE
              </p>
              <h1 className="heroTitle">
                Trace demand through the <em>systems that keep it alive</em>.
              </h1>
              <p className="lede">
                From NVLink mesh silicon to 100kW+ liquid-cooled datacenter power envelopes across 6 modules:
                high-radix fat-trees, RoCE v2 flow control, GPUDirect Storage, gang schedulers, straggler elimination, and FinOps unit economics.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/infra/scenes/nvlink-topology/">
                  START THE JOURNEY <span aria-hidden="true">↓</span>
                </Link>
                <Link className="btn btnSecondary" href="/infra/atlas/">
                  OPEN THE ATLAS
                </Link>
                <Link className="btn btnGhost" href="/">
                  ALL WORLDS →
                </Link>
              </div>
            </div>
            <WorldHeroSignal worldId="infrastructure" />
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · 6 MODULES · {INFRA_JOURNEY.length} SCENES</p>
              <h2 className="sec-title">From silicon trace to cluster power grid.</h2>
            </div>
          </div>

          {INFRA_MODULES.map((m) => {
            const scenes = INFRA_JOURNEY.filter((j) => j.module === m.id);
            return (
              <div key={m.id} style={{ marginBottom: "var(--s5)" }}>
                <div style={{ marginBottom: "var(--s3)", borderBottom: "1px solid var(--hair2)", paddingBottom: "var(--s2)" }}>
                  <span className="kicker" style={{ color: "#FF9E7A" }}>MODULE 0{m.id}</span>
                  <h3 style={{ fontSize: 22, margin: "4px 0" }}>{m.name}</h3>
                  <p className="hint" style={{ margin: 0 }}>{m.tagline}</p>
                </div>

                <div className="galleryGrid">
                  {scenes.map((j) => (
                    <Link
                      key={j.id}
                      href={`/infra/scenes/${j.id}/`}
                      className="card concept"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
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
          <Link
            href="/infra/atlas/"
            className="card concept"
            style={{
              textDecoration: "none",
              color: "inherit",
              flexDirection: "row",
              alignItems: "center",
              gap: "var(--s5)",
              padding: "var(--s4) var(--s5)",
            }}
          >
            <span className="kicker" style={{ color: "#FF9E7A" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>
              The Atlas — eight infrastructure domains, every cluster engineering concept.
            </h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>
              BROWSE →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
