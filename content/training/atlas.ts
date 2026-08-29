export interface TrainDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const TRAIN_DOMAINS: TrainDomain[] = [
  { id: "foundations", num: "01", name: "Foundations", blurb: "What training is: the step loop, the loss, the optimizer." },
  { id: "memory", num: "02", name: "Memory & State", blurb: "Weights, gradients, optimizer moments, activations — the byte budget." },
  { id: "data-parallel", num: "03", name: "Data Parallelism", blurb: "Replicas, all-reduce, ZeRO-style state sharding." },
  { id: "model-parallel", num: "04", name: "Model Parallelism", blurb: "Tensor slicing, pipeline stages, bubbles, composites." },
  { id: "efficiency", num: "05", name: "Efficiency", blurb: "Checkpointing, mixed precision, overlap, MFU." },
  { id: "moe", num: "06", name: "Sparsity & MoE", blurb: "Routers, expert parallelism, load balancing." },
  { id: "budgeting", num: "07", name: "Run Budgeting", blurb: "Scaling laws, token budgets, cost math, failure modes." },
];

export interface TrainTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const TRAIN_TOPICS: TrainTopic[] = [
  { id: "what-is-training", domain: "foundations", title: "What is training?", kind: "scene", scene: "token-diet",
    summary: "Repeatedly nudging random weights until predictions stop being noise.",
    points: [
      "Training finds weights; inference uses them frozen.",
      "One step = forward + backward + optimizer update.",
      "The same step runs billions of times — efficiency compounds." ] },
  { id: "the-step", domain: "foundations", title: "Anatomy of a step", kind: "scene", scene: "one-step",
    summary: "Three beats that repeat for weeks.",
    points: [
      "Forward: batch flows through layers, loss measures surprise.",
      "Backward: chain rule sends blame upstream, layer by layer.",
      "Update: Adam moves each weight by a scaled, damped step." ] },
  { id: "loss-landscape", domain: "foundations", title: "Reading the loss curve", kind: "scene", scene: "loss-curve",
    summary: "The single number every operator watches.",
    points: [
      "Spikes: data shards with anomalies or LR too high.",
      "Plateaus: capacity or schedule limits, not bugs.",
      "Divergence: gradient explosion — check loss scaling and clipping." ] },
  { id: "optimizer-state", domain: "memory", title: "The AdamW bill", kind: "scene", scene: "memory-budget",
    summary: "Mixed precision multiplies weight bytes by 8x before activations.",
    points: [
      "bf16 weights + bf16 grads + fp32 m, v + fp32 master.",
      "7B model ≈ 112 GB of state on one GPU — impossible dense.",
      "ZeRO shards optimizer state across the data-parallel group." ] },
  { id: "activations", domain: "memory", title: "Activation memory", kind: "concept",
    summary: "The transient tensors between layers grow with batch × sequence × layers.",
    points: [
      "~34·hidden bytes per token per layer in bf16.",
      "Grows linearly with depth — the reason checkpointing exists.",
      "Sequence-parallelism and selective recompute trim it further." ] },
  { id: "data-parallel", domain: "data-parallel", title: "Data parallelism", kind: "scene", scene: "data-parallel",
    summary: "Same model, different data, one averaged gradient.",
    points: [
      "Every replica sees a disjoint micro-batch.",
      "Gradients are all-reduced so all replicas stay identical.",
      "Global batch = per-GPU batch × replicas." ] },
  { id: "allreduce", domain: "data-parallel", title: "Ring all-reduce", kind: "scene", scene: "ring-allreduce",
    summary: "Bandwidth-optimal averaging with 2(N-1)/N data movement per GPU.",
    points: [
      "Scatter-reduce phase, then gather phase — 2(N-1) steps.",
      "Cost per GPU is independent of cluster size (per tensor).",
      "Overlap with backward compute hides most of it." ] },
  { id: "zero", domain: "data-parallel", title: "ZeRO state sharding", kind: "concept",
    summary: "Stage 1/2/3 shard optimizer state, gradients, then weights.",
    points: [
      "Stage 1: shard Adam moments (biggest win per complexity).",
      "Stage 2: shard gradients too.",
      "Stage 3: shard weights — all-gather before each layer." ] },
  { id: "tensor-parallel", domain: "model-parallel", title: "Tensor parallelism", kind: "scene", scene: "tensor-parallel",
    summary: "Split individual matmuls across GPUs inside a layer.",
    points: [
      "Column-parallel then row-parallel pairs a transformer block.",
      "Two all-reduces per layer — needs fast intra-node links.",
      "Best kept within one node (NVLink domain)." ] },
  { id: "pipeline-parallel", domain: "model-parallel", title: "Pipeline parallelism", kind: "scene", scene: "pipeline-parallel",
    summary: "Layer-slice stages with micro-batches streaming through.",
    points: [
      "Bubble fraction = (p−1)/(m+p−1) — more micro-batches, smaller tax.",
      "1F1B interleaves forwards and backwards to cap memory.",
      "Activation stashing at stage boundaries." ] },
  { id: "checkpointing", domain: "efficiency", title: "Activation checkpointing", kind: "scene", scene: "checkpointing",
    summary: "Discard intermediates, recompute them during backward.",
    points: [
      "Store only segment boundaries: memory falls from O(L) to O(√L).",
      "Pays ~33% extra forward compute.",
      "Selective checkpointing recomputes only the cheapest-to-redo ops." ] },
  { id: "mixed-precision", domain: "efficiency", title: "Mixed precision & MFU", kind: "concept",
    summary: "bf16 compute with fp32 accumulation and master weights.",
    points: [
      "Loss scaling keeps small fp32 gradients alive.",
      "MFU = achieved / peak FLOPs; 35–50% is a good dense run.",
      "6·N·D FLOPs is the canonical training-cost estimate." ] },
  { id: "moe-routing", domain: "moe", title: "Mixture-of-Experts routing", kind: "scene", scene: "moe-routing",
    summary: "A learned router sends each token to top-k experts.",
    points: [
      "Total params grow; FLOPs per token stay near top-k dense cost.",
      "Load imbalance wastes expert capacity — aux losses rebalance.",
      "Expert parallelism places experts on different GPUs; all-to-all traffic." ] },
  { id: "scaling-laws", domain: "budgeting", title: "Chinchilla budgeting", kind: "scene", scene: "scaling-laws",
    summary: "Compute-optimal training uses ~20 tokens per parameter.",
    points: [
      "L(N) = A·N^-α + E fits loss vs scale across orders of magnitude.",
      "Over-training past optimal buys inference-cheap smaller models.",
      "Every run plan is a bet against this curve." ] },
  { id: "failure-modes", domain: "budgeting", title: "Long-run failure modes", kind: "concept",
    summary: "Weeks-long jobs die of many small things, not one big thing.",
    points: [
      "NaN loss from a bad shard — checkpoint and skip logic.",
      "Stragglers and hot GPUs poison synchronous steps.",
      "Loss spikes mid-run: rewind to a stable checkpoint and drop the batch window." ] },
  { id: "composites", domain: "budgeting", title: "3D parallelism in practice", kind: "concept",
    summary: "Real runs combine DP × TP × PP (+ EP) into one placement.",
    points: [
      "TP inside the node, PP across nodes, DP wraps everything.",
      "World size = DP × TP × PP (× EP for MoE).",
      "Every axis trades memory against communication differently." ] },
];
