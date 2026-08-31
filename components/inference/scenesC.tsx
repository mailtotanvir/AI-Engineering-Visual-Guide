"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  JSON_GRAMMAR, KV_CFG_7B_FP16, MOE_CFG, RADIX_TREE,
  coldStartMs, costPerMTokens, decodeStallMs, expertLoadBalance,
  kvBytesPerToken, kvCacheBytes, kvTransferTimeMs, maskedSample, moeActiveParamsB,
  moeSparsity, pipelineBubble, prefixSaveMs, radixHitTokens, spotMixUsd, tpMemoryPerGPU,
} from "@/lib/inference/engine";
import { mb } from "@/lib/inference/engine";

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

/* ---------- 12 radix prefix reuse ---------- */
export function RadixPrefix() {
  const store = storeOf("radix", 8000);
  useTick(store);
  const t = store.t;
  const requestPrefix = "/sys=claude-md/usr-b/new-question";
  const hit = radixHitTokens(RADIX_TREE, requestPrefix);
  const prefillKtok = 40; // ms per 1k tokens
  const saved = prefixSaveMs(prefillKtok, hit);
  const reveal = Math.min(1, t * 2.5);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">CACHE HIT · {hit} TOKENS</span>
        <span className="configChip">PREFILL SAVED · {saved.toFixed(0)} ms</span>
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="Radix tree of shared prompt prefixes"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {RADIX_TREE.map((n, i) => {
          const depth = n.prefix.split("/").length - 1;
          const x = 60 + depth * 230;
          const y = 40 + i * 34;
          const isHit = requestPrefix.startsWith(n.prefix) && n.prefix !== "/";
          const show = reveal > i / RADIX_TREE.length;
          if (!show) return null;
          return (
            <g key={n.prefix}>
              <rect x={x} y={y - 13} width={200} height={26} rx={7}
                style={{ fill: isHit ? "var(--teal)" : "var(--bg3)", fillOpacity: isHit ? 0.3 : 0.5, stroke: isHit ? "var(--teal)" : "var(--ink3)" }} />
              <text x={x + 8} y={y + 4} className="lblMono" style={{ fontSize: 10.5 }}>
                {n.prefix.slice(0, 26)} · {n.tokens} tok · {n.hits} hits
              </text>
            </g>
          );
        })}
        <text x={620} y={225} className="lblMono" style={{ fill: "var(--teal)" }}>teal = longest matched prefix</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t < 0.5
          ? "Every request walks the tree: shared system prompt, shared user block, then its own tail."
          : "Only the unmatched tail gets prefetched. The 412-token system prompt is computed once, reused thousands of times."}
      </p>
    </div>
  );
}

/* ---------- 13 logits pipeline (token loop) ---------- */
export function LogitsPipeline() {
  const store = storeOf("logits", 8000);
  useTick(store);
  const t = store.t;
  const stages = ["FORWARD PASS", "LOGITS", "TEMPERATURE", "TOP-K / TOP-P", "SAMPLE", "APPEND → LOOP"];
  const stage = Math.min(stages.length, Math.floor(t * (stages.length + 0.3)));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">STEP · {Math.max(1, stage)} / {stages.length}</span>
      </div>
      <svg viewBox="0 0 900 200" role="img" aria-label="Autoregressive token generation loop"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {stages.map((s, i) => {
          const x = 40 + (i % 3) * 290, y = 50 + Math.floor(i / 3) * 90;
          const active = stage === i + 1, done = stage > i + 1;
          return (
            <g key={s}>
              <rect x={x} y={y} width={250} height={54} rx={10}
                style={{ fill: "var(--iris)", fillOpacity: done ? 0.08 : active ? 0.3 : 0.03, stroke: "var(--iris)", strokeOpacity: active || done ? 1 : 0.3 }} />
              <text x={x + 125} y={y + 32} textAnchor="middle" className="lblMono" style={{ fill: "var(--iris)" }}>{s}</text>
            </g>
          );
        })}
        <path d="M 830 175 Q 870 175 870 130 Q 870 40 460 40" fill="none" stroke="var(--gold)" strokeWidth={2} strokeDasharray="6 5" markerEnd="none" />
        <text x={700} y={30} className="lblMono" style={{ fill: "var(--gold)" }}>next token joins the input</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {stage <= 1 ? "One full pass over frozen weights produces a distribution over the vocabulary."
          : stage < 5 ? "Filters sculpt that distribution — cheap kernels, negligible next to attention."
          : "The sampled token appends to the context, and the whole pass runs again. Serial by construction."}
      </p>
    </div>
  );
}

