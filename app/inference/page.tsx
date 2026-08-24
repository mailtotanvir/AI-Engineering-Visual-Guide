import Link from "next/link";
import { INF_JOURNEY } from "@/content/inference/journey";

export const metadata = { title: "Inference Engineering — Visual Encyclopedia" };

export default function InferenceHome() {
  return (
    <main>
      <section className="hero heroSec" aria-label="Inference engineering landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <p className="kicker"><b>INFERENCE ENGINEERING</b>&nbsp;&nbsp;VISUAL ENCYCLOPEDIA</p>
          <h1 className="heroTitle">Watch every token <em>earn</em> its place.</h1>
          <p className="lede">
            LLM serving is a physics problem wearing a chat interface. Prefill versus decode,
            the KV economy, batching, sampling, speculation — see each one move.
          </p>
          <div className="ctaRow">
            <Link className="btn btnPrimary" href="/inference/scenes/decode-loop/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
            <Link className="btn btnSecondary" href="/inference/atlas/">OPEN THE ATLAS</Link>
            <Link className="btn btnGhost" href="/">CUDA WORLD →</Link>
          </div>
        </div>
      </section>

      <section className="sceneSec">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>JOURNEY</b> · EIGHT SCENES · ONE REQUEST</p>
              <h2 className="sec-title">Follow a prompt through the machine.</h2>
            </div>
          </div>
          <div className="galleryGrid">
            {INF_JOURNEY.map((j) => (
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

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Link href="/inference/atlas/" className="card concept"
            style={{ textDecoration: "none", color: "inherit", flexDirection: "row", alignItems: "center", gap: "var(--s5)", padding: "var(--s4) var(--s5)" }}>
            <span className="kicker" style={{ color: "var(--lime)" }}>REFERENCE</span>
            <h3 className="sec-title" style={{ fontSize: 20, margin: 0 }}>The Atlas — seven domains, every inference concept.</h3>
            <span className="link-arrow" style={{ marginLeft: "auto" }}>BROWSE →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
