"use client";
import React, { useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  accuracy, adverseRegressionRate, bleuScore, brevityPenalty, canaryHits,
  contaminationUplift, coverageConcentration, difficultyIndex, itemDiscrimination,
  leakageRisk, ngramOverlapRatio, passAtK, rotatedCeiling, tokenF1, exactMatchNorm,
  twinAxisScore,
} from "@/lib/evals/engine";

const storeOf = (() => {
  const cache = new Map<string, TimelineStore>();
  return (key: string, dur: number) => {
    if (!cache.has(key)) cache.set(key, new TimelineStore(dur));
    return cache.get(key)!;
  };
})();

function useTick(store: TimelineStore) {
  const [, force] = useState(0);
  React.useEffect(() => store.subscribe((ev) => ev === "tick" && force((x) => x + 1)), [store]);
}

/* shared bar */
function Bar({ x, y, w, h, frac, color }: { x: number; y: number; w: number; h: number; frac: number; color: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
      <rect x={x} y={y} width={Math.max(2, w * Math.min(1, Math.max(0, frac)))} height={h} rx={6} style={{ fill: color, fillOpacity: 0.75 }} />
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

function stageStyle(state: "active" | "done" | "idle"): React.CSSProperties {
  if (state === "active") return { fill: "rgba(255,110,140,.18)", stroke: "var(--rose)", strokeWidth: 2 };
  if (state === "done") return { fill: "rgba(70,227,200,.10)", stroke: "var(--teal)", strokeWidth: 1 };
  return { fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)", strokeWidth: 1 };
}

/* ================= 01 EvalLoop ================= */
export function EvalLoop() {
  useTick(storeOf("evloop", 9000));
  const store = storeOf("evloop", 9000);
  const t = store.t;
  const stages = ["MEASURE", "DIAGNOSE", "CHANGE ONE THING", "RE-MEASURE"];
  const active = Math.min(3, Math.floor(t * 4));
  const captions = [
    "Score the system under a frozen protocol.",
    "Slice the failures: which capability, which inputs?",
    "Change exactly one variable — model, prompt, or decoding.",
    "Re-run the identical suite. Did the needle move?",
  ];
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <RunReset store={store} />
        <span className="configChip">LOOP STAGE · {t <= 0 ? "READY" : stages[active]}</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="The evaluation loop stages" style={{ width: "100%", height: "auto", display: "block" }}>
        {stages.map((s, i) => {
          const state = t <= 0 ? "idle" : i < active ? "done" : i === active ? "active" : "idle";
          const x = 24 + i * 219;
          return (
            <g key={s}>
              <rect x={x} y={46} width={204} height={64} rx={10} style={stageStyle(state)} />
              <text x={x + 102} y={72} textAnchor="middle" className="lblMono" style={{ fill: state === "active" ? "var(--rose)" : state === "done" ? "var(--teal)" : "var(--ink2)" }}>
                {i + 1} · {s}
              </text>
              <text x={x + 102} y={94} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>
                {state === "done" ? "✓ COMPLETE" : state === "active" ? "● RUNNING" : "○ WAITING"}
              </text>
              {i < 3 && <text x={x + 212} y={86} textAnchor="middle" className="lblMono">→</text>}
            </g>
          );
        })}
        <text x={24} y={140} className="lblMono">ONE LOOP = ONE ATTRIBUTABLE DECISION · PROTOCOL FROZEN THROUGHOUT</text>
      </svg>
      <p className="raceCaption" aria-live="polite">
        {t <= 0 ? "An unevaluated model is a rumor. RUN to walk the control loop." : captions[active]}
      </p>
    </div>
  );
}

/* ================= 02 CapabilityVsAlignment ================= */
export function CapabilityVsAlignment() {
  const [cap, setCap] = useState(0.85);
  const [align, setAlign] = useState(0.65);
  const { mean, gap } = twinAxisScore(cap, align);
  const px = 60 + cap * 780;
  const py = 250 - align * 200;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">CAPABILITY</span>
        <input type="range" className="slider" min={0} max={1} step={0.01} value={cap} aria-label="Capability score" style={{ maxWidth: 140 }} onChange={(e) => setCap(Number(e.target.value))} />
        <span className="configChip">{cap.toFixed(2)}</span>
        <span className="kicker">ALIGNMENT</span>
        <input type="range" className="slider" min={0} max={1} step={0.01} value={align} aria-label="Alignment score" style={{ maxWidth: 140 }} onChange={(e) => setAlign(Number(e.target.value))} />
        <span className="configChip">{align.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 280" role="img" aria-label="Capability versus alignment plane" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={60} y1={250} x2={840} y2={50} style={{ stroke: "rgba(159,182,187,.35)", strokeDasharray: "6 5" }} />
        <text x={830} y={42} textAnchor="end" className="lblMono">BALANCED DIAGONAL</text>
        <rect x={60} y={50} width={780} height={200} rx={8} style={{ fill: "none", stroke: "rgba(159,182,187,.25)" }} />
        <text x={60} y={270} className="lblMono">CAPABILITY →</text>
        <text x={30} y={150} className="lblMono" transform={`rotate(-90 30 150)`}>ALIGNMENT</text>
        <line x1={px} y1={50} x2={px} y2={250} style={{ stroke: "var(--gold)", strokeDasharray: "4 4", strokeOpacity: 0.6 }} />
        <circle cx={px} cy={py} r={10} style={{ fill: "var(--rose)", stroke: "#fff", strokeWidth: 1.5 }} />
        <text x={px} y={py - 16} textAnchor="middle" className="lblMono" style={{ fill: "var(--rose)" }}>MODEL</text>
        <text x={60} y={34} className="lblMono" style={{ fill: gap > 0.15 ? "var(--rose)" : "var(--teal)" }}>
          MEAN {mean.toFixed(2)} · GAP {gap.toFixed(2)} {gap > 0.15 ? "· AXES DIVERGE — DO NOT SHIP ON THE MEAN" : "· BALANCED"}
        </text>
      </svg>
      <p className="raceCaption">
        A mean of {mean.toFixed(2)} hides a gap of {gap.toFixed(2)}. Capability can soar while alignment collapses in the same fine-tune.
      </p>
    </div>
  );
}

/* ================= 03 StaticVsDynamic ================= */
export function StaticVsDynamic() {
  const [rotation, setRotation] = useState(0.25);
  const [rounds, setRounds] = useState(4);
  const staticRisk = leakageRisk(1, rounds, rotation);
  const arenaRisk = 0.08;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">ROTATION / RELEASE</span>
        <input type="range" className="slider" min={0} max={0.6} step={0.05} value={rotation} aria-label="Rotation fraction" style={{ maxWidth: 140 }} onChange={(e) => setRotation(Number(e.target.value))} />
        <span className="configChip">{(rotation * 100).toFixed(0)}%</span>
        <span className="kicker">RELEASE ROUNDS</span>
        <input type="range" className="slider" min={0} max={8} step={1} value={rounds} aria-label="Release rounds" style={{ maxWidth: 140 }} onChange={(e) => setRounds(Number(e.target.value))} />
        <span className="configChip">{rounds}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Leakage risk of static versus dynamic suites" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">CONTAMINATION RISK</text>
        <Bar x={30} y={38} w={840} h={28} frac={staticRisk} color="var(--rose)" />
        <text x={40} y={57} className="lblMono" style={{ fill: "#fff" }}>STATIC SUITE · {(staticRisk * 100).toFixed(0)}%</text>
        <Bar x={30} y={76} w={840} h={28} frac={arenaRisk} color="var(--teal)" />
        <text x={40} y={95} className="lblMono" style={{ fill: "#fff" }}>LIVE ARENA · {(arenaRisk * 100).toFixed(0)}%</text>
        <text x={30} y={132} className="lblMono" style={{ fill: "var(--gold)" }}>
          {staticRisk > 0.5 ? "STATIC SET IS EFFECTIVELY TRAINING DATA — ROTATE OR GO PRIVATE" : "ROTATION KEEPS THE STATIC SIGNAL HONEST · STILL CARRY BOTH"}
        </text>
      </svg>
      <p className="raceCaption">
        Static suites are comparable until they leak; arenas stay fresh but their population drifts. Reproducibility and freshness are different goods.
      </p>
    </div>
  );
}