/* ---------- 15 grammar mask ---------- */
export function GrammarMask() {
  const [step, setStep] = useState(0);
  const logits = [-1.4, 0.6, -0.9, 2.1, -0.2, 0.9, -1.8, 1.2];
  const state = JSON_GRAMMAR[step % JSON_GRAMMAR.length];
  const res = maskedSample(logits, state.allowed, 0.5);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="chip" style={{ color: "var(--lime)", borderColor: "var(--lime)" }}>GRAMMAR STATE · {state.state.toUpperCase()}</span>
        <span className="configChip">{state.description}</span>
        <span className="configChip">EMITTED · {"{\"" .repeat(0)}{"{"}{step > 0 ? "…" : ""}</span>
      </div>
      <svg viewBox="0 0 900 230" role="img" aria-label="Logit masking under a JSON grammar"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {logits.map((l, i) => {
          const allowed = state.allowed.includes(i);
          const prob = res.kept.includes(i) ? res.probs[res.kept.indexOf(i)] : 0;
          const h = prob * 170;
          return (
            <g key={i}>
              <rect x={60 + i * 100} y={200 - h} width={64} height={Math.max(h, 2)} rx={6}
                style={{ fill: allowed ? "var(--lime)" : "var(--bg3)", fillOpacity: allowed ? 0.5 : 0.35, stroke: allowed ? "var(--lime)" : "var(--rose)", strokeOpacity: allowed ? 1 : 0.5 }} />
              {!allowed && <text x={92 + i * 100} y={195} textAnchor="middle" className="lblMono" style={{ fill: "var(--rose)" }}>✗</text>}
              <text x={92 + i * 100} y={220} textAnchor="middle" className="lblMono">tok {i}</text>
              {allowed && <text x={92 + i * 100} y={192 - h} textAnchor="middle" className="lblMono">{(prob * 100).toFixed(0)}%</text>}
            </g>
          );
        })}
      </svg>
      <p className="raceCaption">
        Invalid tokens get -inf logits before the softmax — the model literally cannot emit a
        syntax error. Parse state advances per token; masking cost is negligible next to attention.
      </p>
    </div>
  );
}

/* ---------- 17 chunked prefill ---------- */
export function ChunkedPrefill() {
  const [chunk, setChunk] = useState(2048);
  const promptTokens = 30720;
  const perKtok = 90; // ms prefill per 1000 tokens
  const mono = decodeStallMs(promptTokens, perKtok, null);
  const chunked = decodeStallMs(promptTokens, perKtok, chunk);
  const slices = Math.ceil(promptTokens / chunk);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">CHUNK SIZE</span>
        <input type="range" className="slider" min={512} max={8192} step={512} value={chunk}
          aria-label="Chunk size" style={{ maxWidth: 260 }} onChange={(e) => setChunk(Number(e.target.value))} />
        <span className="configChip">{chunk} TOK × {slices} SLICES</span>
        <span className="configChip">DECODE STALL · {mono.toFixed(0)} → {chunked === mono ? mono.toFixed(0) : chunked.toFixed(0) + " ms spread"}</span>
      </div>
      <svg viewBox="0 0 900 240" role="img" aria-label="Monolithic vs chunked prefill timeline"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={40} y={50} className="lblMono">MONOLITHIC</text>
        <rect x={160} y={30} width={700} height={34} rx={8} style={{ fill: "var(--rose)", fillOpacity: 0.35, stroke: "var(--rose)" }} />
        <text x={170} y={52} className="lblMono">prefill {promptTokens / 1024 | 0}k tokens — every decode frozen</text>
        <text x={40} y={130} className="lblMono">CHUNKED</text>
        {Array.from({ length: slices }).map((_, i) => {
          const w = Math.min(700 / Math.min(slices, 12), 58);
          const x = 160 + (i % Math.min(slices, 12)) * (700 / Math.min(slices, 12));
          const y = 110 + Math.floor(i / Math.min(slices, 12)) * 46;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w - 6} height={34} rx={6} style={{ fill: "var(--gold)", fillOpacity: 0.4, stroke: "var(--gold)" }} />
              <rect x={x + w - 4} y={y} width={Math.max(2, 700 / Math.min(slices, 12) - w + 2)} height={34} rx={4}
                style={{ fill: "var(--teal)", fillOpacity: 0.25, stroke: "var(--teal)", strokeOpacity: 0.5 }} />
            </g>
          );
        })}
        <text x={160} y={215} className="lblMono" style={{ fill: "var(--gold)" }}>gold = prefill slice</text>
        <text x={330} y={215} className="lblMono" style={{ fill: "var(--teal)" }}>teal = decode steps that kept ticking</text>
      </svg>
      <p className="raceCaption">
        Same total prefill work — but interleaved, so co-batched decodes never freeze for
        {(mono / 1000).toFixed(1)}s. Small TTFT cost buys large TPOT stability under load.
      </p>
    </div>
  );
}

