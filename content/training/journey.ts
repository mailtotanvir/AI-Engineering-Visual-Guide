export interface TrainJourneyEntry {
  id: string;
  num: string;
  module: number;
  kicker: string;
  title: string;
  blurb: string;
}

export interface TrainModule {
  id: number;
  name: string;
  tagline: string;
}

/** The six modules of the training journey, ordered as taught. */
export const TRAIN_MODULES: TrainModule[] = [
  { id: 1, name: "Objectives & Paradigm", tagline: "What a model is actually asked to do, and why next-token prediction won." },
  { id: 2, name: "Data at Web Scale", tagline: "The pipeline that turns a multi-terabyte crawl into training tokens." },
  { id: 3, name: "The Pre-Train Recipe", tagline: "Scaling laws, RoPE, normalization, attention variants — the architectural spec." },
  { id: 4, name: "Distributed Infrastructure", tagline: "Hardware fabric, then the 3D parallelism that fills it." },
  { id: 5, name: "Precision & Acceleration", tagline: "Numerics, memory-bound kernels, and the recompute trade." },
  { id: 6, name: "Execution & Diagnostics", tagline: "Optimizers, schedules, initialization, telemetry, and surviving a crash." },
];

export const TRAIN_JOURNEY: TrainJourneyEntry[] = [
  /* -------- Module 1: objectives & context -------- */
  { id: "token-diet", num: "01", module: 1, kicker: "OBJECTIVES",
    title: "A model is grown, not built",
    blurb: "Weights start random. Every step shows the model one batch and nudges it — billions of times." },
  { id: "clm-vs-mlm", num: "02", module: 1, kicker: "OBJECTIVES",
    title: "Two ways to hide the answer",
    blurb: "Causal LM predicts every next token; masked LM fills blanks. The objective decides everything downstream." },
  { id: "one-step", num: "03", module: 1, kicker: "THE LOOP",
    title: "Forward, backward, update",
    blurb: "One training step in three beats: predict, attribute blame, move the weights." },
  { id: "causal-mask", num: "04", module: 1, kicker: "ATTENTION",
    title: "The mask that lets time flow one way",
    blurb: "Causal masking zeroes half the attention map — the mechanism behind autoregression, and a free compute win." },
  { id: "context-window", num: "05", module: 1, kicker: "CONTEXT",
    title: "The square the model must pay for",
    blurb: "Attention cost and memory grow with N². The context window is an arithmetic promise, not a marketing number." },

  /* -------- Module 2: data engineering -------- */
  { id: "crawl-filter", num: "06", module: 2, kicker: "DATA",
    title: "From crawl to corpus",
    blurb: "Heuristic filters — symbol ratios, language ID, text density — kill most of the web before a model sees it." },
  { id: "dedup", num: "07", module: 2, kicker: "DATA",
    title: "Delete first, train later",
    blurb: "MinHash + LSH find near-duplicates so the model memorizes the world once, not a million copies of it." },
  { id: "bpe", num: "08", module: 2, kicker: "TOKENIZER",
    title: "Building the vocabulary",
    blurb: "Byte-pair encoding grows a vocabulary from raw bytes — merge by merge, with rules that shape every token." },

  /* -------- Module 3: pre-train recipe -------- */
  { id: "scaling-laws", num: "09", module: 3, kicker: "BUDGETING",
    title: "Spend tokens like money",
    blurb: "Chinchilla says the compute-optimal ratio is ~20 tokens per parameter. Plan the run before burning it." },
  { id: "rope", num: "10", module: 3, kicker: "POSITION",
    title: "Position as rotation",
    blurb: "RoPE encodes position by rotating query and key pairs — relative distance falls out of the dot product." },
  { id: "norm-activation", num: "11", module: 3, kicker: "STABILITY",
    title: "RMSNorm and SwiGLU",
    blurb: "The small layers that keep a 100-layer network trainable: normalize, then gate." },
  { id: "gqa", num: "12", module: 3, kicker: "ATTENTION",
    title: "Sharing the KV cache",
    blurb: "Grouped-query attention lets query heads share K/V heads — cheaper memory with almost no quality loss." },

  /* -------- Module 4: distributed -------- */
  { id: "memory-budget", num: "13", module: 4, kicker: "MEMORY",
    title: "The state you pay to keep",
    blurb: "Weights are the cheap part. Gradients and Adam moments quadruple the bill before a single token flows." },
  { id: "data-parallel", num: "14", module: 4, kicker: "PARALLELISM I",
    title: "Copy everything, average the blame",
    blurb: "Data parallelism clones the model per GPU and all-reduces gradients every step." },
  { id: "ring-allreduce", num: "15", module: 4, kicker: "COLLECTIVES",
    title: "The ring that averages the world",
    blurb: "N GPUs trade gradient chunks around a ring — each sends and receives exactly twice." },
  { id: "tensor-parallel", num: "16", module: 4, kicker: "PARALLELISM II",
    title: "Slice the matrix itself",
    blurb: "Tensor parallelism splits every matmul across GPUs and syncs twice per layer." },
  { id: "pipeline-parallel", num: "17", module: 4, kicker: "PARALLELISM III",
    title: "An assembly line of layers",
    blurb: "Pipeline parallelism streams micro-batches through stage slices — and pays a bubble tax." },

  /* -------- Module 5: precision & acceleration -------- */
  { id: "precision", num: "18", module: 5, kicker: "NUMERICS",
    title: "Sixteen bits, carefully placed",
    blurb: "FP16 vs BF16 vs FP8: where the exponent bits go decides whether training survives." },
  { id: "checkpointing", num: "19", module: 5, kicker: "MEMORY II",
    title: "Forget on purpose, recompute later",
    blurb: "Activation checkpointing trades a third of compute for gigabytes of activation memory." },

  /* -------- Module 6: execution & diagnostics -------- */
  { id: "optimizer-schedule", num: "20", module: 6, kicker: "OPTIMIZATION",
    title: "AdamW and the cosine slide",
    blurb: "Decoupled weight decay, bias-corrected moments, warmup, and a learning rate that coasts downhill." },
  { id: "telemetry", num: "21", module: 6, kicker: "TELEMETRY",
    title: "Watching a run breathe",
    blurb: "Gradient norms, throughput, loss spikes, and the checkpoint machinery that survives a dead node." },
];

export function trainIndex(id: string): number {
  return TRAIN_JOURNEY.findIndex((j) => j.id === id);
}
export function trainNeighbors(id: string) {
  const i = trainIndex(id);
  return {
    prev: i > 0 ? TRAIN_JOURNEY[i - 1] : null,
    next: i >= 0 && i < TRAIN_JOURNEY.length - 1 ? TRAIN_JOURNEY[i + 1] : null,
  };
}
export function trainModuleOf(id: string): TrainModule | null {
  const e = TRAIN_JOURNEY.find((j) => j.id === id);
  return e ? TRAIN_MODULES.find((m) => m.id === e.module) ?? null : null;
}
