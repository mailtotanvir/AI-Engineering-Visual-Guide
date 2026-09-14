"use client";
import React, { useState } from "react";
import {
  accuracy, adverseRegressionRate, bootstrapCI, chanceAgreement, ciHalfWidth,
  cohensKappa, driftScore, eloDelta, eloExpected, eloUpdate, gateBreach,
  holmRejected, mcnemarChi2, mcnemarP, orderAveragedWinRate, positionalBias,
  regressionDelta,
} from "@/lib/evals/engine";

/* shared bar */
function Bar({ x, y, w, h, frac, color }: { x: number; y: number; w: number; h: number; frac: number; color: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: "var(--bg3)", stroke: "rgba(159,182,187,.25)" }} />
      <rect x={x} y={y} width={Math.max(2, w * Math.min(1, Math.max(0, frac)))} height={h} rx={6} style={{ fill: color, fillOpacity: 0.75 }} />
    </>
  );
}

/* ================= 13 JudgeRubric ================= */
export function JudgeRubric() {
  const [rubricNoise, setRubricNoise] = useState(0.5);
  const [judgeNoise, setJudgeNoise] = useState(0.5);
  const trueVar = 1;
  const total = trueVar + rubricNoise ** 2 + judgeNoise ** 2;
  const repro = trueVar / total;
  const segs: [string, number, string][] = [
    ["TRUE QUALITY", trueVar / total, "var(--teal)"],
    ["RUBRIC AMBIGUITY", rubricNoise ** 2 / total, "var(--gold)"],
    ["JUDGE SAMPLING", judgeNoise ** 2 / total, "var(--rose)"],
  ];
  let acc = 0;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">RUBRIC NOISE σ</span>
        <input type="range" className="slider" min={0} max={1.2} step={0.1} value={rubricNoise} aria-label="Rubric noise" style={{ maxWidth: 140 }} onChange={(e) => setRubricNoise(Number(e.target.value))} />
        <span className="configChip">{rubricNoise.toFixed(1)}</span>
        <span className="kicker">JUDGE NOISE σ</span>
        <input type="range" className="slider" min={0} max={1.2} step={0.1} value={judgeNoise} aria-label="Judge noise" style={{ maxWidth: 140 }} onChange={(e) => setJudgeNoise(Number(e.target.value))} />
        <span className="configChip">{judgeNoise.toFixed(1)}</span>
        <span className="configChip">REPRODUCIBLE · {(repro * 100).toFixed(0)}%</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Judge score variance decomposition" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">OBSERVED JUDGE VARIANCE = TRUE + RUBRIC + JUDGE</text>
        {segs.map(([label, frac, color]) => {
          const x = 30 + acc * 840;
          acc += frac;
          return <rect key={label} x={x} y={40} width={Math.max(3, 840 * frac)} height={30} style={{ fill: color, fillOpacity: 0.8 }} />;
        })}
        <text x={30} y={102} className="lblMono" style={{ fill: repro > 0.5 ? "var(--teal)" : "var(--rose)" }}>
          {repro > 0.5 ? "MOSTLY SIGNAL — THE RUBRIC EARNS ITS KEEP" : "MOSTLY NOISE — TIGHTEN ANCHORS, SPLIT AXES, LOWER TEMPERATURE"}
        </text>
      </svg>
      <p className="raceCaption">
        Push both noises to zero and the bar turns fully teal — that is what anchored, single-axis, low-temperature rubrics buy.
      </p>
    </div>
  );
}

