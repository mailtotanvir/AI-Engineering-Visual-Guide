"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  TRAIN_CFG_7B, TRAIN_CFG_70B, TRAIN_CFG_405B, PRECISIONS,
  activationGB, adamwStep, attentionPairs, attentionScoreGB, bpeFull,
  bubbleFraction, causalMaskFraction, chinchillaTokensB, clmTargets, cosineLr,
  crawlDocs, dollars, dupGroups, flashReadFactor, fmtGB, fmtHours,
  gradNormTrace, imbalance, kvCacheGB, kvSavings, lshBucket, mlmTargets,
  nextLossScale, overflows, passesFilter, quantStep, recomputeOverhead,
  ringBytesN, ringSteps, ropeAngle, ropeRotate, scalingLoss, segmentsFor,
  shardedMemoryGB, symbolRatio, trainGpuHours, trainMemoryGB, underflows,
} from "@/lib/training/engine";

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

/* ================= 01 TokenDiet ================= */
export function TokenDiet() {
  useTick(storeOf("diet", 8000));
  const store = storeOf("diet", 8000);
  const t = store.t;
  const N = 64;
  const chaos = Math.max(0, 1 - t * 1.15);
  const cells = Array.from({ length: N }, (_, i) => {
    const h = (i * 2654435761) >>> 0;
    const jitter = ((h % 100) / 100 - 0.5) * chaos;
    const base = 0.5 - 0.5 * Math.cos((h % 314) / 50);
    return Math.min(1, Math.max(0, base + jitter));
  });
  const steps = Math.floor(t * 40000);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        <span className="configChip">STEPS · {steps.toLocaleString("en-US")}</span>
        <span className="configChip">LOSS · {(2.45 * Math.exp(-3.8 * t) + 1.72).toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="Weight matrix settling from random noise to structure" style={{ width: "100%", height: "auto", display: "block" }}>
        {cells.map((v, i) => (
          <rect key={i} x={40 + (i % 32) * 26} y={20 + Math.floor(i / 32) * 34} width={22} height={26} rx={4}
            style={{ fill: "var(--gold)", fillOpacity: 0.08 + v * 0.6, stroke: v > 0.62 ? "var(--gold)" : "rgba(159,182,187,.16)" }} />
        ))}
        <text x={40} y={16} className="lblMono">{t <= 0 ? "INITIALIZATION · PURE GAUSSIAN NOISE" : chaos > 0.25 ? "EARLY WARMUP · GRADIENT NUDGES" : "LATE PRE-TRAINING · STRUCTURED SIGNAL"}</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "Weights start random. RUN to watch repetition find structure." : chaos > 0.25 ? "Every step nudges weights towards lowering loss on the current batch." : "Trillions of nudges later: structure accumulated, noise averaged away."}
      </p>
    </div>
  );
}

