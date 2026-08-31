export interface SceneNote {
  id: string;
  module: string;
  title: string;
  overview: string;
  keyConcepts: { heading: string; body: string }[];
  mathDeepDive?: { title: string; equation: string; explanation: string };
  realWorldEngineering: string[];
}

export const SCENE_NOTES: Record<string, SceneNote> = {
  /* ---------- Module 1: Foundations ---------- */
  "decode-loop": {
    id: "decode-loop",
    module: "Module 1: Foundations of Inference & Execution",
    title: "The autoregressive contract: one forward pass per token",
    overview: "Inference is a single forward pass over frozen weights — no gradients, no optimizer state, no backward graph. But it is not one pass per sentence; it is one pass per token. Each emitted token appends to the context and the entire pass runs again, which is why generation is serial and why latency scales with output length, not prompt length.",
    keyConcepts: [
      { heading: "No Backprop Tax", body: "Training stores activations for every layer to replay them backward. Inference keeps only the KV cache; memory that would hold optimizer momentum and variance is freed entirely. A 7B model trains at ~112 GB but serves in ~14 GB." },
      { heading: "The Serial Trap", body: "Token N+1 depends on token N. No amount of parallel hardware changes the dependency chain — only speculative decoding breaks it, by guessing ahead and verifying in batch." },
      { heading: "State Lives in the Cache", body: "The model is stateless between requests but stateful within one: the KV cache is the conversation's working memory, and every architectural decision in serving flows from its growth curve." }
    ],
    mathDeepDive: {
      title: "Per-Token Cost",
      equation: "E2EL = TTFT + N_out × TPOT   ·   KV(bytes) = 2 × L × H_kv × d_head × dtype × N_ctx",
      explanation: "A 200-token reply on a 2k-token prompt costs 14 GB of weight streaming per token plus 512 KB of new KV per token. The forward pass is O(N_ctx) per token because attention reads the whole cache."
    },
    realWorldEngineering: [
      "Streaming SSE responses exist precisely because E2E is serial — users read token 30 while token 80 generates.",
      "Stop-sequence detection and max-token caps are enforced token-by-token in the decode loop, engine-side."
    ]
  },
  "prefill-decode": {
    id: "prefill-decode",
    module: "Module 1: Foundations of Inference & Execution",
    title: "Two personalities of one GPU: compute-bound prefill, bandwidth-bound decode",
    overview: "Every request has two personalities. Prefill ingests the whole prompt in one parallel sweep — thousands of tokens flow through every layer together, saturating tensor cores. Decode emits one token at a time, streaming the full weight matrix from HBM for each: compute idles while memory works. The handoff between these regimes drives most serving architecture.",
    keyConcepts: [
      { heading: "Prefill = FLOP Party", body: "With B×N tokens in flight, matmuls run near peak TFLOPS. Arithmetic intensity is high; the compute roof of the roofline model is what limits you." },
      { heading: "Decode Is a Memory Stream", body: "Batch of 1 decode moves ~14 GB of weights to produce one token: intensity near 1 FLOP/byte. The GPU spends its time waiting on HBM, at maybe 1-5% of peak FLOPs." },
      { heading: "Why Batching Works", body: "Amortization: 64 concurrent decodes read the same weights once per step. Batched decode pushes intensity back toward the compute roof — this is the economic engine of every serving stack." }
    ],
    mathDeepDive: {
      title: "The Two Roofs",
      equation: "AI = FLOPs / Bytes_moved   ·   achievable ≈ min(peak_FLOPs, BW × AI)",
      explanation: "Prefill of 2k tokens: intensity in the hundreds, compute-bound. Decode: intensity ≈ 1-2, bandwidth-bound. Same GPU, two ceilings — which is why prefill/decode scheduling and disaggregation exist."
    },
    realWorldEngineering: [
      "TTFT SLOs are prefill budgets; TPOT SLOs are bandwidth budgets. Marketing quotes one, users feel both.",
      "vLLM logs prefill and decode as separate phases precisely because capacity planning treats them as different workloads."
    ]
  },
  "latency-timeline": {
    id: "latency-timeline",
    module: "Module 1: Foundations of Inference & Execution",
    title: "TTFT, TPOT, and the goodput discipline",
    overview: "Users feel two distinct clocks: how fast the first word appears (TTFT) and how fast the rest streams (TPOT/ITL). End-to-end latency is their sum over the output length. Throughput counts tokens; goodput counts only responses that met both budgets — the number that actually maps to revenue and SLA credits.",
    keyConcepts: [
      { heading: "The SLO Split", body: "Product teams promise TTFT < 500ms and TPOT < 50ms far more often than a single E2E number. The split matters because the phases have different bottlenecks and different fixes." },
      { heading: "Goodput vs Throughput", body: "A batch of 256 that pushes TPOT to 300ms produces huge throughput and near-zero goodput. Maximizing goodput means sizing batches to the SLO envelope, not to GPU saturation." },
      { heading: "Budget Accounting", body: "E2EL = network + queue + tokenize + prefill + N × decode + detokenize. Every middleware hop spends latency the model budget doesn't have." }
    ],
    mathDeepDive: {
      title: "Goodput Rate",
      equation: "goodput = Σ_requests 1[TTFT_i ≤ B_ttft ∧ TPOT_i ≤ B_tpot] / total_requests",
      explanation: "Throughput can rise monotonically with batch size while goodput collapses. The optimal operating point is the largest batch inside the SLO envelope — which is a scheduling problem, not a hardware one."
    },
    realWorldEngineering: [
      "Frontier API providers publish TTFT and TPOT separately; internal dashboards should too, per model and per tenant.",
      "Latency percentiles (p50/p95/p99) beat means: tail TTFT under load is where user-perceived slowness hides."
    ]
  },

  /* ---------- Module 2: Silicon ---------- */
  "silicon-map": {
    id: "silicon-map",
    module: "Module 2: Hardware Micro-Architecture & Silicon Substrates",
    title: "Five substrates, five bets on parallelism",
    overview: "CPUs, GPUs, TPUs, LPUs and inference ASICs all execute the same matmuls with radically different economics. Each substrate is a bet: flexibility (CPU), generality (GPU), dense systolic throughput (TPU), deterministic SRAM-resident scheduling (LPU), or cost-per-token within one vendor's cloud (Inferentia).",
    keyConcepts: [
      { heading: "The Flexibility Tax", body: "General-purpose silicon pays for branchy, irregular workloads with control overhead. Specialized silicon recovers that overhead as latency — until the model changes." },
      { heading: "Memory Placement Is the Real Spec", body: "The LPU's headline number is not FLOPs, it is 230 GB of on-die SRAM: weights stay resident and the memory wall disappears. HBM parts rent bandwidth instead." },
      { heading: "Software Gravity", body: "The GPU wins in production less on peak specs than on ecosystem: kernels, compilers, and a decade of framework integration. An ASIC without a compiler story is a benchmark trophy." }
    ],
    mathDeepDive: {
      title: "Bandwidth-Centric Comparison",
      equation: "t_token ≈ weights_bytes / BW   (H100: 14 GB / 3.35 TB/s ≈ 4.2 ms; LPU-class: SRAM-resident)",
      explanation: "Decode time is weight streaming time. Substrates compete on bytes/s first and FLOPs second, which is why the LPU's 80 TB/s fabric beats the H100's 989 TF for small-batch decode."
    },
    realWorldEngineering: [
      "Groq's LPU schedules the entire model deterministically at compile time — no warp schedulers, no caches, no variance.",
      "AWS Inferentia competes on $/token inside EC2, not on flexibility; model portability is the price."
    ]
  },
  "memory-wall": {
    id: "memory-wall",
    module: "Module 2: Hardware Micro-Architecture & Silicon Substrates",
    title: "The roofline: why decode lives on the memory wall",
    overview: "Every operation has an arithmetic intensity — FLOPs per byte moved. Above the knee, you're compute-bound; below it, you're streaming bytes and the bandwidth roof caps you. Inference's two phases sit on opposite sides, and almost every inference optimization is an attempt to move work up the intensity axis.",
    keyConcepts: [
      { heading: "Von Neumann in Production", body: "Data shuttles between memory and compute over a bus narrower than either side. SRAM (fast, tiny) vs HBM (big, slow) defines the trade every accelerator makes." },
      { heading: "Decode's Math", body: "One 7B FP16 token = 14 GB of weights, ~2×7 GFLOPs of compute. Intensity ≈ 1 FLOP/byte. Peak FLOPs are irrelevant; the bandwidth roof is destiny." },
      { heading: "Escalation Ladders", body: "Batching shares weight loads across requests; quantization shrinks the bytes; fusion keeps intermediates on-chip. All three are intensity upgrades." }
    ],
    mathDeepDive: {
      title: "Roofline",
      equation: "achievable_TFLOPs = min(peak, BW(TB/s) × AI(FLOP/B))   ·   AI_decode = 2P / (P × b) = 2/b",
      explanation: "For FP16 (b=2 bytes/param) decode AI ≈ 1. The H100 compute roof (989 TF) is 300× above its bandwidth roof at that intensity (3.35 TF). Utilization is not a bug — it is geometry."
    },
    realWorldEngineering: [
      "Batch size is the cheapest intensity knob: 64-way batching multiplies AI by ~64 without touching the model.",
      "NVLink-class interconnects exist because tensor parallelism multiplies bytes moved per FLOP even further."
    ]
  },
  "warp-tensor": {
    id: "warp-tensor",
    module: "Module 2: Hardware Micro-Architecture & Silicon Substrates",
    title: "Warps, SMs and Tensor Cores: mapping software onto H100",
    overview: "A CUDA thread is a fiction the scheduler resolves into 32-thread warps. Each of the H100's 132 SMs hosts up to 64 resident warps; when one stalls on memory, another issues. Tensor Cores are the matrix engines inside — fused multiply-accumulate tiles that give the GPU its headline FLOPs.",
    keyConcepts: [
      { heading: "Latency Hiding by Occupancy", body: "Warp schedulers swap in ready warps every cycle. Resident warp density is the currency: too few warps and every HBM stall becomes dead silicon." },
      { heading: "Tensor Cores", body: "Each SM packs 4 Tensor Cores executing 16×8×16 MMA tiles. Peak FLOPs live here; a kernel that doesn't feed them (via WMMA/MMA fragments) leaves 10× on the table." },
      { heading: "Registers Are the Real Cache", body: "Fused kernels keep intermediates in registers and shared memory; unfused chains pay HBM round-trips per op. This is why fusion matters more than kernel micro-tuning." }
    ],
    mathDeepDive: {
      title: "Occupancy Bubble",
      equation: "bubble ≈ 1 − resident_warps / (SMs × warps_per_SM)   ·   H100: 132 × 64 = 8,448 warp slots",
      explanation: "At 30% occupancy, ~5,000 warp slots idle. Latency bubbles appear exactly where resident density drops — the visual signature of an under-occupied kernel."
    },
    realWorldEngineering: [
      "FlashAttention's insight is scheduling, not math: tile attention so the softmax chain never leaves SRAM.",
      "Nsight Compute's 'achieved occupancy' vs 'theoretical occupancy' gap is the first thing kernel engineers check."
    ]
  },

  /* ---------- Module 3: Quantization ---------- */
  "quant-ladder": {
    id: "quant-ladder",
    module: "Module 3: Model Transformation, Compilation & Quantization",
    title: "Precision reduction: the size-fidelity exchange rate",
    overview: "Quantization maps FP32 weights onto coarser grids: FP16/BF16 halve storage losslessly for most workloads; INT8 needs calibrated scales; INT4/FP4 make quality a real engineering conversation. Post-Training Quantization does all of this without retraining — the model is frozen, and scale factors absorb the compression.",
    keyConcepts: [
      { heading: "PTQ Mechanics", body: "Calibrate on a few hundred representative samples; per-channel scales = max|w| / grid_max. The rounding error budget per weight is half a grid step." },
      { heading: "Weight-Only vs Weight-and-Activation", body: "W4A16 keeps activations high precision and wins on quality; W8A8 unlocks integer Tensor Core paths and wins on speed. KV cache quantization is a third axis with its own trade." },
      { heading: "Outlier Channels", body: "A handful of activation channels carry magnitude 20-100× the median. Naive per-tensor scales waste the grid on them; per-channel or AWQ-style salience weighting rescues quality." }
    ],
    mathDeepDive: {
      title: "Symmetric PTQ",
      equation: "scale = max|w| / (2^(b-1) − 1)   ·   q = round(w / scale)   ·   VRAM = params × b/8",
      explanation: "A 7B model at FP32 is 28 GB; INT4 is 3.5 GB — an 8× reduction with max per-weight error ≤ scale/2. Whether that error compounds into gibberish or disappears is what calibration decides."
    },
    realWorldEngineering: [
      "GPTQ quantizes layer-by-layer against calibration activations, minimizing output error rather than weight error.",
      "KV cache quantization (FP8) doubles usable context on the same silicon — often the highest-leverage rung for long-context serving."
    ]
  },
  "graph-fusion": {
    id: "graph-fusion",
    module: "Module 3: Model Transformation, Compilation & Quantization",
    title: "Fusion, DCE and constant folding: paying the launch tax once",
    overview: "An eager transformer layer launches dozens of tiny kernels; each launch costs microseconds of CPU dispatch plus an HBM round-trip for intermediates. Graph optimization collapses pointwise chains into single kernels, deletes dead computation, and folds constants — before any hardware-specific tuning happens.",
    keyConcepts: [
      { heading: "The Launch Tax", body: "A kernel launch is ~5-10 µs of CPU-side overhead. A 32-layer model with 40 eager ops per layer burns milliseconds per step on dispatch alone at batch 1." },
      { heading: "Fusion's Real Win", body: "Bandwidth, not launches: a LayerNorm+GELU+add chain written eagerly writes each intermediate to HBM (7 GB/s of traffic per token at 7B). Fused, intermediates live in registers." },
      { heading: "Compiler Passes", body: "Dead-node elimination prunes unused branches; constant folding precomputes what weights alone determine; layout propagation picks NHWC/NCHW per target." }
    ],
    mathDeepDive: {
      title: "Traffic Saved by Fusion",
      equation: "bytes_saved ≈ (nodes_fused − 1) × tensor_bytes × (reads + writes)",
      explanation: "Fusing a 3-op chain over a 4k-token activation saves ~2 × 3 × activation-size of HBM traffic per layer, per step — often a 20-40% end-to-end decode speedup at batch 1."
    },
    realWorldEngineering: [
      "torch.compile's mode='max-autotune' and TensorRT both run these passes; the difference is schedule quality, not pass coverage.",
      "CUDA graphs capture the whole launch sequence once and replay it, eliminating dispatch jitter for decode loops."
    ]
  },
  "ai-compiler": {
    id: "ai-compiler",
    module: "Module 3: Model Transformation, Compilation & Quantization",
    title: "Lowering graphs to bare metal: TVM, OpenXLA, TensorRT, Mojo/MAX",
    overview: "AI compilers translate a portable model graph into machine-specific code through tiered lowering: graph-level rewrites, then tile/schedule selection against the target's memory hierarchy, then kernel emission. The same graph becomes different SASS for Hopper than for Ada — autotuning against real hardware is the differentiator.",
    keyConcepts: [
      { heading: "Tiered Lowering", body: "Graph IR (framework-agnostic) → operator IR (TVM Relay, StableHLO) → tensor IR (TIR, LHLO) → target ISA. Each tier enables one class of optimization." },
      { heading: "Autotuning", body: "Schedule space (tiling, vectorization, pipelining) is searched against the real hardware with cost models or exhaustive measurement — thousands of candidates per operator." },
      { heading: "Vendor Compilers", body: "TensorRT ships hand-tuned kernels plus PTQ; Mojo/MAX aims at a unified high-performance substrate; OpenXLA trades per-op optimality for ecosystem reach." }
    ],
    mathDeepDive: {
      title: "Why Autotuning Beats Heuristics",
      equation: "t_op ≈ max(FLOPs / peak, Bytes / BW) + t_launch   — search over tile configs minimizes the max()",
      explanation: "The optimal tile shape depends on the ratio of compute to memory traffic for THIS operator on THIS silicon. Analytic models get within 2×; measurement finds the last 30-40%."
    },
    realWorldEngineering: [
      "TensorRT engine build takes minutes per shape — teams cache engines per (GPU, batch, seq-len) tuple and pin them in images.",
      "TVM's Ansor and OpenXLA's autotuner made per-target optimal schedules portable; hand-written CUDA is now the fallback, not the default."
    ]
  },

  /* ---------- Module 4: Runtime & Memory ---------- */
  "kv-cache": {
    id: "kv-cache",
    module: "Module 4: The AI Runtime & Memory Management Layer",
    title: "KV cache anatomy: the second model living in your VRAM",
    overview: "Attention must remember what it has already seen: Keys and Values for every layer, every head, every past token. The KV cache grows linearly with context and batch — and at long contexts it rivals the weights themselves. The entire 'KV economy' of serving is managing this second, growing allocation.",
    keyConcepts: [
      { heading: "The Formula", body: "bytes/token = 2 (K and V) × layers × kv_heads × head_dim × dtype_bytes. A 7B model at FP16 stores 512 KB per token — a 32k context is 16 GB per sequence." },
      { heading: "GQA as Compression", body: "Grouped-Query Attention shares K/V heads across query heads (Llama-2-70B: 8 KV heads for 64 queries), cutting the cache 8× with negligible quality cost." },
      { heading: "The Budget Collision", body: "Weights (fixed) + KV (growing) + activations must fit in HBM. Serving capacity is decided by how many concurrent KV caches fit — the true definition of 'batch slot'." }
    ],
    mathDeepDive: {
      title: "Cache Footprint",
      equation: "KV_bytes = 2 × L × H_kv × d_head × dtype_bytes × N_ctx × B",
      explanation: "7B (L=32, H_kv=32, d=128, fp16): 512 KB/token. At 32k context × 8 concurrent requests: 128 GB — twice the weights. This is why 70B models page, quantize, and evict caches."
    },
    realWorldEngineering: [
      "vLLM logs 'KV cache utilization' as its primary health metric; above ~90% preemption (recompute) begins.",
      "MLA (DeepSeek) and cross-layer KV sharing push per-token cost down another order of magnitude."
    ]
  },
  "paged-kv": {
    id: "paged-kv",
    module: "Module 4: The AI Runtime & Memory Management Layer",
    title: "PagedAttention: virtual memory for attention",
    overview: "Pre-allocation reserves worst-case contiguous slabs per request; most sit empty, and fragmentation strands the rest. PagedAttention borrows the OS answer: fixed-size blocks allocated on demand, a block table mapping logical positions to scattered physical pages, and copy-on-write for shared prefixes.",
    keyConcepts: [
      { heading: "Fragmentation Kill", body: "Reserved-but-unused KV (internal fragmentation) plus unallocatable gaps (external) historically wasted 60-80% of KV memory. Paging cuts waste to under 4%." },
      { heading: "Block Tables", body: "Each request carries a table: logical block i → physical block. Attention kernels gather K/V through indirection instead of assuming contiguity." },
      { heading: "Copy-on-Write Forks", body: "Two requests sharing a prefix share physical blocks; divergence triggers copy. Beam search and n-best sampling become nearly free in memory terms." }
    ],
    mathDeepDive: {
      title: "Waste Accounting",
      equation: "waste = internal_frag (≤ block_size − 1 tokens) + external_frag (unusable gaps)",
      explanation: "With 16-token blocks, internal waste is <15 tokens per request regardless of context length. vLLM's paper reports 2-4× throughput over naive allocation purely from this."
    },
    realWorldEngineering: [
      "Block size is a tuning knob: 16 tokens (vLLM default) balances kernel overhead against fragmentation.",
      "PagedAttention made beam search economically viable again — pre-paging, it was a memory multiplier."
    ]
  },
  "radix-prefix": {
    id: "radix-prefix",
    module: "Module 4: The AI Runtime & Memory Management Layer",
    title: "Radix trees and prefix caching: compute the shared prompt once",
    overview: "System prompts, few-shot headers and multi-turn history are recomputed by thousands of requests that differ only in their tails. A radix tree of cached KV blocks matches the longest shared prefix automatically, and every hit converts prefill compute into an O(1) pointer walk.",
    keyConcepts: [
      { heading: "Automatic Matching", body: "No application changes: the engine inserts each request's token path into a tree; any future request sharing a prefix walks to the fork and prefill starts there." },
      { heading: "TTFT Economics", body: "A 4k-token system prompt at ~90 ms/1k tokens costs ~360 ms of prefill — every request. A cache hit deletes all of it; templated workloads see TTFT drop by half or more." },
      { heading: "Eviction Policy", body: "Cache blocks are reference-counted and evicted LRU. Hot system prompts survive; abandoned conversation branches decay. SGLang's RadixAttention made this the default." }
    ],
    mathDeepDive: {
      title: "Prefill Savings",
      equation: "saved_ms = cached_tokens / 1000 × prefill_ms_per_1k   ·   hit_rate = Σ cached / Σ prompt_tokens",
      explanation: "At 40 ms/1k tokens and a 412-token shared prefix across 900 requests, the tree saves ~15 seconds of aggregate GPU prefill per minute of traffic — capacity you get for free."
    },
    realWorldEngineering: [
      "SGLang reports prefix hit rate as a first-class metric; fleets tune system-prompt design around it.",
      "Prefix caching composes with quantized KV and with PD disaggregation — the transfer shrinks to the unmatched tail."
    ]
  },

  /* ---------- Module 5: Sampling ---------- */
  "logits-pipeline": {
    id: "logits-pipeline",
    module: "Module 5: LLM Interaction, Sampling & Constrained Generation",
    title: "Inside the token loop: forward pass to appended token",
    overview: "Every generated token traverses the same pipeline: a full forward pass produces logits over the vocabulary; temperature rescales them; top-k and top-p truncate the candidate set; one sample is drawn; the token appends to the context. The loop is serial, and every stage between logits and sample is negligible next to the pass itself.",
    keyConcepts: [
      { heading: "Logits Are Raw Scores", body: "The final projection emits one score per vocabulary entry (~128k floats). Everything after is cheap vector arithmetic on a few dozen candidates." },
      { heading: "Filter Order Matters", body: "Temperature reshapes before truncation: at t→0 the distribution sharpens toward argmax regardless of top-k. Filters compose — penalties stack outside them." },
      { heading: "The Append Is the State Change", body: "Nothing else about the model changes between steps. Growth happens in the KV cache; that is the loop's only persistent mutation." }
    ],
    mathDeepDive: {
      title: "The Chain",
      equation: "p_i = softmax(z_i / t)  →  keep top-k / nucleus-p  →  renormalize  →  sample  →  append",
      explanation: "At t=1 the chain is the model's honest distribution; at t=0.1 it concentrates ~90% of mass on the top token; top-p=0.9 adapts the candidate count to distribution shape instead of fixing it."
    },
    realWorldEngineering: [
      "Sampling kernels are memory-trivial but latency-visible at batch 1: fused sampling kernels avoid a separate sync per step.",
      "Engines expose per-request seeds for reproducibility — the sampler is deterministic given the seed and the logits."
    ]
  },
  "sampling": {
    id: "sampling",
    module: "Module 5: LLM Interaction, Sampling & Constrained Generation",
    title: "The filters: temperature, top-k, top-p on real logits",
    overview: "Three knobs sculpt one distribution. Temperature divides logits — sharpening or flattening the whole shape. Top-k keeps a fixed count of candidates. Top-p keeps the smallest set whose mass exceeds a threshold, adapting to distribution shape: wide when uncertain, narrow when confident.",
    keyConcepts: [
      { heading: "Temperature Is a Scale", body: "z/t with t<1 sharpens, t>1 flattens. At t→0 it approaches argmax; entropy of the distribution falls monotonically as t falls." },
      { heading: "Top-k vs Top-p", body: "Fixed k wastes candidates on confident steps and under-covers on flat ones. Nucleus sampling's set size breathes with the distribution — the reason it became the default." },
      { heading: "Hardware Cost", body: "Sorting 128k logits for top-k is a real kernel (radix or bitonic); nucleus accumulation is a scan. Both are trivial next to the 14 GB weight stream — but not free at high QPS." }
    ],
    mathDeepDive: {
      title: "Nucleus Truncation",
      equation: "V' = argmin_{V'⊆V} { |V'| : Σ_{i∈V'} p_i ≥ p }   ·   renormalize p over V'",
      explanation: "With BASE_LOGITS at top-p=0.5, three tokens survive; at top-p=0.95, six do. The kept set's mass is guaranteed ≥ p — that's the 'nucleus' contract."
    },
    realWorldEngineering: [
      "Ampere+ GPUs run sampling as fused single kernels; older stacks synced per filter, adding ~1 ms/step at batch 1.",
      "Repetition and presence penalties apply outside this math (on counts, not logits) but stack with it in the same pass."
    ]
  },
  "grammar-mask": {
    id: "grammar-mask",
    module: "Module 5: LLM Interaction, Sampling & Constrained Generation",
    title: "Constrained decoding: grammars that make invalid tokens unselectable",
    overview: "Structured output forces the model to emit only tokens consistent with a grammar state. At each step, tokens that would break the parse get -inf logits before the softmax — the model cannot produce a syntax error because the syntax-violating tokens have zero probability.",
    keyConcepts: [
      { heading: "Logit Masking", body: "A per-state mask (allowed token set) multiplies logits before sampling. Masking is a vectorized op: microsecond-scale, invisible next to attention." },
      { heading: "Grammar Compilation", body: "Context-free grammars or JSON schemas compile to token-level state machines ahead of time. xgrammar and outlines precompile to bitmask lookups keyed by parse state." },
      { heading: "The Semantics Caveat", body: "Syntactic validity is guaranteed; semantic validity is not. A grammar can force valid JSON while the values inside are still wrong — validation belongs above the engine." }
    ],
    mathDeepDive: {
      title: "Masked Renormalization",
      equation: "p_i = softmax(z)_i / Σ_{j∈allowed} softmax(z)_j   for i ∈ allowed   ·   p_i = 0 otherwise",
      explanation: "Renormalization preserves the model's preferences among legal tokens. The masking engine's only real cost is maintaining parse state — O(1) per token with a precompiled automaton."
    },
    realWorldEngineering: [
      "SGLang uses xgrammar to cut guided-decoding overhead ~10× vs naive recompilation per request.",
      "OpenAI-compatible 'response_format: json_schema' is this machinery surfaced as an API parameter."
    ]
  },
  /* ---------- Module 6: Serving & Scheduling ---------- */
  "continuous-batching": {
    id: "continuous-batching",
    module: "Module 6: Serving Middleware, Frameworks & Scheduling",
    title: "Continuous batching: ending the padding tax",
    overview: "Static batching waits for every request in a batch to finish, padding finished sequences with zero-tokens until the longest request completes. Continuous batching (or iteration-level scheduling) operates per iteration: when a request emits [EOS], its slot is immediately reclaimed and a new request from the queue enters mid-generation.",
    keyConcepts: [
      { heading: "Iteration-Level Scheduling", body: "Instead of scheduling batch-by-batch, the engine reschedules the batch slots before every single decode step. Finished requests leave; queued prompts step into prefill or decode." },
      { heading: "Zero Padding Waste", body: "Because sequences are decoupled, padding tokens drop to zero. Memory and compute that would have been wasted on pad tokens become real generated tokens." },
      { heading: "Synergy with PagedAttention", body: "Dynamic slot swapping is only possible when KV memory can be allocated and freed in non-contiguous chunks — continuous batching relies directly on PagedAttention underneath." }
    ],
    mathDeepDive: {
      title: "Batch Efficiency Gain",
      equation: "efficiency = Σ len_i / (N_batch × max(len_i))   →   continuous batching ≈ 1.0 efficiency",
      explanation: "Static batching on a batch with lengths [10, 50, 200, 500] achieves (760 / 2000) = 38% compute efficiency (62% pad waste). Continuous batching achieves ~100% efficiency."
    },
    realWorldEngineering: [
      "Orca (OSDI '22) introduced iteration-level scheduling; vLLM, TGI, and TRT-LLM all adopted it as the standard engine core.",
      "Metrics dashboards track 'slot utilization' (active requests / max batch size) to measure scheduler saturation."
    ]
  },
  "chunked-prefill": {
    id: "chunked-prefill",
    module: "Module 6: Serving Middleware, Frameworks & Scheduling",
    title: "Chunked prefill: interleave prompt processing without decode stalls",
    overview: "A long prompt prefill (e.g., 32k tokens) takes hundreds of milliseconds or seconds of compute. In a naive scheduler, active decode requests freeze while the prefill completes, causing massive spikes in Inter-Token Latency (ITL). Chunked prefill breaks long prompts into micro-chunks (e.g., 512 tokens) and interleaves them alongside decode steps.",
    keyConcepts: [
      { heading: "ITL Spike Elimination", body: "Without chunking, a single 30k prompt prefill stalls all active streams for ~1-2 seconds. With chunking, the prefill is spread across 60 steps, keeping decode ITL bounded within SLOs." },
      { heading: "Piggybacked Prefill", body: "A chunk of prompt prefill is scheduled in the same batch step as ongoing decode tokens, saturating GPU compute units without starving memory-bound streams." },
      { heading: "TTFT vs TPOT Tradeoff", body: "Chunking slightly increases Time-To-First-Token (TTFT) for the long prompt, but protects TPOT and ITL for every other request on the GPU." }
    ],
    mathDeepDive: {
      title: "Interleave Scheduling",
      equation: "n_chunks = ⌈prompt_len / chunk_size⌉   ·   max_stall ≈ chunk_size / 1000 × prefill_ms_per_1k",
      explanation: "A 30,720 token prompt with 2,048 chunk size creates 15 slices. Max decode stall drops from 2,764 ms down to ~184 ms per step, maintaining smooth token streaming."
    },
    realWorldEngineering: [
      "Sarathi-Serve and vLLM implement chunked prefill (also known as Sarathi scheduling) to guarantee strict p99 ITL limits under heavy prompt loads.",
      "Chunk sizes are tuned based on model size and GPU memory bandwidth (e.g., 512 to 2048 tokens)."
    ]
  },
  "pd-disagg": {
    id: "pd-disagg",
    module: "Module 6: Serving Middleware, Frameworks & Scheduling",
    title: "Prefill/Decode disaggregation: physically isolating distinct workloads",
    overview: "Prefill requires compute-heavy matrix multiplications (high arithmetic intensity), whereas Decode requires memory-bandwidth-heavy weight streaming (low arithmetic intensity). Disaggregated serving places Prefill and Decode on physically separate GPU pools, transferring KV cache blocks across high-speed interconnects (NVLink/InfiniBand) during the handoff.",
    keyConcepts: [
      { heading: "Optimal Hardware Matching", body: "Prefill nodes can run on compute-dense cards (e.g., H100 with high batching), while Decode nodes run on memory-rich nodes or specialized bandwidth topologies." },
      { heading: "Interference Isolation", body: "Prevents heavy prompt prefills from degrading decode latency guarantees entirely, isolating noisy neighbors in multi-tenant fleets." },
      { heading: "High-Speed KV Handoff", body: "Requires ultra-low latency networking (RDMA / NVLink) to stream KV cache states from Prefill GPUs to Decode GPUs in under 10-20ms." }
    ],
    mathDeepDive: {
      title: "Handoff Overhead",
      equation: "t_transfer = (2 × L × H_kv × d_head × dtype × N_prompt) / Network_BW_GBs",
      explanation: "Transferring a 4,096-token KV cache for Llama-3-70B (~1.25 GB) over a 50 GB/s interconnect takes ~25 ms — a fraction of the compute time saved by isolating prefill."
    },
    realWorldEngineering: [
      "DistServe and Mooncake demonstrate 2-3x throughput gains for LLM serving clusters using Prefill/Decode disaggregation.",
      "Used extensively in hyperscale cloud API endpoints where p99 latency SLOs are strictly enforced."
    ]
  },
  "speculative": {
    id: "speculative",
    module: "Module 6: Serving Middleware, Frameworks & Scheduling",
    title: "Speculative decoding: draft cheaply, verify in parallel",
    overview: "Generating N tokens sequentially requires N passes through a large target model. Speculative decoding uses a fast, small draft model to guess K candidate tokens cheaply, then runs the large target model once in parallel to verify all K tokens simultaneously. Accepted tokens are emitted immediately; rejections cost only one target pass.",
    keyConcepts: [
      { heading: "Batched Verification", body: "The large model evaluates K draft tokens in a single forward pass (which takes nearly the same time as generating 1 token due to bandwidth bottlenecks)." },
      { heading: "Lossless Generation", body: "A modified rejection sampling algorithm ensures the output probability distribution matches the target model exactly — zero quality loss." },
      { heading: "Acceptance Rate Dependence", body: "Speedup is directly driven by how often the target accepts draft tokens (α). High α yields 2-3x latency reduction." }
    ],
    mathDeepDive: {
      title: "Speculative Speedup",
      equation: "E[tokens / step] = (1 − α^(K+1)) / (1 − α)   ·   Speedup = E[tokens] / (1 + K × cost_draft)",
      explanation: "If a draft model guesses 4 tokens with a 75% acceptance rate (α=0.75), the target model emits an average of 2.73 tokens per pass, achieving ~2x wall-clock speedup."
    },
    realWorldEngineering: [
      "Medusa and Eagle use specialized multi-head draft heads on top of the base model rather than separate small models, avoiding extra VRAM overhead.",
      "Speculative decoding is deployed in high-throughput coding assistants and chat endpoints where low latency is critical."
    ]
  },

  /* ---------- Module 7: Distributed Inference ---------- */
  "tensor-pipeline": {
    id: "tensor-pipeline",
    module: "Module 7: Distributed Inference & Infrastructure Scale",
    title: "Tensor vs Pipeline parallelism: split weights or chain layers",
    overview: "When a model exceeds the memory or bandwidth of a single GPU, parallelism splits the workload. Tensor Parallelism (TP) splits individual weight matrices inside each layer across GPUs within a node (requiring fast NVLink all-reduce). Pipeline Parallelism (PP) assigns sets of layers to different GPUs across nodes, using micro-batching to hide pipeline bubbles.",
    keyConcepts: [
      { heading: "Tensor Parallelism (TP)", body: "Matrix multiplications are partitioned across GPU column/row splits. Requires 2 All-Reduce communications per Transformer layer, making NVLink (900 GB/s) mandatory." },
      { heading: "Pipeline Parallelism (PP)", body: "Layers are split across GPUs (e.g., layers 1-16 on GPU 0, 17-32 on GPU 1). Micro-batches pass activations sequentially, introducing pipeline fill/drain bubbles." },
      { heading: "Hybrid Strategy (TP+PP)", body: "Large clusters use intra-node TP (e.g., TP=8 on one node) and inter-node PP (e.g., PP=4 across nodes) to balance communication latency." }
    ],
    mathDeepDive: {
      title: "Pipeline Bubble Fraction",
      equation: "Bubble_fraction = (PP − 1) / (PP − 1 + MicroBatches)",
      explanation: "With PP=4 and 16 micro-batches, the pipeline bubble is (3 / 18) ≈ 16.6% idle time. Increasing micro-batches reduces bubble overhead."
    },
    realWorldEngineering: [
      "Megatron-LM and vLLM combine TP and PP to serve 70B to 405B models across multi-node GPU clusters.",
      "Sequence Parallelism (SP) is often added on top of TP to split LayerNorm and Dropout activations, reducing VRAM footprint further."
    ]
  },
  "moe-routing": {
    id: "moe-routing",
    module: "Module 7: Distributed Inference & Infrastructure Scale",
    title: "Expert parallelism & Mixture of Experts (MoE)",
    overview: "Mixture of Experts (MoE) replaces dense FFN layers with multiple specialized 'expert' sub-networks, using a gating router to send each token to only top-K experts (e.g., 2 out of 64). Expert Parallelism places different experts on different GPUs, using All-to-All communication to route tokens to their target expert.",
    keyConcepts: [
      { heading: "Sub-Linear Compute Scaling", body: "A 380B parameter MoE model (like DeepSeek-V3 or Mixtral) might activate only 21B-37B parameters per token, achieving high model capacity with low FLOP cost." },
      { heading: "Router Load Balancing", body: "If all tokens pick the same expert, that GPU bottlenecks while others idle. Routers use auxiliary load-balancing losses to distribute tokens evenly." },
      { heading: "All-to-All Bottleneck", body: "Expert parallelism shifts the bottleneck to network interconnects, as tokens must be routed to expert GPUs and gathered back." }
    ],
    mathDeepDive: {
      title: "MoE Active Parameters",
      equation: "Params_active = Params_shared + K × (Params_total − Params_shared) / N_experts",
      explanation: "For a 382B model with 6B shared and 64 experts picking top-2: Active = 6 + 2 × (376 / 64) = 17.75B active parameters per token."
    },
    realWorldEngineering: [
      "DeepSeek-V3 uses Auxiliary-loss-free Load Balancing and Multi-head Latent Attention (MLA) to achieve extreme MoE efficiency at scale.",
      "DeepSpeed-MoE and vLLM optimize MoE kernel execution with custom grouped GEMMs."
    ]
  },
  "kv-offload": {
    id: "kv-offload",
    module: "Module 7: Distributed Inference & Infrastructure Scale",
    title: "Distributed KV cache: offloading, streaming & tiered memory",
    overview: "As context windows expand to 100k+ tokens, KV cache footprint exceeds GPU VRAM. Tiered KV management offloads inactive or cold KV cache blocks to CPU RAM or NVMe storage over PCIe/RDMA, streaming them back to GPU VRAM only when needed, avoiding expensive recomputation.",
    keyConcepts: [
      { heading: "Hierarchy of Memory", body: "GPU HBM (fastest, tiny) → CPU RAM (fast, large) → NVMe SSD (slowest, massive). Managing KV caches across this hierarchy optimizes overall system cost." },
      { heading: "Offload vs Recompute Decision", body: "If fetching a cold KV cache from CPU RAM over PCIe takes longer than recomputing the prefill on GPU, recomputation is preferred." },
      { heading: "RDMA Remote Caching", body: "In multi-node clusters, a node with idle VRAM/RAM can host KV caches for other nodes using Remote Direct Memory Access (RDMA)." }
    ],
    mathDeepDive: {
      title: "Offload vs Recompute Threshold",
      equation: "t_fetch = KV_bytes / PCIe_BW   vs   t_recompute = N_tokens / 1000 × prefill_ms_per_1k",
      explanation: "Transferring 10 GB of KV over PCIe Gen5 (64 GB/s) takes ~156 ms. Recomputing 20k tokens at 40ms/1k takes 800 ms. Fetching wins by 5x."
    },
    realWorldEngineering: [
      "FlexGen and DeepSpeed-Inference pioneer tiered KV offloading to serve long-context models on single consumer GPUs.",
      "vLLM's multi-tier cache manager coordinates page migration between GPU HBM and Host CPU RAM seamlessly."
    ]
  },

  /* ---------- Module 8: Operations & FinOps ---------- */
  "cold-start": {
    id: "cold-start",
    module: "Module 8: Production Operations, Deployment & FinOps",
    title: "The serverless cold start: container pull to parameter load",
    overview: "Serverless AI endpoints scale to zero when idle to save costs. However, waking up a cold container requires pulling multi-gigabyte container images, loading tens of gigabytes of model weights into GPU memory, and running CUDA warmup iterations — creating massive cold-start delays (10s to 60s+).",
    keyConcepts: [
      { heading: "The Cold Start Chain", body: "Image Pull (Docker layers) + Container Init + PyTorch/CUDA Runtime Init + Model Weight Load (HBM) + KV Cache Pre-allocation + Warmup Pass." },
      { heading: "Fast Weight Loading", body: "Using safetensors and mmap (memory-mapped files) allows direct DMA transfers from NVMe SSD to GPU VRAM, bypassing CPU serialization." },
      { heading: "Warm Pools & Scale-to-1", body: "Mitigating cold starts requires keeping warm standby instances or keeping 1 replica active, balancing cost vs p95 response time." }
    ],
    mathDeepDive: {
      title: "Cold Start Break-Down",
      equation: "t_cold = t_container_pull + (Model_size_GB / NVMe_BW_GBs) + t_cuda_warmup",
      explanation: "Loading a 14 GB model from NVMe at 3.5 GB/s takes 4s for weight transfer alone, on top of 15s container pull and 5s CUDA context setup = 24s total cold start."
    },
    realWorldEngineering: [
      "KServe, Modal, and Replicate use streaming container filesystems (e.g., CDFS) and pre-warmed GPU pools to reduce cold starts under 2 seconds.",
      "Safetensors format is standard across Hugging Face because it enables zero-copy mmap loading directly to GPU."
    ]
  },
  "finops-mig": {
    id: "finops-mig",
    module: "Module 8: Production Operations, Deployment & FinOps",
    title: "FinOps, MIG slicing, spot pools and autoscaling economics",
    overview: "Production AI serving cost is dominated by idle GPU capacity. Multi-Instance GPU (MIG) hardware slicing partitions a single H100 into up to 7 isolated GPU instances for smaller models. Combining MIG with spot instance pools, dynamic autoscaling on queue depth, and batch tuning minimizes cost per million tokens.",
    keyConcepts: [
      { heading: "MIG Hardware Partitioning", body: "NVIDIA MIG divides GPU compute cores, crossbar paths, and memory bandwidth into hardware-isolated instances with guaranteed QoS." },
      { heading: "Spot Instance Economics", body: "Cloud spot/preemptible GPUs offer 60-80% discounts. Serving architectures handle spot terminations by draining KV caches and re-routing active requests." },
      { heading: "Autoscaling Metrics", body: "Autoscaling on CPU/GPU utilization fails because GPUs report 100% load during memory waits. Autoscale on queue depth and ITL instead." }
    ],
    mathDeepDive: {
      title: "Cost Per Million Tokens",
      equation: "Cost_per_1M = (Hourly_GPU_Rate / (Throughput_tok_sec × 3600)) × 1,000,000",
      explanation: "An H100 costing $3.50/hr spot generating 2,400 tok/sec achieves $0.40 per million tokens. On-demand ($10/hr) costs $1.15 per million tokens for the exact same output."
    },
    realWorldEngineering: [
      "Karpenter and KEDA scale Kubernetes GPU worker pools based on pending request queues and p95 TTFT metrics.",
      "Anyscale, Baseten, and Together AI run multi-tenant MIG and spot clusters to optimize infrastructure margin."
    ]
  }
};