/* ================= 14 PairwiseJudge ================= */
export function PairwiseJudge() {
  const [gap, setGap] = useState(150);
  const prob = eloExpected(1500 + gap, 1500);
  const back = eloDelta(prob);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">RATING GAP (A − B)</span>
        <input type="range" className="slider" min={-400} max={400} step={10} value={gap} aria-label="Rating gap" style={{ maxWidth: 220 }} onChange={(e) => setGap(Number(e.target.value))} />
        <span className="configChip">{gap > 0 ? "+" : ""}{gap} Elo</span>
        <span className="configChip">P(A ≻ B) · {prob.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Pairwise win probability from rating gap" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">MODEL A vs MODEL B · TIES ALLOWED IN THE PROTOCOL</text>
        <Bar x={30} y={40} w={840} h={30} frac={prob} color="var(--iris)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>A WINS · {(prob * 100).toFixed(1)}%</text>
        <Bar x={30} y={80} w={840} h={30} frac={1 - prob} color="var(--gold)" />
        <text x={40} y={100} className="lblMono" style={{ fill: "#fff" }}>B WINS · {((1 - prob) * 100).toFixed(1)}%</text>
        <text x={30} y={136} className="lblMono" style={{ fill: "var(--gold)" }}>
          WIN RATE {prob.toFixed(3)} ↔ GAP {back.toFixed(0)} ELO — THE BRIDGE RUNS BOTH WAYS
        </text>
      </svg>
      <p className="raceCaption">
        Relative judgment is easy; ranking is the hard part. Bradley-Terry turns scattered A-vs-B outcomes into one shared scale.
      </p>
    </div>
  );
}

/* ================= 15 JudgeBias ================= */
export function JudgeBias() {
  const [w1, setW1] = useState(68);
  const [w2, setW2] = useState(44);
  const bias = positionalBias(w1, 100);
  const corrected = orderAveragedWinRate(w1, w2, 100);
  const inflation = w1 / 100 - corrected;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">WINS AS FIRST ( /100)</span>
        <input type="range" className="slider" min={0} max={100} step={1} value={w1} aria-label="Wins when shown first" style={{ maxWidth: 140 }} onChange={(e) => setW1(Number(e.target.value))} />
        <span className="configChip">{w1}</span>
        <span className="kicker">WINS AS SECOND ( /100)</span>
        <input type="range" className="slider" min={0} max={100} step={1} value={w2} aria-label="Wins when shown second" style={{ maxWidth: 140 }} onChange={(e) => setW2(Number(e.target.value))} />
        <span className="configChip">{w2}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Position bias correction" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">RAW FIRST-SLOT RATE vs ORDER-AVERAGED TRUTH</text>
        <Bar x={30} y={40} w={840} h={28} frac={w1 / 100} color="var(--rose)" />
        <text x={40} y={59} className="lblMono" style={{ fill: "#fff" }}>RAW · {(w1 / 100).toFixed(2)} (POSITION BIAS {(bias * 100).toFixed(0)} PTS)</text>
        <Bar x={30} y={78} w={840} h={28} frac={corrected} color="var(--teal)" />
        <text x={40} y={97} className="lblMono" style={{ fill: "#fff" }}>CORRECTED · {corrected.toFixed(2)}</text>
        <text x={30} y={132} className="lblMono" style={{ fill: "var(--gold)" }}>
          SINGLE-ORDER REPORTING INFLATES BY {(inflation * 100).toFixed(0)} POINTS — SWAP, RE-JUDGE, AVERAGE
        </text>
      </svg>
      <p className="raceCaption">
        Length and self-preference need the same treatment: control verbosity, and never let a family judge its own.
      </p>
    </div>
  );
}

