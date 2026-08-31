"use client";
import React, { useEffect, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  bradleyTerry, cotTokens, dpoLoss, eloDelta, gae2, grpoSavedMemoryGB, jailbreakRate,
  klPenalty, loraParamsM, mmTokenShare, ppoObjective, probRatio, qloraMemoryGB,
  quantRetained, refusalFrontier, retention, sftLossTokens, testTimeAccuracy,
  toolCallSuccess, contaminationUplift, ciHalfWidth, fullFtMemoryGB, judgeAgreement,
  preferenceLoss, groupAdvantage, passAtK, verifyReward, dataScaleRatio, distillKlLoss,
  serveMemoryGB, calibKL, softTargets,
} from "@/lib/posttrain/engine";

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

/* shared bar */
function Bar({ x, y, w, h, frac, color }: { x: number; y: number; w: number; h: number; frac: number; color: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
      <rect x={x} y={y} width={Math.max(2, w * Math.min(1, frac))} height={h} rx={6} style={{ fill: color, fillOpacity: 0.75 }} />
    </>
  );
}

function RunReset({ store }: { store: TimelineStore }) {
  return (
    <>
      <button className="btn btnPrimary btnSm" onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
        {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
      </button>
      <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳ RESET</button>
    </>
  );
}

/* ================= 01 SftBasics ================= */
export function SftBasics() {
  useTick(storeOf("sftb", 9000));
  const store = storeOf("sftb", 9000);
  const t = store.t;
  const ratio = dataScaleRatio(15000, 1);
  const pull = Math.min(1, t * 1.4); // distribution mode sliding toward assistant behavior
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">SCALE RATIO · {ratio.toLocaleString("en-US", { maximumFractionDigits: 0 })} : 1</span>
      </div>
      <svg viewBox="0 0 900 180" role="img" aria-label="Distribution mode shifting to assistant behavior" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">NEXT-TOKEN DISTRIBUTION OVER RESPONSES</text>
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
          const baseX = 450 + i * 110;
          const h = 70 - Math.abs(i) * 12;
          return (
            <g key={i}>
              <rect x={baseX - 40} y={160 - h} width={80} height={h} rx={6}
                style={{ fill: i === 0 ? "var(--gold)" : "var(--teal)", fillOpacity: 0.15 + (i === 0 ? 0 : 0.1) }} />
              <text x={baseX} y={174} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>
                {i === 0 ? "web-text" : `alt-${i}`}
              </text>
            </g>
          );
        })}
        <rect x={410 - 260 * pull} y={20} width={80} height={34} rx={8}
          style={{ fill: pull > 0.5 ? "var(--gold)" : "var(--rose)", fillOpacity: 0.2, stroke: pull > 0.5 ? "var(--gold)" : "var(--rose)" }} />
        <text x={450 - 220 * pull} y={42} textAnchor="middle" className="lblMono" style={{ fill: pull > 0.5 ? "var(--gold)" : "var(--rose)" }}>
          {t <= 0 ? "BASE MODEL MODE" : pull > 0.5 ? "ASSISTANT MODE ✓" : "SFT NUDGES…"}
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "A base model spreads mass over any plausible continuation. RUN to watch SFT reshape it." : pull < 1 ? "Tens of thousands of demonstrations pull the mode toward assistant behavior." : "Aligned: the model's most likely response is now the assistant's answer."}
      </p>
    </div>
  );
}

/* ================= 02 SftTargets ================= */
export function SftTargets() {
  const [maskPrompt, setMaskPrompt] = useState(true);
  const promptToks = 384, completionToks = 128;
  const scored = sftLossTokens(promptToks, completionToks, maskPrompt);
  const eff = (scored / (promptToks + completionToks)) * 100;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (maskPrompt ? "btnPrimary" : "btnSecondary")} onClick={() => setMaskPrompt(true)}>MASK PROMPT</button>
        <button className={"btn btnSm " + (!maskPrompt ? "btnPrimary" : "btnSecondary")} onClick={() => setMaskPrompt(false)}>SCORE EVERYTHING</button>
        <span className="configChip">SCORED TOKENS · {scored} / {promptToks + completionToks}</span>
        <span className="configChip">EFFICIENCY · {eff.toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Prompt mask across a sequence" style={{ width: "100%", height: "auto", display: "block" }}>
        {Array.from({ length: 32 }, (_, i) => {
          const isPrompt = i < 24;
          const dead = isPrompt && maskPrompt;
          return (
            <rect key={i} x={30 + i * 26} y={40} width={22} height={40} rx={4}
              style={{
                fill: dead ? "var(--bg3)" : isPrompt ? "var(--rose-dim)" : "var(--teal-dim)",
                stroke: dead ? "rgba(159,182,187,.2)" : isPrompt ? "var(--rose)" : "var(--teal)",
                strokeOpacity: dead ? 0.6 : 1,
              }} />
          );
        })}
        <text x={30} y={26} className="lblMono">{maskPrompt ? "PROMPT MASKED (-100) · LOSS ON COMPLETIONS ONLY" : "EVERY POSITION SCORED · GRADIENTS WASTED ON PROMPT TOKENS"}</text>
        <text x={30} y={104} className="lblMono" style={{ fill: maskPrompt ? "var(--teal)" : "var(--rose)" }}>
          {maskPrompt ? `128 COMPLETION TOKENS CARRY ALL GRADIENTS (${eff.toFixed(0)}% EFFICIENCY)` : `512 TOKENS SCORED, MOST OF THEM INPUTS (${eff.toFixed(0)}% USEFUL)`}
        </text>
      </svg>
      <p className="raceCaption">
        {maskPrompt
          ? "The model conditions on the prompt but learns only from its own completions — labels set to -100 upstream."
          : "Scoring prompt positions teaches the model to write prompts. It also halves effective epochs on behavior."}
      </p>
    </div>
  );
}

/* ================= 03 PeftLora ================= */
export function PeftLora() {
  const [rank, setRank] = useState(16);
  const cfg = { rank, targetFrac: 0.5 };
  const loraM = loraParamsM(7, cfg);
  const ql = qloraMemoryGB(7, cfg);
  const full = fullFtMemoryGB(7);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">RANK r</span>
        <input type="range" className="slider" min={4} max={64} step={4} value={rank} aria-label="LoRA rank" style={{ maxWidth: 180 }} onChange={(e) => setRank(Number(e.target.value))} />
        <span className="configChip">r={rank}</span>
        <span className="configChip">ADAPTERS · {loraM.toFixed(1)}M PARAMS</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="QLoRA vs full fine-tune memory" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">VRAM (GB) · 7B MODEL</text>
        <Bar x={30} y={40} w={840} h={30} frac={full / 120} color="var(--rose)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>FULL FINE-TUNE · {full.toFixed(0)} GB</text>
        <Bar x={30} y={84} w={840} h={30} frac={ql / 120} color="var(--teal)" />
        <text x={40} y={104} className="lblMono" style={{ fill: "#fff" }}>QLoRA (4-BIT BASE + ADAPTERS) · {ql.toFixed(1)} GB</text>
        <text x={30} y={140} className="lblMono" style={{ fill: "var(--gold)" }}>{(full / ql).toFixed(0)}× SMALLER · FITS ON ONE {ql < 24 ? "24GB CONSUMER GPU ✓" : "DATA-CENTER GPU"}</text>
      </svg>
      <p className="raceCaption">
        Frozen NF4 base (~{ (7 * 0.55).toFixed(1) } GB) plus bf16 rank-{rank} adapters. Merged at deploy, inference is identical to the original model.
      </p>
    </div>
  );
}