/* ================= 04 ItemAnatomy ================= */
const ITEM_FIELDS = ["prompt", "reference", "scoring rule", "metadata", "provenance"] as const;
export function ItemAnatomy() {
  const [on, setOn] = useState<boolean[]>([true, true, true, false, false]);
  const completeness = on.filter(Boolean).length / ITEM_FIELDS.length;
  const toggle = (i: number) => setOn((prev) => prev.map((v, j) => (j === i ? !v : v)));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {ITEM_FIELDS.map((f, i) => (
          <button key={f} className={"btn btnSm " + (on[i] ? "btnPrimary" : "btnSecondary")} onClick={() => toggle(i)}
            aria-pressed={on[i]}>{(on[i] ? "✓ " : "+ ") + f.toUpperCase()}</button>
        ))}
        <span className="configChip">COMPLETENESS · {(completeness * 100).toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 130" role="img" aria-label="Item completeness affects score meaning" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">WHAT THE SCORE MEANS AT THIS COMPLETENESS</text>
        <Bar x={30} y={40} w={840} h={30} frac={completeness} color={completeness >= 1 ? "var(--teal)" : completeness >= 0.6 ? "var(--gold)" : "var(--rose)"} />
        <text x={30} y={102} className="lblMono" style={{ fill: completeness >= 1 ? "var(--teal)" : "var(--gold)" }}>
          {completeness >= 1 ? "REPRODUCIBLE · SLICEABLE · AUDITABLE — A REAL INSTRUMENT" : on[2] ? "SCORED BUT UNSLICEABLE — YOU CANNOT DIAGNOSE FAILURES" : "NO SCORING RULE — THIS IS A VIBE, NOT A MEASUREMENT"}
        </text>
      </svg>
      <p className="raceCaption">
        Drop metadata and you lose diagnosis; drop the scoring rule and you lose the measurement entirely.
      </p>
    </div>
  );
}

