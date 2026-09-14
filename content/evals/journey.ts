/* The eight-module Evaluation journey — 24 scenes (3 per module).
   One continuous story: turn model behavior into evidence you can trust. */

export interface EvalJourneyEntry {
  id: string;
  num: string;
  module: number;
  kicker: string;
  title: string;
  blurb: string;
}

export interface EvalModule {
  id: number;
  name: string;
  tagline: string;
}

export const EVAL_MODULES: EvalModule[] = [
  { id: 1, name: "Eval Foundations", tagline: "The measurement loop: define the claim, build the instrument, measure, diagnose, repeat." },
  { id: 2, name: "Benchmark Design", tagline: "Anatomy of items, difficulty calibration, discrimination, and designed capability coverage." },
  { id: 3, name: "Contamination & Integrity", tagline: "Leakage detection, canary traps, private and rotating sets that keep the signal honest." },
  { id: 4, name: "Automatic Scoring", tagline: "Exact match, token F1, BLEU/ROUGE limits, and programmatic grading with verifiers." },
  { id: 5, name: "LLM-as-Judge", tagline: "Rubrics, pairwise win rates, and the positional, length, and self-preference biases of the referee." },
  { id: 6, name: "Human & Arena Evaluation", tagline: "Annotation protocols, inter-annotator agreement, and Elo leaderboards from live battles." },
  { id: 7, name: "Statistical Rigor", tagline: "Confidence intervals, paired tests, bootstrap resampling, and the multiple-comparisons tax." },
  { id: 8, name: "Regression Gates & Monitoring", tagline: "Eval-driven CI, prompt and model regression, and detecting drift in production." },
];

