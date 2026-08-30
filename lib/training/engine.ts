/* Deterministic math for the Training at Scale world.
   Every number a scene displays comes from here so tests can pin it. */

export interface TrainModelCfg {
  name: string;
  paramsB: number;
  layers: number;
  hidden: number;
  heads: number;
}

export const TRAIN_CFG_7B: TrainModelCfg = {
  name: "7B dense", paramsB: 7, layers: 32, hidden: 4096, heads: 32,
};
export const TRAIN_CFG_70B: TrainModelCfg = {
  name: "70B dense", paramsB: 70, layers: 80, hidden: 8192, heads: 64,
};
export const TRAIN_CFG_405B: TrainModelCfg = {
  name: "405B dense", paramsB: 405, layers: 126, hidden: 16384, heads: 128,
};

/** Weight bytes at a precision: 2 = bf16, 1 = fp8, 0.5 = 4-bit. */
export function weightBytesGB(paramsB: number, bytesPerParam: number): number {
  return paramsB * 1e9 * bytesPerParam / 1e9; // GB (decimal)
}

/** AdamW mixed-precision memory: weights(bf16) + grads(bf16) + Adam m,v(fp32) + fp32 master. */
export function trainMemoryGB(paramsB: number, bytesPerParam = 2): number {
  const w = bytesPerParam;
  const g = 2;         // grads bf16
  const adam = 8;      // m + v in fp32
  const master = 4;    // fp32 master weights
  return paramsB * (w + g + adam + master);
}

/** Megatron-style model-parallel sharding: TP t, PP p → per-GPU state bytes. */
export function shardedMemoryGB(paramsB: number, tp: number, pp: number, bytesPerParam = 2): number {
  return trainMemoryGB(paramsB, bytesPerParam) / (tp * pp);
}

/** Chinchilla-style compute-optimal token budget (20 tokens per parameter). */
export function chinchillaTokensB(paramsB: number): number {
  return paramsB * 20;
}

/** Power-law scaling loss: L(N) = A · N^-alpha + E (Kaplan/Chinchilla flavor). */
export function scalingLoss(paramsB: number): number {
  const E = 1.69, A = 406.4, alpha = 0.34;
  return E + A * Math.pow(paramsB, -alpha);
}

/** GPU-hours for a training run: 6 · N · D (FLOPs) over GPU FLOP-utilization. */
export function trainGpuHours(paramsB: number, tokensB: number, gpuTflops: number, mfu: number, gpus: number): number {
  const flops = 6 * paramsB * 1e9 * tokensB * 1e9;
  return flops / (gpuTflops * 1e12 * mfu) / 3600 / gpus;
}

/** Cost in dollars at an hourly rate. */
export function dollars(gpuHours: number, rate = 2.0): number {
  return gpuHours * rate;
}

/* ---------- pipeline parallelism ---------- */

export interface PipeConfig { microBatches: number; stages: number; }

/** Wall-clock bubble fraction: (p - 1) / (m + p - 1). */
export function bubbleFraction(microBatches: number, stages: number): number {
  return (stages - 1) / (microBatches + stages - 1);
}

export interface PipeCell { stage: number; slot: number; kind: "fwd" | "bwd" | "bubble"; }

/** 1F1B-style schedule cells for an animated Gantt. */
export function pipeSchedule(cfg: PipeConfig): PipeCell[] {
  const { microBatches: m, stages: p } = cfg;
  const cells: PipeCell[] = [];
  const slots = m + 2 * (p - 1);
  // Simplified GPipe-style ramp: forwards fill, then backwards drain.
  for (let s = 0; s < p; s++) {
    for (let i = 0; i < m; i++) {
      cells.push({ stage: s, slot: i + (p - 1 - s), kind: "fwd" });
      cells.push({ stage: s, slot: m + 2 * (p - 1) - 1 - (p - 1 - s) - (m - 1 - i) + (p - 1 - s), kind: "bwd" });
    }
  }
  // Normalize bwd placement: backwards run immediately after last fwd, mirrored ramp.
  for (let s = 0; s < p; s++) {
    const lastFwd = (m - 1) + (p - 1 - s);
    let bwd = lastFwd + 1 + s;
    for (let i = m - 1; i >= 0; i--) {
      cells.push({ stage: s, slot: bwd, kind: "bwd" });
      bwd += 1;
    }
  }
  // Remove duplicate bwd entries (first pass above is a coarse draft).
  return cells.filter((c, i, arr) => arr.findIndex((d) => d.stage === c.stage && d.slot === c.slot && d.kind === c.kind) === i);
}

/* ---------- ring all-reduce ---------- */

export interface RingStep { from: number; to: number; chunk: number; phase: "scatter" | "gather"; }