/* ================= 02 ClmVsMlm ================= */
export function ClmVsMlm() {
  const [mode, setMode] = useState<"clm" | "mlm">("clm");
  const tokens = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"];
  const seq = tokens.length;
  const clmCount = clmTargets(seq);
  const mlmCount = mlmTargets(seq, 0.15);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (mode === "clm" ? "btnPrimary" : "btnSecondary")} onClick={() => setMode("clm")}>
          CAUSAL LM (CLM / GPT)
        </button>
        <button className={"btn btnSm " + (mode === "mlm" ? "btnPrimary" : "btnSecondary")} onClick={() => setMode("mlm")}>
          MASKED LM (MLM / BERT)
        </button>
        <span className="configChip">{mode === "clm" ? `${clmCount} TARGETS / PASS (100%)` : `${mlmCount} TARGETS / PASS (15%)`}</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="CLM vs MLM token predictions" style={{ width: "100%", height: "auto", display: "block" }}>
        {tokens.map((tok, i) => {
          const isMaskedMLM = mode === "mlm" && (i === 3 || i === 7);
          const isCLMTarget = mode === "clm" && i > 0;
          return (
            <g key={i}>
              <rect x={30 + i * 94} y={40} width={82} height={44} rx={8}
                style={{
                  fill: isMaskedMLM ? "var(--rose-dim)" : isCLMTarget ? "var(--teal-dim)" : "var(--bg3)",
                  stroke: isMaskedMLM ? "var(--rose)" : isCLMTarget ? "var(--teal)" : "rgba(159,182,187,.25)",
                  strokeWidth: isMaskedMLM || isCLMTarget ? 2 : 1,
                }} />
              <text x={30 + i * 94 + 41} y={66} textAnchor="middle" className="lblMono"
                style={{ fill: isMaskedMLM ? "var(--rose)" : isCLMTarget ? "var(--teal)" : "var(--ink2)" }}>
                {isMaskedMLM ? "[MASK]" : tok}
              </text>
              {mode === "clm" && i < seq - 1 && (
                <text x={30 + i * 94 + 88} y={30} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)", fontSize: 10 }}>→</text>
              )}
            </g>
          );
        })}
        <text x={30} y={118} className="lblMono" style={{ fill: mode === "clm" ? "var(--teal)" : "var(--rose)" }}>
          {mode === "clm" ? "CLM: EVERY POSITION PREDICTS THE NEXT TOKEN (100% LOSS EFFICIENCY)" : "MLM: ONLY MASKED POSITIONS COMPUTE LOSS (~15% EFFICIENCY PER FORWARD PASS)"}
        </text>
      </svg>
      <p className="raceCaption">
        {mode === "clm"
          ? "CLM predicts every next token autoregressively. One forward pass yields N-1 training targets."
          : "MLM masks ~15% of tokens and predicts them bidirectionally. It cannot perform autoregressive generation directly."}
      </p>
    </div>
  );
}

/* ================= 03 OneStep ================= */
export function OneStep() {
  useTick(storeOf("step", 7500));
  const store = storeOf("step", 7500);
  const t = store.t;
  const phases = [
    { key: "fwd", label: "1. FORWARD PASS", from: 0.02, to: 0.38, color: "var(--gold)", desc: "Batch flows through layers to produce logits. Cross-entropy loss scores the surprise scalar." },
    { key: "bwd", label: "2. BACKWARD PASS", from: 0.40, to: 0.72, color: "var(--rose)", desc: "Autodiff chain rule walks back layer by layer, calculating ∂L/∂W gradients for every parameter." },
    { key: "upd", label: "3. ADAMW UPDATE", from: 0.74, to: 0.97, color: "var(--teal)", desc: "AdamW updates weight parameters using bias-corrected moment estimates and decoupled weight decay." },
  ];
  const active = phases.find((p) => t >= p.from && t < p.to);
  const arrowX = 60 + t * 780;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN STEP</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        {phases.map((p) => (
          <span key={p.key} className="chip" style={active?.key === p.key ? { color: p.color, borderColor: p.color } : undefined}>
            <i style={{ background: active?.key === p.key ? p.color : "var(--ink3)" }} />{p.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="One training step: forward, backward, update" style={{ width: "100%", height: "auto", display: "block" }}>
        {phases.map((p, i) => {
          const x = 60 + i * 280;
          const on = active?.key === p.key;
          return (
            <g key={p.key}>
              <rect x={x} y={30} width={200} height={54} rx={12}
                style={{ fill: on ? p.color : "var(--bg3)", fillOpacity: on ? 0.22 : 1, stroke: on ? p.color : "rgba(159,182,187,.25)", strokeWidth: on ? 2 : 1 }} />
              <text x={x + 100} y={62} textAnchor="middle" className="lblMono" style={{ fill: on ? p.color : "var(--ink2)" }}>{p.label}</text>
              {i < 2 && <text x={x + 232} y={62} textAnchor="middle" style={{ fill: "var(--ink3)", fontSize: 18 }}>→</text>}
            </g>
          );
        })}
        <line x1={60} y1={100} x2={820} y2={100} stroke="var(--hair2)" />
        {t > 0.02 && t < 0.97 && <circle cx={arrowX} cy={active?.key === "bwd" ? 100 : 92} r={5} style={{ fill: active?.color, filter: "drop-shadow(0 0 6px currentColor)" }} />}
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "One step is three beats. Click RUN STEP." : active ? active.desc : "Step complete! Repeat trillions of times."}
      </p>
    </div>
  );
}

/* ================= 04 CausalMask ================= */
export function CausalMask() {
  const [seq, setSeq] = useState(6);
  const maskFrac = causalMaskFraction(seq);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">SEQUENCE LENGTH</span>
        <input type="range" className="slider" min={4} max={12} step={1} value={seq} aria-label="Sequence length" style={{ maxWidth: 200 }} onChange={(e) => setSeq(Number(e.target.value))} />
        <span className="configChip">SEQ {seq} TOKENS</span>
        <span className="configChip" style={{ color: "var(--rose)" }}>{(maskFrac * 100).toFixed(1)}% MASKED (-∞)</span>
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="Lower-triangular causal attention matrix" style={{ width: "100%", height: "auto", display: "block" }}>
        {Array.from({ length: seq }, (_, r) =>
          Array.from({ length: seq }, (_, c) => {
            const masked = c > r;
            const sz = Math.min(28, 240 / seq);
            const x = 200 + c * (sz + 4);
            const y = 20 + r * (sz + 4);
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={sz} height={sz} rx={4}
                  style={{ fill: masked ? "rgba(224,108,117,.12)" : "var(--teal-dim)", stroke: masked ? "var(--rose)" : "var(--teal)", strokeOpacity: 0.4 }} />
                <text x={x + sz / 2} y={y + sz / 2 + 4} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: masked ? "var(--rose)" : "var(--teal)" }}>
                  {masked ? "-∞" : "ok"}
                </text>
              </g>
            );
          })
        )}
        <text x={500} y={100} className="lblMono" style={{ fill: "var(--teal)" }}>■ ALLOWED ATTENTION (LOWER TRIANGLE)</text>
        <text x={500} y={130} className="lblMono" style={{ fill: "var(--rose)" }}>■ FORBIDDEN FUTURE TOKENS (UPPER TRIANGLE = -∞)</text>
      </svg>
      <p className="raceCaption">
        Upper triangle is masked with -∞ before Softmax, preventing current tokens from seeing future tokens.
      </p>
    </div>
  );
}