export const EVAL_JOURNEY: EvalJourneyEntry[] = [
  /* -------- Module 1: Eval Foundations -------- */
  { id: "eval-loop", num: "01", module: 1, kicker: "Loop", title: "The Evaluation Loop", blurb: "Measure → diagnose → change → re-measure. Evaluation is not a final report; it is the control loop that tells you whether the system moved." },
  { id: "capability-vs-alignment", num: "02", module: 1, kicker: "Axis", title: "Capability vs Alignment Evals", blurb: "Can it do the task, and does it do it the way we intended? Two axes that fail independently and need separate instruments." },
  { id: "static-vs-dynamic", num: "03", module: 1, kicker: "Suite", title: "Static Suites vs Dynamic Arenas", blurb: "Frozen item banks are reproducible but leak; live arenas resist contamination but drift with the crowd. Serious reports carry both." },

  /* -------- Module 2: Benchmark Design -------- */
  { id: "item-anatomy", num: "04", module: 2, kicker: "Item", title: "Anatomy of a Benchmark Item", blurb: "Prompt, reference, scoring rule, metadata, and source. Every field is a design decision that shapes what the score means." },
  { id: "difficulty-calibration", num: "05", module: 2, kicker: "Calibrate", title: "Difficulty & Discrimination", blurb: "Item difficulty p and discrimination d: why floor and ceiling items waste budget and what a useful spread looks like." },
  { id: "coverage-taxonomy", num: "06", module: 2, kicker: "Coverage", title: "Capability Coverage & Taxonomy", blurb: "Map items to capability leaves before writing them. Balanced coverage prevents a single easy skill from carrying the score." },

  /* -------- Module 3: Contamination & Integrity -------- */
  { id: "ngram-contam", num: "07", module: 3, kicker: "Leakage", title: "Contamination Detection", blurb: "n-gram overlap, embedding proximity, and perplexity tells that reveal whether eval items leaked into training data." },
  { id: "canary-trap", num: "08", module: 3, kicker: "Canary", title: "Canary Strings & Trap Items", blurb: "Plant uniquely identifiable markers and impossible items so memorization and gaming show up as anomalies, not silent score inflation." },
  { id: "private-rotating", num: "09", module: 3, kicker: "Hygiene", title: "Private & Rotating Sets", blurb: "Hold out private splits, refresh on a cadence, and version eval sets so today's number is comparable to yesterday's." },

  /* -------- Module 4: Automatic Scoring -------- */
  { id: "exact-match", num: "10", module: 4, kicker: "String", title: "Exact Match & Token F1", blurb: "Normalization first, then exact match or token-level F1 — cheap, deterministic, and blind to meaning it was not told to check." },
  { id: "overlap-metrics", num: "11", module: 4, kicker: "Overlap", title: "BLEU/ROUGE and Their Limits", blurb: "n-gram precision and recall reward surface overlap; they punish correct paraphrase just as hard as incorrect content." },
  { id: "programmatic-grading", num: "12", module: 4, kicker: "Verifier", title: "Execution & Programmatic Grading", blurb: "Unit tests, regexes, and checkers turn open-ended output into a pass/fail oracle — the backbone of code and math eval." },

  /* -------- Module 5: LLM-as-Judge -------- */
  { id: "judge-rubric", num: "13", module: 5, kicker: "Rubric", title: "Rubric Design & Pointwise Scoring", blurb: "Criteria, anchors, and output schema. A judge is only as good as the rubric that tells it what a 3 means versus a 4." },
  { id: "pairwise-judge", num: "14", module: 5, kicker: "Pairwise", title: "Pairwise Comparison & Win Rates", blurb: "Compare two answers instead of scoring one. Lower variance, harder aggregation, and the Bradley-Terry bridge to Elo." },
  { id: "judge-bias", num: "15", module: 5, kicker: "Bias", title: "Judge Bias: Position, Length, Self", blurb: "The referee has preferences. Swap order, control for length, avoid same-family judges — then measure what is left." },

  /* -------- Module 6: Human & Arena Evaluation -------- */
  { id: "annotation-protocol", num: "16", module: 6, kicker: "Protocol", title: "Annotation Protocols & Guidelines", blurb: "Instructions, gold items, adjudication, and rater calibration decide whether human labels are a measurement or an opinion pool." },
  { id: "inter-annotator", num: "17", module: 6, kicker: "Agreement", title: "Inter-Annotator Agreement", blurb: "Percent agreement is inflated by chance; Cohen's kappa subtracts it. If raters cannot agree, the task itself may be ill-defined." },
  { id: "arena-elo", num: "18", module: 6, kicker: "Elo", title: "Arena Elo & Leaderboards", blurb: "Live battles, Elo updates, and confidence around a rank — why an Elo gap is a distribution, not a fact." },

  /* -------- Module 7: Statistical Rigor -------- */
  { id: "confidence-intervals", num: "19", module: 7, kicker: "CI", title: "Confidence Intervals for Scores", blurb: "Every accuracy is a draw from a sampling distribution. Report the interval and the n that produced it, or the score is a rumor." },
  { id: "paired-tests", num: "20", module: 7, kicker: "Paired", title: "Paired Tests & McNemar", blurb: "Same items, two models: compare the discordant pairs. Paired tests are sharper than two independent confidence intervals." },
  { id: "bootstrap-multiple", num: "21", module: 7, kicker: "Resample", title: "Bootstrap & Multiple Comparisons", blurb: "Resample to build intervals without distributional assumptions — then pay the tax for every additional comparison you make." },

  /* -------- Module 8: Regression Gates & Monitoring -------- */
  { id: "regression-gate", num: "22", module: 8, kicker: "Gate", title: "Eval-Driven CI Gates", blurb: "Per-capability regression budgets turn evaluation into a release gate: no ship when a tested axis falls past its allowance." },
  { id: "prompt-regression", num: "23", module: 8, kicker: "Golden", title: "Prompt & Model Regression Testing", blurb: "A frozen golden set catches the quiet breakage a prompt tweak or fine-tune causes before users do." },
  { id: "online-drift", num: "24", module: 8, kicker: "Drift", title: "Online Monitoring & Drift Detection", blurb: "Score distributions move as inputs and populations shift. Sample production, track drift, and gate deploys on live evidence." },
];

/* ---- Module index helpers ---- */

export function evalIndex(id: string): number {
  return EVAL_JOURNEY.findIndex((j) => j.id === id);
}

export function evalNeighbors(id: string): { prev: EvalJourneyEntry | null; next: EvalJourneyEntry | null } {
  const i = evalIndex(id);
  return {
    prev: i > 0 ? EVAL_JOURNEY[i - 1] : null,
    next: i >= 0 && i < EVAL_JOURNEY.length - 1 ? EVAL_JOURNEY[i + 1] : null,
  };
}

export function evalModuleOf(id: string): EvalModule | null {
  const e = EVAL_JOURNEY.find((j) => j.id === id);
  return e ? EVAL_MODULES.find((m) => m.id === e.module) ?? null : null;
}

export function evalModuleJourney(moduleId: number): EvalJourneyEntry[] {
  return EVAL_JOURNEY.filter((j) => j.module === moduleId);
}
