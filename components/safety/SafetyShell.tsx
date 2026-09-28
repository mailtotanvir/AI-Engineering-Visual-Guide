"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  ALL_SAFETY_SCENES,
  SAFETY_MODULES,
  getAdjacentSafetyScenes,
  type SafetySceneMeta,
} from "@/content/safety/journey";
import { SAFETY_SCENE_NOTES } from "@/content/safety/notes";

export default function SafetyShell({
  scene,
  children,
}: {
  scene: SafetySceneMeta;
  children: React.ReactNode;
}) {
  const { prev, next } = getAdjacentSafetyScenes(scene.id);
  const [activeTab, setActiveTab] = useState<"interactive" | "deepdive">("interactive");
  const note = SAFETY_SCENE_NOTES[scene.id];

  const currentMod = SAFETY_MODULES.find((m) =>
    m.scenes.some((s) => s.id === scene.id)
  );
  const currentIndex = ALL_SAFETY_SCENES.findIndex((s) => s.id === scene.id) + 1;
  const totalScenes = ALL_SAFETY_SCENES.length;

  return (
    <main>
      <section className="sceneSec" aria-label={scene.title}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/safety/">SAFETY &amp; ALIGNMENT</Link> <i>/</i>
            <span>{currentMod?.title.toUpperCase() || "CURRICULUM"}</span> <i>/</i>
            <b>{scene.title}</b>
          </nav>

          <header className="sceneHeader" style={{ marginTop: "var(--s3)", marginBottom: "var(--s4)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s3)" }}>
              <p className="kicker" style={{ color: "var(--lime)" }}>
                <b>EXHIBIT {scene.num} OF {totalScenes}</b> · {scene.module.toUpperCase()}
              </p>
              <div style={{ display: "flex", gap: "var(--s2)" }}>
                <span className="statusChip" style={{ borderColor: "rgba(123, 228, 149, 0.4)" }}>
                  <i className="statusDot" style={{ background: "var(--lime)", boxShadow: "0 0 10px rgba(123, 228, 149, 0.7)" }} />
                  {scene.threatLevel}
                </span>
              </div>
            </div>

            <h1 className="heroTitle" style={{ fontSize: "clamp(28px, 4.5vw, 44px)", margin: "var(--s2) 0 var(--s3)" }}>
              {scene.title}
            </h1>
            <p className="lede" style={{ fontSize: 16, maxWidth: 880, margin: 0 }}>
              {scene.summary}
            </p>

            <div style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s4)" }}>
              <button
                type="button"
                className={"atlasTab" + (activeTab === "interactive" ? " on" : "")}
                style={activeTab === "interactive" ? { borderColor: "var(--lime)", color: "var(--lime)" } : undefined}
                onClick={() => setActiveTab("interactive")}
              >
                ◈ INTERACTIVE SIMULATION
              </button>
              <button
                type="button"
                className={"atlasTab" + (activeTab === "deepdive" ? " on" : "")}
                style={activeTab === "deepdive" ? { borderColor: "var(--lime)", color: "var(--lime)" } : undefined}
                onClick={() => setActiveTab("deepdive")}
              >
                📖 TECHNICAL BREAKDOWN &amp; MATH
              </button>
            </div>
          </header>

          <div style={{ display: activeTab === "interactive" ? "block" : "none" }}>
            {children}
          </div>

          {note && (
            <article
              className="panel"
              style={{
                display: activeTab === "deepdive" ? "block" : "none",
                padding: "var(--s5)",
                background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
                borderColor: "var(--hair)",
              }}
            >
              <div style={{ marginBottom: "var(--s4)" }}>
                <span className="kicker" style={{ color: "var(--lime)" }}>ARCHITECTURAL OVERVIEW</span>
                <h2 style={{ fontSize: 22, margin: "6px 0 12px", color: "var(--ink)" }}>{note.title}</h2>
                <p style={{ color: "var(--ink2)", fontSize: 15, lineHeight: 1.65 }}>{note.overview}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--s4)", marginBottom: "var(--s5)" }}>
                {note.keyConcepts.map((kc, idx) => (
                  <div key={idx} style={{ padding: "var(--s4)", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--hair2)" }}>
                    <h3 style={{ fontSize: 15, color: "var(--lime)", margin: "0 0 6px" }}>{kc.heading}</h3>
                    <p style={{ fontSize: 13.5, color: "var(--ink2)", margin: 0, lineHeight: 1.55 }}>{kc.body}</p>
                  </div>
                ))}
              </div>

              {note.mathDeepDive && (
                <div style={{ padding: "var(--s4)", background: "rgba(20, 35, 24, 0.7)", borderRadius: 8, border: "1px solid rgba(123, 228, 149, 0.3)", marginBottom: "var(--s4)" }}>
                  <span className="kicker" style={{ color: "var(--lime)" }}>MATHEMATICAL FORMULATION · {note.mathDeepDive.title.toUpperCase()}</span>
                  <div style={{
                    fontFamily: "var(--font-m, 'JetBrains Mono', monospace)",
                    fontSize: 15,
                    color: "var(--gold)",
                    margin: "12px 0",
                    padding: "12px 16px",
                    background: "var(--bg3)",
                    borderRadius: 6,
                    border: "1px solid rgba(230, 180, 80, 0.2)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6
                  }}>
                    {note.mathDeepDive.equation}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--ink2)" }}>{note.mathDeepDive.explanation}</p>
                </div>
              )}

              <div>
                <span className="kicker" style={{ color: "var(--cyan)" }}>REAL-WORLD PRODUCTION ENGINEERING</span>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: "var(--ink2)", fontSize: 14 }}>
                  {note.realWorldEngineering.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          )}

          <div className="journeyFoot" style={{ marginTop: "var(--s5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {prev ? (
              <Link className="btn btnSecondary btnSm" href={`/safety/scenes/${prev.id}/`}>
                ← {prev.num} {prev.title}
              </Link>
            ) : (
              <Link className="btn btnSecondary btnSm" href="/safety/">
                ← Safety Observatory
              </Link>
            )}

            <Link className="btn btnSecondary btnSm" href="/safety/atlas/">
              Safety Atlas (32 Concepts)
            </Link>

            {next ? (
              <Link className="btn btnPrimary btnSm" href={`/safety/scenes/${next.id}/`} style={{ background: "var(--lime)", color: "#042110" }}>
                {next.num} {next.title} →
              </Link>
            ) : (
              <Link className="btn btnPrimary btnSm" href="/safety/" style={{ background: "var(--lime)", color: "#042110" }}>
                Complete Curriculum →
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