/* ---------- 18 PD disaggregation ---------- */
export function PdDisagg() {
  const store = storeOf("pdd", 9000);
  useTick(store);
  const t = store.t;
  const kvBytes = kvBytesPerToken(KV_CFG_7B_FP16) * 4096;
  const xferMs = kvTransferTimeMs(kvBytes, 50); // NVLink-class 50 GB/s
  const phase = t < 0.35 ? "prefill" : t < 0.55 ? "transfer" : "decode";
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">KV PAYLOAD · {mb(kvBytes)}</span>
        <span className="configChip">HANDOFF · {xferMs.toFixed(1)} ms @ 50 GB/s</span>
        <span className="chip" style={{ color: phase === "prefill" ? "var(--gold)" : phase === "transfer" ? "var(--iris)" : "var(--teal)", borderColor: "currentColor" }}>
          {phase.toUpperCase()}
        </span>
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label="Prefill pool, KV transfer, decode pool"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={40} y={60} width={300} height={100} rx={14} style={{ fill: "var(--gold)", fillOpacity: 0.12, stroke: "var(--gold)" }} />
        <text x={190} y={105} textAnchor="middle" className="lblMono" style={{ fill: "var(--gold)" }}>PREFILL POOL</text>
        <text x={190} y={130} textAnchor="middle" className="lblMono" opacity={0.7}>compute-hungry · batch big</text>
        <rect x={560} y={60} width={300} height={100} rx={14} style={{ fill: "var(--teal)", fillOpacity: 0.12, stroke: "var(--teal)" }} />
        <text x={710} y={105} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>DECODE POOL</text>
        <text x={710} y={130} textAnchor="middle" className="lblMono" opacity={0.7}>memory-bound · stream weights</text>
        <line x1={340} y1={110} x2={560} y2={110} stroke="var(--iris)" strokeWidth={3} strokeDasharray="8 6"
          strokeDashoffset={-((t * 200) % 28)} />
        {t > 0.33 && t < 0.6 && (
          <circle cx={340 + ((t - 0.33) / 0.27) * 220} cy={110} r={9} style={{ fill: "var(--iris)" }} />
        )}
        <text x={450} y={95} textAnchor="middle" className="lblMono" style={{ fill: "var(--iris)" }}>KV transfer</text>
        <text x={450} y={200} textAnchor="middle" className="lblMono" style={{ fill: "var(--ink2)" }}>
          each pool scales against its own SLO; the fabric bridges the handoff
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {phase === "prefill" ? "Prefill rips through the prompt in parallel — it wants raw FLOPs."
          : phase === "transfer" ? "The finished KV cache streams across the fabric in milliseconds."
          : "Decode drones on memory-bound for hundreds of steps — it wants bandwidth, not FLOPs."}
      </p>
    </div>
  );
}

