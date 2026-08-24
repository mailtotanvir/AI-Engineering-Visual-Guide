"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  BASE_LOGITS, KV_CFG_7B_FP16, SPEC_STEPS,
  applySampling, kvCacheBytes, kvBytesPerToken, mb, tokenize,
} from "@/lib/inference/engine";

const storeOf = (() => {
  const cache = new Map<string, TimelineStore>();
  return (key: string, dur: number) => {
    if (!cache.has(key)) cache.set(key, new TimelineStore(dur));
    return cache.get(key)!;
  };
})();

function useTick(store: TimelineStore) {
  const [, force] = useState(0);
  useEffect(() => store.subscribe((ev) => ev === "tick" && force((x) => x + 1)), [store]);
}

/* ---------- 01 decode loop ---------- */
export function DecodeLoop() {
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = storeOf("decode", 6600);
  const store = storeRef.current;
  useTick(store);
  const words = ["The", " GPU", " never", " draws", " a", " whole", " sentence", " —", " it", " predicts", " one", " token", ",", " then", " runs", " again"];
  const steps = words.length;
  const step = Math.min(steps, Math.floor(store.t * steps));
  const bytes = kvCacheBytes(KV_CFG_7B_FP16, step);
  void bytes;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        <span className="configChip">STEP {step} / {steps}</span>
        <span className="configChip">KV CACHE · {mb(kvCacheBytes(KV_CFG_7B_FP16, Math.max(1, step)))}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 96 }}>
        {words.slice(0, step).map((w, i) => (
          <span key={i} className="tokChip" style={{ animation: "none" }}>{w}</span>
        ))}
        {store.playing && step < steps && (
          <span className="tokChip tokNext">▍</span>
        )}
      </div>
      <p className="raceCaption">
        Each chip is one forward pass over the whole model. Past tokens join the input every step —
        that is why generation is serial and why the KV cache grows without asking.
      </p>
    </div>
  );
}

/* ---------- 02 prefill vs decode ---------- */
export function PrefillDecode() {
  useTick(storeOf("pd", 7000));
  const store = storeOf("pd", 7000);
  const t = store.t;
  const prefillEnd = 0.35;
  const inPrefill = t < prefillEnd && t > 0;
  const computeUtil = inPrefill ? 0.95 : 0.28;
  const memUtil = inPrefill ? 0.5 : 0.92;
  const ttftHit = t >= prefillEnd;

  const Meter = ({ label, v, color }: { label: string; v: number; color: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <span className="kicker">{label}</span><span className="kicker" style={{ color }}>{Math.round(v * 100)}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "var(--bg3)" }}>
        <div style={{ height: "100%", width: `${v * 100}%`, borderRadius: 5, background: color, transition: "width .2s" }} />
      </div>
    </div>
  );

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <span className={"chip" + (inPrefill ? "" : "")} style={inPrefill ? { color: "var(--gold)", borderColor: "var(--gold)" } : ttftHit && t < 1 ? { color: "var(--teal)", borderColor: "var(--teal)" } : undefined}>
          {t <= 0 ? "READY" : inPrefill ? "PREFILL · READING PROMPT" : "DECODE · STREAMING TOKENS"}
        </span>
        {ttftHit && <span className="configChip">TTFT MARKER CROSSED</span>}
      </div>
      <Meter label="COMPUTE UNITS" v={computeUtil} color="var(--teal)" />
      <Meter label="MEMORY BANDWIDTH" v={memUtil} color="var(--rose)" />
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "Two phases live inside every request. RUN to feel the handoff."
          : inPrefill
            ? "PREFILL: all prompt tokens flow through together — matmuls saturate compute units. First token lands when it ends."
            : t < 1
              ? "DECODE: one token per pass now. Compute idles; streaming weights from memory is the bottleneck."
              : "Same model, two personalities: compute-bound then bandwidth-bound."}
      </p>
    </div>
  );
}

