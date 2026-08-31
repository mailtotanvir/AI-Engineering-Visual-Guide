export interface InfDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const INF_DOMAINS: InfDomain[] = [
  { id: "foundations", num: "01", name: "Foundations & Execution", blurb: "The forward pass, request lifecycle, TTFT/TPOT/goodput." },
  { id: "silicon", num: "02", name: "Silicon & Micro-Architecture", blurb: "CPUs, GPUs, TPUs, LPUs, the memory wall, warps and Tensor Cores." },
  { id: "quantization", num: "03", name: "Transformation & Quantization", blurb: "Precision ladders, PTQ math, graph fusion, sparsity, AI compilers." },
  { id: "kv-economy", num: "04", name: "Runtime & Memory Layer", blurb: "Engines, the KV cache problem, PagedAttention, radix reuse, FlashAttention." },
  { id: "decoding", num: "05", name: "Sampling & Constrained Generation", blurb: "The token loop, distribution filters, grammar-masked structured output." },
  { id: "batching", num: "06", name: "Serving Frameworks & Scheduling", blurb: "vLLM and SGLang internals, batching, chunked prefill, PD disaggregation, speculation." },
  { id: "distributed", num: "07", name: "Distributed Inference", blurb: "Tensor, pipeline and expert parallelism; KV caches across nodes; edge-cloud hybrids." },
  { id: "operations", num: "08", name: "Operations & FinOps", blurb: "Containers and KServe, cold starts, observability, MIG slicing, spot economics." },
];

