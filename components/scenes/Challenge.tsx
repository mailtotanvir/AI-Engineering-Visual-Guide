"use client";
import React, { useEffect, useRef, useState } from "react";
import { CHALLENGE_BLOCK, CHALLENGE_CELLS, CHALLENGE_GRID, checkChallenge, CHALLENGE_TEMPLATE } from "@/lib/scenes/challenge";

export default function Challenge() {
  const [src, setSrc] = useState(CHALLENGE_TEMPLATE);
  const [result, setResult] = useState<ReturnType<typeof checkChallenge> | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hintIdx, setHintIdx] = useState(0);
  const rafRef = useRef(0);
  const cellRefs = useRef<(SVGRectElement | null)[]>([]);

  const HINTS = [
    "Each block is a row of blockDim.x threads.",
    "Block 1 starts where block 0 ends — that offset is blockDim.x wide.",
    "The canonical map: blockIdx.x * blockDim.x + threadIdx.x",
  ];

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const run = () => {
    const r = checkChallenge(src);
    setResult(r);
    setRunning(true);
    setProgress(0);
    const start = performance.now();
    const D = r.ok ? 2600 : 1600;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / D);
      setProgress(p);
      for (let c = 0; c < CHALLENGE_CELLS; c++) {
        const el = cellRefs.current[c];
        if (!el) continue;
        const lit = r.ok ? c < Math.round(p * CHALLENGE_CELLS) : c % 2 === 0 && p < 0.5;
        el.setAttribute("fill-opacity", lit ? "0.8" : "0.06");
        el.setAttribute("stroke", r.ok ? "var(--teal)" : p >= 0.5 ? "var(--rose)" : "rgba(159,182,187,.16)");
      }
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(240px,320px)", gap: "var(--s5)" }}>
        <div>
          <div className="codePane" style={{ border: "1px solid var(--hair)", borderRadius: "var(--r-m)", minHeight: 300 }}>
            <h5 className="codePaneTitle">YOUR KERNEL — EDIT THE MARKED LINE</h5>
            <textarea
              aria-label="Kernel source editor"
              value={src}
              onChange={(e) => { setSrc(e.target.value); setResult(null); }}
              spellCheck={false}
              style={{
                width: "100%", minHeight: 260, background: "transparent", color: "var(--ink)",
                fontFamily: "var(--font-m)", fontSize: 12.3, lineHeight: 1.85,
                border: 0, outline: "none", resize: "vertical", padding: "4px var(--s4)", whiteSpace: "pre",
              }}
            />
          </div>
          <svg viewBox={`0 0 ${CHALLENGE_CELLS * 34 + 20} 90`} role="img"
            aria-label="Sixty-four output cells fill as your mapping runs"
            style={{ width: "100%", height: "auto", display: "block", marginTop: "var(--s4)" }}>
            {Array.from({ length: CHALLENGE_CELLS }, (_, c) => (
              <rect key={c}
                ref={(r) => { cellRefs.current[c] = r; }}
                x={20 + (c % 16) * 34} y={10 + Math.floor(c / 16) * 40} width={30} height={30} rx={6}
                className="memCell" style={{ strokeOpacity: 0.25 }} />
            ))}
          </svg>
        </div>

        <aside className="stepperCard">
          <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>
            THE TASK
          </h4>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink2)" }}>
            Map every thread to its own element so all <b>{CHALLENGE_CELLS}</b> outputs are written exactly once.
          </p>
          <div className="controls" style={{ margin: "var(--s4) 0" }}>
            <button className="btn btnPrimary btnSm" onClick={run}>▶&nbsp;&nbsp;RUN &amp; TEST</button>
            <button className="btn btnSecondary btnSm" onClick={() => setSrc(CHALLENGE_TEMPLATE)}>⟳&nbsp;&nbsp;RESET CODE</button>
          </div>
          <button
            className="btn btnGhost btnSm"
            onClick={() => { setHintIdx((h) => Math.min(HINTS.length - 1, h + 1)); }}
          >
            💡&nbsp;&nbsp;HINT ({Math.min(hintIdx + 1, HINTS.length)}/{HINTS.length})
          </button>
          <p className="idx-caption" style={{ minHeight: 42 }}>{HINTS[hintIdx]}</p>

          {result && (
            <div
              role="status"
              style={{
                marginTop: "var(--s3)", padding: "12px 14px", borderRadius: 10,
                background: result.ok ? "var(--teal-dim)" : "rgba(255,127,165,.08)",
                border: `1px solid ${result.ok ? "var(--teal)" : "var(--rose)"}`,
              }}
            >
              <b style={result.ok ? { color: "var(--teal)" } : { color: "var(--rose)" }}>
                {result.ok ? "✅ TESTS PASS" : "✗ NOT QUITE"}
              </b>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--ink2)" }}>{result.reason}</p>
              {!result.ok && (
                <button className="btn btnGoldO btnSm" style={{ marginTop: 10 }} onClick={() => setHintIdx(Math.min(HINTS.length - 1, hintIdx + 1))}>
                  TAKE A HINT
                </button>
              )}
            </div>
          )}

          <div className="eq" style={{ borderTop: "1px solid var(--hair2)", paddingTop: "var(--s3)", marginTop: "var(--s3)" }}>
            <span className="op">GRID</span><span className="v vRes" style={{ fontSize: 15 }}>{CHALLENGE_GRID}</span>
            <span className="op">BLOCK</span><span className="v vRes" style={{ fontSize: 15 }}>{CHALLENGE_BLOCK}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
