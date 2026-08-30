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
  "token-diet": {
    id: "token-diet",
    module: "Module 1: Objectives & Paradigm",
    title: "A model is grown, not built — Initialization to Signal",
    overview: "Neural network pre-training is a continuous optimization procedure where a multi-billion parameter weight tensor begins as random Gaussian noise and is iteratively shifted along loss gradients across trillions of tokens.",
    keyConcepts: [
      {
        heading: "Initialization Variance",
        body: "Weights are initialized using scaled normal distributions (e.g. Xavier/Glorot or Kaiming initialization). If initialization scale is too high, activations explode into NaN; if too low, gradients vanish before reaching deep early layers."
      },
      {
        heading: "Accumulated Nudges",
        body: "Each mini-batch calculates a loss score and computes partial derivatives ∂L/∂w for every parameter w. The optimizer applies a minuscule update step. Over 10^12 tokens, these individual nudges aggregate into structured semantic representations."
      },
      {
        heading: "Inference vs. Training",
        body: "During training, model weights are live target buffers requiring gradient history, momentum, and variance state. During inference, weights are frozen, requiring 4x to 8x less VRAM."
      }
    ],
    mathDeepDive: {
      title: "Weight Update Step",
      equation: "w_(t+1) = w_t - η · ( m_hat_t / ( √(v_hat_t) + ε ) )",
      explanation: "Each weight w is adjusted by learning rate η times the bias-corrected first moment estimate divided by the square root of the bias-corrected second moment estimate."
    },
    realWorldEngineering: [
      "Llama 3 70B was trained on over 15 trillion tokens using ~24,000 GPU clusters over several months.",
      "Early training stability is so fragile that the first 2,000-5,000 steps use a linear 'warmup' phase ramping learning rate from 0 to peak."
    ]
  },

  "clm-vs-mlm": {
    id: "clm-vs-mlm",
    module: "Module 1: Objectives & Paradigm",
    title: "Causal Language Modeling (CLM) vs. Masked Language Modeling (MLM)",
    overview: "The choice of self-supervised training objective fundamentally dictates model architecture, inference latency, and generative capabilities. Masked Language Modeling (BERT) bidirectionally inspects context to fill in hidden tokens, while Causal Language Modeling (GPT / Llama) strictly predicts the next token given preceding context.",
    keyConcepts: [
      {
        heading: "CLM Mechanics (Autoregressive)",
        body: "CLM computes cross-entropy loss on every single token position in a sequence simultaneously using a lower-triangular causal attention mask. The model learns P(x_t | x_1, x_2, ..., x_{t-1})."
      },
      {
        heading: "MLM Mechanics (Bidirectional)",
        body: "MLM replaces ~15% of tokens with a [MASK] token. The model sees past and future tokens for unmasked tokens, computing loss only over the masked locations. While powerful for encoder tasks, it cannot generate long text autoregressively without N passes."
      },
      {
        heading: "Why CLM Won the Generative Era",
        body: "CLM computes N predictions per forward pass (one for each position in the context), making token-for-token training computational efficiency far higher than MLM (which only calculates loss on the 15% masked positions)."
      }
    ],
    mathDeepDive: {
      title: "Causal Cross-Entropy Loss",
      equation: "Loss_CLM = - (1 / N) * ∑_(i=1..N) log P( x_i | x_1, x_2, ..., x_(i-1) ; Θ )",
      explanation: "The global loss is the mean negative log-likelihood of predicting each true token x_i given all prior tokens in the sequence."
    },
    realWorldEngineering: [
      "Every modern foundation model (GPT-4, Claude 3.5, Llama 3, Qwen 2.5) uses CLM pre-training.",
      "Hybrid models like T5 or UL2 attempt unified objectives, but pure CLM remains the undisputed standard due to KV-cache inference compatibility."
    ]
  },

  "one-step": {
    id: "one-step",
    module: "Module 1: Objectives & Paradigm",
    title: "Anatomy of a Single Training Step",
    overview: "Every pre-training run is an endless loop of a single fundamental iteration: Forward Pass -> Loss Calculation -> Backward Pass (Autodiff) -> Parameter Update.",
    keyConcepts: [
      {
        heading: "1. The Forward Pass",
        body: "Tokens pass through embedding layers, N Transformer blocks (RMSNorm, MHA/GQA, SwiGLU MLP), and an LM Head to output logits over vocabulary V. Activations must be cached in GPU HBM for backward pass calculation."
      },
      {
        heading: "2. The Backward Pass (Backpropagation)",
        body: "Applying the multivariable chain rule from the loss scalar backwards through layer outputs. Matrix multiplication transpose operations compute ∂L/∂W for each weight tensor."
      },
      {
        heading: "3. The Optimizer Step",
        body: "AdamW updates weight tensors using running exponentially weighted averages of gradients (m) and squared gradients (v), applying weight decay directly to weights."
      }
    ],
    mathDeepDive: {
      title: "Gradient Chain Rule across Layers",
      equation: "∂Loss / ∂W^(l) = ( ∂Loss / ∂a^(l) ) · ( ∂a^(l) / ∂z^(l) ) · ( a^(l-1) )ᵀ",
      explanation: "Backward propagation translates output errors into weight updates by multiplying downstream error gradients by local activation transposes."
    },
    realWorldEngineering: [
      "In distributed clusters, backward pass execution is overlapped with gradient All-Reduce operations across the network fabric to mask communication latency.",
      "A step on a 70B model with 4M token global batch size takes ~2.5 seconds across 1,024 H100 GPUs."
    ]
  },

  "causal-mask": {
    id: "causal-mask",
    module: "Module 1: Objectives & Paradigm",
    title: "Causal Attention Masking & Temporal Flow",
    overview: "To enforce left-to-right temporal order during parallel training, self-attention score matrices are masked with negative infinity above the main diagonal before applying Softmax.",
    keyConcepts: [
      {
        heading: "Lower-Triangular Masking",
        body: "Position i is prohibited from attending to position j if j > i. Setting S_(i,j) = -∞ forces Softmax(S)_(i,j) = 0, zeroing out attention weight."
      },
      {
        heading: "Parallel Training Efficiency",
        body: "Without causal masking, training on sequence length N would require N sequential forward passes. Causal masking allows all N token positions to be trained concurrently in a single forward/backward pass."
      },
      {
        heading: "Waste Elimination",
        body: "Exactly (N-1)/(2N) ≈ 50% of the attention matrix represents upper-triangular masked invalid comparisons. FlashAttention and FlashDecoding exploit this geometry to skip computing 50% of tile scores entirely."
      }
    ],
    mathDeepDive: {
      title: "Masked Attention Softmax",
      equation: "Attention(Q, K, V) = Softmax( (Q Kᵀ / √d_k) + M ) V\n\nwhere M_(i,j) = 0 if i ≥ j, else -∞",
      explanation: "Adding -∞ in the mask matrix M sets exponentiated values to zero in the Softmax row normalization."
    },
    realWorldEngineering: [
      "Modern CUDA kernels for causal attention use triangular loop bounds in GPU thread blocks, saving 50% FLOPs and DRAM bandwidth."
    ]
  },

  "context-window": {
    id: "context-window",
    module: "Module 1: Objectives & Paradigm",
    title: "Context Window Scaling & Quadratic Attention Memory",
    overview: "Standard Multi-Head Attention requires computing all pairs of interactions between query and key tokens, resulting in O(N^2) memory and compute complexity relative to sequence length N.",
    keyConcepts: [
      {
        heading: "The O(N^2) Wall",
        body: "At sequence length N=4,000, N^2 = 16M matrix elements. At N=128,000, N^2 = 16.38B matrix elements per attention head. Unoptimized attention score tensors instantly OOM even 80GB H100 GPUs."
      },
      {
        heading: "KV Cache Expansion",
        body: "During generation, Key and Value vectors for all past tokens must be preserved in VRAM. For a 128k context on Llama 3 70B, KV cache per user request consumes tens of GBs without Grouped-Query Attention."
      },
      {
        heading: "Architectural Workarounds",
        body: "Techniques like FlashAttention (tiled SRAM compute), RingAttention (sequence sharding across GPUs), and RoPE frequency scaling enable modern context lengths from 8k to 1M+ tokens."
      }
    ],
    mathDeepDive: {
      title: "Attention Score Memory Scale",
      equation: "Memory_Score = Batch × Heads × N² × 2 bytes (BF16)",
      explanation: "Batch B, Heads H, Sequence N. Notice how doubling sequence length N quadruples required score buffer bytes."
    },
    realWorldEngineering: [
      "Context length expansion is typically done in two phases: pre-training on 8k tokens, then fine-tuning/extending on 128k+ tokens with adjusted RoPE theta."
    ]
  },

  "crawl-filter": {
    id: "crawl-filter",
    module: "Module 2: Data Engineering & Curation at Web-Scale",
    title: "Web Crawl Filtering & Quality Pipelines",
    overview: "Raw web dumps like Common Crawl contain up to 80% spam, machine-generated junk, duplicate boilerplates, and SEO text. Pre-training on unfiltered data degrades model reasoning and produces high loss floors.",
    keyConcepts: [
      {
        heading: "Heuristic Quality Filters",
        body: "Filters check token-to-symbol ratios, digit-to-char ratios, mean word length, line-ending punctuation, and toxic word lists to eliminate non-prose web garbage."
      },
      {
        heading: "FastText Classifier Scoring",
        body: "Training lightweight FastText or n-gram classifiers on high-quality target sets (Wikipedia, curated books) vs. raw web dumps assigns a probability score to every web document."
      },
      {
        heading: "Language Identification",
        body: "Enforcing clean multilingual proportions using FastText lang-id prevents low-quality untranslated web spam from corrupting domain allocations."
      }
    ],
    mathDeepDive: {
      title: "FastText Document Quality Probability",
      equation: "P(Quality | doc) = exp( w_quality · x_doc ) / ∑_c exp( w_c · x_doc )",
      explanation: "Linear classification over document n-gram embeddings x_doc provides microsecond quality filtering at petabyte scale."
    },
    realWorldEngineering: [
      "FineWeb (Hugging Face) filtered 96 Common Crawl dumps down to 15 trillion high-quality tokens using an open, multi-stage heuristic and classifier pipeline."
    ]
  },

  "dedup": {
    id: "dedup",
    module: "Module 2: Data Engineering & Curation at Web-Scale",
    title: "Advanced Deduplication: MinHash, LSH, & Suffix Arrays",
    overview: "Web data contains millions of near-identical documents, news syndications, privacy disclaimers, and boilerplate footers. Deduplication prevents memorization, reduces loss spikes, and saves thousands of GPU hours.",
    keyConcepts: [
      {
        heading: "Document-Level MinHash + LSH",
        body: "Documents are split into n-gram sets (shingles). MinHash computes signature vectors. Locality-Sensitive Hashing (LSH) hashes signature bands into buckets to catch near-duplicates with Jaccard similarity > 0.8 without pairwise comparisons."
      },
      {
        heading: "Line-Level & Sub-String Dedup",
        body: "Common headers, footers, and cookie banners span across otherwise distinct documents. Suffix arrays locate repeated byte spans >= 50 tokens across multi-terabyte datasets."
      },
      {
        heading: "Impact on Pre-Training",
        body: "Deduplication reduces corpus size by 20%-50% while improving downstream benchmark accuracy, as models spend FLOPs learning concepts rather than repeating memorized text."
      }
    ],
    mathDeepDive: {
      title: "Jaccard Similarity MinHash Property",
      equation: "Prob( min_hash(A) == min_hash(B) ) = Jaccard(A, B) = |A ∩ B| / |A ∪ B|",
      explanation: "The probability that two document shingle sets produce identical minimum hash values equals their exact Jaccard overlap."
    },
    realWorldEngineering: [
      "Llama 3 data processing pipelines execute multi-stage LSH dedup across Spark/Ray clusters spanning thousands of CPU cores."
    ]
  },

  "bpe": {
    id: "bpe",
    module: "Module 2: Data Engineering & Curation at Web-Scale",
    title: "Tokenizer Design & Byte-Pair Encoding (BPE)",
    overview: "Tokenizers convert raw text strings into discrete integer sequences for model ingestion. Modern BPE tokenizers operate directly on UTF-8 bytes to guarantee zero out-of-vocabulary (OOV) tokens while maximizing compression efficiency.",
    keyConcepts: [
      {
        heading: "Byte-Level BPE",
        body: "Starting with a base vocabulary of 256 raw UTF-8 bytes, the algorithm iteratively counts adjacent symbol pairs across a massive text corpus and merges the most frequent pair into a new token."
      },
      {
        heading: "Vocabulary Size Trade-offs",
        body: "Small vocabs (32k) save memory in the embedding/LM head layer but result in longer sequence lengths per document. Large vocabs (128k+) shorten token sequences by ~15%-20%, speeding up attention and generation."
      },
      {
        heading: "Pre-Tokenization Regex",
        body: "Regex splitting (such as tiktoken's cl100k pattern) prevents BPE from merging across numbers, punctuation, or word boundaries, preventing weird token mergers."
      }
    ],
    mathDeepDive: {
      title: "BPE Pair Frequency Merge",
      equation: "Pair_selected = argmax_(p_A, p_B) Count( p_A, p_B )",
      explanation: "Find the most frequent pair of adjacent tokens in the corpus and assign it a fresh vocabulary index."
    },
    realWorldEngineering: [
      "Llama 3 expanded vocabulary from Llama 2's 32k to 128k tokens, achieving ~15% better text compression and significantly improving non-English performance."
    ]
  },

  "scaling-laws": {
    id: "scaling-laws",
    module: "Module 3: Modern Architectural Specifications (The Pre-Train Recipe)",
    title: "Chinchilla Scaling Laws & Compute-Optimal Budgeting",
    overview: "DeepMind's Chinchilla study (Hoffmann et al.) corrected Kaplan's earlier scaling laws, proving that for compute-optimal training, model parameters N and training tokens D should scale in equal proportion: N ∝ D.",
    keyConcepts: [
      {
        heading: "Chinchilla Multiplier (D ≈ 20N)",
        body: "To train a compute-optimal model, allocate ~20 tokens per model parameter. A 7B model requires 140B tokens; a 70B model requires 1.4T tokens for compute efficiency."
      },
      {
        heading: "Inference-Optimal Over-Training",
        body: "Modern open models deliberately break Chinchilla optimality by over-training smaller models (e.g., Llama 3 8B trained on 15T tokens = 1,875 tokens/param). Paying higher pre-training cost yields cheaper inference forever."
      },
      {
        heading: "Compute Budget Formula (6ND)",
        body: "Total training FLOPs for a dense transformer is approximately 6 · N · D (2ND forward pass + 4ND backward pass)."
      }
    ],
    mathDeepDive: {
      title: "Power Law Loss Function",
      equation: "Loss(N, D) = E + ( A / N^a ) + ( B / D^b )",
      explanation: "Cross-entropy loss L scales as power laws of parameter count N and dataset size D, approaching irreducible entropy E."
    },
    realWorldEngineering: [
      "Llama 3 8B trained on 15T tokens achieved benchmark performance competing with 70B Chinchilla-optimal models."
    ]
  },

  "rope": {
    id: "rope",
    module: "Module 3: Modern Architectural Specifications (The Pre-Train Recipe)",
    title: "Rotary Position Embeddings (RoPE)",
    overview: "RoPE (Su et al.) encodes relative positional information by multiplying 2D sub-vectors of Query and Key representations by rotation matrices proportional to sequence position.",
    keyConcepts: [
      {
        heading: "Relative via Absolute Rotation",
        body: "Instead of adding position embeddings to input tokens, RoPE rotates Q and K vectors in complex 2D planes. The dot product <R_m Q, R_n K> depends purely on relative distance (m - n)."
      },
      {
        heading: "No Extra Memory/Parameters",
        body: "RoPE requires zero additional model parameters and is applied on-the-fly inside attention heads."
      },
      {
        heading: "Length Extrapolation (RoPE Scaling)",
        body: "By scaling the base theta frequency (e.g. from 10,000 to 500,000 or YaRN/linear scaling), models trained at 8k context can extrapolate to 128k+ tokens cleanly."
      }
    ],
    mathDeepDive: {
      title: "2D RoPE Rotation Operator",
      equation: "R_(θ, m) = [ cos(m θ_i)  -sin(m θ_i) ]\n           [ sin(m θ_i)   cos(m θ_i) ]",
      explanation: "Rotates vector pairs at position m using dimension-dependent frequency θ_i = 10000^(-2(i-1)/d)."
    },
    realWorldEngineering: [
      "Every top open-weights foundation LLM (Llama 3, Qwen 2.5, Mistral, Gemma 2) uses RoPE position embeddings."
    ]
  },

  "norm-activation": {
    id: "norm-activation",
    module: "Module 3: Modern Architectural Specifications (The Pre-Train Recipe)",
    title: "Normalization & Activation Layer Evolution: RMSNorm & SwiGLU",
    overview: "Modern architecture recipes replaced standard LayerNorm with RMSNorm to eliminate mean-centering overhead, and replaced ReLU/GeLU with SwiGLU gated activations for superior gradient propagation.",
    keyConcepts: [
      {
        heading: "RMSNorm (Root Mean Square Norm)",
        body: "RMSNorm normalizes activation inputs using root mean square without calculating mean offset. This saves ~7% to 10% kernel latency per transformer block with zero loss in training stability."
      },
      {
        heading: "SwiGLU Activation Function",
        body: "SwiGLU combines Swish activation with Gated Linear Units: SwiGLU(x) = (xW + b) * Swish(xV + c). It provides smoother gradients and higher expressive capacity."
      },
      {
        heading: "Pre-Normalization Architecture",
        body: "Placing RMSNorm BEFORE attention and MLP blocks (Pre-LN) instead of after (Post-LN) keeps the residual main branch uncorrupted, preventing vanishing gradients in 80+ layer deep networks."
      }
    ],
    mathDeepDive: {
      title: "RMSNorm Formulation",
      equation: "a_bar_i = ( a_i / RMS(a) ) · g_i\n\nwhere RMS(a) = √( (1 / d) ∑_(j=1..d) a_j² + ε )",
      explanation: "Rescales vector components by the L2 norm over dimension d, multiplied by learnable gain g_i."
    },
    realWorldEngineering: [
      "SwiGLU requires an intermediate hidden dimension of (8/3)d rather than 4d to match parameter count while improving convergence."
    ]
  },

  "gqa": {
    id: "gqa",
    module: "Module 3: Modern Architectural Specifications (The Pre-Train Recipe)",
    title: "Grouped-Query Attention (GQA) & KV Cache Optimization",
    overview: "Standard Multi-Head Attention (MHA) assigns independent Key and Value heads to every Query head, causing massive KV cache VRAM consumption during inference. Grouped-Query Attention groups multiple Query heads to share single Key/Value heads.",
    keyConcepts: [
      {
        heading: "MHA vs. MQA vs. GQA",
        body: "MHA: 1 Q head per 1 KV head (1:1 ratio). MQA: All Q heads share 1 KV head (N:1 ratio, extreme bandwidth saving, minor quality loss). GQA: G Query heads share 1 KV head (e.g. 8:1 ratio, optimal tradeoff)."
      },
      {
        heading: "KV Cache VRAM Reduction",
        body: "With 8:1 GQA (e.g., 64 Q heads, 8 KV heads in Llama 3 70B), the KV cache footprint during generation drops by 87.5% (8x saving), allowing 8x larger batch sizes or context lengths."
      },
      {
        heading: "Pre-Training Integration",
        body: "GQA must be built into pre-training from step 0 so projections learn grouped representations."
      }
    ],
    mathDeepDive: {
      title: "GQA Projection Head Ratios",
      equation: "Heads_KV = Heads_Q / Grouping_Factor_G\n\nKV_bytes = 2 × Layers × Head_Dim × Heads_KV × Context_N × Batch × Precision_bytes",
      explanation: "Dividing KV head count by grouping factor G directly divides KV memory overhead by G."
    },
    realWorldEngineering: [
      "Llama 3 8B and 70B both use GQA with 8 KV heads, enabling fast multi-user serving on single GPU nodes."
    ]
  },

  "memory-budget": {
    id: "memory-budget",
    module: "Module 4: Distributed Infrastructure & 3D Parallelism",
    title: "The Training Memory Bill: Weights, Gradients, Adam, & Activations",
    overview: "A common misconception is that GPU memory only stores model weights. In FP16/BF16 mixed-precision AdamW training, static optimizer states and gradients consume 8x the memory of model parameters alone.",
    keyConcepts: [
      {
        heading: "The 16-Bytes-per-Parameter Rule (State)",
        body: "For parameter count N: Model Weights (BF16) = 2N bytes. Gradients (BF16) = 2N bytes. Adam Momentum (FP32) = 4N bytes. Adam Variance (FP32) = 4N bytes. Master Weights (FP32) = 4N bytes. Total static memory = 16N bytes!"
      },
      {
        heading: "Dynamic Activations",
        body: "In addition to the 16N static bytes, intermediate layer outputs (activations) stored for backprop grow linearly with sequence length N, batch size B, hidden size d, and layer count L."
      },
      {
        heading: "Why Sharding Is Mandatory",
        body: "A 70B model requires 70B * 16 bytes = 1,120 GB static memory — impossible to fit on a single 80GB GPU without distributed sharding."
      }
    ],
    mathDeepDive: {
      title: "Static Training VRAM Breakdown",
      equation: "Static_Memory = N × ( 2_weights + 2_grads + 4_momentum + 4_variance + 4_master ) = 16 N bytes",
      explanation: "Calculating raw static bytes before adding activation tensors and temporary workspace buffers."
    },
    realWorldEngineering: [
      "ZeRO-Stage 1 shards the 12N bytes of Adam state across data-parallel ranks, reducing per-GPU memory by up to 8x."
    ]
  },

  "data-parallel": {
    id: "data-parallel",
    module: "Module 4: Distributed Infrastructure & 3D Parallelism",
    title: "Data Parallelism & ZeRO State Sharding",
    overview: "Data Parallelism (DP) replicates model parameters across multiple GPUs, sending unique micro-batches to each rank and averaging computed gradients across ranks before the optimizer step.",
    keyConcepts: [
      {
        heading: "Naive Data Parallelism",
        body: "Every GPU keeps a full copy of model weights, gradients, and optimizer states. Scale throughput by increasing global batch size = micro_batch * DP_ranks."
      },
      {
        heading: "ZeRO-1, ZeRO-2, ZeRO-3 Memory Sharding",
        body: "ZeRO-1: Shards Adam optimizer states across DP ranks (saves 4x memory). ZeRO-2: Shards gradients across ranks (saves 2x further). ZeRO-3: Shards model parameters across ranks (all-gathers weights on-the-fly per layer)."
      },
      {
        heading: "Communication Overlap",
        body: "Gradient All-Reduce and All-Gather calls are piped concurrently alongside backward pass GEMM operations to maximize GPU compute unit utilization."
      }
    ],
    mathDeepDive: {
      title: "ZeRO-3 Memory per GPU",
      equation: "Memory_ZeRO3 = ( 16 N / DP_ranks ) + Activation_Memory",
      explanation: "Dividing total model static memory evenly across all data-parallel workers."
    },
    realWorldEngineering: [
      "PyTorch FSDP (Fully Sharded Data Parallel) is the open-source implementation of ZeRO-3 built into modern training stacks."
    ]
  },

  "ring-allreduce": {
    id: "ring-allreduce",
    module: "Module 4: Distributed Infrastructure & 3D Parallelism",
    title: "Collectives: Bandwidth-Optimal Ring All-Reduce",
    overview: "Synchronizing gradients across thousands of GPUs requires efficient collective communication algorithms. Ring All-Reduce achieves optimal communication efficiency independent of cluster size.",
    keyConcepts: [
      {
        heading: "Two-Phase Communication",
        body: "1. Scatter-Reduce: Each GPU sends a gradient chunk to its logical neighbor in a ring for N-1 steps, computing partial sums. 2. All-Gather: Each GPU passes fully reduced chunks around the ring for N-1 steps."
      },
      {
        heading: "Bandwidth Optimality",
        body: "Total data transferred per GPU is precisely 2 * ((N-1)/N) * S bytes, where S is tensor size. As rank count N grows large, data transferred approaches 2S bytes — constant regardless of cluster scale!"
      },
      {
        heading: "Interconnect Dependency",
        body: "Ring All-Reduce requires high ring interconnect bandwidth (NVLink within node, InfiniBand/RoCE between nodes) to prevent network stragglers."
      }
    ],
    mathDeepDive: {
      title: "Ring All-Reduce Volume",
      equation: "Volume_per_GPU = 2 × ( (N - 1) / N ) × Tensor_Size",
      explanation: "Proving that per-GPU network transfer volume saturates at 2x tensor size even on 10,000+ GPU nodes."
    },
    realWorldEngineering: [
      "NCCL (NVIDIA Collective Communications Library) automatically configures tree or ring topologies based on physical NVLink and InfiniBand detection."
    ]
  },

  "tensor-parallel": {
    id: "tensor-parallel",
    module: "Module 4: Distributed Infrastructure & 3D Parallelism",
    title: "Tensor Parallelism (Megatron-LM Intra-Node Slicing)",
    overview: "When a single transformer layer's weight matrices exceed single-GPU VRAM or require ultra-fast GEMM acceleration, Tensor Parallelism (TP) splits linear layers across GPUs within a single NVLink node.",
    keyConcepts: [
      {
        heading: "Column-Parallel & Row-Parallel GEMMs",
        body: "In MLP layers: First linear layer (Gate/Up) is split column-wise: Y_i = X * W_i. Second linear layer (Down) is split row-wise: Z = sum(Y_i * V_i)."
      },
      {
        heading: "All-Reduce Synchronization",
        body: "A Megatron transformer block requires exactly 2 All-Reduce communications per layer: one after self-attention row-parallel projection, and one after MLP row-parallel projection."
      },
      {
        heading: "Strict NVLink Domain Constraint",
        body: "Because TP executes All-Reduces on every single layer forward/backward pass, it requires ultra-low latency intra-node NVLink (900 GB/s on H100), limiting TP size to 8 GPUs per node."
      }
    ],
    mathDeepDive: {
      title: "Row-Parallel Matrix Multiplication Summation",
      equation: "Y = ∑_(i=1..TP) ( X_i · W_i )  ==> All-Reduce-Sum( Y )",
      explanation: "Row-parallel outputs are local partial sums that require an All-Reduce sum across TP ranks to reconstruct full activation tensors."
    },
    realWorldEngineering: [
      "Megatron-LM and vLLM use Tensor Parallelism 2, 4, or 8 to fit 70B+ parameters across 8-GPU HGX nodes."
    ]
  },

  "pipeline-parallel": {
    id: "pipeline-parallel",
    module: "Module 4: Distributed Infrastructure & 3D Parallelism",
    title: "Pipeline Parallelism & 1F1B Scheduling",
    overview: "Pipeline Parallelism (PP) splits model layers sequentially across GPU stages (e.g. layers 1-20 on Stage 0, 21-40 on Stage 1). Micro-batches flow through stages sequentially like a physical assembly line.",
    keyConcepts: [
      {
        heading: "The Pipeline Bubble",
        body: "Naive pipeline schedules cause GPUs to sit idle waiting for activations from upstream stages or gradients from downstream stages. Bubble fraction = (p - 1) / (m + p - 1) where p is stages and m is micro-batches."
      },
      {
        heading: "1F1B (One Forward, One Backward) Schedule",
        body: "After a warmup phase, each GPU stage alternates executing 1 micro-batch forward pass followed by 1 micro-batch backward pass, capping activation memory while keeping pipeline bubbles small."
      },
      {
        heading: "Point-to-Point Interconnect",
        body: "Unlike TP or DP, PP only communicates activations and gradients between adjacent stage nodes using direct peer-to-point network calls."
      }
    ],
    mathDeepDive: {
      title: "Pipeline Bubble Idle Time Fraction",
      equation: "Bubble_Fraction = ( Stages_p - 1 ) / ( MicroBatches_m + Stages_p - 1 )",
      explanation: "Increasing micro-batch count m relative to stage count p drastically reduces idle GPU dead time."
    },
    realWorldEngineering: [
      "Interleaved 1F1B (Megatron) assigns multiple non-contiguous layer chunks to each stage, reducing bubble size by another 2x."
    ]
  },

  "precision": {
    id: "precision",
    module: "Module 5: Numerical Stability, Precision, & Acceleration",
    title: "Mixed-Precision Math: FP16 vs. BF16 vs. FP8 & Dynamic Loss Scaling",
    overview: "Training in FP32 double/single precision is bottlenecked by HBM memory bandwidth and Tensor Core compute capability. Mixed-precision training runs GEMMs in 16-bit or 8-bit floats while keeping FP32 master weights for stability.",
    keyConcepts: [
      {
        heading: "FP16 vs. BF16 Architecture",
        body: "FP16 (5 exponent bits, 10 mantissa bits) has high precision but narrow dynamic range (max ~65,504), causing underflow/overflow gradients. BF16 (8 exponent bits, 7 mantissa bits) shares FP32's wide dynamic range, eliminating gradient underflow without loss scaling."
      },
      {
        heading: "FP8 Pre-Training Era",
        body: "FP8 (E4M3 for forward pass, E5M2 for backward pass) doubles Tensor Core TFLOPS on H100 GPUs while halving activation/weight memory, enabling massive compute acceleration."
      },
      {
        heading: "Dynamic Loss Scaling (FP16)",
        body: "Because FP16 underflows small gradients to zero, loss is multiplied by a scale factor S (e.g. 2^16) before backprop, then unscaled before optimizer updates."
      }
    ],
    mathDeepDive: {
      title: "Dynamic Loss Scaling Correction",
      equation: "Loss_scaled = Scale_S × Loss\n\nGrad_master = ( 1 / Scale_S ) × Grad_FP16",
      explanation: "Scaling keeps tiny floating point gradients within subnormal FP16 dynamic representation range."
    },
    realWorldEngineering: [
      "NVIDIA H100 Hopper SXM GPUs feature native FP8 Transformer Engines that dynamically switch between E4M3 and E5M2 per tensor."
    ]
  },

  "checkpointing": {
    id: "checkpointing",
    module: "Module 5: Numerical Stability, Precision, & Acceleration",
    title: "Activation Checkpointing & FlashAttention Mechanics",
    overview: "Storing all layer activations during the forward pass consumes tens of GBs of VRAM. Activation Checkpointing drops intermediate layer activations and recomputes them on-the-fly during the backward pass.",
    keyConcepts: [
      {
        heading: "Trading Compute for Memory",
        body: "By storing activations only at segment boundaries (e.g. every sqrt(L) layers), activation memory drops from O(L) to O(sqrt(L)). The cost is ~33% additional forward pass compute time."
      },
      {
        heading: "FlashAttention-2 / 3 (Tiled Compute)",
        body: "Standard attention writes N x N score matrices to slow GPU HBM. FlashAttention tiles Query, Key, and Value blocks inside fast GPU SRAM (20 TB/s bandwidth), computing online Softmax without ever materializing the quadratic matrix in HBM."
      },
      {
        heading: "Selective Activation Recompute",
        body: "Recomputing only memory-heavy, compute-cheap ops (like RMSNorm, SwiGLU, or Attention Dropout) saves ~70% memory with less than 10% compute penalty."
      }
    ],
    mathDeepDive: {
      title: "FlashAttention Online Softmax Reduction",
      equation: "m_new = max( m_old, m_block )\n\nd_new = d_old · exp( m_old - m_new ) + d_block · exp( m_block - m_new )",
      explanation: "Online Softmax tracks running row maximums and rescale factors across SRAM tiles without full matrix materialization."
    },
    realWorldEngineering: [
      "FlashAttention-3 achieves over 800 TFLOPS (75%+ MFU) on H100 GPUs by leveraging FP8 Tensor Cores and asynchronous CUDA WGMMA instructions."
    ]
  },

  "optimizer-schedule": {
    id: "optimizer-schedule",
    module: "Module 6: Execution Dynamics & Diagnostics",
    title: "AdamW Mechanics, Decoupled Weight Decay, & Cosine Schedules",
    overview: "Training stability and convergence speed rely heavily on optimizer mechanics. AdamW decouples weight decay from gradient updates, paired with linear warmup and cosine decay schedules.",
    keyConcepts: [
      {
        heading: "AdamW vs. L2 Regularization",
        body: "In standard Adam, L2 weight decay is added to gradients, interacting undesirably with moving variance averages. AdamW applies weight decay directly to weight parameters (w = w - lr * wd * w), dramatically improving deep LLM stability."
      },
      {
        heading: "Warmup & Cosine Decay",
        body: "1. Warmup: LR ramps linearly from 0 to max LR over the first 1-2% of steps to prevent gradient explosion during volatile early initialization. 2. Cosine Decay: LR decays along a cosine curve down to 10% peak LR at run completion."
      },
      {
        heading: "Gradient Clipping",
        body: "If global gradient L2 norm exceeds a threshold (typically ||g|| > 1.0), all gradients are rescaled: g = g * (threshold / ||g||) to suppress extreme loss spikes."
      }
    ],
    mathDeepDive: {
      title: "Cosine Learning Rate Schedule",
      equation: "η_t = η_min + 0.5 × ( η_max - η_min ) × ( 1 + cos( π × ( t - t_warmup ) / ( T_total - t_warmup ) ) )",
      explanation: "Smoothly reducing learning rate from peak target down to minimum floor."
    },
    realWorldEngineering: [
      "Llama 3 used a peak learning rate of 3.0e-4 for 8B and 1.5e-4 for 70B, with AdamW hyper-parameters β1=0.9, β2=0.95."
    ]
  },

  "telemetry": {
    id: "telemetry",
    module: "Module 6: Execution Dynamics & Diagnostics",
    title: "Run Telemetry, Gradient Spikes, & Crash Recovery Engines",
    overview: "Pre-training across 20,000+ GPUs running continuously for 3 months suffers from inevitable hardware node crashes, cosmic ray bit flips, stragglers, and sudden loss spikes.",
    keyConcepts: [
      {
        heading: "Monitoring Critical Telemetry Signals",
        body: "Real-time dashboards track: 1. Loss curve & gradient norm ||g||. 2. Model FLOPs Utilization (MFU %). 3. Token throughput (tokens/sec/GPU). 4. HBM temperature & ECC memory errors."
      },
      {
        heading: "Loss Spike Rewind Strategy",
        body: "When loss spikes to infinity or NaN due to bad data shards or numerical explosion, automated recovery engines rewind to a checkpoint 2,000 steps prior, discard the bad data shard window, adjust LR, and resume."
      },
      {
        heading: "Asynchronous Distributed Checkpointing",
        body: "Saving a 70B model checkpoint (1.1 TB) every 1,000 steps uses background host RAM buffering and fast parallel NVMe pipelines to prevent blocking GPU computation."
      }
    ],
    mathDeepDive: {
      title: "Model FLOPs Utilization (MFU)",
      equation: "MFU = ( 6 × N_params × Tokens_per_sec ) / ( Peak_TFLOPS_per_GPU × Total_GPUs )",
      explanation: "Measuring the ratio of achieved theoretical matrix FLOPs against maximum hardware peak specs."
    },
    realWorldEngineering: [
      "Meta's Llama 3 405B training run sustained 38%+ MFU across 16,384 H100 GPUs while automatically recovering from over 400 node hardware failures without manual intervention."
    ]
  }
};
