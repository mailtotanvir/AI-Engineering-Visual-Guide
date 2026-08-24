import Link from "next/link";
import { JOURNEY } from "@/content/cuda/journey";

export const metadata = { title: "CUDA World — AI Engineering Visual Encyclopedia" };

export default function CudaWorld() {
  return (
    <main>
      <section className="hero heroSec" style={{ paddingBottom: "var(--s7)" }}>
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">WORLDS</Link> <i>/</i> <b>CUDA</b>
          </nav>
          <p className="kicker" style={{ marginTop: "var(--s3)" }}>
            <b style={{ color: "var(--teal)" }}>WORLD 01</b>&nbsp;&nbsp;CUDA ENGINEERING
          </p>
          <h1 className="heroTitle">How a kernel runs.</h1>
          <p className="lede">
            Ten scenes from one million additions to writing your own kernel:
            launch, threads, warps, memory geography, tooling and the final challenge.
          </p>
          <div className="ctaRow">
            <Link className="btn btnPrimary" href="/scenes/the-problem/">START SCENE 01 <span aria-hidden="true">↓</span></Link>
            <Link className="btn btnSecondary" href="/atlas/">CUDA ATLAS</Link>
            <Link className="btn btnGhost" href="/">ALL WORLDS →</Link>
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · TEN SCENES</p>
              <h2 className="sec-title">The full story, in order.</h2>
            </div>
          </div>
          <div className="galleryGrid">
            {JOURNEY.map((j) => (
              <Link key={j.id} href={j.href} className="card concept"
                style={{ textDecoration: "none", color: "inherit" }}>
                <h4>{j.num} · {j.kicker}</h4>
                <h3>{j.title}</h3>
                <p>{j.blurb}</p>
                <span className="link-arrow">OPEN →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