/* ================= 16 AnnotationProtocol ================= */
const GOLD_RATERS = [
  { name: "rater-01", gold: 0.98 }, { name: "rater-02", gold: 0.92 }, { name: "rater-03", gold: 0.85 },
  { name: "rater-04", gold: 0.72 }, { name: "rater-05", gold: 0.61 }, { name: "rater-06", gold: 0.55 },
];
export function AnnotationProtocol() {
  const [threshold, setThreshold] = useState(0.8);
  const kept = GOLD_RATERS.filter((r) => r.gold >= threshold);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">GOLD-ITEM GATE</span>
        <input type="range" className="slider" min={0.5} max={1} step={0.01} value={threshold} aria-label="Gold accuracy threshold" style={{ maxWidth: 180 }} onChange={(e) => setThreshold(Number(e.target.value))} />
        <span className="configChip">KEEP ≥ {threshold.toFixed(2)}</span>
        <span className="configChip">{kept.length}/{GOLD_RATERS.length} RATERS · {Math.round(accuracy(kept.length, GOLD_RATERS.length) * 100)}%</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Rater qualification against seeded gold items" style={{ width: "100%", height: "auto", display: "block" }}>
        {GOLD_RATERS.map((r, i) => {
          const pass = r.gold >= threshold;
          const x = 40 + i * 140;
          return (
            <g key={r.name}>
              <rect x={x} y={80 - r.gold * 56} width={90} height={r.gold * 56} rx={5}
                style={{ fill: pass ? "var(--teal)" : "var(--rose)", fillOpacity: pass ? 0.75 : 0.45 }} />
              <line x1={30} y1={80 - threshold * 56} x2={870} y2={80 - threshold * 56} style={{ stroke: "var(--gold)", strokeDasharray: "6 4" }} />
              <text x={x + 45} y={96} textAnchor="middle" className="lblMono" style={{ fontSize: 9 }}>{r.name}</text>
              <text x={x + 45} y={110} textAnchor="middle" className="lblMono" style={{ fontSize: 9, fill: pass ? "var(--teal)" : "var(--rose)" }}>
                {r.gold.toFixed(2)} {pass ? "✓" : "✗"}
              </text>
            </g>
          );
        })}
        <text x={30} y={132} className="lblMono" style={{ fill: "var(--gold)" }}>GOLD LINE = QUALIFICATION · FAILING RATERS PRODUCE OPINIONS, NOT LABELS</text>
      </svg>
      <p className="raceCaption">
        Raise the gate and the pool shrinks but the labels harden. Adjudicate what remains instead of averaging it away.
      </p>
    </div>
  );
}

/* ================= 17 InterAnnotator ================= */
export function InterAnnotator() {
  const [rA, setRA] = useState(0.6);
  const [rB, setRB] = useState(0.55);
  const [observed, setObserved] = useState(0.8);
  const chance = chanceAgreement(rA, rB);
  const kappa = cohensKappa(Math.max(observed, chance), chance);
  const verdict = kappa < 0.4 ? "BROKEN — FIX THE GUIDELINE, NOT THE HEADCOUNT" : kappa < 0.6 ? "FAIR — ADJUDICATE AND TIGHTEN" : kappa < 0.8 ? "SUBSTANTIAL — REPORT WITH THE LABELS" : "STRONG — THE CONSTRUCT HOLDS";
  const verdictColor = kappa < 0.4 ? "var(--rose)" : kappa < 0.6 ? "var(--gold)" : "var(--teal)";
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">RATER A POS RATE</span>
        <input type="range" className="slider" min={0.1} max={0.9} step={0.05} value={rA} aria-label="Rater A positive rate" style={{ maxWidth: 110 }} onChange={(e) => setRA(Number(e.target.value))} />
        <span className="configChip">{rA.toFixed(2)}</span>
        <span className="kicker">RATER B POS RATE</span>
        <input type="range" className="slider" min={0.1} max={0.9} step={0.05} value={rB} aria-label="Rater B positive rate" style={{ maxWidth: 110 }} onChange={(e) => setRB(Number(e.target.value))} />
        <span className="configChip">{rB.toFixed(2)}</span>
        <span className="kicker">OBSERVED AGREE</span>
        <input type="range" className="slider" min={0.4} max={1} step={0.01} value={observed} aria-label="Observed agreement" style={{ maxWidth: 110 }} onChange={(e) => setObserved(Number(e.target.value))} />
        <span className="configChip">{observed.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Chance-corrected agreement" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">κ = (OBSERVED − CHANCE) / (1 − CHANCE) = ({observed.toFixed(2)} − {chance.toFixed(2)}) / {(1 - chance).toFixed(2)}</text>
        <Bar x={30} y={40} w={840} h={30} frac={observed} color="var(--gold)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>RAW AGREEMENT · {observed.toFixed(2)}</text>
        <Bar x={30} y={80} w={840} h={30} frac={Math.max(0, kappa)} color="var(--rose)" />
        <text x={40} y={100} className="lblMono" style={{ fill: "#fff" }}>COHEN κ · {kappa.toFixed(2)}</text>
        <text x={30} y={134} className="lblMono" style={{ fill: verdictColor }}>{verdict}</text>
      </svg>
      <p className="raceCaption">
        Skewed tasks inflate raw agreement: two raters who mostly say “yes” will match by luck. Kappa subtracts the luck.
      </p>
    </div>
  );
}