/* ================= 04 DataFilter ================= */
export function DataFilter() {
  const [threshold, setThreshold] = useState(0.6);
  const examples = [
    { name: "clean-dialog", q: 0.92 }, { name: "code-review", q: 0.87 }, { name: "spam-gibberish", q: 0.12 },
    { name: "near-dup-7", q: 0.44 }, { name: "multi-turn-help", q: 0.81 }, { name: "symbol-noise", q: 0.18 },
    { name: "reasoning-trace", q: 0.9 }, { name: "off-topic-rant", q: 0.3 },
  ];
  const kept = examples.filter((e) => e.q >= threshold);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">QUALITY GATE</span>
        <input type="range" className="slider" min={0.1} max={0.95} step={0.05} value={threshold} aria-label="Quality threshold" style={{ maxWidth: 180 }} onChange={(e) => setThreshold(Number(e.target.value))} />
        <span className="configChip">KEEP ≥ {threshold.toFixed(2)}</span>
        <span className="configChip">{kept.length}/{examples.length} KEPT</span>
      </div>
      <svg viewBox="0 0 900 160" role="img" aria-label="Quality filter over candidate examples" style={{ width: "100%", height: "auto", display: "block" }}>
        {examples.map((e, i) => {
          const x = 30 + (i % 4) * 220, y = 30 + Math.floor(i / 4) * 60;
          const pass = e.q >= threshold;
          return (
            <g key={e.name}>
              <rect x={x} y={y} width={200} height={44} rx={8}
                style={{ fill: pass ? "var(--teal-dim)" : "var(--bg3)", stroke: pass ? "var(--teal)" : "var(--rose)", strokeOpacity: pass ? 1 : 0.6 }} />
              <text x={x + 10} y={y + 19} className="lblMono" style={{ fill: pass ? "var(--teal)" : "var(--rose)", fontSize: 11 }}>{pass ? "✓" : "✗"} {e.name}</text>
              <text x={x + 10} y={y + 35} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>quality {e.q.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        Cheap heuristics + a fast classifier score every candidate; the taxonomy then budgets what gets kept per capability leaf.
      </p>
    </div>
  );
}

/* ================= 05 Clustering ================= */
export function Clustering() {
  const [dedup, setDedup] = useState(false);
  const clusters = [
    { name: "coding", n: 4200 }, { name: "math", n: 3100 }, { name: "chat", n: 9800 },
    { name: "safety", n: 600 }, { name: "creative", n: 1500 }, { name: "tools", n: 400 },
  ];
  const total = clusters.reduce((a, c) => a + c.n, 0);
  const shown = dedup ? clusters.map((c) => ({ ...c, n: Math.round(c.n * 0.55) })) : clusters;
  const maxN = Math.max(...shown.map((c) => c.n));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (!dedup ? "btnPrimary" : "btnSecondary")} onClick={() => setDedup(false)}>RAW CORPUS</button>
        <button className={"btn btnSm " + (dedup ? "btnPrimary" : "btnSecondary")} onClick={() => setDedup(true)}>AFTER MINHASH DEDUP</button>
        <span className="configChip">{total.toLocaleString("en-US")} PROMPTS</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="Cluster sizes before and after dedup" style={{ width: "100%", height: "auto", display: "block" }}>
        {shown.map((c, i) => {
          const y = 20 + i * 25;
          const w = (c.n / maxN) * 620;
          const thin = c.n / total < 0.08;
          return (
            <g key={c.name}>
              <text x={30} y={y + 13} className="lblMono" style={{ fontSize: 11 }}>{c.name}</text>
              <rect x={130} y={y} width={w} height={18} rx={4} style={{ fill: thin ? "var(--rose)" : "var(--teal)", fillOpacity: 0.7 }} />
              <text x={140 + w} y={y + 13} className="lblMono" style={{ fontSize: 10, fill: "var(--ink2)" }}>{c.n.toLocaleString("en-US")}{thin ? " · UNDER-FED" : ""}</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        {dedup ? "Dedup shrinks everything; the dashboard's job is the leaves that were already thin (tools, safety)." : "One cluster at 45% of the corpus is a diversity bug — downsample it, feed the thin leaves."}
      </p>
    </div>
  );
}

/* ================= 06 SyntheticSelf ================= */
export function SyntheticSelf() {
  useTick(storeOf("sdg", 12000));
  const store = storeOf("sdg", 12000);
  const t = store.t;
  const rr = t * 5; // continuous round progress
  const rounds = Math.min(5, Math.floor(rr));
  const frac = rr - rounds; // progress inside the current round
  const stages = ["SEED PROMPTS", "GENERATE", "FILTER", "ADD TO DATA"];
  const stage = Math.min(3, Math.floor(frac * 4));
  const replay = retention(0.1, 0.3);
  const collapse = retention(0.1, 0);
  // bar height at round r: final value once r is complete, animated while in progress
  const hAt = (r: number, base: number, decay: number) => {
    if (r <= rounds) return base * Math.pow(decay, r);
    if (r === rounds + 1) return base * Math.pow(decay, r) * frac; // growing now
    return 0;
  };
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">ROUND · {Math.min(5, rounds)}/5</span>
        <span className="configChip" style={{ color: "var(--teal)" }}>30% REPLAY · {(replay * 100).toFixed(0)}% RETAINED</span>
        <span className="configChip" style={{ color: "var(--rose)" }}>PURE SELF-TRAIN · {(collapse * Math.pow(0.92, Math.min(5, rounds)) * 100).toFixed(0)}% RETAINED</span>
      </div>
      <svg viewBox="0 0 900 260" role="img" aria-label="Synthetic data generation loop and retention" style={{ width: "100%", height: "auto", display: "block" }}>
        {/* generator loop */}
        {stages.map((s, i) => {
          const x = 40 + i * 215;
          const on = t > 0 && stage === i;
          const done = t > 0 && stage > i;
          return (
            <g key={s}>
              <rect x={x} y={16} width={175} height={42} rx={10}
                style={{ fill: on ? "var(--gold)" : "var(--bg3)", fillOpacity: on ? 0.28 : 1, stroke: on ? "var(--gold)" : done ? "var(--teal)" : "rgba(159,182,187,.25)", strokeWidth: on ? 2 : 1 }} />
              <text x={x + 87} y={42} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: on ? "var(--gold)" : done ? "var(--teal)" : "var(--ink2)" }}>{i + 1}. {s}</text>
              {i < 3 && <text x={x + 194} y={42} textAnchor="middle" style={{ fill: "var(--ink3)", fontSize: 15 }}>→</text>}
            </g>
          );
        })}
        {/* items flowing: one dot per stage progressing within the round */}
        {t > 0 && frac < 0.98 && (
          <circle cx={40 + Math.min(3, Math.floor(frac * 4)) * 215 + 87 + ((frac * 4) % 1) * 60 - 30}
            cy={62} r={4} style={{ fill: "var(--gold)", filter: "drop-shadow(0 0 5px currentColor)" }} />
        )}
        {/* retention bars */}
        <line x1={60} y1={210} x2={860} y2={210} stroke="var(--hair2)" />
        {[0, 1, 2, 3, 4, 5].map((r) => {
          const x = 60 + r * 160;
          const hGood = hAt(r, replay, 0.995) * 100;
          const hBad = hAt(r, collapse, 0.92) * 100;
          return (
            <g key={r}>
              <rect x={x - 24} y={210 - hGood} width={18} height={hGood} style={{ fill: "var(--teal)", fillOpacity: 0.8 }} />
              <rect x={x + 6} y={210 - hBad} width={18} height={hBad} style={{ fill: "var(--rose)", fillOpacity: 0.8 }} />
              <text x={x} y={228} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>R{r}</text>
            </g>
          );
        })}
        <text x={60} y={250} className="lblMono" style={{ fill: "var(--teal)" }}>■ REPLAY MIX</text>
        <text x={220} y={250} className="lblMono" style={{ fill: "var(--rose)" }}>■ PURE SYNTHETIC (COLLAPSE)</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "Each round: seed prompts are evolved, answered, filtered, and added back. RUN to watch five rounds." : rounds < 5 ? `Round ${rounds + 1}: ${stages[stage].toLowerCase()} — the pure loop is already losing its distribution tails.` : "Five rounds done: ~93% retained with replay vs ~57% without. The mix is the guard against collapse."}
      </p>
    </div>
  );
}

/* ================= 07 LoraMath ================= */
export function LoraMath() {
  const [rank, setRank] = useState(16);
  const cfg = { rank, targetFrac: 0.5 };
  const loraM = loraParamsM(7, cfg);
  const frac = (loraM / 7000) * 100;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">RANK r</span>
        <input type="range" className="slider" min={2} max={128} step={2} value={rank} aria-label="Rank" style={{ maxWidth: 180 }} onChange={(e) => setRank(Number(e.target.value))} />
        <span className="configChip">ΔW = B·A · r={rank}</span>
        <span className="configChip">{loraM.toFixed(1)}M TRAINABLE ({frac.toFixed(2)}% OF 7B)</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="Weight update factorization" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={40} y={30} width={120} height={100} rx={8} style={{ fill: "var(--bg3)", stroke: "var(--teal)" }} />
        <text x={100} y={85} textAnchor="middle" className="lblMono">W (frozen)</text>
        <text x={190} y={85} className="lblMono" style={{ fill: "var(--gold)", fontSize: 18 }}>+</text>
        <rect x={220} y={30} width={44} height={100} rx={6} style={{ fill: "var(--gold)", fillOpacity: 0.25, stroke: "var(--gold)" }} />
        <text x={242} y={85} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>B</text>
        <text x={280} y={85} className="lblMono" style={{ fill: "var(--gold)", fontSize: 18 }}>·</text>
        <rect x={300} y={68} width={120} height={26} rx={6} style={{ fill: "var(--gold)", fillOpacity: 0.25, stroke: "var(--gold)" }} />
        <text x={360} y={85} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>A</text>
        <text x={460} y={60} className="lblMono" style={{ fill: "var(--gold)" }}>2 · r · d PARAMS PER MATRIX</text>
        <text x={460} y={85} className="lblMono" style={{ fill: "var(--ink2)" }}>d=4096, r={rank}: {2 * rank * 4096 / 1e6 > 1 ? (2 * rank * 4096 / 1e6).toFixed(1) + "M" : ((2 * rank * 4096 / 1e6) * 1000).toFixed(0) + "K"} vs 16.8M FULL</text>
        <text x={460} y={110} className="lblMono" style={{ fill: "var(--teal)" }}>B INIT ZERO → ΔW=0 AT STEP 1</text>
      </svg>
      <p className="raceCaption">
        Fine-tune updates are empirically low-rank. A stays Gaussian, B starts at zero, so the pretrained function is preserved exactly when training begins.
      </p>
    </div>
  );
}

/* ================= 08 QloraMemory ================= */
export function QloraMemory() {
  const [paramsB, setParamsB] = useState(7);
  const cfg = { rank: 16, targetFrac: 0.5 };
  const ql = qloraMemoryGB(paramsB, cfg);
  const full = fullFtMemoryGB(paramsB);
  const fits = ql < 24;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">MODEL SIZE</span>
        <input type="range" className="slider" min={1} max={34} step={1} value={paramsB} aria-label="Model parameters in billions" style={{ maxWidth: 180 }} onChange={(e) => setParamsB(Number(e.target.value))} />
        <span className="configChip">{paramsB}B PARAMS</span>
        <span className="configChip">FULL · {full.toFixed(0)} GB</span>
        <span className="configChip" style={{ color: fits ? "var(--teal)" : "var(--rose)" }}>QLORA · {ql.toFixed(1)} GB {fits ? "· FITS 24GB ✓" : "· NEEDS >24GB"}</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="QLoRA memory ledger" style={{ width: "100%", height: "auto", display: "block" }}>
        <Bar x={30} y={30} w={840} h={26} frac={(paramsB * 0.55) / ql} color="var(--cyan)" />
        <text x={40} y={48} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>NF4 BASE · {(paramsB * 0.55).toFixed(1)} GB</text>
        <Bar x={30} y={66} w={840} h={26} frac={(ql - paramsB * 0.55) / ql} color="var(--gold)" />
        <text x={40} y={84} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>BF16 ADAPTERS + PAGED ADAMW · {(ql - paramsB * 0.55).toFixed(1)} GB</text>
        <text x={30} y={120} className="lblMono">{(full / ql).toFixed(0)}× REDUCTION VS FULL FINE-TUNE ({full.toFixed(0)} GB AT 16 B/PARAM)</text>
      </svg>
      <p className="raceCaption">Everything big is frozen and quantized; everything trainable is tiny. Paged optimizers spill AdamW moments to CPU RAM on activation spikes.</p>
    </div>
  );
}