/** Ring all-reduce over N GPUs: N-1 scatter steps then N-1 gather steps. */
export function ringSteps(n: number): RingStep[] {
  const steps: RingStep[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let g = 0; g < n; g++) {
      steps.push({ from: g, to: (g + 1) % n, chunk: (g - i + n) % n, phase: "scatter" });
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let g = 0; g < n; g++) {
      steps.push({ from: g, to: (g + 1) % n, chunk: (g + 1 + i) % n, phase: "gather" });
    }
  }
  return steps;
}

/** Data moved per GPU in ring all-reduce: 2·(N-1)/N × tensor size. */
export function ringBytesN(n: number, tensorMB: number): number {
  return (2 * (n - 1) / n) * tensorMB;
}

/* ---------- data parallelism ---------- */

export interface DpGpu { grad: number[]; }

/** Split a global gradient into per-GPU shards (deterministic slices). */
export function shardGlobal(total: number, gpus: number): number[] {
  const per = Math.floor(total / gpus);
  const shards = Array.from({ length: gpus }, (_, i) => per + (i === gpus - 1 ? total - per * gpus : 0));
  return shards;
}

/* ---------- expert parallelism / MoE ---------- */

export interface MoEToken { id: number; expert: number; }

/** Deterministic hash router: token → expert (top-1 for the visual). */
export function routeTokens(count: number, experts: number): MoEToken[] {
  const out: MoEToken[] = [];
  for (let i = 0; i < count; i++) {
    // simple deterministic mix
    const h = (i * 2654435761) >>> 0;
    out.push({ id: i, expert: h % experts });
  }
  return out;
}

export function expertLoad(tokens: MoEToken[], experts: number): number[] {
  const load = Array.from({ length: experts }, () => 0);
  tokens.forEach((t) => load[t.expert]++);
  return load;
}

/** Max load imbalance factor: max load / perfect load. */
export function imbalance(load: number[]): number {
  const max = Math.max(...load);
  const avg = load.reduce((a, b) => a + b, 0) / load.length;
  return avg === 0 ? 1 : max / avg;
}

/* ---------- activation checkpointing ---------- */

/** Activation memory without checkpointing scales with layers; with it, with sqrt(L) + boundary. */
export function activationGB(layers: number, seq: number, batch: number, hidden: number, checkpointed: boolean): number {
  // ~34 * hidden bytes per token per layer (transformer rule of thumb, bf16 activations)
  const perLayerPerToken = 34 * hidden;
  const total = (perLayerPerToken * layers * seq * batch) / 1e9;
  if (!checkpointed) return total;
  const segments = Math.ceil(Math.sqrt(layers));
  const boundary = (perLayerPerToken * segments * seq * batch) / 1e9;
  const recomputeFrac = 1 / 3; // ~33% extra forward compute, classic number
  void recomputeFrac;
  return boundary + total * 0.0; // store only segment boundaries
}

export function recomputeOverhead(layers: number): number {
  return 1 / 3; // one extra forward per checkpoint segment ≈ +33% compute
}

export function segmentsFor(layers: number): number {
  return Math.ceil(Math.sqrt(layers));
}

/* ---------- loss curve ---------- */

export interface LossPoint { step: number; loss: number; }

/** Deterministic pseudo training curve: fast drop, slow tail, tiny noise (seeded). */
export function lossCurve(steps: number, seed = 7): LossPoint[] {
  const out: LossPoint[] = [];
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const base = 2.2 * Math.exp(-4.2 * x) + 1.75 + 0.28 * Math.exp(-14 * x);
    const noise = (rand() - 0.5) * 0.012 * (1 - x * 0.5);
    out.push({ step: i, loss: Math.max(1.4, base + noise) });
  }
  return out;
}

export function fmtGB(gb: number): string {
  return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;
}

export function fmtHours(h: number): string {
  if (h >= 24) return `${(h / 24).toFixed(1)} days`;
  return `${h.toFixed(1)} h`;
}

/* =============== MODULE 1: objectives & context =============== */

/** Fraction of the N² attention matrix that causal masking forbids: (N-1)/(2N). */
export function causalMaskFraction(seq: number): number {
  return (seq - 1) / (2 * seq);
}

/** Predictions scored per forward pass: CLM scores seq-1 tokens; MLM scores maskRate·seq. */
export function clmTargets(seq: number): number {
  return seq - 1;
}
export function mlmTargets(seq: number, maskRate: number): number {
  return Math.round(seq * maskRate);
}

/** Token pairs in an attention map: O(N²). */
export function attentionPairs(seq: number): number {
  return seq * seq;
}

/** Bytes of one materialized attention score tensor (heads × seq², bf16), one layer. */
export function attentionScoreGB(seq: number, heads: number, bytesPer = 2): number {
  return (heads * seq * seq * bytesPer) / 1e9;
}