/* ================= 05 DifficultyCalibration ================= */
const CAL_ITEMS = [
  { name: "multi-digit multiply", p: 0.12, d: 0.68 },
  { name: "code repair", p: 0.38, d: 0.61 },
  { name: "logic puzzle", p: 0.47, d: 0.58 },
  { name: "commonsense QA", p: 0.55, d: 0.45 },
  { name: "news summary", p: 0.81, d: 0.22 },
  { name: "capital recall", p: 0.94, d: 0.08 },
];
export function DifficultyCalibration() {
  const [lo, setLo] = useState(0.1);
  const [hi, setHi] = useState(0.9);
  const kept = CAL_ITEMS.filter((it) => it.p >= lo && it.p <= hi);
  const meanD = kept.length ? kept.reduce((a, it) => a + it.d, 0) / kept.length : 0;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">DIFFICULTY BAND</span>
        <input type="range" className="slider" min={0} max={0.5} step={0.05} value={lo} aria-label="Lower difficulty bound" style={{ maxWidth: 120 }} onChange={(e) => setLo(Number(e.target.value))} />
        <input type="range" className="slider" min={0.5} max={1} step={0.05} value={hi} aria-label="Upper difficulty bound" style={{ maxWidth: 120 }} onChange={(e) => setHi(Number(e.target.value))} />
        <span className="configChip">p ∈ [{lo.toFixed(2)}, {hi.toFixed(2)}]</span>
        <span className="configChip">{kept.length}/{CAL_ITEMS.length} KEPT · MEAN d {meanD.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 190" role="img" aria-label="Item difficulty and discrimination" style={{ width: "100%", height: "auto", display: "block" }}>
        {CAL_ITEMS.map((it, i) => {
          const x = 60 + it.p * 760;
          const y = 40 + i * 22;
          const inBand = it.p >= lo && it.p <= hi;
          return (
            <g key={it.name} opacity={inBand ? 1 : 0.3}>
              <circle cx={x} cy={y} r={5 + it.d * 9} style={{ fill: inBand ? "var(--rose)" : "var(--bg3)", stroke: inBand ? "var(--rose)" : "rgba(159,182,187,.4)" }} />
              <text x={x + 18} y={y + 4} className="lblMono" style={{ fontSize: 10 }}>{it.name} · p {it.p.toFixed(2)} · d {it.d.toFixed(2)}{inBand ? "" : " · CULLED"}</text>
            </g>
          );
        })}
        <line x1={60 + lo * 760} y1={24} x2={60 + lo * 760} y2={172} style={{ stroke: "var(--gold)", strokeDasharray: "4 3" }} />
        <line x1={60 + hi * 760} y1={24} x2={60 + hi * 760} y2={172} style={{ stroke: "var(--gold)", strokeDasharray: "4 3" }} />
        <text x={30} y={184} className="lblMono">SIZE = DISCRIMINATION · BAND EDGES = CULLING THRESHOLDS</text>
      </svg>
      <p className="raceCaption">
        Floor and ceiling items look easy to write and cost you information. {difficultyIndex(kept.length, CAL_ITEMS.length).toFixed(0) === "1" ? "Keeping everything keeps the noise too." : `Culling to the band keeps ${kept.length} informative items.`}
      </p>
    </div>
  );
}

