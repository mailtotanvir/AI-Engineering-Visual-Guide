/* Deterministic math for the Post-Training & Alignment world.
   Every number a scene displays comes from here so tests can pin it. */

/* =============== MODULE 1: the post-training gap =============== */

/** Data-volume disparity: pre-training corpus tokens vs. post-training tokens. */
export function dataScaleRatio(preTokensB: number, postTokensM: number): number {
  return (preTokensB * 1e9) / (postTokensM * 1e6);
}

/** Distribution alignment: fraction of assistant-style completions in raw web text. */
export function assistantShare(webPct: number, curatedPct: number, curatedFrac: number): number {
  return webPct * (1 - curatedFrac) + curatedPct * curatedFrac;
}

/** Base-vs-instruct behavioral gap score on a 0-1 instruction-following rubric. */
export function instructGapScore(baseScore: number, sftScore: number): number {
  return Math.max(0, sftScore - baseScore);
}

/* =============== SFT mechanics =============== */

/** Token count actually scored: completion tokens only (masking the prompt). */
export function sftLossTokens(promptToks: number, completionToks: number, maskPrompt: boolean): number {
  return maskPrompt ? completionToks : promptToks + completionToks;
}

/** Effective epochs over a dataset given global batch size. */
export function epochs(steps: number, globalBatch: number, datasetToks: number): number {
  return (steps * globalBatch) / datasetToks;
}

/** Overfit detector: valid loss rising while train loss falls. */
export function overfitGap(trainLoss: number, validLoss: number): number {
  return validLoss - trainLoss;
}

/** Loss on one SFT batch: mean cross-entropy over completion positions. */
export function sftBatchLoss(targetProbs: number[]): number {
  if (targetProbs.length === 0) return 0;
  return -(targetProbs.reduce((a, p) => a + Math.log(Math.max(1e-9, p)), 0)) / targetProbs.length;
}

/** Data-decay blend weight: new-domain data share across CPT steps. */
export function cptBlend(step: number, total: number, peak = 0.7): number {
  return peak * Math.min(1, step / Math.max(1, total * 0.2));
}

/** Generic-capacity retention after specialization: 1 - forgetting rate. */
export function retention(forgettingRate: number, replayShare: number): number {
  return Math.max(0, 1 - forgettingRate * (1 - replayShare));
}

/* =============== LoRA / QLoRA math =============== */

export interface LoraCfg { rank: number; targetFrac: number; }

/** Trainable-parameter share of LoRA: 2·r·(d_in + d_out) per targeted matrix. */
export function loraParamsM(paramsB: number, cfg: LoraCfg, avgDim = 4096): number {
  // fraction of params living in targeted square-ish matrices
  const targeted = paramsB * 1e9 * cfg.targetFrac;
  // per matrix of side d: original d², LoRA adds 2·r·2d = 4·r·d
  const perOrig = avgDim * avgDim;
  const perLora = 4 * cfg.rank * avgDim;
  return (targeted * (perLora / perOrig)) / 1e6;
}

export function loraTrainableFrac(paramsB: number, cfg: LoraCfg, avgDim = 4096): number {
  return loraParamsM(paramsB, cfg, avgDim) / (paramsB * 1e3);
}

/** QLoRA memory: 4-bit base (0.5 B/param) + LoRA weights (bf16) + small optimizer. */
export function qloraMemoryGB(paramsB: number, cfg: LoraCfg, avgDim = 4096): number {
  const base4bit = paramsB * 0.55; // 0.5 base + ~0.05 quant constants
  const loraGB = (loraParamsM(paramsB, cfg, avgDim) * 1e6 * 16) / 1e9; // 16 B/param full AdamW state
  return base4bit + loraGB;
}

/** Full fine-tune memory: 16 bytes/param (bf16 + grads + Adam fp32 + master). */
export function fullFtMemoryGB(paramsB: number): number {
  return paramsB * 16;
}

/* =============== RLHF: Bradley-Terry & reward models =============== */

/** Bradley-Terry probability that y_w beats y_l: sigmoid(r_w - r_l). */
export function bradleyTerry(rWinner: number, rLoser: number): number {
  return 1 / (1 + Math.exp(-(rWinner - rLoser)));
}

/** Preference-pair loss for a reward model: -log σ(r_w − r_l). */
export function preferenceLoss(rWinner: number, rLoser: number): number {
  const p = Math.max(1e-9, bradleyTerry(rWinner, rLoser));
  return -Math.log(p);
}

/** Reward model accuracy over pairs given a reward-margin threshold. */
export function rewardAccuracy(margins: number[]): number {
  if (margins.length === 0) return 0;
  return margins.filter((m) => m > 0).length / margins.length;
}

/** Outcome vs process reward signal purity. */
export function signalPurity(outcomeNoise: number, processNoise: number): { outcome: number; process: number } {
  return { outcome: 1 - outcomeNoise, process: 1 - processNoise };
}

/* =============== PPO =============== */