/* ---------- 03 latency timeline ---------- */
export function LatencyTimeline() {
  useTick(storeOf("lat", 6000));
  const store = storeOf("lat", 6000);
  const t = store.t;
  const ttftAt = 0.3;
  const spans = [
    { label: "TTFT", from: 0, to: ttftAt, color: "var(--gold)" },
    { label: "ITL × N", from: ttftAt, to: 0.94, color: "var(--teal)" },
  ];
  const e2e = 0.94;
  const tokensOut = Math.max(0, Math.floor(Math.max(0, t - ttftAt) / ((1 - ttftAt) / 14)));

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s3)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <span className="configChip">TOKENS OUT · {tokensOut}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Latency spans across a streamed response"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {spans.map((sp, i) => {
          const x = 40 + sp.from * 820;
          const w = (sp.to - sp.from) * 820 * Math.min(1, Math.max(0, (t - sp.from) / Math.max(0.001, sp.to - sp.from)));
          const reached = t > sp.from;
          return (
            <g key={i}>
              <rect x={x} y={40} width={Math.max(0, w)} height={34} rx={8}
                style={{ fill: sp.color, fillOpacity: reached ? 0.25 : 0.06, stroke: sp.color, strokeOpacity: 0.7 }} />
              <text x={x + 12} y={62} className="lblMono" style={{ fill: sp.color }}>{sp.label}</text>
            </g>
          );
        })}
        {[["0", 40], ["FIRST TOKEN", 40 + ttftAt * 820], ["LAST TOKEN", 40 + e2e * 820]].map(([l, x]) => (
          <g key={l as string}>
            <line x1={x as number} y1={90} x2={x as number} y2={104} stroke="var(--ink3)" />
            <text x={x as number} y={122} textAnchor="middle" className="lblMono">{l}</text>
          </g>
        ))}
        <rect x={40} y={98} width={e2e * 820 * Math.min(1, Math.max(0, t))} height={3} rx={1.5}
          style={{ fill: "var(--iris)" }} />
        <text x={40} y={142} className="lblMono" style={{ fill: "var(--iris)" }}>E2E LATENCY</text>
      </svg>
      <p className="raceCaption">
        Users feel TTFT as responsiveness and TPOT as reading speed. Goodput only counts responses
        that satisfy BOTH budgets under real load.
      </p>
    </div>
  );
}

