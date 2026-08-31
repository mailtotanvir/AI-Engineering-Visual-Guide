"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  H100_SM, PRECISION_RUNGS, SILICON_SPECS,
  decodeTokenTimeMs, quantModelGB, quantizeSymmetric, residentWarps,
  rooflineTflops, warpOccupancy,
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

function RunReset({ store }: { store: TimelineStore }) {
  return (
    <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
      {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
    </button>
  );
}

/* ---------- 04 silicon map ---------- */
export function SiliconMap() {
  const [sel, setSel] = useState("gpu");
  const spec = SILICON_SPECS.find((s) => s.id === sel)!;
  const maxTf = Math.max(...SILICON_SPECS.map((s) => s.peakTflops));
  const maxBw = Math.max(...SILICON_SPECS.map((s) => s.memBandwidthTBs));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {SILICON_SPECS.map((s) => (
          <button key={s.id} className={"chip" + (sel === s.id ? "" : "")}
            style={sel === s.id ? { color: "var(--iris)", borderColor: "var(--iris)" } : undefined}
            onClick={() => setSel(s.id)}>{s.name}</button>
        ))}
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label={`Peak compute and memory bandwidth for ${spec.name}`}
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={40} y={30} className="lblMono" style={{ fill: "var(--teal)" }}>PEAK TFLOPS</text>
        <rect x={40} y={40} width={820 * (spec.peakTflops / maxTf)} height={34} rx={8}
          style={{ fill: "var(--teal)", fillOpacity: 0.25, stroke: "var(--teal)" }} />
        <text x={52} y={62} className="lblMono">{spec.peakTflops} TF</text>
        <text x={40} y={130} className="lblMono" style={{ fill: "var(--rose)" }}>MEMORY BANDWIDTH</text>
        <rect x={40} y={140} width={820 * (spec.memBandwidthTBs / maxBw)} height={34} rx={8}
          style={{ fill: "var(--rose)", fillOpacity: 0.25, stroke: "var(--rose)" }} />
        <text x={52} y={162} className="lblMono">{spec.memBandwidthTBs} TB/s · {spec.memGB} GB on-package</text>
        <text x={40} y={218} className="lblMono" style={{ fill: "var(--ink2)" }}>{spec.notes}</text>
      </svg>
      <p className="raceCaption">
        Compute and bandwidth rarely peak together. The LPU&apos;s 80 TB/s SRAM fabric exists precisely
        to keep a deterministic pipeline fed; the GPU trades some of that for flexibility.
      </p>
    </div>
  );
}

/* ---------- 05 memory wall / roofline ---------- */
export function MemoryWall() {
  const store = storeOf("memwall", 8000);
  useTick(store);
  const t = store.t;
  // sweep operational intensity from prefill-like (100) to decode-like (1)
  const intensity = 100 * Math.pow(0.01, t);
  const gpu = rooflineTflops(989, 3.35, intensity);
  const lpu = rooflineTflops(750, 80, intensity);
  const yOf = (tf: number) => 200 - (tf / 1000) * 170;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
        <span className="configChip">ARITHMETIC INTENSITY · {intensity.toFixed(1)} FLOP/B</span>
      </div>
      <svg viewBox="0 0 900 230" role="img" aria-label="Roofline sweep from compute-bound to memory-bound"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={200} x2={880} y2={200} stroke="var(--ink3)" />
        <line x1={60} y1={20} x2={60} y2={200} stroke="var(--ink3)" />
        <text x={470} y={222} textAnchor="middle" className="lblMono">ARITHMETIC INTENSITY (FLOP per byte) →</text>
        <text x={20} y={110} className="lblMono" transform="rotate(-90 20 110)" textAnchor="middle">TFLOPS</text>
        <polyline points={`${60},${yOf(Math.min(989, 3.35 * 100))} 860,${yOf(3.35 * 100)}`}
          fill="none" stroke="var(--rose)" strokeWidth={2} strokeDasharray="6 5" />
        <circle cx={60 + t * 800} cy={yOf(gpu)} r={7} style={{ fill: "var(--teal)" }} />
        <circle cx={60 + t * 800} cy={yOf(lpu)} r={7} style={{ fill: "var(--gold)" }} />
        <text x={80 + t * 800} y={yOf(gpu) - 12} className="lblMono" style={{ fill: "var(--teal)" }}>GPU {gpu.toFixed(0)} TF</text>
        <text x={80 + t * 800} y={yOf(lpu) + 22} className="lblMono" style={{ fill: "var(--gold)" }}>LPU {lpu.toFixed(0)} TF</text>
        <text x={90} y={44} className="lblMono" style={{ fill: "var(--rose)" }}>memory-bound roof (bandwidth × intensity)</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t < 0.25
          ? "Prefill territory: high intensity, compute roof dominates — the GPU's 989 TF ceiling is in play."
          : t < 0.8
            ? "Sliding toward decode: intensity collapses, and the bandwidth roof takes over long before peak compute."
            : "Decode territory: ~1 FLOP/byte. Everyone lives on the memory wall; bandwidth is the currency."}
      </p>
    </div>
  );
}

