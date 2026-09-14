/* Deterministic math for the Evaluation world.
   Every number a scene displays comes from here so tests can pin it. */

/* =============== Foundations: the measurement loop =============== */

/** Accuracy = correct / total. */
export function accuracy(correct: number, total: number): number {
  return total <= 0 ? 0 : correct / total;
}

/** Error rate = 1 - accuracy. */
export function errorRate(correct: number, total: number): number {
  return 1 - accuracy(correct, total);
}

/** Capability/alignment composite: two independently measured axes. */
export function twinAxisScore(capability: number, alignment: number): { mean: number; gap: number } {
  return { mean: (capability + alignment) / 2, gap: Math.abs(capability - alignment) };
}

/** Contamination risk from static reuse: grows with age, shrinks with rotation. */
export function leakageRisk(staticShare: number, ageRounds: number, rotationFrac: number): number {
  const rotated = staticShare * Math.pow(1 - rotationFrac, ageRounds);
  return Math.min(1, rotated + (1 - staticShare) * 0.05);
}

/* =============== Benchmark design =============== */

/** Item difficulty p = fraction of examinees answering correctly. */
export function difficultyIndex(correct: number, total: number): number {
  return accuracy(correct, total);
}

/** Item discrimination d = p(top group) - p(bottom group). */
export function itemDiscrimination(pTop: number, pBottom: number): number {
  return pTop - pBottom;
}

/** Coverage balance: share of items per capability leaf. */
export function coverageShare(leafItems: number, totalItems: number): number {
  return accuracy(leafItems, totalItems);
}

/** Herfindahl concentration of item counts across capability leaves (1 = all in one). */
export function coverageConcentration(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return counts.reduce((a, c) => a + (c / total) ** 2, 0);
}

/* =============== Contamination & integrity =============== */

function wordNgrams(text: string, n: number): string[] {
  const toks = text.toLowerCase().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i + n <= toks.length; i++) out.push(toks.slice(i, i + n).join(" "));
  return out;
}

/** Fraction of candidate n-grams also present in the corpus text. */
export function ngramOverlapRatio(candidate: string, corpus: string, n = 5): number {
  const cand = wordNgrams(candidate, n);
  if (cand.length === 0) return 0;
  const corpusSet = new Set(wordNgrams(corpus, n));
  const hits = cand.filter((g) => corpusSet.has(g)).length;
  return hits / cand.length;
}

/** Uplift from memorized (seen) to unseen items — the contamination tell. */
export function contaminationUplift(seenAcc: number, unseenAcc: number): number {
  return seenAcc - unseenAcc;
}

/** Count planted canary strings recovered verbatim in a model output. */
export function canaryHits(canaries: string[], output: string): number {
  return canaries.filter((c) => output.includes(c)).length;
}

/** Post-rotation ceiling: expected top score after refreshing part of the set. */
export function rotatedCeiling(priorAcc: number, rotationFrac: number, freshAcc: number): number {
  return priorAcc * (1 - rotationFrac) + freshAcc * rotationFrac;
}

/* =============== Automatic scoring =============== */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tighter normalization for answer keys: articles are dropped. */
function normalizeAnswer(text: string): string {
  return normalizeText(text).replace(/\b(a|an|the)\b/g, " ").replace(/\s+/g, " ").trim();
}

/** Normalized exact match as 1/0. */
export function exactMatchNorm(prediction: string, gold: string): number {
  return normalizeAnswer(prediction) === normalizeAnswer(gold) ? 1 : 0;
}