/* ================= 06 CoverageTaxonomy ================= */
const LEAVES = ["arithmetic", "retrieval", "reasoning", "code"] as const;
export function CoverageTaxonomy() {
  const [counts, setCounts] = useState<number[]>([10, 10, 10, 10]);
  const H = coverageConcentration(counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const set = (i: number, v: number) => setCounts((prev) => prev.map((c, j) => (j === i ? v : c)));
  const COLORS = ["var(--rose)", "var(--gold)", "var(--teal)", "var(--iris)"];
  let acc = 0;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {LEAVES.map((leaf, i) => (
          <React.Fragment key={leaf}>
            <span className="kicker">{leaf.toUpperCase()}</span>
            <input type="range" className="slider" min={0} max={30} step={1} value={counts[i]} aria-label={`${leaf} item count`} style={{ maxWidth: 110 }} onChange={(e) => set(i, Number(e.target.value))} />
            <span className="configChip">{counts[i]}</span>
          </React.Fragment>
        ))}
        <span className="configChip">H = {H.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Coverage concentration across capability leaves" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">ITEM MIX · {(counts.map((c) => ((c / Math.max(1, total)) * 100).toFixed(0)).join(" / "))}%</text>
        {counts.map((c, i) => {
          const frac = total > 0 ? c / total : 0;
          const x = 30 + acc * 840;
          acc += frac;
          return <rect key={LEAVES[i]} x={x} y={40} width={Math.max(frac > 0 ? 3 : 0, 840 * frac)} height={30} style={{ fill: COLORS[i], fillOpacity: 0.75 }} />;
        })}
        <text x={30} y={102} className="lblMono" style={{ fill: H > 0.4 ? "var(--rose)" : "var(--teal)" }}>
          {H > 0.4 ? `H = ${H.toFixed(2)} — THE AGGREGATE IS REALLY A ${LEAVES[counts.indexOf(Math.max(...counts))].toUpperCase()} TEST` : `H = ${H.toFixed(2)} — BALANCED COVERAGE, THE MEAN EARNS ITS MEANING`}
        </text>
      </svg>
      <p className="raceCaption">
        Starve a leaf and failures there vanish from the average. Budget coverage before authoring items, then re-audit.
      </p>
    </div>
  );
}

/* ================= 07 NgramContam ================= */
const CONTAM_CORPUS =
  "the quick brown fox jumps over the lazy dog near the river bank at dawn while the city sleeps and the lighthouse beam sweeps the harbor";
const CONTAM_ITEMS = [
  { name: "verbatim passage", text: "the quick brown fox jumps over the lazy dog" },
  { name: "paraphrase", text: "the speedy auburn fox leaps above the sleepy hound" },
  { name: "unrelated", text: "quantum error correction protects fragile qubits" },
];
export function NgramContam() {
  const [n, setN] = useState(5);
  const rows = CONTAM_ITEMS.map((it) => ({ ...it, overlap: ngramOverlapRatio(it.text, CONTAM_CORPUS, n) }));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">N-GRAM SIZE</span>
        <input type="range" className="slider" min={2} max={8} step={1} value={n} aria-label="n-gram size" style={{ maxWidth: 160 }} onChange={(e) => setN(Number(e.target.value))} />
        <span className="configChip">n = {n}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="n-gram overlap per item" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">MAX OVERLAP vs TRAINING CORPUS</text>
        {rows.map((r, i) => (
          <g key={r.name}>
            <Bar x={30} y={38 + i * 34} w={640} h={22} frac={r.overlap} color={r.overlap > 0.5 ? "var(--rose)" : r.overlap > 0 ? "var(--gold)" : "var(--teal)"} />
            <text x={684} y={55 + i * 34} className="lblMono" style={{ fontSize: 11 }}>
              {r.name} · {(r.overlap * 100).toFixed(0)}%{r.overlap > 0.5 ? " LEAKED" : r.overlap > 0 ? " SUSPECT" : " CLEAN"}
            </text>
          </g>
        ))}
      </svg>
      <p className="raceCaption">
        Seen accuracy {0.712} vs unseen {0.63}: an uplift of {contaminationUplift(0.712, 0.63).toFixed(3)} is the contamination tell. Larger n sharpens the verdict.
      </p>
    </div>
  );
}