/* ================= 05 ContextWindow ================= */
export function ContextWindow() {
  const [seq, setSeq] = useState(8192);
  const heads = 32, layers = 32, batch = 2;
  const pairs = attentionPairs(seq);
  const scoreGB = attentionScoreGB(seq, heads);
  const kvGB = kvCacheGB(layers, 8, 128, seq, batch);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">CONTEXT LENGTH (N)</span>
        {[4096, 8192, 32768, 131072].map((s) => (
          <button key={s} className={"btn btnSm " + (seq === s ? "btnPrimary" : "btnSecondary")} onClick={() => setSeq(s)}>
            {(s / 1024).toFixed(0)}K
          </button>
        ))}
        <span className="configChip" style={{ color: "var(--rose)" }}>N² PAIRS · {(pairs / 1e6).toFixed(1)}M</span>
        <span className="configChip" style={{ color: "var(--gold)" }}>UN-TILED SCORE TENSOR · {fmtGB(scoreGB)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)", marginTop: 12 }}>
        <div className="stepperCard">
          <span className="kicker" style={{ color: "var(--rose)" }}>QUADRATIC PAIR COMPARES (N²)</span>
          <h3 style={{ fontSize: 28, margin: "8px 0", color: "var(--rose)" }}>{(pairs / 1e9).toFixed(3)} Billion</h3>
          <p className="hint">Scores matrix scale quadratically. FlashAttention avoids writing this to GPU HBM.</p>
        </div>
        <div className="stepperCard">
          <span className="kicker" style={{ color: "var(--teal)" }}>KV CACHE VRAM FOOTPRINT (GQA 8:1)</span>
          <h3 style={{ fontSize: 28, margin: "8px 0", color: "var(--teal)" }}>{fmtGB(kvGB)}</h3>
          <p className="hint">Keys and Values stored per request across layers. Grows linearly with N.</p>
        </div>
      </div>
    </div>
  );
}