/* ================= 18 ArenaElo ================= */
export function ArenaElo() {
  const [ra, setRa] = useState(1500);
  const [rb, setRb] = useState(1500);
  const [last, setLast] = useState<string | null>(null);
  const exp = eloExpected(ra, rb);
  const battle = (score: number, label: string) => {
    setRa((a) => Math.round(eloUpdate(a, rb, score)));
    setRb((b) => Math.round(eloUpdate(b, ra, 1 - score)));
    setLast(label);
  };
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <button className="btn btnPrimary btnSm" onClick={() => battle(1, "A WINS")}>A WINS</button>
        <button className="btn btnSecondary btnSm" onClick={() => battle(0.5, "DRAW")}>DRAW</button>
        <button className="btn btnSecondary btnSm" onClick={() => battle(0, "B WINS")}>B WINS</button>
        <button className="btn btnGhost btnSm" onClick={() => { setRa(1500); setRb(1500); setLast(null); }}>RESET LADDER</button>
        <span className="configChip">E(A) · {exp.toFixed(3)}</span>
        {last && <span className="configChip">LAST · {last}</span>}
      </div>
      <svg viewBox="0 0 900 140" role="img" aria-label="Live Elo battle" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">ANONYMOUS BATTLE · K = 32 · UPSETS MOVE MORE</text>
        <Bar x={30} y={40} w={840} h={30} frac={(ra - 1000) / 1000} color="var(--rose)" />
        <text x={40} y={60} className="lblMono" style={{ fill: "#fff" }}>MODEL A · {ra}</text>
        <Bar x={30} y={80} w={840} h={30} frac={(rb - 1000) / 1000} color="var(--iris)" />
        <text x={40} y={100} className="lblMono" style={{ fill: "#fff" }}>MODEL B · {rb}</text>
        <text x={30} y={130} className="lblMono" style={{ fill: "var(--gold)" }}>
          GAP {Math.abs(ra - rb)} PTS — {Math.abs(ra - rb) < 30 ? "OVERLAPPING: THE RANK IS UNRESOLVED" : "SEPARATED — BUT ASK FOR THE INTERVAL, NOT JUST THE NUMBER"}
        </text>
      </svg>
      <p className="raceCaption">
        Every battle is a vote with a weight. Feed an underdog win and feel the surprise-priced update; then remember a point rating is a distribution.
      </p>
    </div>
  );
}

/* ================= 19 ConfidenceIntervals ================= */
export function ConfidenceIntervals() {
  const [n, setN] = useState(500);
  const pA = 0.7;
  const pB = 0.74;
  const hA = ciHalfWidth(n, pA);
  const hB = ciHalfWidth(n, pB);
  const lo = 0.55;
  const hi = 0.9;
  const X = (v: number) => 60 + ((v - lo) / (hi - lo)) * 780;
  const separated = pA + hA < pB - hB;
  const band = (p: number, h: number, y: number, color: string, label: string) => (
    <g key={label}>
      <line x1={X(p - h)} y1={y} x2={X(p + h)} y2={y} style={{ stroke: color, strokeWidth: 5, strokeLinecap: "round" }} />
      <line x1={X(p - h)} y1={y - 8} x2={X(p - h)} y2={y + 8} style={{ stroke: color, strokeWidth: 2 }} />
      <line x1={X(p + h)} y1={y - 8} x2={X(p + h)} y2={y + 8} style={{ stroke: color, strokeWidth: 2 }} />
      <circle cx={X(p)} cy={y} r={6} style={{ fill: color }} />
      <text x={X(p + h) + 10} y={y + 4} className="lblMono" style={{ fontSize: 11 }}>{label} {p.toFixed(2)} ± {h.toFixed(3)}</text>
    </g>
  );
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">ITEMS n</span>
        <input type="range" className="slider" min={50} max={2000} step={50} value={n} aria-label="Benchmark size" style={{ maxWidth: 200 }} onChange={(e) => setN(Number(e.target.value))} />
        <span className="configChip">n = {n}</span>
        <span className="configChip">h ≈ ±{hA.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Two model accuracies with confidence intervals" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={X(lo)} y1={70} x2={X(hi)} y2={70} style={{ stroke: "rgba(159,182,187,.3)" }} />
        {[0.6, 0.7, 0.8].map((v) => (
          <text key={v} x={X(v)} y={92} textAnchor="middle" className="lblMono" style={{ fontSize: 10 }}>{v.toFixed(1)}</text>
        ))}
        {band(pA, hA, 46, "var(--rose)", "A")}
        {band(pB, hB, 70, "var(--teal)", "B")}
        <text x={60} y={126} className="lblMono" style={{ fill: separated ? "var(--teal)" : "var(--rose)" }}>
          {separated ? "INTERVALS SEPARATE — THE 4-POINT LEAD IS REAL AT THIS n" : "INTERVALS OVERLAP — 70 vs 74 ON THIS n IS A RUMOR, NOT A RESULT"}
        </text>
      </svg>
      <p className="raceCaption">
        Drag n upward and watch the whiskers tighten as 1/√n. Four times the items buys half the uncertainty — precision is expensive.
      </p>
    </div>
  );
}