/* ---------- 20 tensor / pipeline parallelism ---------- */
export function TensorPipeline() {
  const [ranks, setRanks] = useState(4);
  const totalGB = 140; // 70B FP16
  const perGpu = tpMemoryPerGPU(totalGB, ranks);
  const layersPerStage = 80 / Math.max(2, ranks - 1);
  const bubble = pipelineBubble(Math.max(2, ranks - 1), 8, 12);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">TP RANKS</span>
        <input type="range" className="slider" min={1} max={8} step={1} value={ranks}
          aria-label="Tensor parallel ranks" style={{ maxWidth: 200 }} onChange={(e) => setRanks(Number(e.target.value))} />
        <span className="configChip">TP{ranks} · {perGpu.toFixed(0)} GB / GPU</span>
        <span className="configChip">PIPE BUBBLE · {bubble.toFixed(0)} ms/stage</span>
      </div>
      <svg viewBox="0 0 900 230" role="img" aria-label="Tensor and pipeline parallel memory split"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={40} y={45} className="lblMono" style={{ fill: "var(--teal)" }}>TENSOR PARALLEL — one layer, sliced {ranks}× inside the node</text>
        {Array.from({ length: ranks }).map((_, i) => (
          <rect key={i} x={40 + i * (760 / Math.max(ranks, 1))} y={60} width={760 / Math.max(ranks, 1) - 8} height={44} rx={8}
            style={{ fill: "var(--teal)", fillOpacity: 0.15 + (i % 2) * 0.08, stroke: "var(--teal)" }} />
        ))}
        <text x={40} y={150} className="lblMono" style={{ fill: "var(--gold)" }}>PIPELINE PARALLEL — layers chained across GPUs</text>
        {[0, 1, 2, 3].map((s) => (
          <g key={s}>
            <rect x={40 + s * 200} y={165} width={180} height={40} rx={8}
              style={{ fill: "var(--gold)", fillOpacity: 0.12, stroke: "var(--gold)" }} />
            <text x={130 + s * 200} y={190} textAnchor="middle" className="lblMono">L{s * layersPerStage | 0}–{(s + 1) * layersPerStage | 0}</text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Tensor parallel splits each matmul and needs NVLink-class interconnect; pipeline parallel
        chains layers and hides bubbles with micro-batches. Together they fit big models and multiply
        effective bandwidth per token.
      </p>
    </div>
  );
}

/* ---------- 21 MoE routing ---------- */
export function MoeRouting() {
  const store = storeOf("moe", 9000);
  useTick(store);
  const t = store.t;
  const tokens = 8;
  const experts = 16;
  const routed = Array.from({ length: experts }, () => 0);
  const tokenExperts: number[][] = [];
  for (let i = 0; i < tokens; i++) {
    const e1 = (i * 5 + 3) % experts;
    const e2 = (i * 11 + 7) % experts;
    tokenExperts.push([e1, e2]);
    routed[e1]++; routed[e2]++;
  }
  const capacity = 2;
  const bal = expertLoadBalance(routed, capacity);
  const active = moeActiveParamsB();
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">{MOE_CFG.totalParamsB}B TOTAL · {active.toFixed(0)}B ACTIVE / TOKEN</span>
        <span className="configChip">SPARSITY · {(moeSparsity() * 100).toFixed(0)}% idle per token</span>
        <span className="configChip">MAX EXPERT LOAD · {bal.maxCap.toFixed(1)}× cap</span>
      </div>
      <svg viewBox="0 0 900 250" role="img" aria-label="MoE router assigning tokens to experts"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {tokenExperts.map((es, i) => {
          const shown = t > i / (tokens + 2);
          if (!shown) return null;
          return (
            <g key={i}>
              <circle cx={70} cy={50 + i * 24} r={8} style={{ fill: "var(--iris)" }} />
              {es.map((e, k) => (
                <line key={k} x1={80} y1={50 + i * 24} x2={340 + (e % 4) * 140} y2={45 + Math.floor(e / 4) * 48}
                  stroke="var(--iris)" strokeWidth={1.4} opacity={0.5} />
              ))}
            </g>
          );
        })}
        {Array.from({ length: experts }).map((_, e) => {
          const x = 340 + (e % 4) * 140, y = 25 + Math.floor(e / 4) * 48;
          const load = routed[e];
          return (
            <g key={e}>
              <rect x={x} y={y} width={120} height={38} rx={8}
                style={{ fill: load > capacity ? "var(--rose)" : load > 0 ? "var(--teal)" : "var(--bg3)", fillOpacity: load > 0 ? 0.35 : 0.4, stroke: load > capacity ? "var(--rose)" : "var(--teal)", strokeOpacity: load > 0 ? 1 : 0.4 }} />
              <text x={x + 60} y={y + 24} textAnchor="middle" className="lblMono">E{e} · {load}</text>
            </g>
          );
        })}
        <text x={70} y={230} className="lblMono" style={{ fill: "var(--rose)" }}>red = over capacity → tokens dropped to backup expert</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t < 0.6 ? "The router picks 2 of 64 experts per token — trillion-scale capacity, sliver compute."
          : "All-to-all traffic moves tokens between expert GPUs; one hot expert can cap the whole layer."}
      </p>
    </div>
  );
}

