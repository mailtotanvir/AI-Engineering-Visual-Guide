export interface TrainDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const TRAIN_DOMAINS: TrainDomain[] = [
  { id: "objectives", num: "01", name: "Objectives & Paradigm", blurb: "Predictive self-supervision, Causal vs Masked LM, context windows, and the training step loop." },
  { id: "data", num: "02", name: "Data Engineering", blurb: "Web crawl ingestion, FastText heuristics, MinHash LSH deduplication, BPE tokenization, and synthetic data." },
  { id: "recipe", num: "03", name: "Pre-Train Recipe", blurb: "Chinchilla scaling laws, Rotary Position Embeddings (RoPE), RMSNorm, SwiGLU, and GQA." },
  { id: "infrastructure", num: "04", name: "3D Parallelism", blurb: "Memory state bill, Data Parallelism, Ring All-Reduce, Tensor Parallelism, and Pipeline 1F1B schedules." },
  { id: "numerics", num: "05", name: "Precision & Kernels", blurb: "FP16/BF16/FP8 mixed-precision, dynamic loss scaling, FlashAttention tiled compute, and activation recompute." },
  { id: "diagnostics", num: "06", name: "Execution & Telemetry", blurb: "AdamW decoupled weight decay, cosine schedules, scaled residual init, MFU tracking, and spike recovery engines." },
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
  /* Domain 1: Objectives & Paradigm */
  { id: "token-diet", domain: "objectives", title: "Initialization & Nudging", kind: "scene", scene: "token-diet",
    summary: "How billions of parameters shift from Gaussian noise into structured representations.",
    points: [
      "Weights are grown across trillions of tokens, not hand-programmed.",
      "Every step computes ∂L/∂w for every single parameter.",
      "Early warmup steps prevent gradient explosion during volatile initialization." ] },
  { id: "clm-vs-mlm", domain: "objectives", title: "Causal vs. Masked LM", kind: "scene", scene: "clm-vs-mlm",
    summary: "Autoregressive generation vs bidirectional fill-in-the-blanks.",
    points: [
      "CLM scores N predictions per forward pass; MLM only scores ~15% masked positions.",
      "CLM enables fast KV-cache autoregressive token generation.",
      "Every modern foundation model (GPT-4, Llama 3, Claude 3.5) uses CLM pre-training." ] },
  { id: "one-step", domain: "objectives", title: "The Step Loop", kind: "scene", scene: "one-step",
    summary: "Forward logits -> Backward autodiff -> Optimizer step.",
    points: [
      "Forward pass evaluates loss over mini-batch sequences.",
      "Backward pass applies multivariable chain rule layer by layer.",
      "AdamW updates parameters using running momentum and variance." ] },
  { id: "causal-mask", domain: "objectives", title: "Causal Attention Masking", kind: "scene", scene: "causal-mask",
    summary: "Zeroing upper-triangular scores to enforce unidirectional temporal flow.",
    points: [
      "Lower-triangular matrix prevents position i from seeing future tokens j > i.",
      "Enables parallel training over full sequence lengths in one pass.",
      "FlashAttention skips computing 50% invalid masked tiles entirely." ] },
  { id: "context-window", domain: "objectives", title: "Context Window Math", kind: "scene", scene: "context-window",
    summary: "Understanding O(N^2) memory scaling and KV cache growth.",
    points: [
      "Standard attention score matrices scale quadratically with sequence length N.",
      "KV cache VRAM footprint expands with batch size, context length, and layer depth.",
      "Tiled compute (FlashAttention) and GQA enable 128k+ context windows." ] },

  /* Domain 2: Data Engineering */
  { id: "crawl-filter", domain: "data", title: "Crawl Filtering Pipelines", kind: "scene", scene: "crawl-filter",
    summary: "Eliminating web spam, machine junk, and toxic text using FastText classifiers.",
    points: [
      "Heuristic rules filter symbol ratios, mean word length, and line endings.",
      "FastText n-gram classifiers assign quality probabilities relative to Wikipedia/books.",
      "Language identification enforces balanced multilingual distributions." ] },
  { id: "dedup", domain: "data", title: "MinHash & LSH Deduplication", kind: "scene", scene: "dedup",
    summary: "Locality-Sensitive Hashing to purge near-duplicate web documents at petabyte scale.",
    points: [
      "MinHash converts document shingle sets into compact signature vectors.",
      "LSH buckets similar documents without requiring all-pairs pairwise checks.",
      "Removes 20-50% redundant web data, preventing model memorization and loss spikes." ] },
  { id: "bpe", domain: "data", title: "Byte-Pair Encoding (BPE)", kind: "scene", scene: "bpe",
    summary: "Building robust vocabularies directly from UTF-8 byte streams.",
    points: [
      "Starts from 256 byte tokens, iteratively merging most frequent adjacent pairs.",
      "128k vocabularies (Llama 3) compress text ~15% better than 32k vocabs (Llama 2).",
      "Pre-tokenization regex patterns prevent invalid merges across word/punctuation bounds." ] },
  { id: "synthetic-data", domain: "data", title: "Synthetic Token Infusion", kind: "concept",
    summary: "Generating clean reasoning steps and textbook tokens using LLM teacher models.",
    points: [
      "Small frontier models generate billions of high-density math and coding problems.",
      "Filters eliminate low-diversity or repetitive synthetic outputs.",
      "Boosts reasoning benchmark performance per total training FLOP." ] },

  /* Domain 3: Pre-Train Recipe */
  { id: "scaling-laws", domain: "recipe", title: "Chinchilla Scaling Laws", kind: "scene", scene: "scaling-laws",
    summary: "Compute-optimal budgeting: 20 tokens per parameter (N ∝ D).",
    points: [
      "Total FLOPs = 6 * N * D for dense transformer training.",
      "Over-training smaller models past Chinchilla optimal yields cheaper inference forever.",
      "Loss follows clean power-law curves L(N, D) across 9 orders of magnitude." ] },
  { id: "rope", domain: "recipe", title: "Rotary Position Embeddings (RoPE)", kind: "scene", scene: "rope",
    summary: "Encoding relative distance by rotating Q and K pairs in complex 2D planes.",
    points: [
      "Rotates query/key pairs such that inner products depend strictly on (m - n).",
      "Requires zero extra parameters or auxiliary VRAM allocation.",
      "Theta scaling (e.g. 10k to 500k) extends context window bounds smoothly." ] },
  { id: "norm-activation", domain: "recipe", title: "RMSNorm & SwiGLU", kind: "scene", scene: "norm-activation",
    summary: "Replacing LayerNorm and ReLU with root-mean-square scaling and gated activations.",
    points: [
      "RMSNorm skips mean calculation, saving 7-10% latency per block.",
      "SwiGLU provides smooth gradients and higher expressive parameter capacity.",
      "Pre-LN residual wiring preserves gradient flow across 80+ layers." ] },
  { id: "gqa", domain: "recipe", title: "Grouped-Query Attention (GQA)", kind: "scene", scene: "gqa",
    summary: "Sharing Key/Value heads across Query head groups to slash KV cache size.",
    points: [
      "8:1 GQA ratio reduces KV cache VRAM footprint by 87.5%.",
      "Maintains standard MHA accuracy while enabling larger serving batch sizes.",
      "Implemented directly in pre-training projection matrices." ] },

  /* Domain 4: 3D Parallelism */
  { id: "memory-budget", domain: "infrastructure", title: "Training Memory State (16N)", kind: "scene", scene: "memory-budget",
    summary: "Static memory decomposition: Weights (2N) + Gradients (2N) + Adam (12N).",
    points: [
      "Mixed-precision training requires 16 bytes per parameter for static state.",
      "70B model requires 1,120 GB static VRAM — mandatory distributed sharding.",
      "Dynamic activation memory comes on top, growing linearly with batch and sequence length." ] },
  { id: "data-parallel", domain: "infrastructure", title: "Data Parallelism & ZeRO", kind: "scene", scene: "data-parallel",
    summary: "Replicating model ranks and sharding optimizer states (ZeRO 1/2/3).",
    points: [
      "Each rank receives unique mini-batches; gradients are averaged globally.",
      "ZeRO-1 shards Adam states; ZeRO-2 shards grads; ZeRO-3 shards model parameters.",
      "PyTorch FSDP automates ZeRO-3 parameter all-gathers during forward/backward steps." ] },
  { id: "ring-allreduce", domain: "infrastructure", title: "Ring All-Reduce", kind: "scene", scene: "ring-allreduce",
    summary: "Bandwidth-optimal gradient synchronization across GPU rings.",
    points: [
      "Executes Scatter-Reduce followed by All-Gather across 2(N-1) steps.",
      "Per-GPU data volume equals 2 * ((N-1)/N) * S — independent of cluster scale.",
      "NCCL pipeline overlaps ring communication directly with backward pass GEMMs." ] },
  { id: "tensor-parallel", domain: "infrastructure", title: "Tensor Parallelism (TP)", kind: "scene", scene: "tensor-parallel",
    summary: "Megatron column/row linear layer slicing inside NVLink nodes.",
    points: [
      "Splits MLP Gate/Up column-wise and Down row-wise.",
      "Requires 2 All-Reduces per transformer block.",
      "Must remain within ultra-fast 900 GB/s NVLink intra-node domain." ] },
  { id: "pipeline-parallel", domain: "infrastructure", title: "Pipeline Parallelism (PP)", kind: "scene", scene: "pipeline-parallel",
    summary: "Sequential layer distribution across nodes using 1F1B schedules.",
    points: [
      "Splits layer stacks sequentially across GPU stages.",
      "1F1B schedule interleaves forward and backward micro-batches to minimize memory.",
      "Bubble fraction = (p - 1) / (m + p - 1) decreases with more micro-batches." ] },

  /* Domain 5: Precision & Acceleration */
  { id: "precision", domain: "numerics", title: "Mixed-Precision Math", kind: "scene", scene: "precision",
    summary: "FP16 vs BF16 vs FP8 dynamic representation and loss scaling.",
    points: [
      "BF16 matches FP32 dynamic exponent range, preventing gradient underflow.",
      "FP16 requires dynamic loss scaling (multiplication factor S) to keep tiny grads alive.",
      "FP8 Transformer Engine (E4M3 / E5M2) doubles H100 TFLOPS." ] },
  { id: "checkpointing", domain: "numerics", title: "Activation Checkpointing", kind: "scene", scene: "checkpointing",
    summary: "Trading 33% extra forward compute to drop intermediate activation tensors.",
    points: [
      "Stores activations only at sqrt(L) segment boundaries.",
      "Reduces activation VRAM overhead from O(L) to O(sqrt(L)).",
      "FlashAttention online Softmax eliminates quadratic HBM reads/writes entirely." ] },

  /* Domain 6: Execution & Telemetry */
  { id: "optimizer-schedule", domain: "diagnostics", title: "AdamW & Cosine Schedules", kind: "scene", scene: "optimizer-schedule",
    summary: "Decoupled weight decay, linear warmup, and cosine learning rate decay.",
    points: [
      "AdamW decouples weight decay from gradient updates, stabilizing deep nets.",
      "Warmup (first 1-2% steps) prevents early divergence during random weight steps.",
      "Gradient clipping caps global norm ||g|| <= 1.0 to survive loss spikes." ] },
  { id: "telemetry", domain: "diagnostics", title: "Telemetry & Crash Recovery", kind: "scene", scene: "telemetry",
    summary: "Monitoring MFU, tracking gradient norms, and automated checkpoint rewind.",
    points: [
      "Dashboards track MFU %, loss curves, token throughput, and GPU temperatures.",
      "Automated engines rewind 2,000 steps on NaN/loss spikes to skip corrupt data shards.",
      "Asynchronous parallel NVMe pipelines dump multi-terabyte checkpoints without pausing GPUs." ] }
];