/** PPO clipped surrogate objective for one token. */
export function ppoObjective(ratio: number, advantage: number, clip = 0.2): number {
  const unclipped = ratio * advantage;
  const clipped = Math.min(Math.max(ratio, 1 - clip), 1 + clip) * advantage;
  return Math.min(unclipped, clipped);
}

/** Probability ratio π(a)/π_old(a). */
export function probRatio(logpNew: number, logpOld: number): number {
  return Math.exp(logpNew - logpOld);
}

/** KL penalty term added to the reward: −β·KL(π‖π_ref). */
export function klPenalty(kl: number, beta: number): number {
  return -beta * kl;
}

/** GAE(λ) for a tiny 2-step trace: discounted TD residuals blended by λ. */
export function gae2(r0: number, r1: number, v0: number, v1: number, v2: number,
  gamma = 0.99, lam = 0.95): number {
  const delta0 = r0 + gamma * v1 - v0;
  const delta1 = r1 + gamma * v2 - v1;
  return delta0 + gamma * lam * delta1;
}

/** Actor-critic GPU bill: policy + reference + reward + value models. */
export function ppoModelCount(withReward: boolean, withValue: boolean): number {
  return 1 + 1 + (withReward ? 1 : 0) + (withValue ? 1 : 0);
}

/* =============== DPO & variants =============== */

/** DPO loss: −log σ(β·((π/π_ref)|y_w) − (π/π_ref)|y_l)). */
export function dpoLoss(logpW: number, logpRefW: number, logpL: number, logpRefL: number, beta = 0.1): number {
  const zW = logpW - logpRefW;
  const zL = logpL - logpRefL;
  const z = beta * (zW - zL);
  return -Math.log(Math.max(1e-9, 1 / (1 + Math.exp(-z))));
}

/** DPO implicit reward: β·log(π/π_ref). */
export function dpoImplicitReward(logp: number, logpRef: number, beta = 0.1): number {
  return beta * (logp - logpRef);
}

/** IPO loss regularizes toward a fixed margin instead of pure separation. */
export function ipoLoss(logpW: number, logpRefW: number, logpL: number, logpRefL: number,
  beta = 0.1, tau = 0.5): number {
  const zW = logpW - logpRefW;
  const zL = logpL - logpRefL;
  const diff = beta * (zW - zL) - 2 * tau;
  return diff * diff / (4 * tau);
}

/** KTO utility gain: value function over chosen (win) vs rejected (loss) outcomes. */
export function ktoValue(outcome: "win" | "loss", reward: number, beta = 0.1,
  lambdaW = 1.0, lambdaL = 1.0, refReward = 0, ku = 1.0): number {
  const margin = beta * (reward - refReward);
  if (outcome === "win") return lambdaW - ku * Math.exp(-margin);
  return lambdaL - ku * Math.exp(margin);
}

/** SimPO length-normalized reward margin (no reference model at all). */
export function simpoMargin(logpW: number, lenW: number, logpL: number, lenL: number,
  beta = 0.1, gamma = 0.5): number {
  return beta * (logpW / lenW - logpL / lenL) - gamma;
}

/** Offline vs online DPO data efficiency. */
export function onPolicyRoundAdvantage(offAcc: number, onAcc: number, rounds: number): number {
  return Math.pow(onAcc / Math.max(1e-9, offAcc), rounds);
}

/* =============== RLVR / GRPO =============== */

/** Group-relative advantage: (r − mean) / (std + ε) over a sampled group. */
export function groupAdvantage(rewards: number[], idx: number, eps = 1e-4): number {
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const varr = rewards.reduce((a, b) => a + (b - mean) ** 2, 0) / rewards.length;
  const std = Math.sqrt(varr);
  return (rewards[idx] - mean) / (std + eps);
}

/** Verifier outcomes → rewards: 1 correct, 0 wrong, partial for format. */
export function verifyReward(correct: boolean, formatOk: boolean, partial = 0.1): number {
  return correct ? 1 : formatOk ? partial : 0;
}

/** Pass@k from a set of graded samples: 1 − C(n−k, c)/C(n, c). */
export function passAtK(n: number, c: number, k: number): number {
  if (n - c < k) return 1;
  let prod = 1;
  for (let i = 0; i < k; i++) prod *= (n - c - i) / (n - i);
  return 1 - prod;
}

/** GRPO vs PPO memory: critic value-model params eliminated. */
export function grpoSavedMemoryGB(criticParamsB: number, bytesPerParam = 16): number {
  return criticParamsB * bytesPerParam;
}

/** Reward hacking leakage rate when only outcome rewards are used. */
export function hackLeak(outcomeOnly: boolean, formatPenalty: number): number {
  return outcomeOnly ? 0.35 * (1 - formatPenalty) : 0.05 * (1 - formatPenalty);
}

/** Test-time compute scaling: accuracy vs samples drawn (self-consistency). */
export function testTimeAccuracy(k: number, singleAcc: number): number {
  // majority-vote curve: diminishing returns over k samples
  const p = Math.min(0.999, Math.max(1e-9, singleAcc));
  return p ** (1 / Math.max(1, k * 0.55));
}