/* ================= 20 PairedTests ================= */
export function PairedTests() {
  const [b, setB] = useState(30);
  const [c, setC] = useState(10);
  const chi2 = mcnemarChi2(b, c);
  const p = mcnemarP(b, c);
  const sig = p < 0.05;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">ONLY A RIGHT (b)</span>
        <input type="range" className="slider" min={0} max={60} step={1} value={b} aria-label="Items only A got right" style={{ maxWidth: 140 }} onChange={(e) => setB(Number(e.target.value))} />
        <span className="configChip">{b}</span>
        <span className="kicker">ONLY B RIGHT (c)</span>
        <input type="range" className="slider" min={0} max={60} step={1} value={c} aria-label="Items only B got right" style={{ maxWidth: 140 }} onChange={(e) => setC(Number(e.target.value))} />
        <span className="configChip">{c}</span>
        <span className="configChip">χ² · {chi2.toFixed(2)}</span>
        <span className="configChip">p ≈ {p < 0.001 ? "<0.001" : p.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 170" role="img" aria-label="McNemar contingency table" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">SAME ITEMS · ONLY THE DISCORDANT PAIRS TEST THE DIFFERENCE</text>
        {[
          { x: 30, label: "BOTH RIGHT", v: 40, hot: false }, { x: 245, label: "ONLY A (b)", v: b, hot: true },
          { x: 460, label: "ONLY B (c)", v: c, hot: true }, { x: 675, label: "BOTH WRONG", v: 20, hot: false },
        ].map((cell) => (
          <g key={cell.label}>
            <rect x={cell.x} y={40} width={195} height={64} rx={10}
              style={{ fill: cell.hot ? "rgba(255,110,140,.12)" : "var(--bg3)", stroke: cell.hot ? "var(--rose)" : "rgba(159,182,187,.25)" }} />
            <text x={cell.x + 97} y={66} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>{cell.label}</text>
            <text x={cell.x + 97} y={90} textAnchor="middle" className="lblMono" style={{ fontSize: 18, fill: cell.hot ? "var(--rose)" : "var(--ink1)" }}>{cell.v}</text>
          </g>
        ))}
        <text x={30} y={134} className="lblMono" style={{ fill: sig ? "var(--teal)" : "var(--gold)" }}>
          χ² = (|{b}−{c}|−1)²/({b}+{c}) = {chi2.toFixed(2)} — {sig ? "SIGNIFICANT: A GENUINELY BEATS B HERE" : "NOT SIGNIFICANT: THE SPLIT COULD BE LUCK"}
        </text>
        <text x={30} y={156} className="lblMono">GRAY CELLS CARRY ZERO INFORMATION ABOUT THE DIFFERENCE</text>
      </svg>
      <p className="raceCaption">
        Two overlapping intervals can still hide a decisive paired result — pairing deletes the item-difficulty variance both models share.
      </p>
    </div>
  );
}