/* ================= 08 CanaryTrap ================= */
export function CanaryTrap() {
  const [trainedOnEval, setTrainedOnEval] = useState(false);
  const canaries = ["EVAL-CANARY-7f3a", "EVAL-CANARY-9b1c"];
  const outputs = trainedOnEval
    ? ["solution uses the standard method EVAL-CANARY-7f3a verbatim", "the impossible item is solved: answer 42 EVAL-CANARY-9b1c"]
    : ["solution uses the standard dynamic programming approach", "this item is ill-posed: no valid answer exists"];
  const hits = canaryHits(canaries, outputs.join(" "));
  const trapSolved = trainedOnEval;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (!trainedOnEval ? "btnPrimary" : "btnSecondary")} onClick={() => setTrainedOnEval(false)}>CLEAN TRAINING</button>
        <button className={"btn btnSm " + (trainedOnEval ? "btnPrimary" : "btnSecondary")} onClick={() => setTrainedOnEval(true)}>LEAK EVAL INTO TRAINING</button>
        <span className="configChip">CANARY HITS · {hits}/{canaries.length}</span>
        <span className="configChip">TRAP {trapSolved ? "SOLVED — SUSPICIOUS" : "FAILED AS DESIGNED ✓"}</span>
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="Canary and trap outcomes" style={{ width: "100%", height: "auto", display: "block" }}>
        {outputs.map((o, i) => {
          const bad = trainedOnEval;
          return (
            <g key={i}>
              <rect x={30} y={24 + i * 48} width={840} height={38} rx={8}
                style={{ fill: bad ? "rgba(255,110,140,.12)" : "rgba(70,227,200,.08)", stroke: bad ? "var(--rose)" : "var(--teal)" }} />
              <text x={44} y={48 + i * 48} className="lblMono" style={{ fontSize: 11.5 }}>“{o.length > 88 ? o.slice(0, 88) + "…" : o}”</text>
            </g>
          );
        })}
        <text x={30} y={132} className="lblMono" style={{ fill: trainedOnEval ? "var(--rose)" : "var(--teal)" }}>
          {trainedOnEval ? "CANARY RECOVERY PROVES THE EVAL TEXT WAS IN TRAINING — INVALIDATE THE RUN" : "NO CANARY ECHO · TRAP BEHAVES — THE RUN STANDS"}
        </text>
      </svg>
      <p className="raceCaption">
        Flip the training condition and watch the markers fire. Planted evidence beats statistical inference: recovery is proof, not suspicion.
      </p>
    </div>
  );
}