/** KV cache bytes: 2 (K+V) × layers × kvHeads × headDim × seq × batch × bytes. */
export function kvCacheGB(layers: number, kvHeads: number, headDim: number, seq: number, batch: number, bytesPer = 2): number {
  return (2 * layers * kvHeads * headDim * seq * batch * bytesPer) / 1e9;
}

/** KV cache savings of GQA/MQA vs full MHA: 1 − kvHeads/qHeads. */
export function kvSavings(qHeads: number, kvHeads: number): number {
  return 1 - kvHeads / qHeads;
}

/* =============== MODULE 3: RoPE =============== */

/** RoPE rotation angle for position p, dimension pair i, head dim d: p·θ^-2i/d. */
export function ropeAngle(pos: number, pair: number, headDim: number, thetaBase = 10000): number {
  return pos * Math.pow(thetaBase, (-2 * pair) / headDim);
}

/** Rotate a 2-D (x,y) pair by angle a (radians). */
export function ropeRotate(x: number, y: number, a: number): { x: number; y: number } {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Alias error when extrapolating beyond trained length: relative drift of cos at pos vs the trained anchor. */
export function ropeDrift(pos: number, trainedPos: number, pair: number, headDim: number): number {
  const a = ropeAngle(pos, pair, headDim);
  const anchor = ropeAngle(trainedPos, pair, headDim);
  return Math.abs(Math.cos(a) - Math.cos(anchor));
}

/* =============== MODULE 5: precision & kernels =============== */

export interface PrecisionSpec {
  name: string;
  bits: number;
  expBits: number;
  mantissaBits: number;
  bytesPerParam: number;
  emax: number; // max exponent → overflow threshold ≈ 2^emax
}

export const PRECISIONS: PrecisionSpec[] = [
  { name: "FP32", bits: 32, expBits: 8, mantissaBits: 23, bytesPerParam: 4, emax: 127 },
  { name: "FP16", bits: 16, expBits: 5, mantissaBits: 10, bytesPerParam: 2, emax: 15 },
  { name: "BF16", bits: 16, expBits: 8, mantissaBits: 7, bytesPerParam: 2, emax: 127 },
  { name: "FP8 E4M3", bits: 8, expBits: 4, mantissaBits: 3, bytesPerParam: 1, emax: 8 },
];

/** Relative quantization step ≈ 2^-(mantissa+1): the noise floor of a format. */
export function quantStep(spec: PrecisionSpec): number {
  return Math.pow(2, -(spec.mantissaBits + 1));
}

/** Dynamic loss scaling: halve on overflow, grow 2× per clean step, capped. */
export function nextLossScale(scale: number, overflow: boolean, cap = 2 ** 24): number {
  return overflow ? scale / 2 : Math.min(cap, scale * 2);
}

/** Would a gradient overflow this format's exponent range at the given scale? */
export function overflows(maxGrad: number, scale: number, spec: PrecisionSpec): boolean {
  return maxGrad * scale > Math.pow(2, spec.emax);
}

/** Does a tiny gradient underflow to zero in this format's subnormal range? */
export function underflows(minGrad: number, spec: PrecisionSpec): boolean {
  return minGrad < Math.pow(2, -(spec.emax + spec.mantissaBits + 1));
}

/** FlashAttention SRAM tile edge: √(SRAM bytes / row bytes) for bf16 Q,K rows. */
export function flashTileEdge(sramKB: number, headDim: number): number {
  const rowBytes = headDim * 2 * 2; // Q row + K row, bf16
  return Math.max(1, Math.floor(Math.sqrt((sramKB * 1024) / rowBytes)));
}

/** Number of Q-tiles the score matrix is tiled into (each K tile is re-read per Q tile). */
export function flashTiles(seq: number, sramKB: number, headDim: number): number {
  return Math.ceil(seq / flashTileEdge(sramKB, headDim));
}

/** HBM read amplification vs materializing scores once: ~tiles per K/V block. */
export function flashReadFactor(seq: number, sramKB: number, headDim: number): number {
  return flashTiles(seq, sramKB, headDim);
}

/* =============== MODULE 6: optimizer, init, telemetry =============== */

/** Cosine LR with linear warmup. Returns the raw multiplier (multiply by peak LR). */
export function cosineLr(step: number, total: number, warmupFrac = 0.02, minFrac = 0.1): number {
  const warmup = Math.max(1, Math.floor(total * warmupFrac));
  if (step < warmup) return step / warmup;
  const p = Math.min(1, (step - warmup) / Math.max(1, total - warmup));
  return minFrac + (1 - minFrac) * 0.5 * (1 + Math.cos(Math.PI * p));
}

/** One AdamW step (decoupled weight decay). Deterministic and unit-testable. */
export function adamwStep(w: number, g: number, m: number, v: number, lr: number, t: number,
  beta1 = 0.9, beta2 = 0.999, eps = 1e-8, wd = 0.1): { w: number; m: number; v: number } {
  const m2 = beta1 * m + (1 - beta1) * g;
  const v2 = beta2 * v + (1 - beta2) * g * g;
  const mHat = m2 / (1 - Math.pow(beta1, t));
  const vHat = v2 / (1 - Math.pow(beta2, t));
  return { w: w - lr * (mHat / (Math.sqrt(vHat) + eps) + wd * w), m: m2, v: v2 };
}

/** GPT-2 style scaled residual init: std = base / √(2·layers). */
export function residualInitStd(base: number, layers: number): number {
  return base / Math.sqrt(2 * layers);
}

/** Forward signal growth across depth: per-layer residual gain compounded. */
export function signalThroughDepth(layers: number, perLayerGain: number): number {
  return Math.pow(perLayerGain, layers);
}

/** Deterministic telemetry: grad-norm trace with one spike window (seeded). */
export function gradNormTrace(steps: number, spikeAt: number, seed = 11): number[] {
  const out: number[] = [];
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  for (let i = 0; i < steps; i++) {
    const base = 1.0 + 0.15 * Math.sin(i / 9);
    const spike = i >= spikeAt && i < spikeAt + 4 ? 4 + (i - spikeAt) * 3 : 0;
    out.push(base + (rand() - 0.5) * 0.2 + spike);
  }
  return out;
}

/* =============== MODULE 2: data curation & tokenizer =============== */

/** Fraction of characters that are letters or whitespace — the crudest quality filter. */
export function symbolRatio(text: string): number {
  const ok = (text.match(/[A-Za-z\s]/g) ?? []).length;
  return text.length === 0 ? 0 : ok / text.length;
}

export interface CrawlDoc { id: number; hash: number; symbol: number; lang: string; }

/** Deterministic fake crawl for scenes: hashed docs with quality signals. */
export function crawlDocs(count: number, seed = 3): CrawlDoc[] {
  const out: CrawlDoc[] = [];
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  for (let i = 0; i < count; i++) {
    out.push({
      id: i,
      hash: ((i * 2654435761) >>> 0) % 1000,
      symbol: 0.2 + rand() * 0.78,
      lang: rand() < 0.82 ? "en" : "other",
    });
  }
  return out;
}

/** Heuristic filter: symbol ratio + language ID thresholds. */
export function passesFilter(doc: CrawlDoc, minSymbol: number): boolean {
  return doc.symbol >= minSymbol && doc.lang === "en";
}

/** MinHash LSH bucket for a doc hash and band index (deterministic). */
export function lshBucket(hash: number, band: number, bands: number): number {
  return (hash ^ (band * 0x9E3779B9)) % 997;
}

/** Count distinct MinHash buckets across all bands — near-duplicate candidates share buckets. */
export function dedupKeep(docHashes: number[]): number {
  return new Set(docHashes).size;
}

/** Near-duplicate groups: hashes seen more than once (bucket level). */
export function dupGroups(bucketIds: number[]): number {
  const seen = new Map<number, number>();
  bucketIds.forEach((b) => seen.set(b, (seen.get(b) ?? 0) + 1));
  let groups = 0;
  seen.forEach((c) => { if (c > 1) groups += 1; });
  return groups;
}

/** Apply the first applicable BPE merge to a symbol sequence. */
export function bpeMergeOnce(symbols: string[], merges: Array<[string, string]>): { symbols: string[]; merged: string | null } {
  for (const [a, b] of merges) {
    for (let i = 0; i < symbols.length - 1; i++) {
      if (symbols[i] === a && symbols[i + 1] === b) {
        const next = symbols.slice(0, i).concat(a + b, symbols.slice(i + 2));
        return { symbols: next, merged: a + b };
      }
    }
  }
  return { symbols, merged: null };
}

/** Run BPE to a fixed point. */
export function bpeFull(text: string, merges: Array<[string, string]>): string[] {
  let symbols = Array.from(text);
  let merging = true;
  let guard = 0;
  while (merging && guard++ < 64) {
    const r = bpeMergeOnce(symbols, merges);
    if (r.merged === null) merging = false;
    else symbols = r.symbols;
  }
  return symbols;
}

/** UTF-8 byte length of a string (multi-byte chars cost more than one token slot). */
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Synthetic-data blend: quality-scored mix that upweights synthetic textbooks. */
export function blendWeights(syntheticShare: number): { web: number; code: number; math: number; synthetic: number } {
  const synth = Math.min(0.4, Math.max(0, syntheticShare));
  const rest = 1 - synth;
  return { web: rest * 0.72, code: rest * 0.17, math: rest * 0.11, synthetic: synth };
}
