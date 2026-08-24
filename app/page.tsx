import Link from "next/link";
import BootVeil from "@/components/home/BootVeil";
import MiniViz from "@/components/home/MiniViz";
import { TOKEN_SWATCHES } from "@/content/cuda/scenes";
import { JOURNEY } from "@/content/cuda/journey";
import InstrumentDemo from "@/components/home/InstrumentDemo";
import TokenLab from "@/components/home/TokenLab";
import { WORLDS } from "@/content/worlds";

export default function Home() {
  return (
    <main>
      <BootVeil />
      <section className="hero heroSec" aria-label="Landing">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <div className="heroLayout bootHideUntilDone">
            <div>
              <p className="kicker"><b>AI ENGINEERING</b>&nbsp;&nbsp;VISUAL ENCYCLOPEDIA</p>
              <h1 className="heroTitle">See the machine <em>think.</em></h1>
              <p className="lede">
                CUDA, but you can see it run. An interactive atlas where code, hardware,
                execution, memory and performance become one continuous visual story.
              </p>
              <div className="ctaRow">
                <Link className="btn btnPrimary" href="/scenes/the-problem/">START THE JOURNEY <span aria-hidden="true">↓</span></Link>
                <Link className="btn btnSecondary" href="/launch/">ENTER THE MACHINE</Link>
                <Link className="btn btnGhost" href="/descent/">DESCEND →</Link>
              </div>
              <div className="chipRow" aria-label="What is inside">
                <span className="chip"><i style={{ background: "var(--teal)" }} />LIVE KERNEL LAUNCH</span>
                <span className="chip"><i style={{ background: "var(--gold)" }} />TIME UNDER YOUR CONTROL</span>
                <span className="chip"><i style={{ background: "var(--iris)" }} />CODE ⇄ MACHINE</span>
                <span className="chip"><i style={{ background: "var(--cyan)" }} />SPATIAL NAVIGATION</span>
              </div>
            </div>
            <div className="vizWrap mini">
              <MiniViz />
              <span className="hintline" style={{ display: "block", textAlign: "center", marginTop: 10 }}>
                LIVE · MINIATURE LAUNCH LOOP
              </span>
            </div>
          </div>
        </div>
      </section>

            <section className="section" id="worlds" style={{ borderTop: 0 }}>
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>WORLDS</b> · EIGHT DISCIPLINES · TWO LIVE TODAY</p>
              <h2 className="sec-title">Choose your discipline.</h2>
            </div>
          </div>
          <div className="galleryGrid">
            {WORLDS.map((w) => {
              const live = w.status === "live";
              const inner = (<>
                <h4 style={{ color: live ? undefined : "var(--ink3)" }}>
                  {live ? <>WORLD · {w.scenes} SCENES · {w.entries} ENTRIES</> : <>PLANNED WORLD</>}
                </h4>
                <h3>{w.name}</h3>
                <p><i style={{ fontStyle: "normal", color: w.accent }}>{w.tagline}</i> — {w.blurb}</p>
                <span className="link-arrow">{live ? "ENTER →" : "COMING IN A FUTURE MVP"}</span>
              </>);
              return live ? (
                <Link key={w.id} href={w.href!} className="card concept"
                  style={{ textDecoration: "none", color: "inherit", borderLeft: `3px solid ${w.accent}` }}>
                  {inner}
                </Link>
              ) : (
                <div key={w.id} className="card concept" style={{ borderLeft: `3px solid ${w.accent}`, opacity: 0.55 }}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>



      <section className="section" id="instruments">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker"><b>SYSTEM</b> · PRINCIPLES</p>
              <h2 className="sec-title">One interaction vocabulary</h2>
              <p className="sec-sub">
                Don’t explain what can be demonstrated. Don’t demonstrate what can be manipulated.
                The learner navigates CUDA by manipulating the visualization itself.
              </p>
            </div>
          </div>
          <div className="galleryGrid">
            <div className="card" style={{ gridColumn: "span 2" }}>
              <h4>INSTRUMENTS · LIVE — EVERY BUTTON WORKS</h4>
              <InstrumentDemo />
              <p className="hint">The same vocabulary drives every exhibit: RUN · RESET · STEP · INSPECT · SPEED.</p>
            </div>
            <div className="card concept">
              <h4>Spatial navigation</h4>
              <nav className="crumbs" aria-label="Breadcrumb sample">
                CUDA <i>/</i> EXECUTION <i>/</i> THREADS <i>/</i> <b>WARP LANES</b>
              </nav>
              <p>The visualization itself navigates. Click an SM, a warp, a memory cell — the world opens underneath your cursor.</p>
            </div>
            <div className="card concept">
              <h4>Time is a dimension</h4>
              <nav className="crumbs" aria-label="Time controls sample">
                RUN <i>/</i> PAUSE <i>/</i> STEP <i>/</i> REWIND <i>/</i> SCRUB
              </nav>
              <p>Every simulation is a pure function of time. Rewind reality, inspect any instant, replay at half speed.</p>
            </div>
            <div className="card concept">
              <h4>Type scale — conceptual headlines first</h4>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                A GPU doesn’t execute your program. It executes a grid of work.
              </p>
              <p style={{ margin: 0 }}>One statement, up to three sentences, then the visual earns the detail.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="tokens">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker"><b>SYSTEM</b> · TOKENS</p>
              <h2 className="sec-title">Deep space, signal colors</h2>
              <p className="sec-sub">
                Surfaces stay near-black with a cool cast; each hierarchy level owns one hue.
                Color never carries meaning alone — every object carries a label too.
              </p>
            </div>
          </div>
          <TokenLab />
          <div className="specDemo" style={{ marginTop: "var(--s5)" }}>
            <p className="specNote">DISPLAY · SPACE GROTESK 700</p>
            <p style={{ margin: 0, fontSize: "clamp(30px,4.5vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
              One thread is tiny.<br />A million threads become a workload.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
