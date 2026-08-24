"use client";
import React, { useState } from "react";

const STAGES = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const ROWS = 32;

export default function Threads() {
  const [idx, setIdx] = useState(3);
  const n = STAGES[idx];
  const shown = Math.min(n, ROWS * 8);
  const fullGroups = n >= 32 ? Math.floor(shown / 32) : 0;
  const warps = Math.max(1, Math.ceil(n / 32));
  const partial = n < 32 && n > 0;

  function caption(): React.ReactNode {
    if (n === 1) return <>One thread. One instance of <b>add()</b>. Tiny — and alone.</>;
    if (n < 32) return <>Part of one warp. The GPU is barely warmed up.</>;
    if (n === 32) return <>Exactly <b>one warp</b>: 32 lanes stepping together.</>;
    return <><b>{warps.toLocaleString("en-US")} warps</b> of 32. Every thread runs the same code on its own element.</>;
  }

  const dots = [];
  for (let i = 0; i < shown; i++) {
    dots.push(
      <circle key={i} cx={30 + (i % ROWS) * 26 + 7} cy={36 + Math.floor(i / ROWS) * 34 + 7}
        r={7.5} style={{ fill: "var(--teal)", opacity: 0.88 }} />
    );
  }
  const seps = [];
  for (let g = 1; g <= fullGroups - (shown === fullGroups * 32 ? 0 : 0); g++) {
    if (g * 32 <= shown || g === fullGroups) {
      seps.push(
        <line key={"s" + g} className="warpLine" x1={16 + g * 32 * 26} y1={28}
          x2={16 + g * 32 * 26} y2={36 + Math.ceil(shown / ROWS) * 34} />
      );
    }
  }

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(220px,300px)", gap: "var(--s5)" }}>
        <div>
          <svg viewBox="0 0 900 250" role="img"
            aria-label={`${n} thread dots on a grid${n >= 32 ? ", grouped into warps of thirty-two" : ""}`}
            style={{ width: "100%", height: "auto", display: "block" }}>
            {seps}
            {dots}
            {n > 256 && (
              <text x={880} y={230} textAnchor="end" className="lblMono" style={{ fill: "var(--teal)" }}>
                +{(n - 256).toLocaleString("en-US")} MORE THREADS…
              </text>
            )}
            {n >= 32 && (
              <>
                <text x={20} y={240} className="lblMono">EACH CYAN BREAK · ONE WARP OF 32</text>
                {partial ? null : null}
              </>
            )}
          </svg>
          <input
            type="range"
            className="slider"
            min={0}
            max={STAGES.length - 1}
            step={1}
            value={idx}
            aria-label="Number of threads"
            onChange={(e) => setIdx(Number(e.target.value))}
            style={{ marginTop: "var(--s4)" }}
          />
        </div>
        <aside className="stepperCard">
          <h4 style={{ margin: "0 0 6px", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>WORKLOAD</h4>
          <p className="bigCount">{n.toLocaleString("en-US")}</p>
          <p style={{ margin: "6px 0 0", fontFamily: "var(--font-m)", fontSize: 12, color: "var(--ink3)" }}>THREADS</p>
          <p className="idx-caption">{caption()}</p>
          <div className="eq"><span className="v vTh">{n}</span><span className="op">×</span><span className="v vRes">add()</span></div>
          <p className="hint">A million threads is nothing mystical — it is this slide, kept going.</p>
        </aside>
      </div>
    </div>
  );
}