/* ---------- 22 KV offload ---------- */
export function KvOffload() {
  const [seq, setSeq] = useState(16384);
  const hot = kvCacheBytes(KV_CFG_7B_FP16, Math.min(seq, 8192), 8);
  const total = kvCacheBytes(KV_CFG_7B_FP16, seq, 8);
  const cold = total - hot;
  const rdmaMs = kvTransferTimeMs(cold, 25);
  const recomputeMs = (seq / 1000) * 90;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">QUEUE DEPTH</span>
        <input type="range" className="slider" min={2048} max={65536} step={2048} value={seq}
          aria-label="Aggregate sequence tokens" style={{ maxWidth: 260 }} onChange={(e) => setSeq(Number(e.target.value))} />
        <span className="configChip">{seq.toLocaleString("en-US")} TOK × 8 REQ</span>
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label="KV cache tiers: HBM, host memory, NVMe"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={40} y={40} width={340} height={60} rx={10} style={{ fill: "var(--teal)", fillOpacity: 0.25, stroke: "var(--teal)" }} />
        <text x={210} y={66} textAnchor="middle" className="lblMono" style={{ fill: "var(--teal)" }}>HBM · HOT</text>
        <text x={210} y={88} textAnchor="middle" className="lblMono">{mb(hot)}</text>
        <rect x={480} y={40} width={380} height={60} rx={10} style={{ fill: "var(--gold)", fillOpacity: 0.18, stroke: "var(--gold)" }} />
        <text x={670} y={66} textAnchor="middle" className="lblMono" style={{ fill: "var(--gold)" }}>HOST MEM / NVMe · COLD</text>
        <text x={670} y={88} textAnchor="middle" className="lblMono">{mb(cold)}</text>
        <line x1={380} y1={70} x2={480} y2={70} stroke="var(--iris)" strokeWidth={3} strokeDasharray="7 5" strokeDashoffset={-(Date.now() % 24)} />
        <text x={430} y={58} textAnchor="middle" className="lblMono" style={{ fill: "var(--iris)" }}>RDMA</text>
        <text x={40} y={150} className="lblMono" style={{ fill: "var(--ink2)" }}>
          fetch cold block over fabric · {rdmaMs.toFixed(0)} ms @ 25 GB/s
        </text>
        <text x={40} y={180} className="lblMono" style={{ fill: "var(--ink2)" }}>
          vs recompute from scratch · {recomputeMs.toFixed(0)} ms
        </text>
        <text x={40} y={210} className="lblMono" style={{ fill: rdmaMs < recomputeMs ? "var(--teal)" : "var(--rose)" }}>
          {rdmaMs < recomputeMs ? "→ offload wins" : "→ recompute wins at this depth"}
        </text>
      </svg>
      <p className="raceCaption">
        Placement is the decision: streaming a cold KV block over the fabric beats recomputing it —
        until it doesn&apos;t. Balance keeps hot prefixes resident and long tails tiered.
      </p>
    </div>
  );
}