/* ---------- 04 kv cache growth ---------- */
export function KvGrowth() {
  const [seq, setSeq] = useState(2048);
  const perToken = kvBytesPerToken(KV_CFG_7B_FP16);
  const batches = [1, 8, 32];
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">SEQUENCE LENGTH</span>
        <input type="range" className="slider" min={256} max={16384} step={256} value={seq}
          aria-label="Sequence length" style={{ maxWidth: 320 }}
          onChange={(e) => setSeq(Number(e.target.value))} />
        <span className="configChip">{seq.toLocaleString("en-US")} TOKENS</span>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {batches.map((b) => {
          const bytes = kvCacheBytes(KV_CFG_7B_FP16, seq, b);
          const frac = bytes / kvCacheBytes(KV_CFG_7B_FP16, 16384, 32);
          return (
            <div key={b}>
              <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="kicker">BATCH {b}</span>
                <span className="kicker" style={{ color: "var(--rose)" }}>{mb(bytes)}</span>
              </div>
              <div style={{ height: 16, borderRadius: 8, background: "var(--bg3)" }}>
                <div style={{
                  height: "100%", width: `${Math.max(2, frac * 100)}%`, borderRadius: 8,
                  background: "linear-gradient(90deg,var(--iris),var(--rose))",
                  transition: "width .25s",
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="raceCaption">
        Formula: <b>2 × 32 layers × 32 kvHeads × 128 headDim × 2 bytes = {mb(perToken)} per token</b>.
        A 32-way batch at full context carries a small model's worth of weights in cache alone.
      </p>
    </div>
  );
}

/* ---------- 05 paged kv ---------- */
export function PagedKv() {
  const [paged, setPaged] = useState(true);
  const [, force] = useState(0);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = storeOf("paged", 5000);
  const store = storeRef.current;

  useEffect(() => store.subscribe((ev) => ev === "tick" && force((x) => x + 1)), [store]);

  const MAX = 64;
  const BLOCK = 8;
  const used = Math.round(store.t * 44);
  const reservedBlocks = Math.ceil(MAX / BLOCK);
  const usedBlocksPaged = Math.ceil(used / BLOCK);
  const wasteNaive = MAX - MAX;
  const internalFrag = paged ? reservedBlocks * BLOCK - used : MAX - MAX;
  const externalFrag = paged ? 0 : Math.round(MAX * 0.18);

  const cells = [];
  for (let c = 0; c < MAX; c++) {
    const filled = c < used;
    let bg = "rgba(16,32,43,.5)";
    let border = "rgba(159,182,187,.16)";
    if (!paged && !filled && c < MAX) { /* reserved but unusable until needed */ }
    if (filled) { bg = "var(--teal-dim)"; border = "var(--teal)"; }
    else if (!paged) { border = "rgba(255,127,165,.35)"; }
    cells.push(
      <rect key={c} x={24 + (c % 32) * 26} y={30 + Math.floor(c / 32) * 34} width={22} height={26} rx={4}
        style={{ fill: bg, stroke: border }} />
    );
  }
  void wasteNaive;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["naive", "paged"] as const).map((m) => (
          <button key={m} className={"btn btnSm " + ((m === "paged") === paged ? "btnPrimary" : "btnSecondary")}
            aria-pressed={paged === (m === "paged")}
            onClick={() => { setPaged(m === "paged"); store.reset(); }}>
            {m === "naive" ? "CONTIGUOUS RESERVATION" : "PAGED BLOCKS"}
          </button>
        ))}
        <button className="btn btnPrimary btnSm" onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN</button>
        <span className="configChip">TOKENS STORED · {used}/{MAX}</span>
        {!paged && <span className="chip" style={{ color: "var(--rose)", borderColor: "var(--rose)" }}>
          RESERVED FOR WORST CASE · {MAX}
        </span>}
        {paged && <span className="chip" data-testid="frag">INTERNAL FRAG · {internalFrag} SLOTS</span>}
      </div>
      <svg viewBox="0 0 900 110" role="img" aria-label="KV cache cells filling"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {cells}
        {!paged && <text x={24} y={104} className="lblMono" style={{ fill: "var(--rose)" }}>
          PINK-EDGED CELLS ARE LOCKED TO ONE REQUEST WHETHER OR NOT THEY FILL
        </text>}
        {paged && <text x={24} y={104} className="lblMono">
          BLOCK TABLE MAPS LOGICAL POSITIONS → PHYSICAL PAGES · FRAGMENTATION ≤ {BLOCK - 1} SLOTS PER SEQUENCE
        </text>}
      </svg>
      <p className="raceCaption">
        Contiguous reservation bets every request hits max context. Paging allocates {BLOCK}-token blocks
        on demand — waste drops from whole slabs to less than one block per sequence.
      </p>
    </div>
  );
}

/* ---------- 06 continuous batching ---------- */
export function ContinuousBatching() {
  const [mode, setMode] = useState<"static" | "continuous">("continuous");
  const jobs = [
    { id: "R0", arrival: 0, len: 9 },
    { id: "R1", arrival: 0, len: 5 },
    { id: "R2", arrival: 0, len: 13 },
    { id: "R3", arrival: 2, len: 7 },
    { id: "R4", arrival: 4, len: 11 },
  ];
  const lanesW = 900;
  const scale = lanesW / 22;
  const laneH = 34;
  const colors = ["var(--teal)", "var(--cyan)", "var(--iris)", "var(--gold)", "var(--rose)"];

  const staticLanes = jobs.slice(0, 4).map((j, i) => ({
    j, y: i * (laneH + 10), start: 0, end: Math.max(...jobs.slice(0, 4).map((q) => q.len)), padFrom: j.len,
  }));
  const contLanes = jobs.map((j, i) => ({ j, y: i * (laneH + 10), start: j.arrival, end: j.arrival + j.len }));

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["static", "continuous"] as const).map((m) => (
          <button key={m} className={"btn btnSm " + (mode === m ? "btnPrimary" : "btnSecondary")}
            aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m.toUpperCase()} BATCH
          </button>
        ))}
        <span className="chip">MAKESPAN · {Math.round(mode === "static" ? 13 : 15)} STEPS</span>
        {mode === "static" && <span className="chip" style={{ color: "var(--rose)", borderColor: "var(--rose)" }}>PADDED IDLE · {(staticLanes.reduce((a, l) => a + (l.end - l.padFrom), 0))} SLOTS</span>}
        {mode === "continuous" && <span className="chip" style={{ color: "var(--teal)", borderColor: "var(--teal)" }}>NEW ARRIVALS JOIN MID-FLIGHT</span>}
      </div>

      <svg viewBox={`0 0 ${lanesW} ${mode === "static" ? 200 : 250}`} role="img"
        aria-label={mode === "static" ? "Static batch padded to the slowest request" : "Continuous batch refilling slots"}
        style={{ width: "100%", height: "auto", display: "block" }}>
        {mode === "static"
          ? staticLanes.map((l, i) => (
            <g key={i}>
              <text x={4} y={l.y + 23} className="lblMono">{l.j.id}</text>
              <rect x={60} y={l.y} width={(l.end - l.start) * scale} height={laneH} rx={8}
                style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.2)" }} />
              <rect x={60} y={l.y} width={l.padFrom * scale} height={laneH} rx={8}
                style={{ fill: colors[i], fillOpacity: 0.55 }} />
              {l.end > l.padFrom && (
                <rect x={60 + l.padFrom * scale} y={l.y} width={(l.end - l.padFrom) * scale} height={laneH} rx={0}
                  style={{ fill: "repeating-linear-gradient(45deg, rgba(255,127,165,.18), rgba(255,127,165,.18) 6px, transparent 6px, transparent 12px)" }} />
              )}
            </g>
          ))
          : contLanes.map((l, i) => (
            <g key={i}>
              <text x={4} y={l.y + 23} className="lblMono">{l.j.id}</text>
              <rect x={60 + l.start * scale} y={l.y} width={l.j.len * scale} height={laneH} rx={8}
                style={{ fill: colors[i], fillOpacity: 0.6 }} />
              <text x={66 + l.start * scale} y={l.y + 21} className="lblMono" style={{ fill: "#04211B" }}>{l.j.id}</text>
            </g>
          ))}
        {Array.from({ length: 12 }, (_, s) => (
          <g key={"tick" + s}>
            <line x1={60 + s * scale} y1={mode === "static" ? 180 : 230} x2={60 + s * scale}
              y2={(mode === "static" ? 196 : 246)} stroke="var(--hair)" />
            <text x={60 + s * scale} y={(mode === "static" ? 194 : 246)} textAnchor="middle"
              className="lblMono" opacity={0.6}>{s}</text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Static batching locks the group until the longest request finishes — padding wastes slots and
        arrivals wait outside. Continuous batching swaps finished requests for queued ones at iteration
        boundaries, which is why modern servers keep GPUs busy.
      </p>
    </div>
  );
}

/* ---------- 07 sampling ---------- */
export function SamplingDemo() {
  const [temp, setTemp] = useState(0.8);
  const [topK, setTopK] = useState(8);
  const [topP, setTopP] = useState(0.9);
  const pickFrac = 0.62;
  const res = applySampling(BASE_LOGITS, { temp, topK, topP, pickFrac });
  const labels = ["▁the", "transformer", "stream", "engine", "batch", "model", "predicts", "gpu"];

  return (
    <div className="panel" style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(240px,300px) minmax(0,1fr)", gap: "var(--s5)" }}>
      <aside className="stepperCard">
        <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>SHAPE THE DICE</h4>
        {([["TEMPERATURE", temp, 0.1, 2, 0.05, setTemp, temp.toFixed(2)],
           ["TOP-K", topK, 1, 8, 1, setTopK, String(topK)],
           ["TOP-P", topP, 0.1, 1, 0.05, setTopP, topP.toFixed(2)]] as const).map(([label, val, min, max, step, setter, text]) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span className="kicker">{label}</span><span className="kicker" style={{ color: "var(--teal)" }}>{text}</span>
            </div>
            <input type="range" className="slider" min={min} max={max} step={step} value={val}
              aria-label={label}
              onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))} />
          </div>
        ))}
        <p className="hint">Low temperature sharpens toward argmax; top-p adapts the cut to distribution shape.</p>
      </aside>
      <div>
        <svg viewBox="0 0 900 260" role="img" aria-label="Candidate probabilities after filtering"
          style={{ width: "100%", height: "auto", display: "block" }}>
          {BASE_LOGITS.map((_, i) => {
            const keptIdx = res.kept.indexOf(i);
            const prob = keptIdx >= 0 ? res.probs[keptIdx] : 0;
            const h = prob * 210;
            const picked = res.picked === i;
            return (
              <g key={i}>
                <rect x={40 + i * 106} y={230 - h} width={72} height={Math.max(h, 2)} rx={6}
                  style={{ fill: picked ? "var(--gold)" : keptIdx >= 0 ? "var(--teal-dim)" : "rgba(16,32,43,.5)", stroke: picked ? "var(--gold)" : keptIdx >= 0 ? "var(--teal)" : "rgba(159,182,187,.2)" }} />
                <text x={76 + i * 106} y={250} textAnchor="middle" className="lblMono">{labels[i]}</text>
                <text x={76 + i * 106} y={222 - h} textAnchor="middle" className="lblMono" opacity={prob > 0 ? 1 : 0.35}>
                  {(prob * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>
        <p className="raceCaption" aria-live="polite">
          Filtered candidates keep <b>{(res.probs.length / BASE_LOGITS.length * 100).toFixed(0)}%</b> of
          the vocabulary; the gold bar is what actually emitted this run.
        </p>
      </div>
    </div>
  );
}

/* ---------- 08 speculative ---------- */
export function Speculative() {
  const [cycle, setCycle] = useState(-1);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const CYCLE = 1600;
    const tick = (now: number) => {
      const el = now - start;
      const c = Math.floor(el / CYCLE) % SPEC_STEPS.length;
      setCycle((prev) => (prev === c ? prev : c));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const st = cycle >= 0 ? SPEC_STEPS[cycle % SPEC_STEPS.length] : null;
  const baseline = 4;
  const specTokensPerCycle = st ? st.accepted + 1 : 0;
  const totalSpec = SPEC_STEPS.reduce((a, s) => a + s.accepted + 1, 0);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, minHeight: 70, alignItems: "center" }}>
        {st ? st.draftTokens.map((accepted, i) => {
          const chipStyle: React.CSSProperties = accepted
            ? { background: "var(--teal-dim)", borderColor: "var(--teal)" }
            : { background: "var(--bg3)", borderColor: "var(--rose)" };
          return (
            <span key={i} className="tokChip" style={chipStyle}>
              {accepted ? "✔" : "✗"} draft {i + 1}
            </span>
          );
        }) : <span className="kicker">PRESS NOTHING — THE LOOP IS ALIVE</span>}
        {st && <span className="tokChip" style={{ background: "var(--gold-dim)", borderColor: "var(--gold)" }}>★ bonus (target's own)</span>}
      </div>
      <div className="controls" style={{ marginTop: "var(--s4)" }}>
        <span className="configChip">CYCLE {cycle + 1} / {SPEC_STEPS.length}</span>
        <span className="configChip">ACCEPTED THIS CYCLE · {st ? st.accepted : 0}</span>
        <span className="configChip" data-testid="spec-total">TOTAL TOKENS EMITTED · {totalSpec}</span>
      </div>
      <p className="raceCaption">
        Baseline decodes emit exactly {baseline} tokens per {baseline} target passes. The draft model
        proposes several for pennies; verification happens in ONE parallel pass — accepted streaks ride
        through, rejections cost almost nothing.
      </p>
    </div>
  );
}
