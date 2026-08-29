import Link from "next/link";
import { TRAIN_JOURNEY } from "@/content/training/journey";
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
                Pre-training is the step loop, the memory bill, and four kinds of parallelism stacked
                into one machine. Follow a batch forward, blame backward, and weights — billions of times.
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
              <p className="kicker"><b>JOURNEY</b> · ELEVEN SCENES · ONE RUN</p>
              <h2 className="sec-title">From random noise to a trained model.</h2>
            </div>
          </div>
          <div className="galleryGrid">
            {TRAIN_JOURNEY.map((j) => (
              <Link key={j.id} href={`/training/scenes/${j.id}/`}
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

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Link href="/training/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--gold)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — seven domains, every training concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
