"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  BUGS, CORRECT_LINE, DEBUG_CELLS,
  computeDebugState, type BugKind,
} from "@/lib/scenes/debugState";

const CELL_W = 48;
const GAP = 6;

export default function DebugIt() {
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(5200);
  const store = storeRef.current;

  const [bug, setBug] = useState<BugKind>("offByOne");
  const [fixed, setFixed] = useState(false);
  const [diagnosis, setDiagnosis] = useState<BugKind | null>(null);
  const [, force] = useState(0);

  const cellRefs = useRef<(SVGRectElement | null)[]>([]);
  const countRefs = useRef<(SVGTextElement | null)[]>([]);
  const oobRef = useRef<SVGGElement>(null);

  useEffect(() => () => store.pause(), [store]);

  useEffect(() => {
    return store.subscribe((ev, t) => {
      if (ev !== "tick") return;
      const s = computeDebugState(t, fixed ? "fixed" : bug);
      for (let c = 0; c < DEBUG_CELLS; c++) {
        cellRefs.current[c]?.setAttribute("fill-opacity", s.covered[c] ? "0.8" : "0.06");
        cellRefs.current[c]?.setAttribute("stroke", s.collisions[c] > 0 ? "var(--rose)" : s.covered[c] ? "var(--teal)" : "rgba(159,182,187,.16)");
        const ct = countRefs.current[c];
        if (ct) ct.textContent = s.collisions[c] > 0 ? `×${s.writeCounts[c]}` : "";
      }
      if (oobRef.current) oobRef.current.style.opacity = s.outOfBounds > 0 && s.done ? "1" : "0";
      force((x) => x + 1);
    });
  }, [store, fixed, bug]);

  const state = computeDebugState(store.t, fixed ? "fixed" : bug);
  const line = fixed ? CORRECT_LINE : BUGS[bug].line;
  const diagnosedRight = diagnosis === bug;
  const success = fixed && state.done && state.missing.length === 0 && state.outOfBounds === 0;

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)" }}>
        {!fixed && (
          <div className="controls" style={{ marginBottom: "var(--s4)" }}>
            {(Object.keys(BUGS) as BugKind[]).map((k) => (
              <button key={k} className={"btn btnSm " + (bug === k ? "btnGoldO" : "btnSecondary")}
                aria-pressed={bug === k}
                onClick={() => { setBug(k); setDiagnosis(null); setFixed(false); store.reset(); }}>
                BUG · {BUGS[k].label}
              </button>
            ))}
          </div>
        )}

        <pre className="srcLine" style={{ whiteSpace: "pre-wrap" }}>{`__global__ void add(float* a, float* b, float* c, int n) {\n    ${fixed ? CORRECT_LINE : BUGS[bug].line}\n    if (i < n) c[i] = a[i] + b[i];\n}`}</pre>

        <svg viewBox={`0 0 ${DEBUG_CELLS * (CELL_W + GAP) + 80} 120`} role="img"
          aria-label="Sixteen output cells; watch which ones receive writes"
          style={{ width: "100%", height: "auto", display: "block", margin: "var(--s4) 0 var(--s2)" }}>
          {Array.from({ length: DEBUG_CELLS }, (_, c) => (
            <g key={c}>
              <rect
                ref={(r) => { cellRefs.current[c] = r; }}
                x={24 + c * (CELL_W + GAP)} y={20} width={CELL_W} height={CELL_W - 4} rx={8}
                className="memCell"
                style={{ strokeOpacity: 1, fillOpacity: 0.06 }}
              />
              <text ref={(r) => { countRefs.current[c] = r; }}
                x={24 + c * (CELL_W + GAP) + CELL_W / 2} y={46}
                textAnchor="middle" className="lblMono" style={{ fill: "#04211B", fontWeight: 600 }} />
            </g>
          ))}
          <text x={24} y={104} className="lblMono">OUTPUT C[] · 16 ELEMENTS</text>
          <g ref={oobRef} style={{ opacity: 0, transition: "opacity .3s" }}>
            <rect x={24 + DEBUG_CELLS * (CELL_W + GAP)} y={20} width={CELL_W - 4} height={CELL_W - 4} rx={8}
              style={{ fill: "rgba(255,127,165,.15)", stroke: "var(--rose)", strokeDasharray: "4 3" }} />
            <text x={24 + DEBUG_CELLS * (CELL_W + GAP) + (CELL_W - 4) / 2} y={46} textAnchor="middle"
              style={{ fill: "var(--rose)" }}>!</text>
            <text x={24 + DEBUG_CELLS * (CELL_W + GAP)} y={104} className="lblMono" style={{ fill: "var(--rose)" }}>OOB</text>
          </g>
        </svg>

        <p className="raceCaption" aria-live="polite">
          {state.done && !fixed
            ? `${state.missing.length} elements got nothing${state.outOfBounds ? ", one write went out of bounds" : ""}, and some cells took extra writes. Diagnose the line above.`
            : success
              ? "Every element written exactly once. That is a healthy kernel."
              : "Press RUN — the visualization is your debugger."}
        </p>

        {!fixed && (
          <>
            <div className="controls" style={{ marginTop: "var(--s3)" }}>
              <button className="btn btnPrimary btnSm"
                onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN</button>
              <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳&nbsp;&nbsp;RESET</button>
              {(Object.keys(BUGS) as BugKind[]).map((k) => (
                <button key={k}
                  className={"btn btnSm " + (diagnosis === k ? (diagnosedRight ? "btnPrimary" : "btnGoldO") : "btnGhost")}
                  onClick={() => setDiagnosis(k)}>
                  {k === "offByOne" ? "+1 SLIP" : "WRONG VARIABLE"}
                </button>
              ))}
              <button className="btn btnPrimary btnSm" style={{ marginLeft: "auto" }}
                onClick={() => { setFixed(true); setDiagnosis(null); store.seek(0); }}>
                APPLY FIX →
              </button>
            </div>
            {diagnosis && (
              <p className="idx-caption" aria-live="polite">
                {diagnosedRight
                  ? <>✅ Correct — {BUGS[diagnosis].symptom} Hit <b>APPLY FIX</b> to heal the kernel.</>
                  : <>Not this one. Look again: which indices were actually written?</>}
              </p>
            )}
          </>
        )}

        {fixed && (
          <p className="idx-caption" aria-live="polite">
            Fixed line applied: <b>{CORRECT_LINE}</b> — run it again to see all sixteen cells light once.
          </p>
        )}
      </div>
    </div>
  );
}
