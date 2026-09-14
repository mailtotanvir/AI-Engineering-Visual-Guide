"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { EVAL_JOURNEY, evalIndex, evalModuleOf, evalNeighbors } from "@/content/evals/journey";
import { SCENE_NOTES } from "@/content/evals/notes";

export default function EvalShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const i = evalIndex(id);
  const entry = EVAL_JOURNEY[i];
  const mod = evalModuleOf(id);
  const note = SCENE_NOTES[id];
  const { prev, next } = evalNeighbors(id);

  useEffect(() => {
    const sec = document.getElementById(`eval-${id}`);
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,[role=slider]")) return;
      if (e.key === "ArrowRight" && next) window.location.assign("/evals/scenes/" + next.id + "/");
      else if (e.key === "ArrowLeft" && prev) window.location.assign("/evals/scenes/" + prev.id + "/");
    };
    sec.addEventListener("keydown", onKey);
    return () => sec.removeEventListener("keydown", onKey);
  }, [id, next, prev]);

  if (!entry) return <>{children}</>;

  return (
    <section id={`eval-${id}`} className="sceneSec" tabIndex={-1} aria-label={`Evaluation scene ${entry.num}, ${entry.title}`}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/evals/">EVALUATION</Link> <i>/</i> MODULE {entry.module} <i>/</i> <b>{entry.kicker}</b>
        </nav>
        <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
          <div>
            <p className="kicker">
              <b>MODULE {entry.module}: {mod?.name.toUpperCase()}</b> · SCENE {entry.num}
            </p>
            <h2 className="sec-title">{entry.title}</h2>
            <p className="sec-sub">{entry.blurb}</p>
          </div>
        </div>

        {children}

        {note && (
          <article className="stepperCard" style={{ marginTop: "var(--s5)", padding: "var(--s5)", background: "var(--bg2)", border: "1px solid var(--hair2)", borderRadius: 12 }}>
            <div className="controls" style={{ marginBottom: "var(--s3)" }}>
              <span className="kicker" style={{ color: "var(--rose)" }}>TECHNICAL BREAKDOWN</span>
              <span className="configChip">{note.module}</span>
            </div>

            <h3 style={{ fontSize: 22, marginTop: 0, marginBottom: "var(--s3)", color: "var(--ink1)" }}>{note.title}</h3>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink2)", marginBottom: "var(--s4)" }}>{note.overview}</p>

            <div style={{ display: "grid", gap: "var(--s4)", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "var(--s4)" }}>
              {note.keyConcepts.map((kc, idx) => (
                <div key={idx} style={{ padding: "var(--s3)", background: "var(--bg3)", borderRadius: 8, borderLeft: "3px solid var(--rose)" }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: 15, color: "var(--rose)" }}>{kc.heading}</h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ink2)" }}>{kc.body}</p>
                </div>
              ))}
            </div>

            {note.mathDeepDive && (
              <div style={{ padding: "var(--s4)", background: "rgba(22,34,44,0.7)", borderRadius: 8, border: "1px solid var(--rose-dim)", marginBottom: "var(--s4)" }}>
                <span className="kicker" style={{ color: "var(--rose)" }}>MATHEMATICAL FORMULATION · {note.mathDeepDive.title.toUpperCase()}</span>
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
              <span className="kicker" style={{ color: "var(--iris)" }}>REAL-WORLD PRODUCTION ENGINEERING</span>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: "var(--ink2)", fontSize: 14 }}>
                {note.realWorldEngineering.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        )}

        <div className="journeyFoot" style={{ marginTop: "var(--s5)" }}>
          {prev ? (
            <Link className="btn btnSecondary btnSm" href={`/evals/scenes/${prev.id}/`}>← {prev.num} · {prev.title}</Link>
          ) : (
            <Link className="btn btnGhost btnSm" href="/evals/">← WORLD HOME</Link>
          )}
          <div className="dots" role="list" aria-label="Journey progress">
            {EVAL_JOURNEY.map((j) => (
              <Link key={j.id} role="listitem" aria-label={j.title}
                href={`/evals/scenes/${j.id}/`}
                className={"dot" + (j.id === id ? " on" : "")} />
            ))}
          </div>
          {next ? (
            <Link className="btn btnPrimary btnSm" href={`/evals/scenes/${next.id}/`}>{next.num} · {next.title} →</Link>
          ) : (
            <Link className="btn btnPrimary btnSm" href="/evals/atlas/">ATLAS →</Link>
          )}
        </div>
      </div>
    </section>
  );
}
