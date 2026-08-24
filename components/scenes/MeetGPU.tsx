"use client";
import React, { useEffect, useRef, useState } from "react";
import { SM_COUNT, tileXY } from "@/lib/engine/machine";

export default function MeetGPU() {
  const [sel, setSel] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const tiles = Array.from({ length: SM_COUNT }, (_, s) => tileXY(s));

  return (
    <div className="panel">
      <div
        ref={wrapRef}
        style={{ position: "relative", padding: "var(--s5)" }}
        onClick={(e) => {
          if (!(e.target as Element).closest("[data-sm]")) setSel(null);
        }}
      >
        <svg viewBox="0 0 1200 620" role="img" aria-label="GPU die with six streaming multiprocessors; click one to expand it"
          style={{ width: "100%", height: "auto", display: "block", maxHeight: 460 }}>
          <rect x={330} y={110} width={730} height={400} rx={18} className="chassis" />
          <text x={350} y={141} className="lblStrong">GPU · DEVICE</text>
          {tiles.map((p, s) => (
            <g
              key={s}
              data-sm={s}
              className="clickable tileBtn"
              role="button"
              tabIndex={0}
              aria-label={`Expand SM ${s}`}
              aria-pressed={sel === s}
              onClick={() => setSel(sel === s ? null : s)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(sel === s ? null : s))}
            >
              <title>{`SM ${s} — two warp schedulers, shared memory`}</title>
              <rect x={p.x} y={p.y} width={142} height={150} rx={12}
                className="tile"
                style={sel === s ? { stroke: "var(--teal)", strokeWidth: 1.6 } : undefined} />
              <text x={p.x + 12} y={p.y + 22} className="lblStrong">{`SM${s}`}</text>
              {[0, 1].map((q) => (
                <rect key={q} x={p.x + 12} y={p.y + 34 + q * 54} width={118} height={44} rx={8} className="slotR" />
              ))}
              {[0, 1].map((q) => (
                <text key={"l" + q} x={p.x + 20} y={p.y + 60 + q * 54} className="lblMono">W0 W1 · LANES</text>
              ))}
            </g>
          ))}
          <text x={330} y={540} className="lblMono">GLOBAL MEMORY · SHARED BY ALL SMs</text>
        </svg>

        <div className={"inspCard" + (sel !== null ? " show" : "")} role="status" style={{ top: 24, right: 24 }}>
          <div className="inspHead">
            <span className="kicker">STREAMING MULTIPROCESSOR</span>
            <button className="inspClose" aria-label="Close" onClick={() => setSel(null)}>×</button>
          </div>
          <h4>SM {sel ?? ""}</h4>
          <p>Two schedulers drive warps of 32 lanes in lockstep.</p>
          <div style={{ marginTop: 12 }} className={sel !== null ? "lockstepOn" : ""}>
            {[0, 1].map((w) => (
              <div key={w} className="warpRow" style={{ display: "flex", gap: 6, margin: "6px 0", alignItems: "center" }}>
                <span className="kicker" style={{ width: 34 }}>W{w}</span>
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="lockstepLane" />
                ))}
              </div>
            ))}
          </div>
          <p className="hint">Every lane fires the same instruction each cycle. Click elsewhere to close.</p>
        </div>

        <div className="legend">
          <span><i style={{ background: "var(--gold)" }} />SM</span>
          <span><i style={{ background: "rgba(92,200,255,.7)" }} />WARP SCHEDULER</span>
          <span><i style={{ background: "var(--rose)" }} />SHARED MEMORY</span>
        </div>
      </div>
    </div>
  );
}