/* ================= 09 Forgetting ================= */
export function Forgetting() {
  const [replayShare, setReplayShare] = useState(0.25);
  const [rate, setRate] = useState(0.4);
  const ret = retention(rate, replayShare);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">FORGETTING RATE</span>
        <input type="range" className="slider" min={0.1} max={0.8} step={0.05} value={rate} aria-label="Forgetting rate" style={{ maxWidth: 150 }} onChange={(e) => setRate(Number(e.target.value))} />
        <span className="kicker">REPLAY SHARE</span>
        <input type="range" className="slider" min={0} max={0.5} step={0.05} value={replayShare} aria-label="Replay share" style={{ maxWidth: 150 }} onChange={(e) => setReplayShare(Number(e.target.value))} />
        <span className="configChip" style={{ color: ret > 0.8 ? "var(--teal)" : "var(--rose)" }}>GENERAL CAPABILITY RETAINED · {(ret * 100).toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="Retention curve" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">retention = 1 − forgetting × (1 − replay)</text>
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((s) => {
          const x = 60 + s * 1400;
          const h = retention(rate, s) * 80;
          return (
            <g key={s}>
              <rect x={x - 14} y={110 - h} width={28} height={h} style={{ fill: s === replayShare ? "var(--gold)" : "var(--teal)", fillOpacity: s === replayShare ? 0.9 : 0.4 }} />
              <text x={x} y={126} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>{(s * 100).toFixed(0)}%</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        {ret > 0.8 ? "Healthy: the rehearsal buffer keeps general capability within bounds during domain adaptation." : "Degraded: raise replay share or shorten the CPT run — the general suite will catch this in eval."}
      </p>
    </div>
  );
}

/* ================= 10 BradleyTerry ================= */
export function BradleyTerry() {
  const [margin, setMargin] = useState(2);
  const p = bradleyTerry(margin, 0);
  const loss = preferenceLoss(margin, 0);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">REWARD GAP r_w − r_l</span>
        <input type="range" className="slider" min={-4} max={6} step={0.1} value={margin} aria-label="Reward gap" style={{ maxWidth: 200 }} onChange={(e) => setMargin(Number(e.target.value))} />
        <span className="configChip">σ(gap) = {p.toFixed(3)}</span>
        <span className="configChip">LOSS = {loss.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 190" role="img" aria-label="Bradley-Terry sigmoid curve" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={80} y1={160} x2={860} y2={160} stroke="var(--hair2)" />
        <line x1={80} y1={20} x2={80} y2={160} stroke="var(--hair2)" />
        {Array.from({ length: 40 }, (_, i) => {
          const g = -5 + i * 0.3;
          const x = 80 + ((g + 5) / 12) * 780;
          const y = 160 - bradleyTerry(g, 0) * 130;
          const on = Math.abs(g - margin) < 0.15;
          return <circle key={i} cx={x} cy={y} r={on ? 6 : 2.5} style={{ fill: on ? "var(--gold)" : "var(--teal)", fillOpacity: on ? 1 : 0.6 }} />;
        })}
        <circle cx={80 + ((margin + 5) / 12) * 780} cy={160 - p * 130} r={9} style={{ fill: "none", stroke: "var(--gold)", strokeWidth: 2 }} />
        <text x={100} y={40} className="lblMono" style={{ fill: "var(--gold)" }}>P(y_w ≻ y_l) = σ(r_w − r_l)</text>
        <text x={820} y={176} textAnchor="end" className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>gap −5 … +7</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {margin < 0 ? "Negative gap: the model thinks the 'loser' wins — this pair contributes a large loss." : margin < 1 ? "Near zero margin: annotators were inconsistent here, loss is near its ceiling." : "Confident separation. Reward-model training pushes gaps up until held-out pairs are ranked correctly."}
      </p>
    </div>
  );
}

/* ================= 11 RlhfPpo ================= */
export function RlhfPpo() {
  const [logp, setLogp] = useState(-1.2);
  const [kl, setKl] = useState(2);
  const rho = probRatio(logp, 0);
  const adv = 0.8;
  const obj = ppoObjective(rho, adv);
  const pen = klPenalty(kl, 0.05);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">LOG-RATIO</span>
        <input type="range" className="slider" min={-1.5} max={1.5} step={0.05} value={logp} aria-label="Log probability ratio" style={{ maxWidth: 160 }} onChange={(e) => setLogp(Number(e.target.value))} />
        <span className="kicker">KL DRIFT</span>
        <input type="range" className="slider" min={0} max={12} step={0.5} value={kl} aria-label="KL divergence" style={{ maxWidth: 160 }} onChange={(e) => setKl(Number(e.target.value))} />
        <span className="configChip">ρ = {rho.toFixed(2)} {rho > 1.2 || rho < 0.8 ? "(CLIPPED)" : ""}</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="PPO clipped objective and KL penalty" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={30} y={30} width={190} height={54} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--teal)" }} />
        <text x={125} y={62} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>POLICY (TRAIN)</text>
        <rect x={250} y={30} width={190} height={54} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--ink3)" }} />
        <text x={345} y={62} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>REFERENCE (FROZEN)</text>
        <rect x={470} y={30} width={190} height={54} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--gold)" }} />
        <text x={565} y={62} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>REWARD MODEL</text>
        <rect x={690} y={30} width={180} height={54} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--rose)" }} />
        <text x={780} y={62} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>VALUE (TRAIN)</text>
        <text x={30} y={116} className="lblMono" style={{ fill: "var(--teal)" }}>SURROGATE min(ρA, clip(ρ,0.8,1.2)A) = {obj.toFixed(3)}   (A = {adv})</text>
        <text x={30} y={140} className="lblMono" style={{ fill: pen < -0.3 ? "var(--rose)" : "var(--gold)" }}>KL PENALTY −β·KL = {pen.toFixed(3)} — DRIFT RENT {pen < -0.3 ? "DUE (REWARD HACKING RISK)" : "OK"}</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {rho > 1.2 ? "The ratio escaped the trust region — the clip flattens the incentive to move further this batch." : pen < -0.3 ? "Policy is drifting far from the reference; the KL rent starts dominating. Raise β or lower LR." : "Healthy PPO step: ratio inside the trust region, drift rent affordable."}
      </p>
    </div>
  );
}