/* ================= 06 CrawlFilter ================= */
export function CrawlFilter() {
  const docs = crawlDocs(10);
  const [minSym, setMinSym] = useState(0.5);
  const filtered = docs.filter((d) => passesFilter(d, minSym));

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">MIN SYMBOL RATIO</span>
        <input type="range" className="slider" min={0.2} max={0.8} step={0.05} value={minSym} aria-label="Min symbol ratio" style={{ maxWidth: 200 }} onChange={(e) => setMinSym(Number(e.target.value))} />
        <span className="configChip">PASSED FILTER: {filtered.length} / {docs.length} DOCS</span>
      </div>
      <svg viewBox="0 0 900 180" role="img" aria-label="Filter documents by text density and quality heuristics" style={{ width: "100%", height: "auto", display: "block" }}>
        {docs.map((d, i) => {
          const pass = passesFilter(d, minSym);
          return (
            <g key={d.id}>
              <rect x={30 + i * 82} y={30} width={72} height={100} rx={8}
                style={{ fill: pass ? "var(--teal-dim)" : "var(--rose-dim)", stroke: pass ? "var(--teal)" : "var(--rose)", strokeWidth: pass ? 2 : 1 }} />
              <text x={30 + i * 82 + 36} y={55} textAnchor="middle" className="lblMono">DOC #{d.id}</text>
              <text x={30 + i * 82 + 36} y={80} textAnchor="middle" className="lblMono" style={{ fill: pass ? "var(--teal)" : "var(--rose)" }}>
                {(d.symbol * 100).toFixed(0)}%
              </text>
              <text x={30 + i * 82 + 36} y={110} textAnchor="middle" className="lblMono" style={{ fill: pass ? "var(--teal)" : "var(--rose)", fontSize: 10 }}>
                {pass ? "KEEP" : "DISCARD"}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption">
        Heuristic quality filters evaluate symbol density, punctuation, and FastText classification to eliminate web spam.
      </p>
    </div>
  );
}

/* ================= 07 DedupScene ================= */
export function DedupScene() {
  const hashes = [102, 451, 102, 889, 451, 310, 991, 102];
  const uniqueCount = dupGroups(hashes);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="configChip">RAW DOCUMENTS: {hashes.length}</span>
        <span className="configChip" style={{ color: "var(--rose)" }}>DUPLICATE BUCKETS: {uniqueCount}</span>
        <span className="configChip" style={{ color: "var(--teal)" }}>UNIQUE DOCS: {new Set(hashes).size}</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="MinHash LSH deduplication buckets" style={{ width: "100%", height: "auto", display: "block" }}>
        {hashes.map((h, i) => {
          const isDup = hashes.indexOf(h) !== i;
          return (
            <g key={i}>
              <circle cx={60 + i * 100} cy={60} r={28} style={{ fill: isDup ? "var(--rose-dim)" : "var(--teal-dim)", stroke: isDup ? "var(--rose)" : "var(--teal)", strokeWidth: 2 }} />
              <text x={60 + i * 100} y={64} textAnchor="middle" className="lblMono" style={{ fill: isDup ? "var(--rose)" : "var(--teal)" }}>
                #{h}
              </text>
              <text x={60 + i * 100} y={110} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: isDup ? "var(--rose)" : "var(--teal)" }}>
                {isDup ? "DUP -> DELETE" : "KEEP"}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption">
        MinHash + LSH maps similar document shingles into matching buckets, enabling 20-50% corpus deduplication.
      </p>
    </div>
  );
}

/* ================= 08 BpeScene ================= */
export function BpeScene() {
  const merges: Array<[string, string]> = [["t", "h"], ["th", "e"], ["i", "n"], ["i", "n", "g"] as any];
  const [step, setStep] = useState(0);
  const text = "thinking";
  const tokens = step === 0 ? Array.from(text) : step === 1 ? ["th", "i", "n", "k", "i", "n", "g"] : step === 2 ? ["th", "in", "k", "in", "g"] : ["th", "ing"];

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => setStep((s) => (s + 1) % 4)}>
          MERGE STEP ({step}/3)
        </button>
        <span className="configChip">RAW TEXT: "{text}"</span>
        <span className="configChip" style={{ color: "var(--teal)" }}>VOCAB TOKENS: {tokens.length}</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Byte pair encoding iterative merges" style={{ width: "100%", height: "auto", display: "block" }}>
        {tokens.map((tok, i) => (
          <g key={i}>
            <rect x={40 + i * 90} y={35} width={75} height={45} rx={8} style={{ fill: "var(--teal-dim)", stroke: "var(--teal)", strokeWidth: 2 }} />
            <text x={40 + i * 90 + 37} y={62} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>
              "{tok}"
            </text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Byte-Pair Encoding merges frequent adjacent character pairs into single vocabulary tokens.
      </p>
    </div>
  );
}

/* ================= 09 ScalingLaws ================= */
export function ScalingLaws() {
  const [params, setParams] = useState(7);
  const tokensB = chinchillaTokensB(params);
  const gpuTflops = 989, mfu = 0.42;
  const gpus = 1024;
  const hours = trainGpuHours(params, tokensB, gpuTflops, mfu, gpus);
  const cost = dollars(hours, 2.0);
  const loss = scalingLoss(params);

  const W = 560, H = 220, L = 52, R = 16, T = 16, B = 34;
  const models = [0.1, 0.4, 1, 3, 7, 15, 30, 70, 140, 405];
  const xs = (p: number) => L + ((Math.log10(p) - Math.log10(0.1)) / (Math.log10(405) - Math.log10(0.1))) * (W - L - R);
  const ys = (l: number) => T + (1 - (l - 1.69) / (2.6 - 1.69)) * (H - T - B);
  const curve = models.map((p) => `${xs(p).toFixed(1)},${ys(scalingLoss(p)).toFixed(1)}`);

  return (
    <div className="panel" style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(240px,300px) minmax(0,1fr)", gap: "var(--s5)" }}>
      <aside className="stepperCard">
        <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>PLAN THE RUN</h4>
        <div style={{ marginBottom: 12 }}>
          <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <span className="kicker">PARAMETERS</span><span className="kicker" style={{ color: "var(--gold)" }}>{params}B</span>
          </div>
          <input type="range" className="slider" min={0.5} max={405} step={0.5} value={params} aria-label="Parameters" onChange={(e) => setParams(Number(e.target.value))} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">TOKENS (20×N)</span><span className="kicker" style={{ color: "var(--teal)" }}>{tokensB.toFixed(0)}B</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">PREDICTED LOSS</span><span className="kicker" style={{ color: "var(--iris)" }}>{loss.toFixed(3)}</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">1,024 H100 GPU TIME</span><span className="kicker" style={{ color: "var(--gold)" }}>{fmtHours(hours)}</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">COST (@ $2/GPU-H)</span><span className="kicker" style={{ color: "var(--rose)" }}>${(cost / 1000).toFixed(2)}M</span>
          </div>
        </div>
      </aside>
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chinchilla scaling laws curve" style={{ width: "100%", height: "auto", display: "block" }}>
          <path d={`M${curve.join(" L")}`} fill="none" stroke="var(--iris)" strokeWidth={2} />
          {models.map((p) => (
            <g key={p}>
              <circle cx={xs(p)} cy={ys(scalingLoss(p))} r={3.5} style={{ fill: p === params ? "var(--gold)" : "var(--iris)" }} />
            </g>
          ))}
          <circle cx={xs(params)} cy={ys(scalingLoss(params))} r={6} style={{ fill: "var(--gold)", filter: "drop-shadow(0 0 6px var(--gold))" }} />
        </svg>
        <p className="raceCaption">
          Chinchilla compute-optimal training scales parameters N and tokens D equally (D ≈ 20N).
        </p>
      </div>
    </div>
  );
}

/* ================= 10 RopeScene ================= */
export function RopeScene() {
  const [pos, setPos] = useState(2);
  const angle = ropeAngle(pos, 0, 64);
  const rotated = ropeRotate(1, 0, angle);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">TOKEN POSITION (m)</span>
        <input type="range" className="slider" min={0} max={16} step={1} value={pos} aria-label="Position" style={{ maxWidth: 200 }} onChange={(e) => setPos(Number(e.target.value))} />
        <span className="configChip">ANGLE θ · {(angle * (180 / Math.PI)).toFixed(1)}°</span>
      </div>
      <svg viewBox="0 0 900 200" role="img" aria-label="Rotary position embedding vector rotation" style={{ width: "100%", height: "auto", display: "block" }}>
        <circle cx={450} cy={100} r={70} fill="none" stroke="rgba(159,182,187,.2)" strokeDasharray="4 4" />
        <line x1={380} y1={100} x2={520} y2={100} stroke="rgba(159,182,187,.2)" />
        <line x1={450} y1={30} x2={450} y2={170} stroke="rgba(159,182,187,.2)" />
        {/* original vector */}
        <line x1={450} y1={100} x2={520} y2={100} stroke="var(--ink3)" strokeWidth={2} />
        {/* rotated vector */}
        <line x1={450} y1={100} x2={450 + rotated.x * 70} y2={100 - rotated.y * 70} stroke="var(--gold)" strokeWidth={3} />
        <circle cx={450 + rotated.x * 70} cy={100 - rotated.y * 70} r={5} style={{ fill: "var(--gold)" }} />
        <text x={470} y={80} className="lblMono" style={{ fill: "var(--gold)" }}>ROTATED VECTOR (m={pos})</text>
      </svg>
      <p className="raceCaption">
        RoPE encodes relative position by rotating Query and Key vectors in complex 2D planes.
      </p>
    </div>
  );
}

/* ================= 11 NormActivation ================= */
export function NormActivation() {
  const [normType, setNormType] = useState<"rmsnorm" | "layernorm">("rmsnorm");

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (normType === "rmsnorm" ? "btnPrimary" : "btnSecondary")} onClick={() => setNormType("rmsnorm")}>
          RMSNORM (SAVINGS: ~8% LATENCY)
        </button>
        <button className={"btn btnSm " + (normType === "layernorm" ? "btnPrimary" : "btnSecondary")} onClick={() => setNormType("layernorm")}>
          STANDARD LAYERNORM
        </button>
      </div>
      <div className="stepperCard" style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0, color: "var(--teal)" }}>{normType === "rmsnorm" ? "RMSNorm Formula" : "LayerNorm Formula"}</h4>
        <p className="hint" style={{ fontSize: 16, color: "var(--ink1)", margin: "8px 0" }}>
          {normType === "rmsnorm"
            ? "a_bar = (a / RMS(a)) * g  --> Skips mean subtraction!"
            : "a_bar = ((a - mean) / Var(a)) * g + b  --> Requires two-pass mean + var calculation."}
        </p>
      </div>
    </div>
  );
}