/** Token-level F1 over normalized bags of words (multiset intersection). */
export function tokenF1(prediction: string, gold: string): number {
  const p = normalizeText(prediction).split(" ").filter(Boolean);
  const g = normalizeText(gold).split(" ").filter(Boolean);
  if (p.length === 0 || g.length === 0) return 0;
  const pool = new Map<string, number>();
  for (const t of g) pool.set(t, (pool.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of p) {
    const left = pool.get(t) ?? 0;
    if (left > 0) { common++; pool.set(t, left - 1); }
  }
  const precision = common / p.length;
  const recall = common / g.length;
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
}

/** ROUGE-N recall: fraction of reference n-grams present in the candidate. */
export function rougeNRecall(reference: string, candidate: string, n = 2): number {
  const ref = wordNgrams(reference, n);
  if (ref.length === 0) return 0;
  const candSet = new Set(wordNgrams(candidate, n));
  return ref.filter((g) => candSet.has(g)).length / ref.length;
}

/** Brevity penalty for BLEU: <1 when the candidate is shorter than the reference. */
export function brevityPenalty(candLen: number, refLen: number): number {
  return candLen >= refLen || candLen <= 0 ? 1 : Math.exp(1 - refLen / candLen);
}

/** BLEU: weighted geometric mean of n-gram precisions with a brevity penalty. */
export function bleuScore(precisions: number[], candLen: number, refLen: number): number {
  if (precisions.length === 0 || precisions.some((p) => p <= 0)) return 0;
  const w = 1 / precisions.length;
  const logMean = precisions.reduce((a, p) => a + w * Math.log(p), 0);
  return Math.exp(logMean) * brevityPenalty(candLen, refLen);
}

/** pass@k: probability at least one of k samples is correct given c of n correct. */
export function passAtK(n: number, c: number, k: number): number {
  if (n - c < k) return 1;
  let prod = 1;
  for (let i = 0; i < k; i++) prod *= (n - c - i) / (n - i);
  return 1 - prod;
}

/* =============== LLM-as-judge =============== */

/** Positional bias: deviation from an even split between first and second. */
export function positionalBias(firstWins: number, total: number): number {
  return Math.abs(accuracy(firstWins, total) - 0.5);
}

/** Length bias: excess win rate attributable to the longer answer. */
export function lengthBiasRate(longWins: number, total: number): number {
  return Math.max(0, accuracy(longWins, total) - 0.5);
}

/** Self-preference: excess win rate when the judge shares the candidate's family. */
export function selfPreferenceRate(selfWins: number, total: number): number {
  return Math.max(0, accuracy(selfWins, total) - 0.5);
}

/** Bias-corrected win rate after averaging both answer orders. */
export function orderAveragedWinRate(firstOrderWins: number, secondOrderWins: number, total: number): number {
  return (accuracy(firstOrderWins, total) + accuracy(secondOrderWins, total)) / 2;
}

/** Length-controlled win rate: regress out the verbosity advantage. */
export function lengthControlledWinRate(rawWinRate: number, lengthDeltaFrac: number, slope = 0.08): number {
  return Math.max(0, Math.min(1, rawWinRate - slope * lengthDeltaFrac));
}

/* =============== Human & arena evaluation =============== */

/** Percent agreement between two raters. */
export function percentAgreement(agree: number, total: number): number {
  return accuracy(agree, total);
}

/** Cohen's kappa: chance-corrected agreement. */
export function cohensKappa(observed: number, expected: number): number {
  return expected >= 1 ? 0 : (observed - expected) / (1 - expected);
}

/** Expected agreement by chance from two raters' positive rates. */
export function chanceAgreement(raterAPos: number, raterBPos: number): number {
  return raterAPos * raterBPos + (1 - raterAPos) * (1 - raterBPos);
}

/** Elo expected score of A against B. */
export function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/** Elo rating update after a result (score in [0,1]). */
export function eloUpdate(ratingA: number, ratingB: number, score: number, k = 32): number {
  return ratingA + k * (score - eloExpected(ratingA, ratingB));
}

/** Win rate to Elo delta (logistic scale, k=400). */
export function eloDelta(winRate: number, k = 400): number {
  const wr = Math.min(0.999, Math.max(0.001, winRate));
  return k * Math.log10(wr / (1 - wr));
}

/* =============== Statistical rigor =============== */

/** Normal-approximation 95% CI half-width for a proportion. */
export function ciHalfWidth(n: number, p = 0.7): number {
  if (n <= 0) return 0;
  return 1.96 * Math.sqrt((p * (1 - p)) / n);
}

/** Sample size needed for a target half-width at 95% confidence. */
export function requiredSampleSize(halfWidth: number, p = 0.5): number {
  if (halfWidth <= 0) return 0;
  return Math.ceil(((1.96 / halfWidth) ** 2) * p * (1 - p));
}

/** McNemar chi-square on discordant pairs with continuity correction. */
export function mcnemarChi2(b: number, c: number): number {
  const denom = b + c;
  if (denom <= 0) return 0;
  return ((Math.abs(b - c) - 1) ** 2) / denom;
}

/** Two-sided p-value approximation for McNemar via chi-square(1). */
export function mcnemarP(b: number, c: number): number {
  const x = mcnemarChi2(b, c);
  if (x <= 0) return 1;
  // complementary error function approximation for chi-square(1)
  return Math.min(1, Math.max(0, Math.exp(-x / 2)));
}

interface BootstrapResult { mean: number; lo: number; hi: number; }

/** Deterministic percentile bootstrap over sample values (seeded LCG). */
export function bootstrapCI(values: number[], iterations = 1000, seed = 1): BootstrapResult {
  if (values.length === 0) return { mean: 0, lo: 0, hi: 0 };
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const means: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < values.length; j++) sum += values[Math.floor(next() * values.length)];
    means.push(sum / values.length);
  }
  means.sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    mean,
    lo: means[Math.floor(0.025 * iterations)],
    hi: means[Math.floor(0.975 * iterations)],
  };
}

/** Holm-Bonferroni step-down: number of hypotheses rejected at level alpha. */
export function holmRejected(pValues: number[], alpha = 0.05): number {
  const sorted = [...pValues].sort((a, b) => a - b);
  const m = sorted.length;
  let rejected = 0;
  for (let i = 0; i < m; i++) {
    if (sorted[i] <= alpha / (m - i)) rejected++;
    else break;
  }
  return rejected;
}

/* =============== Regression gates & monitoring =============== */

/** Signed change between two eval runs. */
export function regressionDelta(before: number, after: number): number {
  return after - before;
}

/** Per-capability gate: true when a regression exceeds its allowance. */
export function gateBreach(before: number, after: number, allowance: number): boolean {
  return regressionDelta(before, after) < -allowance;
}

/** Fraction of tested items that regressed against a frozen golden set. */
export function adverseRegressionRate(regressed: number, tested: number): number {
  return accuracy(regressed, tested);
}

/** Standardized drift between a baseline and a current population mean. */
export function driftScore(baselineMean: number, currentMean: number, baselineStd: number): number {
  if (baselineStd <= 0) return 0;
  return Math.abs(currentMean - baselineMean) / baselineStd;
}

/** Weighted composite of a capability scorecard. */
export function scorecardComposite(scores: number[], weights: number[]): number {
  const totalW = weights.reduce((a, b) => a + b, 0);
  if (totalW <= 0 || scores.length !== weights.length) return 0;
  return scores.reduce((a, s, i) => a + s * weights[i], 0) / totalW;
}