/* ================= 12 DpoFamily ================= */
export function DpoFamily() {
  const [zW, setZW] = useState(2);
  const [zL, setZL] = useState(-3);
  const [beta, setBeta] = useState(0.1);
  const loss = dpoLoss(zW, 0, zL, 0, beta);
  const margin = beta * (zW - zL);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">CHOSEN LOG-RATIO</span>
        <input type="range" className="slider" min={-4} max={6} step={0.1} value={zW} aria-label="Chosen log ratio" style={{ maxWidth: 150 }} onChange={(e) => setZW(Number(e.target.value))} />
        <span className="kicker">REJECTED</span>
        <input type="range" className="slider" min={-6} max={4} step={0.1} value={zL} aria-label="Rejected log ratio" style={{ maxWidth: 150 }} onChange={(e) => setZL(Number(e.target.value))} />
        <span className="kicker">β</span>
        <input type="range" className="slider" min={0.05} max={0.5} step={0.05} value={beta} aria-label="Beta" style={{ maxWidth: 120 }} onChange={(e) => setBeta(Number(e.target.value))} />
        <span className="configChip">L = {loss.toFixed(3)} · IMPLICIT MARGIN {margin.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="DPO implicit reward separation" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={450} y1={20} x2={450} y2={110} stroke="var(--hair2)" />
        <circle cx={450 + zW * 45} cy={50} r={12} style={{ fill: "var(--teal)", fillOpacity: 0.8 }} />
        <circle cx={450 + zL * 45} cy={50} r={12} style={{ fill: "var(--rose)", fillOpacity: 0.8 }} />
        <text x={450 + zW * 45} y={30} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: "var(--teal)" }}>y_w</text>
        <text x={450 + zL * 45} y={30} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: "var(--rose)" }}>y_l</text>
        <text x={30} y={116} className="lblMono" style={{ fill: zW < 0 ? "var(--rose)" : "var(--teal)" }}>
          {zW < 0 ? "WATCH: CHOSEN LOG-PROB SINKING — BOTH SIDES CAN FALL WHILE THE MARGIN GROWS" : "Loss pushes the chosen response's implicit reward up, the rejected one down."}
        </text>
      </svg>
      <p className="raceCaption">No reward model: the policy's log-ratio vs the reference IS the reward. IPO adds a margin target; KTO uses win/loss labels; SimPO drops the reference and length-normalizes.</p>
    </div>
  );
}