export interface InfTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const INF_TOPICS: InfTopic[] = [
  /* 01 Foundations */
  { id: "what-is-inference", domain: "foundations", title: "What is inference?", kind: "scene", scene: "decode-loop",
    summary: "A forward pass that turns tokens into the next token.",
    points: [
      "Weights are frozen; only activations flow per request.",
      "No backprop, no optimizer state, no gradients — a fraction of training's memory.",
      "Autoregressive: each output token joins the input for the next step." ] },
  { id: "train-vs-serve", domain: "foundations", title: "Training vs serving", kind: "concept",
    summary: "Different workloads with opposite bottlenecks.",
    points: [
      "Training: huge batches, days-long runs, compute-bound everywhere.",
      "Serving: small batches, millisecond SLOs, memory-bandwidth-bound decode.",
      "Inference runs on every user message forever — efficiency compounds too." ] },
  { id: "request-lifecycle", domain: "foundations", title: "The request lifecycle", kind: "concept",
    summary: "Network ingress to detokenized egress, end to end.",
    points: [
      "Ingress and queueing happen before any GPU work is scheduled.",
      "Tokenizer, prefill, decode loop, detokenizer, SSE stream out.",
      "Every stage adds latency the SLO has to absorb." ] },
  { id: "ttft", domain: "foundations", title: "TTFT vs TPOT", kind: "scene", scene: "prefill-decode",
    summary: "Responsiveness and steady-state speed, measured separately.",
    points: [
      "TTFT is dominated by prefill over the prompt — parallel attention work.",
      "ITL/TPOT is the per-token cadence after the first token lands.",
      "Goodput counts only responses meeting both targets — throughput that honors the SLO." ] },
  { id: "tpot-goodput", domain: "foundations", title: "Throughput · goodput · E2EL", kind: "scene", scene: "latency-timeline",
    summary: "Steady-state speed versus requests that satisfy their SLO.",
    points: [
      "Throughput rises with batch size — and so do individual latencies.",
      "E2EL = TTFT + TPOT x output length; budget each segment.",
      "Latency timelines make the budget visible per request." ] },
  /* 02 Silicon */
  { id: "silicon-topology", domain: "silicon", title: "CPU · GPU · TPU · LPU", kind: "scene", scene: "silicon-map",
    summary: "Every substrate makes a different parallelism bet.",
    points: [
      "CPUs win on flexibility and irregular control flow.",
      "GPUs pair throughput with a mature software ecosystem.",
      "LPUs trade generality for deterministic, SRAM-resident execution." ] },
  { id: "von-neumann", domain: "silicon", title: "The memory-bottleneck bottleneck", kind: "scene", scene: "memory-wall",
    summary: "Decode transitions from compute-bound to memory-bound.",
    points: [
      "SRAM is fast and tiny; HBM is big and comparatively slow.",
      "One 7B FP16 token means streaming ~14 GB of weights.",
      "Roofline arithmetic intensity tells you which ceiling you hit." ] },
  { id: "warps-tensor-cores", domain: "silicon", title: "Warps, SMs, Tensor Cores", kind: "scene", scene: "warp-tensor",
    summary: "Software maps onto H100 silicon through threads and warps.",
    points: [
      "132 SMs, 64 warp slots each — resident warp density hides latency.",
      "Tensor Cores execute fused matrix-multiply-accumulate.",
      "Scheduling bubbles appear when occupancy drops." ] },
  { id: "edge-deploy", domain: "silicon", title: "Edge vs datacenter", kind: "concept",
    summary: "Watts and thermals replace racks and power budget.",
    points: [
      "Mobile NPUs run quantized few-billion-parameter models offline.",
      "Automotive and IoT impose hard real-time and safety constraints.",
      "Hyperscale farms the opposite trade: efficiency per token at any power." ] },
  /* 03 Quantization */
  { id: "quant-ladder", domain: "quantization", title: "The precision ladder", kind: "scene", scene: "quant-ladder",
    summary: "FP32 to FP4: size versus fidelity at every rung.",
    points: [
      "PTQ calibrates scales on real activation samples, not ideals.",
      "Weight-only quantization keeps activations in high precision.",
      "VRAM math: params x bits/8, plus a calibration-dependent quality bill." ] },
  { id: "graph-optimization", domain: "quantization", title: "Graph optimization", kind: "scene", scene: "graph-fusion",
    summary: "Fusion, dead-node elimination, constant folding.",
    points: [
      "Fused kernels remove intermediate global-memory round-trips.",
      "Dead nodes and folded constants shrink the launch count.",
      "Fewer launches mean less CPU-side dispatch overhead." ] },
  { id: "sparsity-pruning", domain: "quantization", title: "Sparsity & pruning", kind: "concept",
    summary: "Structure determines whether zeros buy speed.",
    points: [
      "2:4 structured sparsity executes at 2x on Tensor Core paths.",
      "Unstructured sparsity compresses storage but rarely the math.",
      "Pruning first, then quantizing, compounds the savings." ] },
  { id: "ai-compilers", domain: "quantization", title: "AI compilers", kind: "scene", scene: "ai-compiler",
    summary: "TVM, OpenXLA, TensorRT, Mojo/MAX lower graphs to bare metal.",
    points: [
      "Tiered lowering: graph passes, tile schedules, kernel emission.",
      "Autotuning searches schedules against the target's real memory system.",
      "The same graph compiles to different code per silicon generation." ] },
  /* 04 Runtime & memory */
  { id: "runtime-engines", domain: "kv-economy", title: "Runtime engines", kind: "concept",
    summary: "ONNX Runtime, TensorRT, TensorFlow Lite, ExecuTorch.",
    points: [
      "Each engine pairs a graph format with per-hardware execution providers.",
      "Engine choice decides which optimizations are even available.",
      "Portability and peak performance pull in opposite directions." ] },
  { id: "kv-anatomy", domain: "kv-economy", title: "KV cache anatomy", kind: "scene", scene: "kv-cache",
    summary: "Keys and Values for every layer, head and past token.",
    points: [
      "bytes/token = 2 x layers x kvHeads x headDim x dtypeBytes.",
      "Long contexts turn MBs into GBs before weights are counted.",
      "GQA shrinks it by sharing K/V heads across query heads." ] },
  { id: "paged-attention", domain: "kv-economy", title: "Paged attention", kind: "scene", scene: "paged-kv",
    summary: "Virtual memory paging applied to the KV cache.",
    points: [
      "Fixed-size blocks allocated on demand kill internal fragmentation.",
      "Block tables map logical positions to scattered physical pages.",
      "Copy-on-write enables cheap beam search and prefix forks." ] },
  { id: "prefix-caching", domain: "kv-economy", title: "Prefix & radix caching", kind: "scene", scene: "radix-prefix",
    summary: "Shared prompts reuse identical cache blocks automatically.",
    points: [
      "Radix trees match longest cached prefixes across requests.",
      "System prompts and multi-turn history hit cache every time.",
      "Large TTFT wins for templated workloads." ] },
  { id: "flash-attention", domain: "kv-economy", title: "FlashAttention & kernels", kind: "concept",
    summary: "Tiled attention keeps the softmax in SRAM.",
    points: [
      "Never materializes the full NxN attention matrix in HBM.",
      "IO-aware tiling turns bandwidth waste into compute headroom.",
      "Custom CUDA kernels and vendor libraries (cuBLAS, CUTLASS) finish the job." ] },
  /* 05 Sampling */
  { id: "token-loop", domain: "decoding", title: "The token generation loop", kind: "scene", scene: "logits-pipeline",
    summary: "Autoregressive decoding as a pipeline stage.",
    points: [
      "Forward pass produces logits over the vocabulary.",
      "Filters then the sample, then append and repeat.",
      "Each iteration is a full pass over the model — serial by construction." ] },
  { id: "sampling-controls", domain: "decoding", title: "Temperature · top-k · top-p", kind: "scene", scene: "sampling",
    summary: "Deterministic engines still roll dice — you shape the dice.",
    points: [
      "Low temperature sharpens the distribution toward argmax.",
      "top-k caps candidates; top-p adapts the cap to distribution shape.",
      "Each filter is a tiny kernel — negligible next to attention." ] },
  { id: "structured-output", domain: "decoding", title: "Grammar-constrained decoding", kind: "scene", scene: "grammar-mask",
    summary: "Logit masking makes invalid tokens unselectable.",
    points: [
      "A context-free grammar tracks parse state per request.",
      "Impossible tokens get -inf logits before the softmax.",
      "xgrammar and outlines implement it engine-side." ] },
  /* 06 Serving */
  { id: "framework-landscape", domain: "batching", title: "Triton · Ollama · vLLM · SGLang", kind: "concept",
    summary: "Four serving stacks, four philosophies.",
    points: [
      "Triton generalizes multi-model serving with ensembles.",
      "Ollama optimizes local, single-user simplicity.",
      "vLLM and SGLang compete on high-concurrency token streams." ] },
  { id: "chunked-prefill", domain: "batching", title: "Chunked prefill", kind: "scene", scene: "chunked-prefill",
    summary: "Slice big prompts so decodes keep flowing.",
    points: [
      "A 30k-token prefill would stall every active decode for seconds.",
      "Chunking interleaves prefill slices between decode steps.",
      "Small TTFT cost buys large TPOT stability under load." ] },
  { id: "pd-disaggregation", domain: "batching", title: "Prefill/Decode disaggregation", kind: "scene", scene: "pd-disagg",
    summary: "Different phases have different appetites — separate pools.",
    points: [
      "Prefill is compute-hungry; decode is memory-bound.",
      "KV transfers bridge the handoff between GPU pools.",
      "Each pool scales independently against its own SLO." ] },
  { id: "continuous-batching", domain: "batching", title: "Continuous batching", kind: "scene", scene: "continuous-batching",
    summary: "Admit requests mid-generation; never pad to the longest.",
    points: [
      "Static batching pads every lane to the longest request.",
      "Continuous batching swaps finished lanes for queued ones.",
      "Throughput gains compound with PagedAttention." ] },
  { id: "speculative", domain: "batching", title: "Speculative decoding", kind: "scene", scene: "speculative",
    summary: "Draft-and-verify turns serial decoding into batched verification.",
    points: [
      "The draft model guesses several tokens cheaply.",
      "The target verifies all of them in one pass.",
      "Wins scale with draft acceptance rate." ] },
  /* 07 Distributed */
  { id: "parallelism", domain: "distributed", title: "Tensor & pipeline parallelism", kind: "scene", scene: "tensor-pipeline",
    summary: "Slice weights or chain layers across GPUs.",
    points: [
      "Tensor parallel splits each matmul; needs fast interconnect.",
      "Pipeline parallel chains layers; bubbles hide with micro-batches.",
      "Both multiply effective memory bandwidth per token." ] },
  { id: "moe-expert-parallel", domain: "distributed", title: "Expert parallelism (MoE)", kind: "scene", scene: "moe-routing",
    summary: "A router activates a few experts per token.",
    points: [
      "Total capacity is huge; per-token compute stays small.",
      "All-to-all communication moves tokens between expert GPUs.",
      "Load balancing keeps a hot expert from capping throughput." ] },
  { id: "kv-distribution", domain: "distributed", title: "Distributed KV cache", kind: "scene", scene: "kv-offload",
    summary: "Offload, stream and balance attention memory across nodes.",
    points: [
      "HBM exhaustion pushes cold KV blocks to CPU or NVMe tiers.",
      "Cross-node transfers ride RDMA or NVLink-class fabric.",
      "Placement decides whether remote KV still beats recompute." ] },
  { id: "hybrid-edge-cloud", domain: "distributed", title: "Edge-cloud hybrids", kind: "concept",
    summary: "Cooperative inference loops split by latency budget.",
    points: [
      "Draft locally, verify in cloud, or route by difficulty.",
      "Multi-device pooling aggregates phones, gateways and edge servers.",
      "The handoff protocol is the hard engineering problem." ] },
  /* 08 Operations */
  { id: "deployment-typologies", domain: "operations", title: "Containers to KServe", kind: "concept",
    summary: "Docker standardizes the stack; Kubernetes scales it.",
    points: [
      "KServe adds canary rollouts and scale-to-zero on top.",
      "BYOC keeps data boundaries inside a customer account.",
      "Air-gapped on-prem trading convenience for governance." ] },
  { id: "cold-start", domain: "operations", title: "The cold start problem", kind: "scene", scene: "cold-start",
    summary: "Image pull plus weight load decides survival of the first request.",
    points: [
      "Multi-GB model loads dwarf typical container start times.",
      "Snapshots, tiered caching and warm pools mitigate.",
      "Scale-to-zero economics collide with p95 latency promises." ] },
  { id: "observability", domain: "operations", title: "Serving observability", kind: "concept",
    summary: "Saturation, leaks, decay, drift, anomalies.",
    points: [
      "KV utilization and queue depth predict saturation before SLOs break.",
      "Memory-allocation leaks show up as slow capacity erosion.",
      "Data drift and latency anomalies trigger the same playbook: bisect." ] },
  { id: "finops", domain: "operations", title: "MIG, spot & autoscaling", kind: "scene", scene: "finops-mig",
    summary: "Fractional GPUs and interruption-tolerant pools cut run-cost.",
    points: [
      "MIG slices one H100 into up to seven isolated instances.",
      "Spot capacity with checkpoint-and-drain saves most of the bill.",
      "Autoscale on concurrency, not CPU — GPUs lie about utilization." ] },
];