/* ================= 21 BootstrapMultiple ================= */
const BOOT_SAMPLE = [0.62, 0.71, 0.68, 0.75, 0.66, 0.73];
const MULTI_P = [0.001, 0.01, 0.04, 0.2];
export function BootstrapMultiple() {
  const [alpha, setAlpha] = useState(0.05);
  const boot = bootstrapCI(BOOT_SAMPLE, 1000, 7);
  const rejected = holmRejected(MULTI_P, alpha);
  const sortedRejected = [...MULTI_P].sort((a, b) => a - b).slice(0, rejected);
  const X = (v: number) => 60 + ((v - 0.55) / 0.35) * 780;
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">α LEVEL</span>
        <input type="range" className="slider" min={0.01} max={0.1} step={0.01} value={alpha} aria-label="Significance level" style={{ maxWidth: 160 }} onChange={(e) => setAlpha(Number(e.target.value))} />
        <span className="configChip">α = {alpha.toFixed(2)}</span>
        <span className="configChip">HOLM REJECTS · {rejected}/{MULTI_P.length}</span>
      </div>
      <svg viewBox="0 0 900 190" role="img" aria-label="Bootstrap interval and Holm corrections" style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={30} y={24} className="lblMono">1000 RESAMPLES · MEAN {boot.mean.toFixed(3)} · 95% INTERVAL [{boot.lo.toFixed(3)}, {boot.hi.toFixed(3)}]</text>
        <line x1={X(boot.lo)} y1={48} x2={X(boot.hi)} y2={48} style={{ stroke: "var(--teal)", strokeWidth: 5, strokeLinecap: "round" }} />
        <circle cx={X(boot.mean)} cy={48} r={6} style={{ fill: "var(--teal)" }} />
        <text x={30} y={80} className="lblMono">FOUR SLICES TESTED — REPORTING THE BEST WITHOUT CORRECTION IS P-HACKING</text>
        {MULTI_P.map((p, i) => {
          const ok = sortedRejected.includes(p);
          return (
            <g key={i}>
              <circle cx={52 + i * 210} cy={112} r={9} style={{ fill: ok ? "var(--teal)" : "var(--bg3)", stroke: ok ? "var(--teal)" : "rgba(159,182,187,.4)" }} />
              <text x={70 + i * 210} y={116} className="lblMono" style={{ fontSize: 12 }}>p = {p} {ok ? "✓ REJECT" : "✗ KEEP"}</text>
            </g>
          );
        })}
        <text x={30} y={152} className="lblMono" style={{ fill: "var(--gold)" }}>
          TWENTY UNCORRECTED TESTS EXPECT ONE FALSE “DISCOVERY” — HOLM SPENDS α WHERE IT EARNS IT
        </text>
      </svg>
      <p className="raceCaption">
        The bootstrap frees you from normality assumptions; Holm frees you from fooling yourself across many slices.
      </p>
    </div>
  );
}