/* ================= 13 RlvrMath ================= */
export function RlvrMath() {
  const samples = [
    { id: 1, correct: true, formatOk: true }, { id: 2, correct: false, formatOk: true },
    { id: 3, correct: false, formatOk: false }, { id: 4, correct: true, formatOk: true },
    { id: 5, correct: true, formatOk: true }, { id: 6, correct: false, formatOk: true },
  ];
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">VERIFIER VERDICTS · GROUP OF {samples.length}</span>
        <span className="configChip">R = 1·[correct] + 0.1·[format only]</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="Verifier rewards per sample" style={{ width: "100%", height: "auto", display: "block" }}>
        {samples.map((s, i) => {
          const r = verifyReward(s.correct, s.formatOk);
          const x = 60 + i * 130;
          return (
            <g key={s.id}>
              <rect x={x} y={40} width={90} height={50} rx={8}
                style={{ fill: r === 1 ? "var(--teal-dim)" : r > 0 ? "var(--gold-dim, rgba(230,180,80,.15))" : "var(--bg3)", stroke: r === 1 ? "var(--teal)" : r > 0 ? "var(--gold)" : "var(--rose)" }} />
              <text x={x + 45} y={70} textAnchor="middle" className="lblMono" style={{ fill: r === 1 ? "var(--teal)" : r > 0 ? "var(--gold)" : "var(--rose)" }}>R={r.toFixed(1)}</text>
              <text x={x + 45} y={112} textAnchor="middle" className="lblMono" style={{ fontSize: 9, fill: "var(--ink3)" }}>{s.correct ? "✓ ANSWER" : s.formatOk ? "FORMAT ONLY" : "✗ WRONG"}</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        Rewards are computed, not learned: an exact-match checker, a compiler, a unit-test run. Fluent prose earns nothing — the oracle cannot be charmed.
      </p>
    </div>
  );
}

/* ================= 14 GrpoElim ================= */
export function GrpoElim() {
  const rewards = [1, 0, 1, 1, 0, 0.1, 1, 0];
  const [idx, setIdx] = useState(0);
  const adv = groupAdvantage(rewards, idx);
  const saved = grpoSavedMemoryGB(7);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">SAMPLE i</span>
        <input type="range" className="slider" min={0} max={7} step={1} value={idx} aria-label="Sample index" style={{ maxWidth: 160 }} onChange={(e) => setIdx(Number(e.target.value))} />
        <span className="configChip">r = {rewards[idx].toFixed(1)}</span>
        <span className="configChip" style={{ color: adv > 0 ? "var(--teal)" : "var(--rose)" }}>A = {adv.toFixed(2)} {adv > 0 ? "↑ REINFORCE" : "↓ SUPPRESS"}</span>
        <span className="configChip">CRITIC DELETED · SAVES ~{saved.toFixed(0)} GB</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Group rewards and advantage" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={100} x2={860} y2={100} stroke="var(--hair2)" />
        <text x={60} y={20} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>GROUP REWARDS (μ = {(rewards.reduce((a, b) => a + b, 0) / rewards.length).toFixed(2)})</text>
        {rewards.map((r, i) => {
          const x = 80 + i * 95;
          const h = r * 70;
          const a = groupAdvantage(rewards, i);
          return (
            <g key={i}>
              <rect x={x} y={100 - h} width={40} height={h} style={{ fill: a > 0 ? "var(--teal)" : "var(--rose)", fillOpacity: i === idx ? 0.95 : 0.45 }} />
              <text x={x + 20} y={118} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>{r.toFixed(1)}</text>
              <text x={x + 20} y={134} textAnchor="middle" className="lblMono" style={{ fontSize: 9, fill: a > 0 ? "var(--teal)" : "var(--rose)" }}>{a > 0 ? "+" : ""}{a.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        Advantage is a z-score inside the sampled group: the group mean replaces the learned value function. Compute moves from a critic model to extra rollouts.
      </p>
    </div>
  );
}

/* ================= 15 CotGains ================= */
export function CotGains() {
  const [k, setK] = useState(1);
  const acc = testTimeAccuracy(k, 0.4);
  const p8 = passAtK(20, 8, Math.min(8, k));
  const toks = cotTokens(60, 3);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">SAMPLES k</span>
        <input type="range" className="slider" min={1} max={32} step={1} value={k} aria-label="Number of samples" style={{ maxWidth: 180 }} onChange={(e) => setK(Number(e.target.value))} />
        <span className="configChip">SELF-CONSISTENCY · {(acc * 100).toFixed(0)}%</span>
        <span className="configChip">pass@{Math.min(8, k)} · {(p8 * 100).toFixed(0)}%</span>
        <span className="configChip">CoT COST · ~{toks.toLocaleString("en-US")} TOKENS</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="Test-time compute scaling curve" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={140} x2={860} y2={140} stroke="var(--hair2)" />
        <line x1={60} y1={20} x2={60} y2={140} stroke="var(--hair2)" />
        {Array.from({ length: 32 }, (_, i) => {
          const kk = i + 1;
          const x = 60 + ((kk - 1) / 31) * 780;
          const y = 140 - testTimeAccuracy(kk, 0.4) * 110;
          return <circle key={kk} cx={x} cy={y} r={kk === k ? 7 : 2.5} style={{ fill: kk === k ? "var(--gold)" : "var(--cyan)" }} />;
        })}
        <text x={90} y={40} className="lblMono" style={{ fill: "var(--gold)" }}>ACCURACY vs TEST-TIME COMPUTE (SINGLE-SHOT 40%)</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {k === 1 ? "One chain of thought: the baseline. RUN the slider right to buy accuracy with votes." : `Majority voting over ${k} chains cancels independent errors — with diminishing returns and real latency cost (~${toks.toLocaleString("en-US")} tokens/answer).`}
      </p>
    </div>
  );
}

/* ================= 16 Redteam ================= */
export function Redteam() {
  useTick(storeOf("rt", 10000));
  const store = storeOf("rt", 10000);
  const rounds = Math.min(6, Math.floor(store.t * 6.2));
  const rate = jailbreakRate(rounds);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">RED-TEAM ROUND · {rounds}</span>
        <span className="configChip" style={{ color: rate > 0.3 ? "var(--rose)" : "var(--teal)" }}>JAILBREAK SUCCESS · {(rate * 100).toFixed(1)}%</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="Jailbreak decay across red-team rounds" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={140} x2={860} y2={140} stroke="var(--hair2)" />
        {Array.from({ length: 7 }, (_, r) => {
          const x = 90 + r * 120;
          const h = jailbreakRate(r) * 120;
          return (
            <g key={r}>
              <rect x={x - 30} y={140 - h} width={60} height={h} style={{ fill: r <= rounds ? (h / 120 > 0.3 ? "var(--rose)" : "var(--teal)") : "var(--bg3)", fillOpacity: r <= rounds ? 0.75 : 1 }} />
              <text x={x} y={156} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>R{r}</text>
              <text x={x} y={134 - h} textAnchor="middle" className="lblMono" style={{ fontSize: 9, fill: "var(--ink2)" }}>{(jailbreakRate(r) * 100).toFixed(0)}%</text>
            </g>
          );
        })}
        <text x={90} y={24} className="lblMono" style={{ fill: "var(--gold)" }}>0.8 × 0.55^R · EVERY CONFIRMED JAILBREAK BECOMES TRAINING DATA</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {store.t <= 0 ? "Attack → label → train → re-attack. RUN to watch success decay per round." : rounds < 6 ? `Round ${rounds}: fresh attack models keep probing; each round compounds the defense.` : "Six rounds in: 80% initial success is down to ~3%. The loop, not the audit, is the mechanism."}
      </p>
    </div>
  );
}

/* ================= 17 RefusalTrain ================= */
export function RefusalTrain() {
  const [w, setW] = useState(0.5);
  useTick(storeOf("ref", 14000));
  const store = storeOf("ref", 14000);
  const t = store.t;
  const pt = refusalFrontier(0.8, w);
  // deterministic probe stream: hash decides whether a benign or harmful probe arrives
  const probes = Array.from({ length: 14 }, (_, i) => {
    const h = (i * 2654435761) >>> 0;
    return { i, benign: h % 2 === 0, bias: ((h >>> 8) % 100) / 100 };
  });
  const hAt = (i: number) => probes[i].bias < t * (probes[i].i + 2) / 16;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="kicker">REFUSAL WEIGHT</span>
        <input type="range" className="slider" min={0.1} max={1.2} step={0.05} value={w} aria-label="Refusal weight" style={{ maxWidth: 170 }} onChange={(e) => setW(Number(e.target.value))} />
        <span className="configChip">REFUSALS · {(pt.refusals * 100).toFixed(0)}%</span>
        <span className="configChip" style={{ color: pt.helpful > 0.9 ? "var(--teal)" : "var(--rose)" }}>HELPFULNESS · {(pt.helpful * 100).toFixed(1)}%</span>
      </div>
      <svg viewBox="0 0 900 250" role="img" aria-label="Refusal calibration probe stream and frontier" style={{ width: "100%", height: "auto", display: "block" }}>
        {/* probe stream */}
        <text x={30} y={18} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>PROBE STREAM · HARMFUL (RED) vs BENIGN LOOK-ALIKE (CYAN)</text>
        {probes.map((p, i) => {
          const arrived = hAt(i);
          const refused = arrived && (p.benign ? pt.refusals > p.bias : pt.refusals * 1.6 > p.bias);
          const x = 30 + i * 61;
          return (
            <g key={i}>
              <rect x={x} y={28} width={46} height={30} rx={6}
                style={{
                  fill: !arrived ? "var(--bg3)" : refused ? "var(--rose-dim)" : "var(--bg3)",
                  stroke: !arrived ? "rgba(159,182,187,.2)" : refused ? "var(--rose)" : p.benign ? "var(--cyan)" : "var(--rose)",
                  strokeOpacity: arrived ? 1 : 0.4,
                }} />
              <text x={x + 23} y={47} textAnchor="middle" className="lblMono" style={{ fontSize: 9, fill: !arrived ? "var(--ink3)" : refused ? "var(--rose)" : p.benign ? "var(--cyan)" : "var(--ink2)" }}>
                {!arrived ? "···" : refused ? "REFUSE" : "SERVE"}
              </text>
            </g>
          );
        })}
        {/* frontier curve */}
        <text x={80} y={118} className="lblMono" style={{ fontSize: 10, fill: "var(--gold)" }}>FRONTIER: helpfulness = 1 − 0.35 · refusals²</text>
        <line x1={80} y1={210} x2={860} y2={210} stroke="var(--hair2)" />
        {Array.from({ length: 30 }, (_, i) => {
          const ww = 0.1 + i * 0.04;
          const p = refusalFrontier(0.8, ww);
          const x = 80 + p.refusals * 700;
          const y = 210 - p.helpful * 70;
          const on = Math.abs(ww - w) < 0.02;
          return <circle key={i} cx={x} cy={y} r={on ? 7 : 2.5} style={{ fill: on ? "var(--gold)" : "var(--cyan)", fillOpacity: on ? 1 : 0.55 }} />;
        })}
        {/* status line, placed below the curve, clear of all points */}
        <text x={80} y={240} className="lblMono" style={{ fontSize: 11, fill: pt.helpful < 0.9 ? "var(--rose)" : "var(--teal)" }}>
          {pt.helpful < 0.9 ? "OVER-REFUSAL TRAP: benign look-alikes are being refused too" : "CALIBRATED: harmful prompts refused, benign ones served"}
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "RUN to send a stream of harmful and benign near-boundary probes at the current calibration."
          : pt.helpful < 0.9
            ? "Refusals are landing on benign look-alikes — false refusals compound across a conversation. Lower the refusal weight."
            : "Harmful probes refused, benign ones served. Near-boundary pairs teach the decision variable, not the surface pattern."}
      </p>
    </div>
  );
}

/* ================= 18 RlaifConstit ================= */
export function RlaifConstit() {
  useTick(storeOf("cai", 10000));
  const store = storeOf("cai", 10000);
  const pass = Math.min(5, Math.floor(store.t * 5.2));
  const viol = 0.42 * Math.pow(0.6, pass);
  const agree = judgeAgreement(1000);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">REVISION PASS · {pass}</span>
        <span className="configChip" style={{ color: viol < 0.1 ? "var(--teal)" : "var(--rose)" }}>VIOLATIONS · {(viol * 100).toFixed(1)}%</span>
        <span className="configChip">JUDGE↔HUMAN · {(agree * 100).toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Constitutional revision loop" style={{ width: "100%", height: "auto", display: "block" }}>
        {["DRAFT", "CRITIQUE", "REVISE", "PREFER"].map((s, i) => {
          const x = 40 + i * 220;
          const on = pass > 0 && (i === (pass - 1) % 4);
          return (
            <g key={s}>
              <rect x={x} y={30} width={180} height={50} rx={10}
                style={{ fill: on ? "var(--gold)" : "var(--bg3)", fillOpacity: on ? 0.25 : 1, stroke: on ? "var(--gold)" : "rgba(159,182,187,.25)", strokeWidth: on ? 2 : 1 }} />
              <text x={x + 90} y={60} textAnchor="middle" className="lblMono" style={{ fontSize: 11, fill: on ? "var(--gold)" : "var(--ink2)" }}>{i + 1}. {s}</text>
              {i < 3 && <text x={x + 200} y={60} textAnchor="middle" style={{ fill: "var(--ink3)", fontSize: 16 }}>→</text>}
            </g>
          );
        })}
        <line x1={60} y1={130} x2={860} y2={130} stroke="var(--hair2)" />
        {Array.from({ length: 6 }, (_, p) => {
          const x = 80 + p * 150;
          const h = 0.42 * Math.pow(0.6, p) * 110;
          return (
            <g key={p}>
              <rect x={x - 20} y={130 - h} width={40} height={h} style={{ fill: "var(--teal)", fillOpacity: p <= pass ? 0.8 : 0.2 }} />
              <text x={x} y={126 - h} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>{(0.42 * Math.pow(0.6, p) * 100).toFixed(0)}%</text>
            </g>
          );
        })}
      </svg>
      <p className="raceCaption" aria-live="polite">
        {store.t <= 0 ? "The model critiques its own draft against a written constitution, revises, and the pair becomes preference data." : `Pass ${pass}: violations halve each pass (0.42 × 0.6^p) while judge agreement with humans grows only logarithmically — humans stay in the loop.`}
      </p>
    </div>
  );
}

/* ================= 19 BenchmarkContam ================= */
export function BenchmarkContam() {
  useTick(storeOf("contam", 12000));
  const store = storeOf("contam", 12000);
  const t = store.t;
  const seen = 71.2, unseen = 63.0;
  const uplift = contaminationUplift(seen / 100, unseen / 100) * 100;
  const hw = ciHalfWidth(500, 0.67) * 100;
  const sweep = Math.min(1, t * 1.25); // dedup scanner progress
  // deterministic item grid: contamination flag from hash; matches seen/unseen proportions
  const items = Array.from({ length: 48 }, (_, i) => {
    const h = (i * 40503) >>> 0;
    const isSeen = i < 24;
    const flagged = isSeen ? ((h % 100) / 100) < 0.55 : ((h % 100) / 100) < 0.08;
    return { i, isSeen, flagged };
  });
  const revealed = (i: number) => (i / 48) < sweep;
  const found = items.filter((it) => it.flagged && revealed(it.i)).length;
  // animated bars: fill toward final value as the sweep completes
  const fill = (v: number) => (v / 100) * Math.min(1, 0.25 + sweep * 0.75);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">SCANNED · {(sweep * 100).toFixed(0)}%</span>
        <span className="configChip" style={{ color: "var(--rose)" }}>LEAKED ITEMS · {found}</span>
        <span className="configChip" style={{ color: uplift - hw > 2 ? "var(--rose)" : "var(--teal)" }}>UPLIFT · +{uplift.toFixed(1)} ± {hw.toFixed(1)} PTS</span>
      </div>
      <svg viewBox="0 0 900 300" role="img" aria-label="Contamination scan over eval items" style={{ width: "100%", height: "auto", display: "block" }}>
        {/* item grid: top row seen, bottom row unseen */}
        <text x={30} y={16} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>DEDUP SCANNER · ITEMS SEEN IN TRAINING (TOP) vs UNSEEN MATCHES (BOTTOM)</text>
        {items.map((it) => {
          const col = it.i % 24, row = Math.floor(it.i / 24);
          const x = 30 + col * 36, y = 26 + row * 46;
          const vis = revealed(it.i);
          return (
            <rect key={it.i} x={x} y={y} width={28} height={28} rx={5}
              style={{
                fill: !vis ? "var(--bg3)" : it.flagged ? "var(--rose-dim)" : it.isSeen ? "var(--bg3)" : "var(--teal-dim)",
                fillOpacity: vis ? 1 : 0.4,
                stroke: !vis ? "rgba(159,182,187,.18)" : it.flagged ? "var(--rose)" : it.isSeen ? "rgba(159,182,187,.3)" : "var(--teal)",
                strokeOpacity: vis ? (it.flagged ? 1 : 0.5) : 0.4,
              }} />
          );
        })}
        {/* scanner sweep line */}
        {t > 0 && sweep < 1 && (
          <line x1={30 + sweep * (24 * 36 - 8)} y1={22} x2={30 + sweep * (24 * 36 - 8)} y2={110}
            stroke="var(--gold)" strokeWidth={2} style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
        )}
        {/* animated seen/unseen bars */}
        <Bar x={30} y={140} w={840} h={26} frac={fill(seen)} color="var(--rose)" />
        <text x={40} y={158} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>BENCHMARK ITEMS SEEN IN TRAINING · {seen}%</text>
        <Bar x={30} y={176} w={840} h={26} frac={fill(unseen)} color="var(--teal)" />
        <text x={40} y={194} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>STRUCTURALLY IDENTICAL UNSEEN ITEMS · {unseen}%</text>
        {/* uplift marker between the two bars */}
        <line x1={30 + fill(unseen) * 840} y1={176} x2={30 + fill(seen) * 840} y2={166}
          stroke="var(--gold)" strokeDasharray="4 3" />
        <text x={30} y={236} className="lblMono" style={{ fill: "var(--gold)" }}>UPLIFT GAP: +{uplift.toFixed(1)} PTS · 95% CI ±{hw.toFixed(1)} PTS</text>
        <text x={30} y={266} className="lblMono" style={{ fontSize: 11, fill: uplift - hw > 2 ? "var(--rose)" : "var(--teal)" }}>
          {uplift - hw > 2 ? "GAP EXCEEDS THE CI — CONTAMINATION EVIDENCE" : "GAP WITHIN NOISE — PARITY PLAUSIBLE"}
        </text>
        <text x={30} y={290} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>GUARDRAIL: DEDUP EVAL ITEMS FROM TRAINING CORPORA BEFORE THE RUN — AND REPORT BOTH SPLITS</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "RUN to sweep the dedup scanner across the eval bank and compare seen vs unseen accuracy."
          : sweep < 1
            ? `Scanning… ${found} leaked items flagged so far. The seen bar keeps climbing above its unseen twin.`
            : `${found} leaked items confirmed: an ${uplift.toFixed(1)}-point uplift, far outside the ±${hw.toFixed(1)} CI. This score measures memorization, not capability.`}
      </p>
    </div>
  );
}

/* ================= 20 LlmJudgeBias ================= */
export function LlmJudgeBias() {
  const [posBias, setPosBias] = useState(0.2);
  const corrected = 0.5 + posBias * 0.5;
  const wr = corrected;
  const elo = eloDelta(wr);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">POSITIONAL BIAS</span>
        <input type="range" className="slider" min={0} max={0.45} step={0.05} value={posBias} aria-label="Positional bias" style={{ maxWidth: 180 }} onChange={(e) => setPosBias(Number(e.target.value))} />
        <span className="configChip" style={{ color: posBias > 0.15 ? "var(--rose)" : "var(--teal)" }}>BIAS = {posBias.toFixed(2)} {posBias > 0.15 ? "· SWAP-AUGMENT!" : "· OK"}</span>
        <span className="configChip">WIN 64% → ΔELO {eloDelta(0.64).toFixed(0)}</span>
      </div>
      <svg viewBox="0 0 900 160" role="img" aria-label="Judge bias audit" style={{ width: "100%", height: "auto", display: "block" }}>
        {[
          { name: "position", val: posBias, max: 0.45 },
          { name: "length", val: 0.12, max: 0.45 },
          { name: "self-pref", val: 0.22, max: 0.45 },
        ].map((b, i) => {
          const y = 30 + i * 40;
          return (
            <g key={b.name}>
              <text x={30} y={y + 16} className="lblMono" style={{ fontSize: 11 }}>{b.name}</text>
              <Bar x={140} y={y} w={600} h={24} frac={b.val / b.max} color={b.val > 0.15 ? "var(--rose)" : "var(--teal)"} />
              <text x={750} y={y + 16} className="lblMono" style={{ fontSize: 10 }}>{b.val.toFixed(2)}</text>
            </g>
          );
        })}
        <text x={30} y={150} className="lblMono" style={{ fill: "var(--gold)" }}>MITIGATION: SWAP AND RE-JUDGE · LENGTH-CONTROLLED WIN RATES · CROSS-FAMILY JUDGES</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {posBias > 0.15 ? "This judge prefers the first answer it reads — close comparisons flip with answer order. Run every pair twice, swapped." : "Bias within tolerance. Still: report length-controlled, swap-corrected win rates, and never a same-family judge."}
      </p>
    </div>
  );
}