/* ================= 09 PrivateRotating ================= */
export function PrivateRotating() {
  const [prior, setPrior] = useState(0.8);
  const [rotation, setRotation] = useState(0.25);
  const [fresh, setFresh] = useState(0.6);
  const ceiling = rotatedCeiling(prior, rotation, fresh);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">PRIOR (LEAKED) ACC</span>
        <input type="range" className="slider" min={0.5} max={1} step={0.01} value={prior} aria-label="Prior accuracy" style={{ maxWidth: 110 }} onChange={(e) => setPrior(Number(e.target.value))} />
        <span className="configChip">{prior.toFixed(2)}</span>
        <span className="kicker">ROTATION</span>
        <input type="range" className="slider" min={0} max={0.8} step={0.05} value={rotation} aria-label="Rotation fraction" style={{ maxWidth: 110 }} onChange={(e) => setRotation(Number(e.target.value))} />
        <span className="configChip">{(rotation * 100).toFixed(0)}%</span>
        <span className="kicker">FRESH ACC</span>
        <input type="range" className="slider" min={0.3} max={0.9} step={0.01} value={fresh} aria-label="Fresh accuracy" style={{ maxWidth: 110 }} onChange={(e) => setFresh(Number(e.target.value))} />
        <span className="configChip">{fresh.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Rotation ceiling" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">SCORE AFTER ROTATION</text>
        <Bar x={30} y={40} w={840} h={30} frac={prior} color="var(--rose)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>PRIOR (MEMORIZED) · {prior.toFixed(2)}</text>
        <Bar x={30} y={82} w={840} h={30} frac={ceiling} color="var(--teal)" />
        <text x={40} y={102} className="lblMono" style={{ fill: "#fff" }}>ROTATED CEILING · {ceiling.toFixed(2)}</text>
        <text x={30} y={138} className="lblMono" style={{ fill: "var(--gold)" }}>
          VERSION THE SET · PIN THE VERSION TO THE SCORE · KEEP A PRIVATE SPLIT NOBODY PUBLISHES
        </text>
      </svg>
      <p className="raceCaption">
        Rotation trades memorized points for honest ones: {(prior * 100).toFixed(0)} falls to {(ceiling * 100).toFixed(0)}. The drop is the price of truth.
      </p>
    </div>
  );
}

/* ================= 10 ExactMatch ================= */
const EM_PAIRS = [
  { q: "Capital of France?", gold: "Paris" },
  { q: "2 + 2 × 2?", gold: "6" },
  { q: "Author of '1984'?", gold: "George Orwell" },
];
export function ExactMatch() {
  const [pair, setPair] = useState(0);
  const [pred, setPred] = useState("paris.");
  const gold = EM_PAIRS[pair].gold;
  const hit = exactMatchNorm(pred, gold);
  const f1 = tokenF1(pred, gold);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {EM_PAIRS.map((p, i) => (
          <button key={p.q} className={"btn btnSm " + (pair === i ? "btnPrimary" : "btnSecondary")} onClick={() => setPair(i)}>{p.q}</button>
        ))}
      </div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">PREDICTION</span>
        <input value={pred} onChange={(e) => setPred(e.target.value)} aria-label="Model prediction"
          style={{ background: "var(--bg3)", border: "1px solid var(--hair2)", borderRadius: 8, color: "var(--ink1)", padding: "8px 12px", fontFamily: "var(--font-m)", fontSize: 14, minWidth: 240 }} />
        <span className="configChip">GOLD · {gold}</span>
        <span className="configChip">EXACT {hit ? "✓ 1" : "✗ 0"}</span>
        <span className="configChip">TOKEN F1 · {f1.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 90" role="img" aria-label="Exact match versus token F1" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={30} className="lblMono" style={{ fill: hit ? "var(--teal)" : "var(--rose)" }}>
          {hit ? "NORMALIZED STRINGS IDENTICAL — FULL CREDIT" : "STRINGS DIFFER — EXACT MATCH GIVES ZERO EVEN WHEN MEANING OVERLAPS"}
        </text>
        <text x={30} y={58} className="lblMono" style={{ fill: "var(--gold)" }}>
          TOKEN F1 = {f1.toFixed(3)} — PARTIAL CREDIT FOR SHARED TOKENS (“{pred}” vs “{gold}”)
        </text>
      </svg>
      <p className="raceCaption">
        Try “The Paris” or “paris france”: normalization absorbs the first, F1 forgives the second. The scorer is part of the item.
      </p>
    </div>
  );
}