/* ---------- 06 warps & tensor cores ---------- */
export function WarpTensor() {
  const store = storeOf("warp", 9000);
  useTick(store);
  const t = store.t;
  const frac = 0.2 + 0.8 * Math.min(1, t * 1.4);
  const warps = residentWarps(frac);
  const bubble = (1 - warpOccupancy(warps, H100_SM.sms * H100_SM.warpsPerSm)) * 100;
  const smCycles = Math.floor(t * 40);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">RESIDENT WARPS · {warps.toLocaleString("en-US")} / {H100_SM.sms * H100_SM.warpsPerSm}</span>
        <span className="configChip">SCHEDULER BUBBLE · {bubble.toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="SM warp occupancy grid and tensor core activity"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {Array.from({ length: H100_SM.sms }).map((_, sm) => {
          const col = sm % 33, row = Math.floor(sm / 33);
          const x = 30 + col * 26, y = 30 + row * 34;
          const lit = ((sm * 7 + smCycles * 3) % 10) / 10 < frac;
          return (
            <g key={sm}>
              <rect x={x} y={y} width={22} height={28} rx={4}
                style={{ fill: lit ? "var(--teal)" : "var(--bg3)", fillOpacity: lit ? 0.7 : 0.3, stroke: "var(--ink3)" }} />
              {lit && [0, 1, 2, 3].map((tc) => (
                <rect key={tc} x={x + 2 + tc * 5} y={y + 20} width={4} height={5} rx={1}
                  style={{ fill: "var(--gold)", opacity: (smCycles + sm + tc) % 3 === 0 ? 1 : 0.35 }} />
              ))}
            </g>
          );
        })}
        <text x={30} y={218} className="lblMono" style={{ fill: "var(--teal)" }}>SM · teal = warps resident</text>
        <text x={330} y={218} className="lblMono" style={{ fill: "var(--gold)" }}>gold = Tensor Core MMA active</text>
        <text x={640} y={218} className="lblMono" style={{ fill: "var(--ink2)" }}>132 SMs · 64 warp slots · 4 TC each</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "RUN to sweep occupancy from starved to saturated."
          : frac < 0.6
            ? "Sparse occupancy: every memory stall becomes a visible scheduler bubble — latency goes unhidden."
            : "Dense warp residency: stalled warps retire while others issue, and Tensor Cores stay fed with MMA tiles."}
      </p>
    </div>
  );
}

/* ---------- 07 quant ladder ---------- */
export function QuantLadder() {
  const [bits, setBits] = useState(8);
  const paramsB = 7;
  const vals = [0.92, -0.31, 0.05, 0.77, -0.64, 0.12, -0.88, 0.41];
  const q = quantizeSymmetric(vals, bits);
  const gb = quantModelGB(paramsB, bits);
  const gb32 = quantModelGB(paramsB, 32);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {PRECISION_RUNGS.map((r) => (
          <button key={r.name} className="chip"
            style={bits === r.bits && (r.name !== "INT8" || bits === 8) && (r.name !== "FP8" || bits === 8) ? { color: "var(--iris)", borderColor: "var(--iris)" } : undefined}
            onClick={() => setBits(r.bits)}>{r.name}</button>
        ))}
        <span className="configChip">{paramsB}B MODEL · {gb.toFixed(1)} GB (was {gb32.toFixed(1)})</span>
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label={`Weights quantized to ${bits} bits`}
        style={{ width: "100%", height: "auto", display: "block" }}>
        {vals.map((v, i) => {
          const orig = 110 - v * 90;
          const dq = 110 - q.dequantized[i] * 90;
          return (
            <g key={i}>
              <line x1={70 + i * 100} y1={orig} x2={70 + i * 100} y2={dq} stroke="var(--rose)" strokeWidth={2} />
              <circle cx={70 + i * 100} cy={orig} r={6} style={{ fill: "var(--teal)" }} />
              <rect x={62 + i * 100} y={dq - 5} width={16} height={10} rx={2} style={{ fill: "var(--gold)" }} />
            </g>
          );
        })}
        <line x1={40} y1={110} x2={860} y2={110} stroke="var(--ink3)" />
        <text x={40} y={200} className="lblMono" style={{ fill: "var(--teal)" }}>● FP32 weight</text>
        <text x={200} y={200} className="lblMono" style={{ fill: "var(--gold)" }}>▬ dequantized</text>
        <text x={360} y={200} className="lblMono" style={{ fill: "var(--rose)" }}>— rounding error</text>
        <text x={560} y={200} className="lblMono">max err · {q.maxErr.toFixed(4)} · scale {q.scale.toFixed(4)}</text>
      </svg>
      <p className="raceCaption">
        PTQ in one picture: pick a scale from calibration data, snap each weight to the grid, and the
        gap between teal and gold is your quality bill. Lower rungs widen the grid — and the error.
      </p>
    </div>
  );
}