/* ================= 21 EvalUncertainty ================= */
export function EvalUncertainty() {
  const [n, setN] = useState(500);
  const [acc, setAcc] = useState(0.7);
  const hw = ciHalfWidth(n, acc) * 100;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">ITEMS n</span>
        <input type="range" className="slider" min={100} max={5000} step={100} value={n} aria-label="Number of items" style={{ maxWidth: 160 }} onChange={(e) => setN(Number(e.target.value))} />
        <span className="kicker">ACC</span>
        <input type="range" className="slider" min={0.5} max={0.95} step={0.01} value={acc} aria-label="Accuracy" style={{ maxWidth: 160 }} onChange={(e) => setAcc(Number(e.target.value))} />
        <span className="configChip">{(acc * 100).toFixed(1)}% ± {hw.toFixed(1)} (95% CI)</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="Confidence interval" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={70} x2={860} y2={70} stroke="var(--hair2)" />
        {[
          { name: "Model A", v: 71.2, hw2: 1.5, c: "var(--teal)" },
          { name: "Model B", v: 69.8, hw2: hw, c: "var(--rose)" },
        ].map((m, i) => {
          const cx = 450 + (m.v - 70) * 60;
          return (
            <g key={m.name}>
              <line x1={cx - m.hw2 * 60} x2={cx + m.hw2 * 60} y1={40 + i * 40} y2={40 + i * 40} stroke={m.c} strokeWidth={3} />
              <circle cx={cx} cy={40 + i * 40} r={6} style={{ fill: m.c }} />
              <text x={820} y={44 + i * 40} className="lblMono" style={{ fontSize: 10, fill: m.c }}>{m.name} {m.v}% ± {m.hw2.toFixed(1)}</text>
            </g>
          );
        })}
        <text x={60} y={128} className="lblMono" style={{ fill: "var(--gold)" }}>1.96 · √(p(1−p)/n) — AT n={n}: ±{hw.toFixed(1)} PTS. A 1.4-PT GAP INSIDE OVERLAPPING CIs IS NOT EVIDENCE.</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {hw > 3 ? `At ${n} items the interval is ±${hw.toFixed(1)} points — most adjacent-leaderboard gaps are noise. Claim improvement only when intervals separate.` : `n=${n} tightens the interval to ±${hw.toFixed(1)} points — now a 1.4-point gap can mean something.`}
      </p>
    </div>
  );
}

