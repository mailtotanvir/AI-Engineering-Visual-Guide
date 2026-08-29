"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  TRAIN_CFG_7B, TRAIN_CFG_70B, TRAIN_CFG_405B,
  activationGB, bubbleFraction, chinchillaTokensB, dollars, expertLoad,
  fmtGB, fmtHours, imbalance, lossCurve, recomputeOverhead, ringBytesN,
  ringSteps, routeTokens, scalingLoss, segmentsFor, shardedMemoryGB,
  trainGpuHours, trainMemoryGB,
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

/* ---------- 01 token diet: random weights → nudged weights ---------- */
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
    const v = Math.min(1, Math.max(0, base + jitter));
    return v;
  });
  const steps = Math.floor(t * 40);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        <span className="configChip">TRAINING STEPS · {steps.toLocaleString("en-US")}</span>
        <span className="configChip">LOSS · {(2.45 * Math.exp(-3.8 * t) + 1.72).toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="Weight matrix settling from random noise to structure"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {cells.map((v, i) => (
          <rect key={i} x={40 + (i % 32) * 26} y={20 + Math.floor(i / 32) * 34} width={22} height={26} rx={4}
            style={{
              fill: "var(--gold)", fillOpacity: 0.08 + v * 0.6,
              stroke: v > 0.62 ? "var(--gold)" : "rgba(159,182,187,.16)",
            }} />
        ))}
        <text x={40} y={16} className="lblMono">{t <= 0 ? "INITIALIZATION · PURE NOISE" : chaos > 0.25 ? "EARLY TRAINING · NOISE STILL DOMINATES" : "LATE TRAINING · STRUCTURE EMERGES"}</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "Nothing is learned yet — weights are random draws. RUN to watch repetition find structure."
          : chaos > 0.25
            ? "Every step nudges weights toward whichever direction lowers the loss on the batch just seen."
            : "Same cells, billions of nudges later: noise averaged away, signal accumulated. This is all training is."}
      </p>
    </div>
  );
}

