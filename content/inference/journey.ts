export interface InfModule {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const INF_MODULES: InfModule[] = [
  { id: "m1", num: "01", name: "Foundations of Inference & Execution",
    blurb: "Computational traits of the forward pass, the end-to-end request lifecycle, and the metric split that defines every serving SLO." },
  { id: "m2", num: "02", name: "Hardware Micro-Architecture & Silicon",
    blurb: "CPUs to LPUs, the Von Neumann bottleneck, warp scheduling on the H100, and the edge-versus-datacenter split." },
  { id: "m3", num: "03", name: "Transformation, Compilation & Quantization",
    blurb: "Precision ladders and PTQ math, graph fusion and pruning, and the compilers that lower model code to bare metal." },
  { id: "m4", num: "04", name: "The Runtime & Memory Management Layer",
    blurb: "Engine landscape, the KV cache problem, PagedAttention, radix-tree prefix reuse, and kernel-level attention." },
  { id: "m5", num: "05", name: "Interaction, Sampling & Constrained Generation",
    blurb: "The autoregressive token loop, distribution filters, and grammar-masked structured outputs." },
  { id: "m6", num: "06", name: "Serving Middleware, Frameworks & Scheduling",
    blurb: "vLLM and SGLang internals, continuous batching, chunked prefill, PD disaggregation, and speculative decoding." },
  { id: "m7", num: "07", name: "Distributed Inference & Infrastructure Scale",
    blurb: "Tensor, pipeline and expert parallelism, KV cache distribution, and edge-cloud hybrid pools." },
  { id: "m8", num: "08", name: "Production Operations, Deployment & FinOps",
    blurb: "Containers and KServe, cold starts, observability of saturation and drift, and run-cost optimization." },
];

export interface InfJourneyEntry {
  id: string;
  num: string;
  module: string;
  kicker: string;
  title: string;
  blurb: string;
}

export const INF_JOURNEY: InfJourneyEntry[] = [
  // M1 — Foundations
  { id: "decode-loop", num: "01", module: "m1", kicker: "FOUNDATIONS", title: "One token at a time",
    blurb: "An LLM never writes a sentence — it predicts the next token, then does it again." },
  { id: "prefill-decode", num: "02", module: "m1", kicker: "TWO PHASES", title: "Prefill reads. Decode writes.",
    blurb: "Your prompt is ingested in parallel; generation streams one token per step." },
  { id: "latency-timeline", num: "03", module: "m1", kicker: "METRICS & SLOs", title: "TTFT, TPOT and goodput",
    blurb: "The three numbers every inference SLO is made of." },
  // M2 — Silicon
  { id: "silicon-map", num: "04", module: "m2", kicker: "SILICON TOPOLOGY", title: "CPU, GPU, TPU, LPU",
    blurb: "Every substrate makes a different bet on parallelism, memory and flexibility." },
  { id: "memory-wall", num: "05", module: "m2", kicker: "MEMORY BANDWIDTH", title: "The wall every model hits",
    blurb: "Why decode stops being compute-bound and starts waiting on bytes." },
  { id: "warp-tensor", num: "06", module: "m2", kicker: "GPU MICRO-ARCH", title: "Warps and Tensor Cores",
    blurb: "Threads, SMs and matrix engines — how software maps onto H100 silicon." },
  // M3 — Transformation & Quantization
  { id: "quant-ladder", num: "07", module: "m3", kicker: "QUANTIZATION", title: "The precision ladder",
    blurb: "FP32 down to FP4: what each rung saves, and what calibration rescues." },
  { id: "graph-fusion", num: "08", module: "m3", kicker: "GRAPH OPTIMIZATION", title: "Fuse the graph",
    blurb: "Kernel fusion, dead-node elimination and constant folding shrink the launch tax." },
  { id: "ai-compiler", num: "09", module: "m3", kicker: "AI COMPILERS", title: "Model code to bare metal",
    blurb: "TVM, OpenXLA, TensorRT and MAX lower high-level graphs to tuned kernels." },
  // M4 — Runtime & Memory
  { id: "kv-cache", num: "10", module: "m4", kicker: "THE KV ECONOMY", title: "Half a megabyte per token",
    blurb: "Attention remembers its past in the KV cache — memory becomes the budget." },
  { id: "paged-kv", num: "11", module: "m4", kicker: "PAGED ATTENTION", title: "End the fragmentation tax",
    blurb: "Reserve exact blocks on demand instead of worst-case contiguous slabs." },
  { id: "radix-prefix", num: "12", module: "m4", kicker: "PREFIX CACHING", title: "Reuse what shared prompts pay for",
    blurb: "Radix trees match cached prefixes so multi-turn history is computed once." },
  // M5 — Sampling & Constrained Generation
  { id: "logits-pipeline", num: "13", module: "m5", kicker: "THE TOKEN LOOP", title: "Logits in, token out",
    blurb: "Temperature, top-k and top-p sculpt probabilities before the dice roll." },
  { id: "sampling", num: "14", module: "m5", kicker: "SAMPLING FILTERS", title: "Shape the distribution",
    blurb: "Low-level logic of the filters — and what each costs on hardware." },
  { id: "grammar-mask", num: "15", module: "m5", kicker: "STRUCTURED OUTPUTS", title: "Force valid JSON",
    blurb: "Grammar constraints mask impossible tokens before the softmax ever runs." },
  // M6 — Serving & Scheduling
  { id: "continuous-batching", num: "16", module: "m6", kicker: "BATCHING", title: "Never leave a slot empty",
    blurb: "A request finishes? Swap the next one in mid-generation." },
  { id: "chunked-prefill", num: "17", module: "m6", kicker: "CHUNKED PREFILL", title: "Decode never freezes",
    blurb: "Slice big prompts into micro-chunks so active decodes keep ticking." },
  { id: "pd-disagg", num: "18", module: "m6", kicker: "PD DISAGGREGATION", title: "Two pools, two appetites",
    blurb: "Compute-hungry prefill and memory-bound decode run on separate GPUs." },
  { id: "speculative", num: "19", module: "m6", kicker: "SPECULATIVE DECODING", title: "Draft cheaply, verify once",
    blurb: "A small model guesses several tokens; the big model checks them in one pass." },
  // M7 — Distributed
  { id: "tensor-pipeline", num: "20", module: "m7", kicker: "PARALLELISM", title: "Slice weights, chain layers",
    blurb: "Tensor parallelism inside a node, pipeline parallelism across it." },
  { id: "moe-routing", num: "21", module: "m7", kicker: "EXPERT PARALLELISM", title: "Route to a few experts",
    blurb: "MoE keeps trillion-parameter capacity while activating a sliver per token." },
  { id: "kv-offload", num: "22", module: "m7", kicker: "DISTRIBUTED CACHE", title: "KV caches across nodes",
    blurb: "Offload, stream and balance attention memory over the network fabric." },
  // M8 — Ops & FinOps
  { id: "cold-start", num: "23", module: "m8", kicker: "SERVERLESS", title: "The cold start tax",
    blurb: "Container pull plus weight loading decides whether your first request survives." },
  { id: "finops-mig", num: "24", module: "m8", kicker: "FINOPS", title: "Every slice of the GPU bills",
    blurb: "MIG slicing, spot pools and autoscaling turn utilization into run-cost." },
];

export function infIndex(id: string): number {
  return INF_JOURNEY.findIndex((j) => j.id === id);
}
export function infNeighbors(id: string) {
  const i = infIndex(id);
  return {
    prev: i > 0 ? INF_JOURNEY[i - 1] : null,
    next: i >= 0 && i < INF_JOURNEY.length - 1 ? INF_JOURNEY[i + 1] : null,
  };
}
export function infModuleOf(id: string): InfModule | undefined {
  const j = INF_JOURNEY.find((e) => e.id === id);
  return j ? INF_MODULES.find((m) => m.id === j.module) : undefined;
}
export function infModuleJourney(moduleId: string): InfJourneyEntry[] {
  return INF_JOURNEY.filter((j) => j.module === moduleId);
}