/* ================= 22 MmAgentic ================= */
export function MmAgentic() {
  const [syntax, setSyntax] = useState(0.95);
  const [args, setArgs] = useState(0.9);
  const succ = toolCallSuccess(syntax, args);
  const share = mmTokenShare(0.25, 576, 400);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">SYNTAX</span>
        <input type="range" className="slider" min={0.5} max={1} step={0.01} value={syntax} aria-label="Syntax accuracy" style={{ maxWidth: 140 }} onChange={(e) => setSyntax(Number(e.target.value))} />
        <span className="kicker">ARGS</span>
        <input type="range" className="slider" min={0.5} max={1} step={0.01} value={args} aria-label="Argument fidelity" style={{ maxWidth: 140 }} onChange={(e) => setArgs(Number(e.target.value))} />
        <span className="configChip">TOOL SUCCESS · {(succ * 100).toFixed(1)}%</span>
        <span className="configChip">IMAGE TOKEN SHARE · {(share * 100).toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Tool call success decomposition" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={40} y={30} width={200} height={50} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--cyan)" }} />
        <text x={140} y={60} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>SYNTAX {(syntax * 100).toFixed(0)}%</text>
        <text x={255} y={60} textAnchor="middle" style={{ fill: "var(--ink3)", fontSize: 16 }}>×</text>
        <rect x={270} y={30} width={200} height={50} rx={10} style={{ fill: "var(--bg3)", stroke: "var(--cyan)" }} />
        <text x={370} y={60} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>ARGS {(args * 100).toFixed(0)}%</text>
        <text x={485} y={60} textAnchor="middle" style={{ fill: "var(--ink3)", fontSize: 16 }}>→</text>
        <rect x={505} y={30} width={200} height={50} rx={10} style={{ fill: succ > 0.85 ? "var(--teal-dim)" : "var(--bg3)", stroke: succ > 0.85 ? "var(--teal)" : "var(--rose)" }} />
        <text x={605} y={60} textAnchor="middle" className="lblMono" style={{ fontSize: 11, fill: succ > 0.85 ? "var(--teal)" : "var(--rose)" }}>EXEC {(succ * 100).toFixed(1)}%</text>
        <text x={40} y={120} className="lblMono" style={{ fill: "var(--gold)" }}>+30% RETRY RECOVERY · CREDIT BLUR OVER 30 STEPS = {(1 / Math.sqrt(30)).toFixed(2)}</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        Agent success decomposes into syntax × argument fidelity, plus retry recovery. Long trajectories blur outcome credit to ~1/√steps — hence process rewards.
      </p>
    </div>
  );
}