/* ================= 22 RegressionGate ================= */
const GATE_CAPS = [
  { name: "MATH", before: 0.82 }, { name: "CODE", before: 0.74 }, { name: "SAFETY", before: 0.69 },
];
export function RegressionGate() {
  const [after, setAfter] = useState<number[]>([0.83, 0.75, 0.66]);
  const [allowance, setAllowance] = useState(0.02);
  const breaches = GATE_CAPS.map((cap, i) => gateBreach(cap.before, after[i], allowance));
  const blocked = breaches.some(Boolean);
  const set = (i: number, v: number) => setAfter((prev) => prev.map((a, j) => (j === i ? v : a)));
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        {GATE_CAPS.map((cap, i) => (
          <React.Fragment key={cap.name}>
            <span className="kicker">{cap.name} AFTER</span>
            <input type="range" className="slider" min={0.55} max={0.9} step={0.005} value={after[i]} aria-label={`${cap.name} after score`} style={{ maxWidth: 110 }} onChange={(e) => set(i, Number(e.target.value))} />
            <span className="configChip">{after[i].toFixed(3)}</span>
          </React.Fragment>
        ))}
        <span className="kicker">ALLOWANCE</span>
        <input type="range" className="slider" min={0} max={0.05} step={0.005} value={allowance} aria-label="Regression allowance" style={{ maxWidth: 110 }} onChange={(e) => setAllowance(Number(e.target.value))} />
        <span className="configChip">±{allowance.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 900 180" role="img" aria-label="Per-capability regression gate" style={{ width: "100%", height: "auto", display: "block" }}>
        {GATE_CAPS.map((cap, i) => {
          const delta = regressionDelta(cap.before, after[i]);
          const bad = breaches[i];
          return (
            <g key={cap.name}>
              <text x={30} y={36 + i * 44} className="lblMono" style={{ fontSize: 12 }}>{cap.name} {cap.before.toFixed(2)} → {after[i].toFixed(2)} · Δ {delta >= 0 ? "+" : ""}{delta.toFixed(3)}</text>
              <Bar x={280} y={18 + i * 44} w={430} h={22} frac={after[i]} color={bad ? "var(--rose)" : "var(--teal)"} />
              <text x={722} y={35 + i * 44} className="lblMono" style={{ fontSize: 11, fill: bad ? "var(--rose)" : "var(--teal)" }}>
                {bad ? "✗ BREACH — BLOCK" : "✓ WITHIN BUDGET"}
              </text>
            </g>
          );
        })}
        <text x={30} y={166} className="lblMono" style={{ fill: blocked ? "var(--rose)" : "var(--teal)", fontSize: 13 }}>
          {blocked ? "⛔ RELEASE BLOCKED — ONE BROKEN AXIS VETOES A RISING AVERAGE" : "✓ GATE GREEN — EVERY AXIS WITHIN ITS ALLOWANCE"}
        </text>
      </svg>
      <p className="raceCaption">
        Nudge SAFETY below its allowance and the average can still climb. A global threshold ships the breakage; a per-axis gate does not.
      </p>
    </div>
  );
}

/* ================= 23 PromptRegression ================= */
export function PromptRegression() {
  const [failed, setFailed] = useState<boolean[]>([false, false, true, false, false, false, false, true, false, false, false, false]);
  const regressed = failed.filter(Boolean).length;
  const rate = adverseRegressionRate(regressed, failed.length);
  const toggle = (i: number) => setFailed((prev) => prev.map((v, j) => (j === i ? !v : v)));
  const flips = failed.map((f, i) => (f ? i + 1 : null)).filter((v): v is number => v !== null);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">CLICK ITEMS TO FLIP PASS ⇄ FAIL</span>
        <span className="configChip">ADVERSE RATE · {(rate * 100).toFixed(1)}% ({regressed}/{failed.length})</span>
        <span className="configChip">{flips.length ? `FLIPPED · #${flips.join(", #")}` : "NO FLIPS"}</span>
      </div>
      <svg viewBox="0 0 900 120" role="img" aria-label="Golden set regression grid" style={{ width: "100%", height: "auto", display: "block" }}>
        {failed.map((f, i) => {
          const x = 30 + (i % 6) * 143;
          const y = 20 + Math.floor(i / 6) * 48;
          return (
            <g key={i} onClick={() => toggle(i)} style={{ cursor: "pointer" }} role="button" aria-label={`Golden item ${i + 1} ${f ? "failing" : "passing"}`}>
              <rect x={x} y={y} width={128} height={38} rx={8}
                style={{ fill: f ? "rgba(255,110,140,.15)" : "rgba(70,227,200,.08)", stroke: f ? "var(--rose)" : "var(--teal)" }} />
              <text x={x + 64} y={y + 24} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>
                #{i + 1} {f ? "✗ FAIL" : "✓ PASS"}
              </text>
            </g>
          );
        })}
        <text x={30} y={112} className="lblMono" style={{ fill: regressed > 0 ? "var(--rose)" : "var(--teal)" }}>
          {regressed > 0 ? `${regressed} QUIET BREAK${regressed > 1 ? "S" : ""} THE AGGREGATE HIDES — DIFF ITEM BY ITEM` : "GOLDEN SET CLEAN — THIS PROMPT VERSION EARNS ITS EVIDENCE"}
        </text>
      </svg>
      <p className="raceCaption">
        Two items improving can mask two breaking. A prompt edit that “only rewords” is a code change with no compiler — re-run the goldens.
      </p>
    </div>
  );
}

