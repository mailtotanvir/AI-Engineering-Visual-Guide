"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  ACCESS_LANES, ACCESS_WINDOWS, MEMORY_ROW, TIERS,
  accessClusters, addressesFor, computeAccessState,
} from "@/lib/scenes/memoryState";

const CELL_W = 32;
const GAP = 5;

export default function Memory() {
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(6000);
  const store = storeRef.current;

  const [mode, setMode] = useState<"coalesced" | "strided">("coalesced");
  const [prediction, setPrediction] = useState<"coalesced" | "strided" | null>(null);
  const [tier, setTier] = useState("shared");
  const [, forceTick] = useState(0);

  const cellRefs = useRef<(SVGRectElement | null)[]>([]);
  const laneRefs = useRef<(SVGCircleElement | null)[]>([]);
  const txBadgeRef = useRef<SVGTextElement>(null);
  const capRef = useRef<HTMLSpanElement>(null);
  let lastCap = "";

  const clusters = accessClusters(mode);
  const totalTx = clusters.length;
  const addrs = addressesFor(mode);

  useEffect(() => {
    return store.subscribe((ev, t) => {
      if (ev !== "tick") { forceTick((x) => x + 1); return; }
      const s = computeAccessState(mode, t);
      for (let c = 0; c < MEMORY_ROW; c++) {
        cellRefs.current[c]?.setAttribute("fill-opacity", String(0.06 + s.cellGlow[c] * 0.74));
      }
      s.laneProgress.forEach((p, li) => {
        laneRefs.current[li]?.setAttribute("fill-opacity", String(0.35 + p * 0.65));
      });
      const w = ACCESS_WINDOWS[mode];
      const doneTx = Math.min(totalTx, Math.floor(Math.min(1, Math.max(0, (t - w.start) / w.span)) * totalTx));
      if (txBadgeRef.current) txBadgeRef.current.textContent = `TRANSACTIONS · ${doneTx} / ${totalTx}`;
    });
  }, [store, mode, totalTx]);

  useEffect(() => {
    if (store.t < 1 && capRef.current) capRef.current.textContent = "";
  });

  const tierInfo = TIERS.find((x) => x.key === tier)!;
  const finished = store.t >= 1;
  const verdict =
    prediction === "strided"
      ? `Called it. Contiguous addresses ride one trip together — strided forced ${accessClusters("strided").length}.`
      : `This round goes to COALESCED: one trip for eight neighbours, while strided needed ${accessClusters("strided").length}.`;

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(240px,320px) minmax(0,1fr)", gap: "var(--s5)" }}>
        <div>
          <h4 className="specNote">MEMORY IS GEOGRAPHY</h4>
          {[...TIERS].reverse().map((tr) => (
            <button
              key={tr.key}
              onClick={() => setTier(tr.key)}
              aria-pressed={tier === tr.key}
              style={{
                display: "block", marginBottom: 10, padding: "12px 16px",
                width: tr.key === "registers" ? "46%" : tr.key === "shared" ? "72%" : "100%",
                background: tier === tr.key ? "var(--gold-dim)" : "var(--bg2)",
                border: "1px solid " + (tier === tr.key ? "var(--gold)" : "var(--hair)"),
                borderRadius: 10, color: "var(--ink)", textAlign: "left", cursor: "pointer", font: "inherit",
              }}
            >
              <span style={{ fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".14em" }}>{tr.label}</span>
              <br />
              <small style={{ color: "var(--ink3)" }}>{tr.distance}</small>
            </button>
          ))}
          <p className="idx-caption" aria-live="polite">
            <b>{tierInfo.label}</b> — {tierInfo.body}
          </p>
        </div>

        <div>
          {!prediction && (
            <>
              <p className="idx-caption">Eight lanes will fetch eight numbers. Predict the winner:</p>
              <div className="controls" style={{ margin: "var(--s3) 0" }}>
                <button className="btn btnGoldO btnSm" onClick={() => { setPrediction("coalesced"); setMode("coalesced"); }}>COALESCED WINS</button>
                <button className="btn btnGoldO btnSm" onClick={() => { setPrediction("strided"); setMode("strided"); }}>STRIDED WINS</button>
              </div>
            </>
          )}

          {prediction && (
            <>
              <div className="controls" style={{ marginBottom: "var(--s3)" }}>
                {(["coalesced", "strided"] as const).map((m) => (
                  <button
                    key={m}
                    className={"btn btnSm " + (mode === m ? "btnPrimary" : "btnSecondary")}
                    aria-pressed={mode === m}
                    onClick={() => { setMode(m); store.reset(); }}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
                <button
                  className="btn btnSecondary btnSm"
                  data-testid="prediction"
                  onClick={() => { store.seek(0); store.play(); }}
                >
                  ▶&nbsp;&nbsp;RUN · YOUR CALL: {prediction.toUpperCase()}
                </button>
              </div>

              <svg
                viewBox={`0 0 ${MEMORY_ROW * (CELL_W + GAP) + 20} 200`}
                role="img"
                aria-label={`Eight lanes reading memory ${mode}`}
                style={{ width: "100%", height: "auto", display: "block" }}
              >
                {addrs.map((a, li) => (
                  <g key={"lane" + li}>
                    <circle ref={(r) => { laneRefs.current[li] = r; }} cx={24 + li * 92} cy={28} r={9}
                      className="" style={{ fill: "var(--teal)", fillOpacity: 0.4 }} />
                    <text x={24 + li * 92} y={56} textAnchor="middle" className="lblMono">L{li}</text>
                    <text x={24 + li * 92} y={70} textAnchor="middle" className="lblMono" style={{ fill: "var(--gold)" }}>
                      →{a}
                    </text>
                  </g>
                ))}
                {Array.from({ length: MEMORY_ROW }, (_, c) => (
                  <rect
                    key={c}
                    ref={(r) => { cellRefs.current[c] = r; }}
                    x={20 + c * (CELL_W + GAP)} y={96} width={CELL_W} height={30} rx={6}
                    className="memCell"
                    style={{ strokeOpacity: 0.25 }}
                  />
                ))}
                <text x={20} y={182} className="lblStrong">TRANSACTIONS · 0 / {totalTx}</text>
              </svg>
              <p className="raceCaption" aria-live="polite">
                <span ref={capRef}>
                  {finished
                    ? verdict
                    : `Press RUN — watch the transaction counter for the ${mode.toUpperCase()} pattern.`}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