/* ================= 11 OverlapMetrics ================= */
export function OverlapMetrics() {
  const [p1, setP1] = useState(0.8);
  const [p2, setP2] = useState(0.6);
  const [p3, setP3] = useState(0.4);
  const [p4, setP4] = useState(0.2);
  const [cand, setCand] = useState(8);
  const [ref, setRef] = useState(10);
  const bp = brevityPenalty(cand, ref);
  const bleu = bleuScore([p1, p2, p3, p4], cand, ref);
  const sliders: [string, number, (v: number) => void][] = [
    ["P1", p1, setP1], ["P2", p2, setP2], ["P3", p3, setP3], ["P4", p4, setP4],
  ];
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {sliders.map(([label, v, set]) => (
          <React.Fragment key={label}>
            <span className="kicker">{label}</span>
            <input type="range" className="slider" min={0.05} max={1} step={0.05} value={v} aria-label={`${label} precision`} style={{ maxWidth: 90 }} onChange={(e) => set(Number(e.target.value))} />
            <span className="configChip">{v.toFixed(2)}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">CAND LEN</span>
        <input type="range" className="slider" min={4} max={14} step={1} value={cand} aria-label="Candidate length" style={{ maxWidth: 110 }} onChange={(e) => setCand(Number(e.target.value))} />
        <span className="configChip">{cand}</span>
        <span className="kicker">REF LEN</span>
        <input type="range" className="slider" min={4} max={14} step={1} value={ref} aria-label="Reference length" style={{ maxWidth: 110 }} onChange={(e) => setRef(Number(e.target.value))} />
        <span className="configChip">{ref}</span>
        <span className="configChip">BP · {bp.toFixed(3)}</span>
        <span className="configChip">BLEU · {bleu.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="BLEU score composition" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">GEOMETRIC MEAN OF PRECISIONS × BREVITY PENALTY</text>
        <Bar x={30} y={40} w={840} h={30} frac={bleu} color="var(--cyan)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>BLEU · {bleu.toFixed(3)}</text>
        <text x={30} y={102} className="lblMono" style={{ fill: "var(--gold)" }}>
          A PERFECT PARAPHRASE SHARES FEW N-GRAMS — {cand < ref ? "AND THE SHORT CANDIDATE IS PENALIZED AGAIN" : "SURFACE OVERLAP IS NOT MEANING"}
        </text>
      </svg>
      <p className="raceCaption">
        High precision on unigrams collapses by 4-grams; a single weak order dominates the geometric mean. Accuracy of the words, not of the thought.
      </p>
    </div>
  );
}

/* ================= 12 ProgrammaticGrading ================= */
export function ProgrammaticGrading() {
  const [n, setN] = useState(10);
  const [c, setC] = useState(5);
  const [k, setK] = useState(5);
  const safeC = Math.min(c, n);
  const safeK = Math.min(k, n);
  const p1 = passAtK(n, safeC, 1);
  const pk = passAtK(n, safeC, safeK);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">SAMPLES n</span>
        <input type="range" className="slider" min={1} max={20} step={1} value={n} aria-label="Sample count" style={{ maxWidth: 110 }} onChange={(e) => setN(Number(e.target.value))} />
        <span className="configChip">{n}</span>
        <span className="kicker">CORRECT c</span>
        <input type="range" className="slider" min={0} max={20} step={1} value={c} aria-label="Correct count" style={{ maxWidth: 110 }} onChange={(e) => setC(Number(e.target.value))} />
        <span className="configChip">{safeC}</span>
        <span className="kicker">k</span>
        <input type="range" className="slider" min={1} max={20} step={1} value={k} aria-label="k attempts" style={{ maxWidth: 110 }} onChange={(e) => setK(Number(e.target.value))} />
        <span className="configChip">{safeK}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="pass at 1 versus pass at k" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">EXECUTED, NOT READ — {safeC}/{n} SAMPLES PASS THE TESTS</text>
        <Bar x={30} y={40} w={840} h={28} frac={p1} color="var(--rose)" />
        <text x={40} y={59} className="lblMono" style={{ fill: "#fff" }}>pass@1 (RELIABILITY) · {p1.toFixed(3)}</text>
        <Bar x={30} y={78} w={840} h={28} frac={pk} color="var(--teal)" />
        <text x={40} y={97} className="lblMono" style={{ fill: "#fff" }}>pass@{safeK} (REACHABLE CAPABILITY) · {pk.toFixed(3)}</text>
        <text x={30} y={132} className="lblMono" style={{ fill: "var(--gold)" }}>
          {accuracy(safeC, n).toFixed(2)} RELIABLE, {pk.toFixed(2)} REACHABLE — THE GAP IS WHAT SAMPLING BUYS
        </text>
      </svg>
      <p className="raceCaption">
        A verifier cannot be charmed by fluent prose. But extract the code block wrong and the failure is yours, not the model's.
      </p>
    </div>
  );
}