/* ================= 12 GqaScene ================= */
export function GqaScene() {
  const [mode, setMode] = useState<"mha" | "gqa">("gqa");
  const qHeads = 32;
  const kvHeads = mode === "mha" ? 32 : 8;
  const savings = kvSavings(qHeads, kvHeads);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (mode === "gqa" ? "btnPrimary" : "btnSecondary")} onClick={() => setMode("gqa")}>
          GROUPED-QUERY ATTENTION (GQA 8:1)
        </button>
        <button className={"btn btnSm " + (mode === "mha" ? "btnPrimary" : "btnSecondary")} onClick={() => setMode("mha")}>
          MULTI-HEAD ATTENTION (MHA 1:1)
        </button>
        <span className="configChip" style={{ color: "var(--teal)" }}>KV VRAM SAVINGS: {(savings * 100).toFixed(1)}%</span>
      </div>
      <svg viewBox="0 0 900 160" role="img" aria-label="GQA Query heads grouped to KV heads" style={{ width: "100%", height: "auto", display: "block" }}>
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i}>
            <rect x={30 + i * 52} y={30} width={42} height={30} rx={4} style={{ fill: "var(--gold-dim)", stroke: "var(--gold)" }} />
            <text x={30 + i * 52 + 21} y={50} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: "var(--gold)" }}>Q{i}</text>
          </g>
        ))}
        {Array.from({ length: mode === "mha" ? 16 : 2 }, (_, i) => (
          <g key={i}>
            <rect x={mode === "mha" ? 30 + i * 52 : 120 + i * 420} y={100} width={mode === "mha" ? 42 : 200} height={34} rx={6}
              style={{ fill: "var(--teal-dim)", stroke: "var(--teal)" }} />
            <text x={mode === "mha" ? 30 + i * 52 + 21 : 120 + i * 420 + 100} y={122} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>
              {mode === "mha" ? `KV${i}` : `SHARED KV HEAD ${i}`}
            </text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        GQA groups 8 Query heads per KV head, slashing KV cache memory overhead by 87.5%.
      </p>
    </div>
  );
}

/* ================= 13 MemoryBudget ================= */
export function MemoryBudget() {
  const [tp, setTp] = useState(1);
  const [pp, setPp] = useState(1);
  const [cfg, setCfg] = useState(TRAIN_CFG_70B);
  const total = trainMemoryGB(cfg.paramsB);
  const sharded = shardedMemoryGB(cfg.paramsB, tp, pp);

  return (
    <div className="panel" style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(220px,280px) minmax(0,1fr)", gap: "var(--s5)" }}>
      <aside className="stepperCard">
        <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>MODEL & PLACEMENT</h4>
        {[["7B", TRAIN_CFG_7B], ["70B", TRAIN_CFG_70B], ["405B", TRAIN_CFG_405B]].map(([label, c]) => (
          <button key={label as string} className={"btn btnSm " + (cfg === c ? "btnPrimary" : "btnSecondary")} style={{ marginBottom: 8 }} onClick={() => setCfg(c as any)}>
            {label as string} DENSE
          </button>
        ))}
        <div style={{ marginTop: 12 }}>
          <span className="kicker">TP x PP SHARDING: {tp * pp}x</span>
          <input type="range" className="slider" min={1} max={8} step={1} value={tp} aria-label="Tensor Parallelism" onChange={(e) => setTp(Number(e.target.value))} />
        </div>
      </aside>
      <div>
        <div className="controls" style={{ marginBottom: "var(--s3)" }}>
          <span className="configChip">STATIC STATE (16N) · {fmtGB(total)}</span>
          <span className="configChip" style={{ color: "var(--teal)" }}>PER-GPU SHARDED · {fmtGB(sharded)}</span>
        </div>
        <p className="raceCaption">
          AdamW mixed precision requires 16 bytes per parameter: Weights (2B) + Gradients (2B) + Adam m,v (8B) + Master Weights (4B).
        </p>
      </div>
    </div>
  );
}

/* ================= 14 DataParallel ================= */
export function DataParallel() {
  useTick(storeOf("dp", 9000));
  const store = storeOf("dp", 9000);
  const t = store.t;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN STEP</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
      </div>
      <svg viewBox="0 0 900 180" role="img" aria-label="Data parallel replicas" style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 1, 2, 3].map((g) => (
          <g key={g}>
            <rect x={40 + g * 210} y={40} width={180} height={70} rx={8} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
            <text x={40 + g * 210 + 90} y={70} textAnchor="middle" className="lblMono">GPU RANK {g}</text>
            <text x={40 + g * 210 + 90} y={92} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)", fontSize: 11 }}>
              {t > 0.5 ? "ALL-REDUCED GRADIENTS" : "LOCAL BATCH GRADIENT"}
            </text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Data Parallelism replicates model weights across GPUs and averages gradients via All-Reduce every step.
      </p>
    </div>
  );
}