/* ================= 23 QuantGptq ================= */
export function QuantGptq() {
  const [bits, setBits] = useState(4);
  const [group, setGroup] = useState(128);
  const ret = quantRetained(bits, group);
  const mem = serveMemoryGB(70, bits);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">BITS</span>
        <input type="range" className="slider" min={2} max={8} step={1} value={bits} aria-label="Bit width" style={{ maxWidth: 140 }} onChange={(e) => setBits(Number(e.target.value))} />
        <span className="kicker">GROUP</span>
        <input type="range" className="slider" min={32} max={256} step={32} value={group} aria-label="Group size" style={{ maxWidth: 140 }} onChange={(e) => setGroup(Number(e.target.value))} />
        <span className="configChip" style={{ color: ret > 0.95 ? "var(--teal)" : "var(--rose)" }}>QUALITY RETAINED · {(ret * 100).toFixed(1)}%</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="Quantization memory and quality" style={{ width: "100%", height: "auto", display: "block" }}>
        <Bar x={30} y={30} w={840} h={26} frac={serveMemoryGB(70, 16) / 160} color="var(--rose)" />
        <text x={40} y={48} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>BF16 · {serveMemoryGB(70, 16).toFixed(0)} GB</text>
        <Bar x={30} y={70} w={840} h={26} frac={mem / 160} color="var(--teal)" />
        <text x={40} y={88} className="lblMono" style={{ fill: "#fff", fontSize: 11 }}>{bits}-BIT · {mem.toFixed(0)} GB (70B MODEL)</text>
        <text x={30} y={124} className="lblMono" style={{ fill: ret > 0.95 ? "var(--teal)" : "var(--rose)" }}>
          err ≈ 2^−{bits} · √(1/{group}) → {(ret * 100).toFixed(1)}% RETAINED {ret > 0.95 ? "✓" : "· RE-EVAL ON YOUR TASK SUITE"}
        </text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {bits <= 2 ? "2-bit needs tiny groups and still costs points — reasoning-heavy evals drop 1-3 points at 4-bit already; check every time." : "GPTQ compensates rounding error through the inverse Hessian; AWQ scales salient channels. Quantize the final aligned model, then re-eval."}
      </p>
    </div>
  );
}

/* ================= 24 InferOpt ================= */
export function InferOpt() {
  useTick(storeOf("infer", 12000));
  const store = storeOf("infer", 12000);
  const t = store.t;
  const teacher = [0.62, 0.21, 0.09, 0.05, 0.03];
  const temp = softTargets(2);
  const kl = distillKlLoss(teacher, teacher.map((p) => p * (1 - 0.15 * (1 - t)) + 0.15 * (1 - t) / teacher.length));
  const calib = calibKL(Math.max(20, Math.round(20 + t * 180))); // calibration set grows over the run
  const klCalib = calibKL(200);
  const stages = ["DISTILL", "QUANTIZE 4-BIT", "CALIBRATE FP8", "EVAL EXPORT"];
  const stageDone = Math.floor(t * 4.5); // how many pipeline stages are complete
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">DISTILL KL · {kl.toFixed(4)}</span>
        <span className="configChip">T² · SOFTENING {(temp * 100).toFixed(0)}%</span>
        <span className="configChip" style={{ color: calib <= klCalib * 1.1 ? "var(--teal)" : "var(--rose)" }}>FP8 CALIB KL · {calib.toFixed(3)} ({Math.round(20 + t * 180)} SAMPLES)</span>
      </div>
      <svg viewBox="0 0 900 300" role="img" aria-label="Distillation convergence and deployment pipeline" style={{ width: "100%", height: "auto", display: "block" }}>
        {/* student bars converge on teacher as KL shrinks */}
        <text x={60} y={18} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>NEXT-TOKEN DISTRIBUTION · STUDENT CHASING THE TEACHER</text>
        {teacher.map((p, i) => {
          const x = 60 + i * 150;
          const th = p * 110;
          const noisy = p * (1 - 0.15 * (1 - t)) + (0.15 * (1 - t)) / teacher.length;
          const sh = noisy * 110;
          return (
            <g key={i}>
              <rect x={x} y={140 - th} width={50} height={th} style={{ fill: "var(--gold)", fillOpacity: 0.7 }} />
              <rect x={x + 55} y={140 - sh} width={50} height={sh} style={{ fill: "var(--cyan)", fillOpacity: 0.7, stroke: t > 0.9 ? "var(--cyan)" : "none" }} />
              <text x={x + 52} y={156} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>tok {i + 1}</text>
            </g>
          );
        })}
        <text x={60} y={34} className="lblMono" style={{ fill: "var(--gold)" }}>■ TEACHER</text>
        <text x={170} y={34} className="lblMono" style={{ fill: "var(--cyan)" }}>■ STUDENT (CONVERGING)</text>
        {/* deployment pipeline */}
        <line x1={60} y1={190} x2={860} y2={190} stroke="var(--hair2)" />
        <text x={60} y={182} className="lblMono" style={{ fontSize: 10, fill: "var(--ink3)" }}>DEPLOYMENT PIPELINE</text>
        {stages.map((s, i) => {
          const x = 50 + i * 210;
          const done = stageDone > i;
          const active = t > 0 && stageDone === i && t < 1;
          return (
            <g key={s}>
              <rect x={x} y={205} width={180} height={44} rx={10}
                style={{
                  fill: active ? "var(--gold)" : done ? "var(--teal)" : "var(--bg3)",
                  fillOpacity: active ? 0.25 : done ? 0.18 : 1,
                  stroke: active ? "var(--gold)" : done ? "var(--teal)" : "rgba(159,182,187,.25)",
                  strokeWidth: active ? 2 : 1,
                }} />
              <text x={x + 90} y={232} textAnchor="middle" className="lblMono" style={{ fontSize: 10, fill: active ? "var(--gold)" : done ? "var(--teal)" : "var(--ink2)" }}>
                {done ? "✓ " : ""}{s}
              </text>
              {i < 3 && <text x={x + 195} y={232} textAnchor="middle" style={{ fill: done ? "var(--teal)" : "var(--ink3)", fontSize: 15 }}>→</text>}
            </g>
          );
        })}
        {/* KL trace */}
        <polyline
          points={Array.from({ length: 21 }, (_, i) => {
            const tt = i / 20;
            const k = distillKlLoss(teacher, teacher.map((p) => p * (1 - 0.15 * (1 - tt)) + (0.15 * (1 - tt)) / teacher.length));
            return `${60 + tt * 800},${296 - k * 2500}`;
          }).join(" ")}
          fill="none" stroke="var(--cyan)" strokeWidth={2} strokeOpacity={0.9} />
        {t > 0 && <circle cx={60 + t * 800} cy={296 - kl * 2500} r={5} style={{ fill: "var(--gold)", filter: "drop-shadow(0 0 5px currentColor)" }} />}
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0
          ? "RUN: the student chases the teacher's softened distribution, then the artifact walks the deployment pipeline."
          : t < 1
            ? `Stage: ${stages[Math.min(3, stageDone)]} — KL falling, ${Math.round(20 + t * 180)} calibration samples fixing FP8 ranges.`
            : "Converged and exported. Final gate passed: the eval suite ran on the quantized artifact — score what you ship."}
      </p>
    </div>
  );
}
