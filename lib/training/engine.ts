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