/* ---------- 08 graph fusion ---------- */
export function GraphFusion() {
  const store = storeOf("fuse", 7000);
  useTick(store);
  const t = store.t;
  const ops = [
    { name: "LayerNorm", y: 40 }, { name: "add (residual)", y: 90 },
    { name: "GELU", y: 140 }, { name: "matmul QKV", y: 190 },
  ];
  const fused = t > 0.45;
  const launches = fused ? 1 : 4;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">KERNEL LAUNCHES · {launches}</span>
        {fused && <span className="chip" style={{ color: "var(--lime)", borderColor: "var(--lime)" }}>FUSED + DCE + CONST-FOLD</span>}
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="Operator graph before and after fusion"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {ops.map((op, i) => {
          const visible = t > i * 0.1;
          const x = fused ? 560 : 90 + (i % 2) * 220;
          const y = fused ? 110 : op.y + 10;
          return visible ? (
            <g key={op.name} opacity={fused ? 1 : Math.min(1, t * 4 - i)}>
              <rect x={x} y={y - 24} width={180} height={48} rx={10}
                style={{ fill: "var(--teal)", fillOpacity: fused ? 0.3 : 0.14, stroke: fused ? "var(--lime)" : "var(--teal)" }} />
              <text x={x + 90} y={y + 5} textAnchor="middle" className="lblMono">{op.name}</text>
            </g>
          ) : null;
        })}
        {fused && (
          <g>
            <rect x={530} y={60} width={240} height={110} rx={16} fill="none" stroke="var(--lime)" strokeDasharray="8 6" />
            <text x={650} y={195} textAnchor="middle" className="lblMono" style={{ fill: "var(--lime)" }}>ONE launch · intermediates stay in registers</text>
          </g>
        )}
        <text x={90} y={224} className="lblMono" style={{ fill: fused ? "var(--ink3)" : "var(--ink2)", textDecoration: fused ? "line-through" : "none" }}>
          {fused ? "3 launches eliminated" : "eager mode: 4 launches, 3 HBM round-trips"}
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t < 0.45
          ? "Eager execution pays the launch tax per op and parks every intermediate tensor in HBM."
          : "The compiler fuses the chain: one kernel, registers instead of round-trips, dead nodes gone."}
      </p>
    </div>
  );
}

/* ---------- 09 AI compiler ---------- */
export function AiCompiler() {
  const store = storeOf("compiler", 9000);
  useTick(store);
  const t = store.t;
  const stages = [
    { name: "MODEL GRAPH", sub: "PyTorch / JAX / ONNX", color: "var(--iris)" },
    { name: "GRAPH PASSES", sub: "fusion · DCE · layout", color: "var(--teal)" },
    { name: "TILE & SCHEDULE", sub: "autotuned per target", color: "var(--gold)" },
    { name: "BARE METAL", sub: "PTX / SASS / bytecodes", color: "var(--rose)" },
  ];
  const stage = Math.min(stages.length, Math.floor(t * (stages.length + 0.4)));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">LOWERING · STAGE {Math.max(1, stage)} / {stages.length}</span>
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label="Compiler lowering pipeline"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {stages.map((s, i) => {
          const active = stage === i + 1;
          const done = stage > i + 1;
          const x = 40 + i * 220;
          return (
            <g key={s.name}>
              <rect x={x} y={70} width={180} height={80} rx={12}
                style={{ fill: s.color, fillOpacity: done ? 0.1 : active ? 0.3 : 0.04, stroke: s.color, strokeOpacity: active || done ? 1 : 0.35 }} />
              <text x={x + 90} y={105} textAnchor="middle" className="lblMono" style={{ fill: s.color }}>{s.name}</text>
              <text x={x + 90} y={128} textAnchor="middle" className="lblMono" opacity={0.75}>{s.sub}</text>
              {i < 3 && <text x={x + 196} y={115} className="lblMono" style={{ fill: "var(--ink2)" }}>→</text>}
            </g>
          );
        })}
        <text x={450} y={200} textAnchor="middle" className="lblMono" style={{ fill: "var(--ink2)" }}>
          same graph → different SASS per silicon generation; autotuning searches the schedule space
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {stage <= 1 ? "High-level model code enters as a portable graph."
          : stage === 2 ? "Graph passes rewrite the math — fusion, layout, constant folding."
          : stage === 3 ? "Schedules are tiled and tuned against the real memory hierarchy."
          : "Out comes machine-specific code: TensorRT for NVIDIA, OpenXLA or TVM anywhere else."}
      </p>
    </div>
  );
}