/* ================= 24 OnlineDrift ================= */
export function OnlineDrift() {
  const [baseMean, setBaseMean] = useState(0.7);
  const [baseStd, setBaseStd] = useState(0.05);
  const [current, setCurrent] = useState(0.63);
  const drift = driftScore(baseMean, current, baseStd);
  const level = drift > 2 ? "ALERT" : drift > 1 ? "WATCH" : "STABLE";
  const levelColor = drift > 2 ? "var(--rose)" : drift > 1 ? "var(--gold)" : "var(--teal)";
  const X = (v: number) => 60 + ((v - 0.4) / 0.5) * 780;
  const lo = Math.min(baseMean, current);
  const hi = Math.max(baseMean, current);
  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", flexWrap: "wrap" }}>
        <span className="kicker">BASELINE MEAN</span>
        <input type="range" className="slider" min={0.5} max={0.9} step={0.01} value={baseMean} aria-label="Baseline mean" style={{ maxWidth: 110 }} onChange={(e) => setBaseMean(Number(e.target.value))} />
        <span className="configChip">{baseMean.toFixed(2)}</span>
        <span className="kicker">BASELINE σ</span>
        <input type="range" className="slider" min={0.02} max={0.15} step={0.01} value={baseStd} aria-label="Baseline standard deviation" style={{ maxWidth: 110 }} onChange={(e) => setBaseStd(Number(e.target.value))} />
        <span className="configChip">{baseStd.toFixed(2)}</span>
        <span className="kicker">CURRENT MEAN</span>
        <input type="range" className="slider" min={0.4} max={0.9} step={0.01} value={current} aria-label="Current mean" style={{ maxWidth: 110 }} onChange={(e) => setCurrent(Number(e.target.value))} />
        <span className="configChip">{current.toFixed(2)}</span>
        <span className="configChip">DRIFT · {drift.toFixed(2)}σ</span>
      </div>
      <svg viewBox="0 0 900 150" role="img" aria-label="Production drift gauge" style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={X(0.4)} y1={60} x2={X(0.9)} y2={60} style={{ stroke: "rgba(159,182,187,.3)", strokeWidth: 2 }} />
        <line x1={X(baseMean - baseStd)} y1={60} x2={X(baseMean + baseStd)} y2={60} style={{ stroke: "var(--teal)", strokeWidth: 8, strokeLinecap: "round" }} />
        <circle cx={X(baseMean)} cy={60} r={8} style={{ fill: "var(--teal)" }} />
        <text x={X(baseMean)} y={42} textAnchor="middle" className="lblMono" style={{ fontSize: 11 }}>BASELINE {baseMean.toFixed(2)}</text>
        <circle cx={X(current)} cy={60} r={8} style={{ fill: levelColor, stroke: "#fff", strokeWidth: 1.5 }} />
        <text x={X(current)} y={92} textAnchor="middle" className="lblMono" style={{ fontSize: 11, fill: levelColor }}>LIVE {current.toFixed(2)}</text>
        <rect x={X(lo)} y={54} width={Math.max(2, X(hi) - X(lo))} height={12} style={{ fill: levelColor, fillOpacity: 0.3 }} />
        <text x={60} y={126} className="lblMono" style={{ fill: levelColor, fontSize: 13 }}>
          {level} — {level === "ALERT" ? "POPULATION MOVED · FREEZE THE ROLLOUT, RE-SAMPLE PRODUCTION" : level === "WATCH" ? "MOVEMENT WORTH A CANARY CHECK BEFORE FULL RELEASE" : "WITHIN NOISE — OFFLINE SCORES STILL REPRESENT TRAFFIC"}
        </text>
      </svg>
      <p className="raceCaption">
        No code changed and quality still moved — because the inputs did. Sample production continuously, or the offline eval becomes history.
      </p>
    </div>
  );
}