/* ================= 15 RingAllReduce ================= */
export function RingAllReduce() {
  const [n, setN] = useState(4);
  const steps = ringSteps(n);
  const bytes = ringBytesN(n, 400);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">RING GPUs</span>
        {[4, 8, 16].map((k) => (
          <button key={k} className={"btn btnSm " + (n === k ? "btnPrimary" : "btnSecondary")} onClick={() => setN(k)}>
            {k} GPUs
          </button>
        ))}
        <span className="configChip" style={{ color: "var(--teal)" }}>PER-GPU TRANSFER: {bytes.toFixed(0)} MB (SATURATES @ 2x)</span>
      </div>
      <p className="raceCaption">
        Ring All-Reduce executes 2(N-1) scatter and gather steps around a logical GPU ring.
      </p>
    </div>
  );
}

/* ================= 16 TensorParallel ================= */
export function TensorParallel() {
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="configChip" style={{ color: "var(--rose)" }}>MEGATRON INTRA-NODE SLICING (NVLINK ONLY)</span>
      </div>
      <p className="raceCaption">
        Column-parallel and Row-parallel matrix splits require 2 All-Reduces per transformer layer.
      </p>
    </div>
  );
}

/* ================= 17 PipelineParallel ================= */
export function PipelineParallel() {
  const [micro, setMicro] = useState(4);
  const bubble = bubbleFraction(micro, 4);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">MICRO-BATCHES (m)</span>
        <input type="range" className="slider" min={1} max={12} step={1} value={micro} aria-label="Micro batches" style={{ maxWidth: 200 }} onChange={(e) => setMicro(Number(e.target.value))} />
        <span className="configChip" style={{ color: "var(--rose)" }}>PIPELINE BUBBLE IDLE: {(bubble * 100).toFixed(1)}%</span>
      </div>
      <p className="raceCaption">
        1F1B schedules interleave forward and backward micro-batches to cap activation memory while keeping pipeline bubble idle time small.
      </p>
    </div>
  );
}