/* ---------- 23 cold start ---------- */
export function ColdStart() {
  const [warm, setWarm] = useState(false);
  const plan = { imagePullS: warm ? 0 : 22, modelLoadS: warm ? 0 : 38, kvWarmS: warm ? 0.4 : 6 };
  const ms = coldStartMs(plan);
  const segs = [
    { name: "IMAGE PULL", v: plan.imagePullS, color: "var(--iris)" },
    { name: "WEIGHT LOAD", v: plan.modelLoadS, color: "var(--gold)" },
    { name: "KV / WARMUP", v: plan.kvWarmS, color: "var(--teal)" },
  ];
  const activeSegs = segs.filter((s) => s.v > 0);
  const total = segs.reduce((a, s) => a + s.v, 0);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <button className={"btn btnSm " + (warm ? "btnPrimary" : "btnSecondary")}
          onClick={() => setWarm((w) => !w)}>{warm ? "WARM POOL: ON" : "WARM POOL: OFF"}</button>
        <span className="configChip">FIRST TOKEN DELAY · {(ms / 1000).toFixed(1)} s</span>
      </div>
      <svg viewBox="0 0 900 190" role="img" aria-label="Cold start timeline segments"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {activeSegs.map((s) => {
          const idx = segs.indexOf(s);
          const before = segs.slice(0, idx).reduce((a, x) => a + x.v, 0);
          const x = 40 + (before / total) * 820;
          const w = (s.v / total) * 820;
          return (
            <g key={s.name}>
              <rect x={x} y={60} width={Math.max(w, 3)} height={50} rx={8}
                style={{ fill: s.color, fillOpacity: 0.3, stroke: s.color }} />
              <text x={x + w / 2} y={90} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>{s.v.toFixed(1)}s</text>
              <text x={x + w / 2} y={140} textAnchor="middle" className="lblMono" style={{ fontSize: 10.5, fill: s.color }}>{s.name}</text>
            </g>
          );
        })}
        <text x={40} y={175} className="lblMono" style={{ fill: "var(--ink2)" }}>
          {warm ? "snapshot restore + pooled replicas: the bill drops to milliseconds" : "scale-to-zero economics vs p95 latency promises"}
        </text>
      </svg>
      <p className="raceCaption">
        Multi-GB weight loads dwarf container starts. Snapshots, tiered model caches and warm pools
        are how serverless inference survives its own first request.
      </p>
    </div>
  );
}

/* ---------- 24 finops ---------- */
export function FinopsMig() {
  const [spotFrac, setSpotFrac] = useState(50);
  const [profile, setProfile] = useState("3g.40gb");
  const tokPerSec = 2400;
  const onDemand = 32.77; // $/hr H100
  const withSpot = spotMixUsd(onDemand, spotFrac / 100);
  const perM = costPerMTokens(tokPerSec, withSpot);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">SPOT MIX</span>
        <input type="range" className="slider" min={0} max={90} step={10} value={spotFrac}
          aria-label="Spot fraction" style={{ maxWidth: 220 }} onChange={(e) => setSpotFrac(Number(e.target.value))} />
        <span className="configChip">{spotFrac}% SPOT</span>
        {["1g.10gb", "3g.40gb", "7g.80gb"].map((p) => (
          <button key={p} className={"btn btnSm " + (profile === p ? "btnPrimary" : "btnSecondary")}
            onClick={() => setProfile(p)}>{p}</button>
        ))}
      </div>
      <svg viewBox="0 0 900 220" role="img" aria-label="Cost per million tokens under spot mix and MIG profile"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={40} y={45} className="lblMono" style={{ fill: "var(--gold)" }}>MIG SLICES ON ONE H100</text>
        {profile === "1g.10gb" && [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={40 + i * 118} y={60} width={106} height={40} rx={8} style={{ fill: "var(--lime)", fillOpacity: 0.2, stroke: "var(--lime)" }} />
        ))}
        {profile === "3g.40gb" && [0, 1].map((i) => (
          <rect key={i} x={40 + i * 414} y={60} width={402} height={40} rx={8} style={{ fill: "var(--lime)", fillOpacity: 0.2, stroke: "var(--lime)" }} />
        ))}
        {profile === "7g.80gb" && (
          <rect x={40} y={60} width={820} height={40} rx={8} style={{ fill: "var(--lime)", fillOpacity: 0.2, stroke: "var(--lime)" }} />
        )}
        <text x={450} y={135} textAnchor="middle" className="lblMono" style={{ fontSize: 20, fill: "var(--teal)" }}>
          ${perM.toFixed(2)} / M TOKENS
        </text>
        <text x={450} y={165} textAnchor="middle" className="lblMono" style={{ fill: "var(--ink2)" }}>
          full on-demand: ${costPerMTokens(tokPerSec, onDemand).toFixed(2)} → spot-adjusted: ${perM.toFixed(2)}
        </text>
        <text x={450} y={195} textAnchor="middle" className="lblMono" style={{ fill: "var(--rose)" }}>
          spot saves {(100 - (perM / costPerMTokens(tokPerSec, onDemand)) * 100).toFixed(0)}% — with retry-on-interruption overhead priced in
        </text>
      </svg>
      <p className="raceCaption">
        Fractional GPUs absorb small models cheaply; spot pools carry the checkpoint-and-drain tax;
        autoscale on concurrency, not CPU — GPUs lie about utilization.
      </p>
    </div>
  );
}
