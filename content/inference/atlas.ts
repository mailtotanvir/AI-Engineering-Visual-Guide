export interface InfDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const INF_DOMAINS: InfDomain[] = [
  { id: "foundations", num: "01", name: "Foundations", blurb: "What inference is and how autoregressive decoding works." },
  { id: "metrics", num: "02", name: "Metrics & SLOs", blurb: "TTFT, TPOT, throughput, goodput — and what to promise users." },
  { id: "kv-economy", num: "03", name: "The KV Economy", blurb: "Cache anatomy, growth math, paging, prefix reuse." },
  { id: "batching", num: "04", name: "Batching & Scheduling", blurb: "Static to continuous batching, chunked prefill, interference." },
  { id: "quantization", num: "05", name: "Quantization", blurb: "Precision ladders, weight-only formats, KV quantization." },
  { id: "decoding", num: "06", name: "Decoding Strategies", blurb: "Sampling controls and speculative execution." },
  { id: "deploy", num: "07", name: "Deployment Patterns", blurb: "Disaggregation, parallelism strategies, capacity planning." },
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
  { id: "what-is-inference", domain: "foundations", title: "What is inference?", kind: "scene", scene: "decode-loop",
    summary: "A forward pass that turns tokens into the next token.",
    points: [
      "Weights are frozen; only activations flow per request.",
      "Autoregressive: each output token joins the input for the next step.",
      "One request means many sequential forwards — latency compounds." ] },
  { id: "train-vs-serve", domain: "foundations", title: "Training vs serving", kind: "concept",
    summary: "Different workloads with opposite bottlenecks.",
    points: [
      "Training: huge batches, days-long runs, compute-bound everywhere.",
      "Serving: small batches, millisecond SLOs, memory-bandwidth-bound decode.",
      "Inference runs on every user message forever — efficiency compounds too." ] },
  { id: "tokenization", domain: "foundations", title: "Tokenization (BPE-style)", kind: "concept",
    summary: "Text becomes subword ids before anything touches a GPU.",
    points: [
      "Vocabulary merges frequent pairs into reusable subwords.",
      "Cost scales with text length — pricing and context limits count tokens.",
      "Identical text can tokenize differently across models and versions." ] },
  { id: "context-window", domain: "foundations", title: "Context window", kind: "concept",
    summary: "The finite stage every conversation shares.",
    points: [
      "Prompt + history + generation must all fit inside the window.",
      "Every turn re-sends prior history — cost grows with conversation age.",
      "Sliding windows and summaries trade fidelity for room." ] },
  { id: "ttft", domain: "metrics", title: "Time To First Token", kind: "scene", scene: "prefill-decode",
    summary: "Responsiveness as users perceive it.",
    points: [
      "Dominated by prefill over the prompt — parallel attention work.",
      "Streaming makes long generations feel fast even when totals are slow." ] },
  { id: "tpot-goodput", domain: "metrics", title: "TPOT · Throughput · Goodput", kind: "scene", scene: "latency-timeline",
    summary: "Steady-state speed versus requests that satisfy their SLO.",
    points: [
      "TPOT: average time per token after the first.",
      "Throughput rises with batch size — and so do individual latencies.",
      "Goodput counts only responses meeting both TTFT and TPOT targets." ] },
  { id: "kv-anatomy", domain: "kv-economy", title: "KV cache anatomy", kind: "scene", scene: "kv-cache",
    summary: "Keys and Values for every layer, head and past token.",
    points: [
      "bytes/token = 2 × layers × kvHeads × headDim × dtypeBytes.",
      "Long contexts turn MBs into GBs before weights are counted.",
      "GQA shrinks it by sharing K/V heads across query heads." ] },
  { id: "paged-attention", domain: "kv-economy", title: "Paged attention", kind: "scene", scene: "paged-kv",
    summary: "Page the cache like virtual memory.",
    points: [
      "Fixed-size blocks allocated on demand kill internal fragmentation.",
      "Block tables map logical positions to scattered physical pages.",
      "Copy-on-write enables cheap beam search and prefix forks." ] },
  { id: "prefix-caching", domain: "kv-economy", title: "Prefix & radix caching", kind: "concept",
    summary: "Identical prompt prefixes reuse identical cache blocks.",
    points: [
      "System prompts and few-shot headers hit cache on every request.",
      "Radix trees match longest cached prefixes automatically.",
      "Large TTFT wins for templated workloads." ] },
  { id: "chunked-prefill", domain: "batching", title: "Chunked prefill", kind: "concept",
    summary: "Slice big prompts so decodes keep flowing between slices.",
    points: [
      "A 30k-token prefill would stall every active decode for seconds.",
      "Chunking interleaves prefill slices between decode steps.",
      "Small TTFT cost buys large TPOT stability under load." ] },
  { id: "quant-ladder", domain: "quantization", title: "The precision ladder", kind: "concept",
    summary: "FP16 → BF16 → INT8 → FP8 → INT4: size versus fidelity.",
    points: [
      "Weight-only quantization keeps activations in high precision.",
      "Per-channel scales rescue outlier channels from rounding cliffs.",
      "KV quantization doubles usable context at a small quality cost." ] },
  { id: "calibration", domain: "quantization", title: "Calibration (GPTQ / AWQ)", kind: "concept",
    summary: "Choose scales by watching real activations, not ideal ones.",
    points: [
      "GPTQ minimizes layer-wise output error against sample data.",
      "AWQ protects the few salient channels that matter most.",
      "Bad calibration shows up as fluent-but-wrong answers." ] },
  { id: "sampling-controls", domain: "decoding", title: "Temperature · top-k · top-p", kind: "scene", scene: "sampling",
    summary: "Deterministic engines still roll dice — you shape the dice.",
    points: [
      "Low temperature sharpens the distribution toward argmax.",
      "top-k caps candidates; top-p adapts the cap to distribution shape.",
      "Repetition penalties live outside this math but stack with it." ] },
  { id: "structured-output", domain: "decoding", title: "Constrained decoding", kind: "concept",
    summary: "Force JSON or grammar by masking impossible next tokens.",
    points: [
      "Per-state logit masking guarantees syntactically valid output.",
      "Masking cost is negligible next to attention." ] },
  { id: "disaggregation", domain: "deploy", title: "Prefill/Decode disaggregation", kind: "concept",
    summary: "Different phases have different appetites — run them on different machines.",
    points: [
      "Prefill is compute-hungry and latency-tolerant; decode is memory-bound.",
      "KV transfers bridge the handoff between the two pools.",
      "Each pool scales independently against its own SLO." ] },
  { id: "parallelism", domain: "deploy", title: "Tensor & pipeline parallelism", kind: "concept",
    summary: "Slice weights or layers across GPUs to fit big models.",
    points: [
      "Tensor parallel splits each matmul; needs fast interconnect.",
      "Pipeline parallel chains layers; bubbles hide with micro-batches.",
      "Both multiply effective memory bandwidth per token." ] },
];