/* ================= 18 PrecisionScene ================= */
export function PrecisionScene() {
  const [spec, setSpec] = useState(PRECISIONS[2]); // BF16

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {PRECISIONS.map((p) => (
          <button key={p.name} className={"btn btnSm " + (spec.name === p.name ? "btnPrimary" : "btnSecondary")} onClick={() => setSpec(p)}>
            {p.name}
          </button>
        ))}
        <span className="configChip">EXPONENT BITS: {spec.expBits}</span>
        <span className="configChip">MANTISSA BITS: {spec.mantissaBits}</span>
      </div>
      <div className="stepperCard" style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0, color: "var(--teal)" }}>{spec.name} Numerical Properties</h4>
        <p className="hint" style={{ fontSize: 15, color: "var(--ink1)", margin: "8px 0" }}>
          Noise floor quantization step: ~{quantStep(spec).toExponential(2)}.
          Max exponent boundary: 2^{spec.emax}.
        </p>
      </div>
    </div>
  );
}

/* ================= 19 Checkpointing ================= */
export function Checkpointing() {
  const [ckpt, setCkpt] = useState(true);
  const layers = 32;
  const full = activationGB(layers, 4096, 4, 4096, false);
  const withCk = activationGB(layers, 4096, 4, 4096, true);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (ckpt ? "btnPrimary" : "btnSecondary")} onClick={() => setCkpt(!ckpt)}>
          {ckpt ? "CHECKPOINTING ENABLED O(√L)" : "FULL ACTIVATION STORE O(L)"}
        </button>
        <span className="configChip" style={{ color: "var(--teal)" }}>ACTIVATION VRAM: {fmtGB(ckpt ? withCk : full)}</span>
      </div>
      <p className="raceCaption">
        Activation Checkpointing drops intermediate layer activations and recomputes them during backprop, trading +33% compute to save gigabytes of VRAM.
      </p>
    </div>
  );
}

