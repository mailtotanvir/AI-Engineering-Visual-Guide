import Link from "next/link";
import { SAFETY_MODULES, ALL_SAFETY_SCENES } from "@/content/safety/journey";
import { SAFETY_DOMAINS } from "@/content/safety/atlas";

export const metadata = {
  title: "AI Safety & Alignment — Interactive Visual Encyclopedia",
  description: "Threat models, representation engineering, refusal mechanics, guardrails, watermarking, DP-SGD, sycophancy, and frontier governance.",
};

export default function SafetyWorldPage() {
  return (
    <main>
      <section className="heroSec" style={{ borderBottom: "1px solid var(--hair2)" }}>
        <div className="heroGridBg" />
        <div className="wrap">
          <nav className="crumbs">
            <Link href="/">ENCYCLOPEDIA</Link> <i>/</i>
            <b>WORLD 07 · AI SAFETY &amp; ALIGNMENT</b>
          </nav>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s3)", marginTop: "var(--s3)" }}>
            <span className="statusChip" style={{ borderColor: "rgba(123, 228, 149, 0.4)", color: "var(--lime)" }}>
              <i className="statusDot" style={{ background: "var(--lime)", boxShadow: "0 0 10px rgba(123, 228, 149, 0.7)" }} />
              WORLD 07 · DISCIPLINE LIVE
            </span>
            <span className="kicker" style={{ color: "var(--ink3)" }}>
              24 VISUAL EXHIBITS · 8 ATLAS DOMAINS · 32+ CONCEPTS
            </span>
          </div>

          <h1 className="heroTitle" style={{ fontSize: "clamp(32px, 5.5vw, 56px)", margin: "var(--s2) 0 var(--s3)" }}>
            AI Safety &amp; Alignment
          </h1>
          <p className="lede" style={{ fontSize: 18, maxWidth: 880, margin: 0, color: "var(--ink2)" }}>
            A comprehensive, mathematically grounded visual discipline on adversarial threat models, mechanistic safety representation engineering, constitutional alignment, guardrail topologies, differential privacy, and frontier risk governance.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s3)", marginTop: "var(--s4)" }}>
            <Link
              className="btn btnPrimary"
              href="/safety/scenes/many-shot-jailbreaking/"
              style={{ background: "var(--lime)", color: "#042110", fontWeight: 700 }}
            >
              START CURRICULUM (EXHIBIT 01) →
            </Link>
            <Link className="btn btnSecondary" href="/safety/atlas/">
              EXPLORE SAFETY ATLAS (32 CONCEPTS)
            </Link>
          </div>
        </div>
      </section>

      {/* 6 Core Modules Grid */}
      <section className="sceneSec">
        <div className="wrap">
          <div style={{ marginBottom: "var(--s4)" }}>
            <span className="kicker" style={{ color: "var(--lime)" }}>THE 6 CORE TECHNICAL MODULES</span>
            <h2 style={{ fontSize: 28, margin: "6px 0 0", color: "var(--ink)" }}>Curriculum &amp; Interactive Exhibits</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--s4)" }}>
            {SAFETY_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="panel"
                style={{
                  padding: "var(--s4)",
                  background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
                  borderColor: "var(--hair2)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s2)" }}>
                    <span className="kicker" style={{ color: "var(--lime)" }}>MODULE {mod.num}</span>
                    <span style={{ fontSize: 12, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>{mod.scenes.length} EXHIBITS</span>
                  </div>
                  <h3 style={{ fontSize: 18, margin: "0 0 6px", color: "var(--ink)" }}>{mod.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--gold)", margin: "0 0 10px", fontWeight: 500 }}>{mod.tagline}</p>
                  <p style={{ fontSize: 13.5, color: "var(--ink2)", margin: "0 0 16px", lineHeight: 1.55 }}>{mod.description}</p>
                </div>

                <div style={{ borderTop: "1px solid var(--hair2)", paddingTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mod.scenes.map((sc) => (
                      <Link
                        key={sc.id}
                        href={`/safety/scenes/${sc.id}/`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: 4,
                          background: "var(--bg3)",
                          color: "var(--ink)",
                          fontSize: 13,
                          textDecoration: "none",
                          border: "1px solid var(--hair)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <b style={{ color: "var(--lime)", fontSize: 11 }}>{sc.num}</b>
                          <span>{sc.title}</span>
                        </span>
                        <span style={{ color: "var(--ink3)", fontSize: 11 }}>→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atlas Taxonomy Strip */}
      <section className="sceneSec" style={{ background: "var(--bg2)", borderTop: "1px solid var(--hair2)" }}>
        <div className="wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--s4)" }}>
            <div>
              <span className="kicker" style={{ color: "var(--lime)" }}>TAXONOMY &amp; ATLAS</span>
              <h2 style={{ fontSize: 28, margin: "6px 0 0", color: "var(--ink)" }}>8 Safety Knowledge Domains</h2>
            </div>
            <Link className="btn btnPrimary btnSm" href="/safety/atlas/" style={{ background: "var(--lime)", color: "#042110" }}>
              BROWSE COMPLETE ATLAS →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--s3)" }}>
            {SAFETY_DOMAINS.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: "var(--s3)",
                  background: "var(--bg3)",
                  borderRadius: 6,
                  border: "1px solid var(--hair2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "var(--lime)", fontWeight: 700, fontFamily: "var(--font-m)", fontSize: 12 }}>{d.num}</span>
                  <h4 style={{ margin: 0, fontSize: 15, color: "var(--ink)" }}>{d.name}</h4>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>{d.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