/** Chain-of-thought token budget vs direct answer. */
export function cotTokens(directTokens: number, reasoningDepth: number): number {
  return Math.round(directTokens * (1 + reasoningDepth * 8));
}

/* =============== Safety =============== */

/** Refusal calibration: over-refusal vs helpfulness frontier point. */
export function refusalFrontier(safetyTraining: number, refusalWeight: number): { helpful: number; refusals: number } {
  const refusals = Math.min(1, safetyTraining * refusalWeight);
  const helpful = 1 - 0.35 * refusals * refusals; // quadratic over-refusal cost
  return { helpful, refusals };
}

/** Jailbreak success rate declining with training rounds (red-team loop). */
export function jailbreakRate(rounds: number, initialRate = 0.8, decay = 0.55): number {
  return initialRate * Math.pow(decay, rounds);
}

/** Constitutional AI revision loop: violation rate per revision pass. */
export function cauViolationRate(pass: number, initial = 0.42, decay = 0.6): number {
  return initial * Math.pow(decay, pass);
}

/** RLAIF agreement with a human panel at judge scale. */
export function judgeAgreement(samples: number, base = 0.72): number {
  return Math.min(0.95, base + 0.2 * Math.log10(Math.max(10, samples)) / Math.log10(1000));
}

/** Refusal margin on a harmful prompt: distance from refusal threshold. */
export function refusalMargin(safetyScore: number, threshold = 0.5): number {
  return safetyScore - threshold;
}

/* =============== Evals =============== */

/** Benchmark contamination: uplift on seen vs unseen items. */
export function contaminationUplift(seenAcc: number, unseenAcc: number): number {
  return seenAcc - unseenAcc;
}

/** LLM-judge positional bias: win-rate flip when answer order swaps. */
export function positionalBiasWinrate(judgePrefersFirst: number): number {
  return Math.abs(judgePrefersFirst - 0.5);
}

/** Length bias: judge preference for the longer response. */
export function lengthBiasRate(judgeLongerWins: number): number {
  return Math.max(0, judgeLongerWins - 0.5);
}

/** Pairwise battle win rate → Bradley-Terry style Elo delta. */
export function eloDelta(winRate: number, k = 400): number {
  const wr = Math.min(0.999, Math.max(0.001, winRate));
  return k * Math.log10(wr / (1 - wr));
}

/** 95% CI half-width for a benchmark accuracy (normal approx, n items). */
export function ciHalfWidth(n: number, acc = 0.7): number {
  return 1.96 * Math.sqrt(acc * (1 - acc) / Math.max(1, n));
}

/* =============== Multimodal, agentic, quantization =============== */

/** Multimodal post-train token mix: text vs interleaved image/audio tokens. */
export function mmTokenShare(imageDocsFrac: number, tokensPerImage: number, tokensPerDoc: number): number {
  const img = imageDocsFrac * tokensPerImage;
  const txt = (1 - imageDocsFrac) * tokensPerDoc + imageDocsFrac * tokensPerDoc;
  return img / (img + txt);
}

/** Agentic tool-call success: composite of call syntax + argument fidelity. */
export function toolCallSuccess(syntaxAcc: number, argAcc: number, retryHelps = 0.3): number {
  const base = syntaxAcc * argAcc;
  return Math.min(1, base + (1 - base) * retryHelps);
}

/** Trajectory-level reward vs per-step reward credit sharpness. */
export function trajectoryCreditBlur(steps: number): number {
  return 1 / Math.sqrt(steps);
}

/** GPTQ/AWQ style error: relative weight-perturbation introduced by r-bit grouping. */
export function quantError(rBits: number, groupSize: number): number {
  return Math.pow(2, -rBits) * Math.sqrt(1 / groupSize) * 0.5;
}

/** Model quality retained after r-bit grouped quantization. */
export function quantRetained(rBits: number, groupSize: number): number {
  return 1 - quantError(rBits, groupSize) * 4;
}

/** VRAM for a model at bits per weight. */
export function serveMemoryGB(paramsB: number, bitsPerWeight: number): number {
  return (paramsB * 1e9 * (bitsPerWeight / 8)) / 1e9;
}

/** FP8 calibration set size vs downstream KL divergence (deterministic curve). */
export function calibKL(calibSamples: number): number {
  return 0.05 * Math.pow(Math.max(10, calibSamples) / 10, -0.25);
}

/** Distillation KL loss between teacher and student next-token distributions. */
export function distillKlLoss(pTeacher: number[], pStudent: number[]): number {
  let kl = 0;
  for (let i = 0; i < pTeacher.length; i++) {
    const pt = Math.max(1e-9, pTeacher[i]);
    const ps = Math.max(1e-9, pStudent[i]);
    kl += pt * Math.log(pt / ps);
  }
  return kl;
}

/** Temperature-softened distillation weighting. */
export function softTargets(temp: number): number {
  return Math.min(1, 1 / Math.max(1, temp)) * 0.7 + 0.3;
}