/* ================= 20 OptimizerSchedule ================= */
export function OptimizerSchedule() {
  const [step, setStep] = useState(200);
  const lrMult = cosineLr(step, 1000);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">STEP {step} / 1000</span>
        <input type="range" className="slider" min={0} max={1000} step={10} value={step} aria-label="Step" style={{ maxWidth: 200 }} onChange={(e) => setStep(Number(e.target.value))} />
        <span className="configChip" style={{ color: "var(--gold)" }}>LR MULTIPLIER: {lrMult.toFixed(3)}x</span>
      </div>
      <p className="raceCaption">
        Warmup ramps learning rate from 0 during early steps; cosine decay smoothly coaxes parameters toward the local minimum.
      </p>
    </div>
  );
}

/* ================= 21 TelemetryScene ================= */
export function TelemetryScene() {
  const trace = gradNormTrace(20, 10);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="configChip" style={{ color: "var(--teal)" }}>MFU %: 42.5%</span>
        <span className="configChip" style={{ color: "var(--rose)" }}>SPIKE DETECTED @ STEP 10 → REWIND ENGINE ACTIVE</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Gradient norm telemetry trace" style={{ width: "100%", height: "auto", display: "block" }}>
        {trace.map((val, i) => (
          <g key={i}>
            <rect x={40 + i * 40} y={100 - val * 18} width={24} height={val * 18} rx={4}
              style={{ fill: val > 3 ? "var(--rose)" : "var(--teal)" }} />
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Real-time telemetry detects loss spikes and gradient norm anomalies, triggering automated checkpoint rewinds.
      </p>
    </div>
  );
}