/* ---------- 02 one step: forward / backward / update ---------- */
export function OneStep() {
  useTick(storeOf("step", 7500));
  const store = storeOf("step", 7500);
  const t = store.t;
  const phases = [
    { key: "fwd", label: "FORWARD", from: 0.02, to: 0.38, color: "var(--gold)", desc: "The batch flows through every layer; the final logits are scored against the right answers. Out comes one number: the loss — how surprised the model was." },
    { key: "bwd", label: "BACKWARD", from: 0.40, to: 0.72, color: "var(--rose)", desc: "The chain rule walks the graph in reverse, converting loss into a gradient for every single weight. Blame flows upstream, layer by layer." },
    { key: "upd", label: "UPDATE", from: 0.74, to: 0.97, color: "var(--teal)", desc: "AdamW moves each weight a small, damped step against its gradient — then the whole machine does it again." },
  ];
  const active = phases.find((p) => t >= p.from && t < p.to);
  const arrowX = 60 + t * 780;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        {phases.map((p) => (
          <span key={p.key} className="chip" style={active?.key === p.key ? { color: p.color, borderColor: p.color } : undefined}>
            <i style={{ background: active?.key === p.key ? p.color : "var(--ink3)" }} />{p.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="One training step: forward, backward, update"
        style={{ width: "100%", height: "auto", display: "block" }}>
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
        <text x={60} y={116} className="lblMono">BATCH IN → LOSS OUT → GRADIENTS IN → WEIGHTS OUT</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "One step is three beats. RUN to play the loop." : active ? active.desc : "Step complete. Weights moved. Now do it again — about a trillion more times."}
      </p>
    </div>
  );
}

/* ---------- 03 loss curve ---------- */
export function LossCurveScene() {
  const curve = lossCurve(120);
  const [probe, setProbe] = useState<number | null>(null);
  const W = 900, H = 260, L = 60, R = 40, T = 24, B = 40;
  const xs = (s: number) => L + (s / 120) * (W - L - R);
  const ys = (v: number) => T + (1 - (v - 1.4) / (2.6 - 1.4)) * (H - T - B);
  const path = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xs(p.step).toFixed(1)},${ys(p.loss).toFixed(1)}`).join(" ");
  const anomalies = [31, 72, 103];

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="chip"><i style={{ background: "var(--teal)" }} />HEALTHY RUN</span>
        <span className="chip" style={{ color: "var(--rose)", borderColor: "var(--rose)" }}><i style={{ background: "var(--rose)" }} />SPIKES · INVESTIGATE</span>
        <span className="configChip">HOVER THE CURVE</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Training loss over steps with anomaly spikes"
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const s = Math.round(((x - L) / (W - L - R)) * 120);
          setProbe(s >= 0 && s <= 120 ? s : null);
        }}
        onMouseLeave={() => setProbe(null)}>
        {[1.6, 1.9, 2.2, 2.5].map((v) => (
          <g key={v}>
            <line x1={L} y1={ys(v)} x2={W - R} y2={ys(v)} stroke="var(--hair2)" />
            <text x={L - 8} y={ys(v) + 4} textAnchor="end" className="lblMono">{v.toFixed(1)}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--teal)" strokeWidth={2} />
        {anomalies.map((a) => {
          const p = curve[a];
          return (
            <g key={a}>
              <circle cx={xs(p.step)} cy={ys(p.loss)} r={4.5} style={{ fill: "var(--rose)" }} />
              <text x={xs(p.step)} y={ys(p.loss) - 10} textAnchor="middle" className="lblMono" style={{ fill: "var(--rose)" }}>SPIKE</text>
            </g>
          );
        })}
        {probe !== null && curve[probe] && (
          <g>
            <line x1={xs(probe)} y1={T} x2={xs(probe)} y2={H - B} stroke="var(--gold)" strokeDasharray="3 4" />
            <circle cx={xs(probe)} cy={ys(curve[probe].loss)} r={4} style={{ fill: "var(--gold)" }} />
            <text x={xs(probe) + 8} y={ys(curve[probe].loss) - 8} className="lblMono" style={{ fill: "var(--gold)" }}>
              STEP {probe * 100} · LOSS {curve[probe].loss.toFixed(3)}
            </text>
          </g>
        )}
        <text x={L} y={H - 8} className="lblMono">STEP 0</text>
        <text x={W - R} y={H - 8} textAnchor="end" className="lblMono">STEP 12,000</text>
      </svg>
      <p className="raceCaption">
        {probe !== null && anomalies.includes(probe)
          ? "A spike like this usually means one data shard or a learning-rate window misbehaved. Operators rewind to a checkpoint and drop the offending window."
          : "The loss is the only scoreboard. Every incident — bad data, LR too hot, a stuck GPU — shows up here first."}
      </p>
    </div>
  );
}

/* ---------- 04 memory budget ---------- */
export function MemoryBudget() {
  const [tp, setTp] = useState(1);
  const [pp, setPp] = useState(1);
  const [cfg, setCfg] = useState(TRAIN_CFG_7B);
  const total = trainMemoryGB(cfg.paramsB);
  const sharded = shardedMemoryGB(cfg.paramsB, tp, pp);
  const H100_GB = 80;
  const parts = [
    { label: "WEIGHTS bf16", gb: cfg.paramsB * 2, color: "var(--gold)" },
    { label: "GRADIENTS bf16", gb: cfg.paramsB * 2, color: "var(--rose)" },
    { label: "ADAM m+v fp32", gb: cfg.paramsB * 8, color: "var(--iris)" },
    { label: "FP32 MASTER", gb: cfg.paramsB * 4, color: "var(--cyan)" },
  ];
  const scaleFrac = (gb: number) => gb / trainMemoryGB(TRAIN_CFG_405B.paramsB);

  return (
    <div className="panel" style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(220px,280px) minmax(0,1fr)", gap: "var(--s5)" }}>
      <aside className="stepperCard">
        <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>MODEL + PLACEMENT</h4>
        {([["7B", TRAIN_CFG_7B], ["70B", TRAIN_CFG_70B], ["405B", TRAIN_CFG_405B]] as const).map(([label, c]) => (
          <button key={label} className={"btn btnSm " + (cfg === c ? "btnPrimary" : "btnSecondary")} style={{ marginBottom: 8 }}
            aria-pressed={cfg === c} onClick={() => setCfg(c)}>{label} DENSE</button>
        ))}
        {([["TENSOR PARALLEL (TP)", setTp], ["PIPELINE PARALLEL (PP)", setPp]] as const).map(([label, setter], row) => (
          <div key={label as string} style={{ marginTop: 12 }}>
            <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span className="kicker">{label as string}</span>
              <span className="kicker" style={{ color: "var(--teal)" }}>{row === 0 ? tp : pp}×</span>
            </div>
            <input type="range" className="slider" min={1} max={8} step={1} value={row === 0 ? tp : pp}
              aria-label={label as string}
              onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))} />
          </div>
        ))}
        <p className="hint">Per-GPU state = full optimizer bill ÷ (TP × PP). Activations come on top.</p>
      </aside>
      <div>
        <div className="controls" style={{ marginBottom: "var(--s3)" }}>
          <span className="configChip">FULL STATE · {fmtGB(total)}</span>
          <span className="configChip">PER GPU · {fmtGB(sharded)}</span>
          <span className={"chip " + (sharded > H100_GB ? "" : "")} style={sharded > H100_GB ? { color: "var(--rose)", borderColor: "var(--rose)" } : { color: "var(--teal)", borderColor: "var(--teal)" }}>
            {sharded > H100_GB ? "OVERFLOWS 80GB H100" : "FITS 80GB H100"}
          </span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {parts.map((p) => {
            const per = p.gb / (tp * pp);
            return (
              <div key={p.label}>
                <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="kicker">{p.label}</span>
                  <span className="kicker" style={{ color: p.color }}>{fmtGB(p.gb)} → {fmtGB(per)}</span>
                </div>
                <div style={{ height: 14, borderRadius: 7, background: "var(--bg3)" }}>
                  <div style={{ height: "100%", width: `${Math.max(1.2, scaleFrac(p.gb) * 100)}%`, borderRadius: 7, background: p.color, opacity: 0.85, transition: "width .25s" }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="raceCaption">
          Mixed precision means the optimizer bill is ~{Math.round(total / (cfg.paramsB * 2))}× the weight bytes.
          Sharding state across TP × PP = {tp * pp} GPUs brings {cfg.name} down to {fmtGB(sharded)} per GPU —
          before activations, which scene 09 hunts.
        </p>
      </div>
    </div>
  );
}

/* ---------- 05 data parallel ---------- */
export function DataParallel() {
  useTick(storeOf("dp", 9000));
  const store = storeOf("dp", 9000);
  const t = store.t;
  const gpus = [0, 1, 2, 3];
  const grads = [0.9, 1.1, 0.8, 1.2];
  const avg = grads.reduce((a, b) => a + b, 0) / 4;
  const inBackward = t > 0.15 && t < 0.55;
  const inReduce = t >= 0.55 && t < 0.8;
  const inUpdate = t >= 0.8;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
          {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        <span className="chip" style={inReduce ? { color: "var(--teal)", borderColor: "var(--teal)" } : undefined}>
          {t <= 0 ? "READY" : inBackward ? "LOCAL BACKWARD" : inReduce ? "ALL-REDUCE" : inUpdate ? "IDENTICAL UPDATE" : "NEXT BATCH"}
        </span>
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="Four data-parallel replicas compute and average gradients"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {gpus.map((g, i) => {
          const y = 20 + i * 52;
          const gradH = inBackward || inReduce || inUpdate ? grads[i] * 40 : 4;
          const synced = inReduce || inUpdate;
          return (
            <g key={g}>
              <rect x={60} y={y} width={150} height={40} rx={10}
                style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
              <text x={135} y={y + 25} textAnchor="middle" className="lblMono">GPU {g}</text>
              <text x={240} y={y + 25} className="lblMono">BATCH {g}</text>
              {/* gradient bars */}
              <rect x={340} y={y + 12} width={Math.max(4, gradH * 3)} height={16} rx={4}
                style={{ fill: synced ? "var(--teal)" : "var(--gold)", fillOpacity: 0.8, transition: "width .3s" }} />
              <text x={350 + Math.max(4, gradH * 3)} y={y + 25} className="lblMono" style={{ fill: synced ? "var(--teal)" : "var(--gold)" }}>
                {synced ? avg.toFixed(2) : grads[i].toFixed(2)}
              </text>
            </g>
          );
        })}
        {inReduce && gpus.map((g) => (
          <circle key={"p" + g} r={4} style={{ fill: "var(--teal)" }}>
            <animateMotion dur="1.4s" repeatCount="indefinite" path={`M340 ${40 + g * 52} H500`} />
          </circle>
        ))}
        <text x={640} y={128} className="lblMono" style={{ fill: inReduce ? "var(--teal)" : "var(--ink3)" }}>
          {inReduce ? "ALL-REDUCE IN FLIGHT" : inUpdate ? "ALL REPLICAS IDENTICAL AGAIN" : "GRADIENTS FORM LOCALLY"}
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "Four replicas, four different batches, one shared model. RUN the step."
          : inBackward
            ? "Each replica backprops its own batch — local gradients disagree by design."
            : inReduce
              ? "The all-reduce averages every gradient. The mean over replicas IS the gradient of the global batch."
              : inUpdate
                ? "After averaging, all four apply the same update and stay bit-identical. The world moves in lockstep."
                : "Repeat with fresh batches. Scale replicas and the global batch grows with them."}
      </p>
    </div>
  );
}

/* ---------- 06 ring all-reduce ---------- */
export function RingAllReduce() {
  const [n, setN] = useState(4);
  const [pos, setPos] = useState(0);
  const rafRef = useRef(0);
  const steps = ringSteps(n);
  const TENSOR_MB = 408;

  useEffect(() => {
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 550) { setPos((p) => (p + 1) % steps.length); last = now; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [steps.length]);

  const step = steps[pos];
  const scatterSteps = (n - 1) * n;
  const doneScatter = pos >= scatterSteps;
  const ringPos = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    return { i, x: 150 + 105 * Math.cos(a), y: 120 + 95 * Math.sin(a) };
  });
  // per-GPU filled chunks
  const chunksByGpu: number[][] = Array.from({ length: n }, () => []);
  steps.slice(0, pos + 1).forEach((s) => { if (!chunksByGpu[s.to].includes(s.chunk)) chunksByGpu[s.to].push(s.chunk); });

  return (
    <div className="panel" style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(240px,300px) minmax(0,1fr)", gap: "var(--s5)" }}>
      <aside className="stepperCard">
        <h4 style={{ margin: "0 0 var(--s3)", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>RING SIZE</h4>
        {([2, 4, 8] as const).map((k) => (
          <button key={k} className={"btn btnSm " + (n === k ? "btnPrimary" : "btnSecondary")} style={{ marginBottom: 8 }}
            aria-pressed={n === k} onClick={() => { setN(k); setPos(0); }}>{k} GPUs</button>
        ))}
        <div className="controls" style={{ marginTop: 10 }}>
          <span className="configChip">STEP {pos + 1}/{steps.length}</span>
          <span className="configChip" data-testid="ring-phase">{doneScatter ? "GATHER" : "SCATTER-REDUCE"}</span>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Each GPU sends {fmtGB(0)}… precisely {(2 * (n - 1) / n).toFixed(2)}× the tensor:
          {" "}{Math.round(ringBytesN(n, TENSOR_MB))} MB for a {TENSOR_MB} MB gradient — regardless of ring size.
        </p>
      </aside>
      <div>
        <svg viewBox="0 0 640 240" role="img" aria-label="Ring all-reduce passing chunks around GPUs"
          style={{ width: "100%", height: "auto", display: "block" }}>
          {ringPos.map(({ i, x, y }) => (
            <g key={i}>
              <circle cx={x} cy={y} r={34} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.3)" }} />
              <text x={x} y={y - 4} textAnchor="middle" className="lblMono">GPU {i}</text>
              <text x={x} y={y + 12} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>
                {chunksByGpu[i].length}/{n} ✓
              </text>
              {n === 2 || i < n - 1 ? null : null}
            </g>
          ))}
          {ringPos.map(({ i, x, y }, idx) => {
            const nxt = ringPos[(idx + 1) % n];
            const activeEdge = step && step.from === i;
            const mx = (x + nxt.x) / 2, my = (y + nxt.y) / 2;
            return (
              <g key={"e" + i}>
                <line x1={x} y1={y} x2={nxt.x} y2={nxt.y} stroke={activeEdge ? "var(--teal)" : "var(--hair2)"} strokeWidth={activeEdge ? 2.5 : 1} />
                {activeEdge && step && (
                  <circle cx={mx} cy={my} r={6} style={{ fill: "var(--teal)", filter: "drop-shadow(0 0 5px var(--teal))" }}>
                    <animate attributeName="opacity" values="1;.3;1" dur=".7s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
          {step && (
            <text x={320} y={228} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>
              {step.phase === "scatter" ? "SCATTER-REDUCE" : "ALL-GATHER"} · GPU {step.from} → GPU {step.to} · CHUNK {step.chunk}
            </text>
          )}
        </svg>
        <p className="raceCaption">
          Two phases of {n - 1} hops each. Every chunk travels exactly once around the ring —
          that symmetry is why per-GPU traffic never grows with cluster size.
        </p>
      </div>
    </div>
  );
}

/* ---------- 07 tensor parallel ---------- */
export function TensorParallel() {
  const [sliced, setSliced] = useState(true);
  const W = 900, H = 210;
  const gpus = [0, 1];
  const showSync = sliced;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["dense", "sliced"] as const).map((m) => (
          <button key={m} className={"btn btnSm " + ((m === "sliced") === sliced ? "btnPrimary" : "btnSecondary")}
            aria-pressed={sliced === (m === "sliced")} onClick={() => setSliced(m === "sliced")}>
            {m === "dense" ? "ONE GPU OWNS THE MATMUL" : "TENSOR SLICED ACROSS 2"}
          </button>
        ))}
        {sliced && <span className="chip" style={{ color: "var(--rose)", borderColor: "var(--rose)" }}>2 ALL-REDUCES PER LAYER</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A weight matrix sliced column-wise across two GPUs"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {/* input activations */}
        <rect x={40} y={40} width={70} height={130} rx={8} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
        <text x={75} y={190} textAnchor="middle" className="lblMono">X</text>
        {/* weight blocks */}
        {[0, 1].map((g) => {
          const bx = 180 + g * 220;
          return (
            <g key={g}>
              {!sliced || g === 0 ? (
                <rect x={bx} y={40} width={sliced ? 110 : 220} height={130} rx={8}
                  style={{ fill: g === 0 || !sliced ? "var(--gold-dim)" : "var(--cyan-dim)", fillOpacity: 0.35, stroke: g === 0 || !sliced ? "var(--gold)" : "var(--cyan)" }} />
              ) : null}
              {sliced && g === 1 && (
                <rect x={bx} y={40} width={110} height={130} rx={8}
                  style={{ fill: "var(--cyan-dim)", fillOpacity: 0.35, stroke: "var(--cyan)" }} />
              )}
              <text x={bx + (sliced ? 55 : 110)} y={110} textAnchor="middle" className="lblMono" style={{ fill: g === 0 || !sliced ? "var(--gold)" : "var(--cyan)" }}>
                {sliced ? `W[:, ${g * 110}–${(g + 1) * 110}]` : "W (full)"}
              </text>
              <text x={bx + (sliced ? 55 : 110)} y={196} textAnchor="middle" className="lblMono">GPU {g}</text>
            </g>
          );
        })}
        {/* partial outputs */}
        <rect x={640} y={40} width={100} height={58} rx={8} style={{ fill: "var(--bg3)", stroke: sliced ? "var(--gold)" : "rgba(159,182,187,.25)" }} />
        <rect x={640} y={112} width={100} height={58} rx={8} style={{ fill: "var(--bg3)", stroke: sliced ? "var(--cyan)" : "rgba(159,182,187,.25)" }} />
        <text x={690} y={72} textAnchor="middle" className="lblMono">{sliced ? "Y₀ partial" : "Y"}</text>
        <text x={690} y={144} textAnchor="middle" className="lblMono">{sliced ? "Y₁ partial" : ""}</text>
        {showSync && (
          <g>
            <path d="M740 69 C 790 69, 790 141, 740 141" fill="none" stroke="var(--rose)" strokeWidth={2} strokeDasharray="5 5" />
            <text x={800} y={110} className="lblMono" style={{ fill: "var(--rose)" }}>ALL-REDUCE</text>
          </g>
        )}
        <text x={40} y={26} className="lblMono">
          {sliced ? "COLUMN-PARALLEL WEIGHTS · PARTIAL SUMS MUST BE REDUCED" : "THE WHOLE MATRIX LIVES ON ONE GPU — NO COMMS, NO ROOM FOR A BIGGER MODEL"}
        </text>
      </svg>
      <p className="raceCaption" style={{ maxWidth: 900 }}>
        Megatron-style: column-parallel to split, row-parallel to finish. Each transformer block pays two
        all-reduces, which is why tensor parallelism stays inside the NVLink domain and pipeline parallelism crosses nodes.
      </p>
    </div>
  );
}

/* ---------- 08 pipeline parallel ---------- */
export function PipelineParallel() {
  const [micro, setMicro] = useState(4);
  const stages = 4;
  const bubble = bubbleFraction(micro, stages);
  const slots = micro + 2 * (stages - 1);
  const cellW = Math.min(30, 760 / slots);
  const cellH = 26;
  const rows = Array.from({ length: stages }, (_, s) => {
    const cells: { slot: number; kind: "fwd" | "bwd" }[] = [];
    for (let i = 0; i < micro; i++) cells.push({ slot: i + (stages - 1 - s), kind: "fwd" });
    for (let i = 0; i < micro; i++) cells.push({ slot: micro + 2 * (stages - 1) - 1 - i - (stages - 1 - s), kind: "bwd" });
    return { s, cells };
  });

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">MICRO-BATCHES</span>
        <input type="range" className="slider" min={1} max={12} step={1} value={micro} aria-label="Micro-batches"
          style={{ maxWidth: 260 }} onChange={(e) => setMicro(Number(e.target.value))} />
        <span className="configChip">{micro} MICRO × {stages} STAGES</span>
        <span className={"chip"} style={bubble > 0.3 ? { color: "var(--rose)", borderColor: "var(--rose)" } : { color: "var(--teal)", borderColor: "var(--teal)" }} data-testid="bubble">
          BUBBLE · {(bubble * 100).toFixed(0)}%
        </span>
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label="Pipeline schedule with forward and backward cells and bubble gaps"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {rows.map(({ s, cells }) => (
          <g key={s}>
            <text x={20} y={30 + s * (cellH + 12) + 18} className="lblMono">STAGE {s}</text>
            {Array.from({ length: slots }, (_, slot) => {
              const c = cells.find((c) => c.slot === slot);
              const x = 90 + slot * cellW;
              const y = 30 + s * (cellH + 12);
              const color = c ? (c.kind === "fwd" ? "var(--gold)" : "var(--rose)") : "transparent";
              return (
                <rect key={slot} x={x} y={y} width={cellW - 3} height={cellH} rx={4}
                  style={{
                    fill: c ? color : "rgba(159,182,187,.06)",
                    fillOpacity: c ? 0.55 : 1,
                    stroke: c ? color : "rgba(159,182,187,.14)",
                    strokeDasharray: c ? undefined : "3 3",
                  }} />
              );
            })}
          </g>
        ))}
        <text x={90} y={210} className="lblMono" style={{ fill: "var(--gold)" }}>■ FORWARD</text>
        <text x={190} y={210} className="lblMono" style={{ fill: "var(--rose)" }}>■ BACKWARD</text>
        <text x={300} y={210} className="lblMono">▨ IDLE BUBBLE — DEAD GPU TIME</text>
      </svg>
      <p className="raceCaption">
        Bubble fraction = (p−1)/(m+p−1). With m={micro}: {(bubble * 100).toFixed(0)}% of the schedule is idle.
        Slide to 12 micro-batches and the tax shrinks — the trade is activation memory (scene 09).
      </p>
    </div>
  );
}

/* ---------- 09 checkpointing ---------- */
export function Checkpointing() {
  const [ckpt, setCkpt] = useState(false);
  const layers = 32;
  const seq = 4096, batch = 4, hidden = 4096;
  const full = activationGB(layers, seq, batch, hidden, false);
  const withCk = activationGB(layers, seq, batch, hidden, true);
  const segs = segmentsFor(layers);
  const shown = ckpt ? withCk : full;
  const maxGB = full;

  const bar = (label: string, gb: number, color: string) => (
    <div>
      <div className="controls" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <span className="kicker">{label}</span><span className="kicker" style={{ color }}>{fmtGB(gb)}</span>
      </div>
      <div style={{ height: 16, borderRadius: 8, background: "var(--bg3)" }}>
        <div style={{ height: "100%", width: `${Math.max(2, (gb / maxGB) * 100)}%`, borderRadius: 8, background: color, transition: "width .3s" }} />
      </div>
    </div>
  );

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["full", "ckpt"] as const).map((m) => (
          <button key={m} className={"btn btnSm " + ((m === "ckpt") === ckpt ? "btnPrimary" : "btnSecondary")}
            aria-pressed={ckpt === (m === "ckpt")} onClick={() => setCkpt(m === "ckpt")}>
            {m === "full" ? "KEEP EVERYTHING" : "CHECKPOINT √L SEGMENTS"}
          </button>
        ))}
        <span className="configChip">SEQ {seq} · BATCH {batch} · {layers} LAYERS</span>
        {ckpt && <span className="chip" style={{ color: "var(--gold)", borderColor: "var(--gold)" }}>+{Math.round(recomputeOverhead(layers) * 100)}% FORWARD COMPUTE</span>}
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {bar("ACTIVATIONS STORED", full, "var(--rose)")}
        {ckpt && bar("STORED WITH CHECKPOINTING", withCk, "var(--teal)")}
      </div>
      <svg viewBox="0 0 900 90" role="img" aria-label="Layers grouped into checkpointed segments"
        style={{ width: "100%", height: "auto", display: "block", marginTop: "var(--s4)" }}>
        {Array.from({ length: layers }, (_, l) => {
          const x = 30 + l * 26;
          const segBoundary = ckpt && l % segs === 0;
          return (
            <g key={l}>
              <rect x={x} y={20} width={22} height={34} rx={4}
                style={{
                  fill: ckpt ? (segBoundary ? "var(--teal-dim)" : "rgba(16,32,43,.5)") : "var(--rose-dim, var(--bg3))",
                  fillOpacity: ckpt && !segBoundary ? 0.4 : 0.7,
                  stroke: ckpt ? (segBoundary ? "var(--teal)" : "rgba(159,182,187,.16)") : "var(--rose)",
                }} />
              {ckpt && segBoundary && <text x={x + 11} y={16} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>★</text>}
            </g>
          );
        })}
        <text x={30} y={80} className="lblMono">
          {ckpt ? `ONLY ${segs} BOUNDARY SEGMENTS (★) SURVIVE BACKWARD REACHES BACK — EVERYTHING ELSE IS RECOMPUTED` : "EVERY LAYER'S ACTIVATIONS WAIT IN HBM FOR THE BACKWARD PASS"}
        </text>
      </svg>
      <p className="raceCaption">
        Memory falls from {fmtGB(full)} to {fmtGB(withCk)} — O(L) becomes O(√L) — by paying one extra
        forward per segment. Compute is cheap and renewable; HBM is neither.
      </p>
    </div>
  );
}

/* ---------- 10 MoE routing ---------- */
export function MoERouting() {
  const [experts, setExperts] = useState(8);
  const tokens = routeTokens(64, experts);
  const load = expertLoad(tokens, experts);
  const imb = imbalance(load);
  const maxLoad = Math.max(...load);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">EXPERTS</span>
        <input type="range" className="slider" min={4} max={16} step={2} value={experts} aria-label="Experts"
          style={{ maxWidth: 220 }} onChange={(e) => setExperts(Number(e.target.value))} />
        <span className="configChip">{experts} EXPERTS · 64 TOKENS</span>
        <span className={"chip"} style={imb > 1.6 ? { color: "var(--rose)", borderColor: "var(--rose)" } : { color: "var(--teal)", borderColor: "var(--teal)" }} data-testid="imbalance">
          MAX LOAD IMBALANCE · {imb.toFixed(2)}×
        </span>
      </div>
      <svg viewBox="0 0 900 230" role="img" aria-label="Tokens routed to experts with load bars"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {/* token column */}
        {tokens.slice(0, 16).map((tk, i) => (
          <circle key={tk.id} cx={60} cy={26 + i * 12.5} r={4.5}
            style={{ fill: "var(--gold)", fillOpacity: 0.85 }} />
        ))}
        <text x={60} y={222} textAnchor="middle" className="lblMono">TOKENS (16 of 64)</text>
        {/* expert lanes */}
        {Array.from({ length: experts }, (_, e) => {
          const y = 22 + e * (180 / experts);
          const w = (load[e] / maxLoad) * 380;
          return (
            <g key={e}>
              <text x={180} y={y + 12} className="lblMono">E{e}</text>
              <rect x={210} y={y} width={Math.max(6, w)} height={16} rx={4}
                style={{ fill: "var(--teal)", fillOpacity: 0.7 }} />
              <text x={220 + Math.max(6, w)} y={y + 12} className="lblMono" style={{ fill: "var(--teal)" }}>{load[e]}</text>
              {/* routed token dots */}
              {tokens.filter((t) => t.expert === e).slice(0, 8).map((t, i) => (
                <circle key={t.id} cx={640 + i * 12} cy={y + 8} r={4}
                  style={{ fill: "var(--gold)", fillOpacity: 0.7 }} />
              ))}
            </g>
          );
        })}
        <text x={640} y={222} className="lblMono">ROUTED TOKENS PER EXPERT</text>
      </svg>
      <p className="raceCaption">
        A learned router picks top-k experts per token — capacity grows with experts, FLOPs per token stay near top-k.
        The catch is imbalance: a hot expert wastes the others' capacity, so auxiliary losses keep lanes even.
      </p>
    </div>
  );
}

/* ---------- 11 scaling laws ---------- */
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
  const xs = (p: number) => L + (Math.log10(p) - Math.log10(0.1)) / (Math.log10(405) - Math.log10(0.1)) * (W - L - R);
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
          <input type="range" className="slider" min={0.5} max={405} step={0.5} value={params} aria-label="Parameters"
            onChange={(e) => setParams(Number(e.target.value))} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">TOKEN BUDGET (20×N)</span><span className="kicker" style={{ color: "var(--teal)" }}>{tokensB.toFixed(0)}B</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">PREDICTED LOSS</span><span className="kicker" style={{ color: "var(--iris)" }}>{loss.toFixed(3)}</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">1,024 H100 · 42% MFU</span><span className="kicker" style={{ color: "var(--gold)" }}>{fmtHours(hours)}</span>
          </div>
          <div className="controls" style={{ justifyContent: "space-between" }}>
            <span className="kicker">COST @ $2/GPU-H</span><span className="kicker" style={{ color: "var(--rose)" }} data-testid="cost">${(cost / 1000).toFixed(2)}M</span>
          </div>
        </div>
        <p className="hint">Every slider move is a multimillion-dollar decision. This is why run plans exist.</p>
      </aside>
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scaling law: loss falls as a power of parameters"
          style={{ width: "100%", height: "auto", display: "block" }}>
          <path d={`M${curve.join(" L")}`} fill="none" stroke="var(--iris)" strokeWidth={2} />
          {models.map((p) => (
            <g key={p}>
              <circle cx={xs(p)} cy={ys(scalingLoss(p))} r={3.5} style={{ fill: p === params ? "var(--gold)" : "var(--iris)" }} />
              <text x={xs(p)} y={H - 12} textAnchor="middle" className="lblMono">{p >= 1 ? p : p}</text>
            </g>
          ))}
          <circle cx={xs(params)} cy={ys(scalingLoss(params))} r={6} style={{ fill: "var(--gold)", filter: "drop-shadow(0 0 6px var(--gold))" }} />
          <text x={L} y={H - 1} className="lblMono">0.1B</text>
          <text x={W - R} y={H - 1} textAnchor="end" className="lblMono">405B · log scale</text>
          <text x={L} y={T + 10} className="lblMono" style={{ fill: "var(--iris)" }}>L(N) = A·N^-α + E</text>
        </svg>
        <p className="raceCaption">
          Loss falls as a smooth power law across nine orders of magnitude — the most consequential graph in
          the field. Compute-optimal training spends ~20 tokens per parameter; over-train a smaller model and
          you buy cheaper inference instead of lower loss.
        </p>
      </div>
    </div>
  );
}
