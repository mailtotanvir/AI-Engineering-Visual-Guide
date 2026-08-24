export interface AtlasDomain {
  id: string;
  num: string;
  name: string;
  source: string;
  blurb: string;
}

export const DOMAIN_COLORS: Record<string, string> = {
  hardware: "var(--gold)",
  threads: "var(--teal)",
  memory: "var(--rose)",
  performance: "var(--cyan)",
  async: "var(--iris)",
  tooling: "var(--lime)",
  ecosystem: "#FF9E7A",
};

export const DOMAINS: AtlasDomain[] = [
  { id: "hardware", num: "01", name: "Hardware Architecture", source: "hardware_architecture.md", blurb: "The silicon itself — SMs, SIMT pipelines, schedulers, generations." },
  { id: "threads", num: "02", name: "Thread Hierarchy", source: "thread_hierarchy.md", blurb: "Grids, blocks, threads, indexing math, divergence, synchronization." },
  { id: "memory", num: "03", name: "Memory Management", source: "memory_management.md", blurb: "Coalescing, bank conflicts, read-only caches, unified memory." },
  { id: "performance", num: "04", name: "Performance Optimization", source: "performance_optimization.md", blurb: "Occupancy, tiling, instruction throughput, atomics." },
  { id: "async", num: "05", name: "Asynchronous CUDA", source: "asynchronous_cuda.md", blurb: "Streams, async copies, graphs, multi-GPU." },
  { id: "tooling", num: "06", name: "Compilation & Tooling", source: "compilation_tooling.md", blurb: "nvcc, PTX/SASS, Nsight Systems & Compute." },
  { id: "ecosystem", num: "07", name: "Library Ecosystem", source: "library_ecosystem.md", blurb: "cuBLAS, cuDNN, Thrust, host bindings." },
];

export interface AtlasTopic {
  id: string;
  domain: string;
  title: string;
  kind: "interactive" | "concept";
  summary: string;
  points: string[];
  journey?: string;
  interactiveId?: string;
}

const J = (id: string) => `/scenes/${id}/`;

export const TOPICS: AtlasTopic[] = [
  {
    id: "sms", domain: "hardware", title: "Streaming Multiprocessors",
    kind: "concept",
    summary: "The physical engines: each SM owns warp schedulers, execution units and on-chip memory.",
    points: [
      "A GPU is a grid of SMs; every block is assigned to exactly one SM for its lifetime.",
      "Each SM carries its own warp schedulers, register file, shared memory and constant cache.",
      "Blocks are independent — the hardware packs as many as fit per SM.",
    ],
    journey: "meet-the-gpu",
  },
  {
    id: "simt", domain: "hardware", title: "SIMT Execution Model",
    kind: "concept",
    summary: "Single Instruction, Multiple Threads: one decoder drives 32 lanes in formation.",
    points: [
      "Warps fetch one instruction and all 32 lanes execute it — or sit masked out.",
      "Branches do not stop the warp; they narrow which lanes are active (see Divergence).",
      "Best performance keeps lanes in lockstep: same work, different data.",
    ],
    journey: "warps",
  },
  {
    id: "warp-scheduling", domain: "hardware", title: "Warp Scheduling & Latency Hiding",
    kind: "concept",
    summary: "Schedulers swap between warps every cycle — stalled warp? Run another.",
    points: [
      "Two schedulers per SM issue instructions from different warps on the same cycle.",
      "Memory latency hides behind arithmetic of other resident warps.",
      "More active warps = more places to hide latency — see Occupancy.",
    ],
    journey: undefined,
  },
  {
    id: "compute-capability", domain: "hardware", title: "Compute Capabilities",
    kind: "concept",
    summary: "Generations of hardware features: sm_70, sm_89… determine what compiles and runs.",
    points: [
      "Major.minor numbers gate features: tensor cores, async copy, cluster support.",
      "PTX targets a virtual arch forward-compatible with future GPUs.",
      "SASS targets one exact chip — fastest path, baked at build time.",
    ],
  },
  {
    id: "grid-hierarchy", domain: "threads", title: "Grids · Blocks · Threads",
    kind: "concept",
    summary: "Three levels of organization: launch a grid, schedule blocks, execute threads.",
    points: [
      "Launch dimensions <<<grid, block>>> can be 1D, 2D or 3D.",
      "Blocks map to SMs once; threads inside stay together.",
      "Hardware limits cap threads/block (1024) and blocks/grid (2³¹-1 in x).",
    ],
    journey: "first-kernel",
  },
  {
    id: "indexing-2d3d", domain: "threads", title: "Indexing Formulas — 2D & 3D",
    kind: "concept",
    summary: "Linearize coordinates: row-major math for images and volumes.",
    points: [
      "2D: row = blockIdx.y*blockDim.y + threadIdx.y; col likewise; idx = row*width + col.",
      "3D adds a depth stride: idx = x + y*width + z*width*height.",
      "Pitch matters: allocated rows may be padded — use pitch, not width.",
    ],
  },
  {
    id: "divergence", domain: "threads", title: "Warp Divergence",
    kind: "concept",
    summary: "If lanes disagree at a branch, the warp executes both paths serially.",
    points: [
      "Hardware masks lanes per path; cost equals sum of both paths.",
      "Interleaved addressing keeps neighbouring threads on one side.",
      "Reconvergence happens automatically at the join point.",
    ],
    journey: "warps",
  },
  {
    id: "sync", domain: "threads", title: "Synchronization",
    kind: "concept",
    summary: "__syncthreads() barriers within a block; warp intrinsics need no barrier.",
    points: [
      "__syncthreads(): all threads of a block wait — never diverge around it.",
      "__shfl_sync / __shfl_down_sync exchange registers lane-to-lane instantly.",
      "Cooperative groups generalize both patterns.",
    ],
  },
  {
    id: "coalescing", domain: "memory", title: "Global Memory Coalescing",
    kind: "concept",
    summary: "Neighbouring threads should touch neighbouring addresses.",
    points: [
      "32/64/128-byte cache-line segments serve whole warps when access is contiguous.",
      "Strided or random patterns waste most of every line fetched.",
      "Structure-of-arrays often beats array-of-structures for this reason.",
    ],
    journey: "memory",
  },
  {
    id: "shared-banks", domain: "memory", title: "Shared Memory Banks",
    kind: "interactive",
    interactiveId: "banks",
    summary: "32 banks answer simultaneously — unless threads collide on one.",
    points: [],
  },
  {
    id: "constant-texture", domain: "memory", title: "Constant & Texture Memory",
    kind: "concept",
    summary: "Read-only caches tuned for broadcast and spatial locality.",
    points: [
      "Constant memory: 64 KB, cached, ideal when all threads read the SAME address.",
      "Texture/surface: cached fetches with free wrapping and filtering for spatial data.",
      "Both are read-only from device code — write from host before launch.",
    ],
  },
  {
    id: "unified-memory", domain: "memory", title: "Unified Memory",
    kind: "concept",
    summary: "cudaMallocManaged pointers migrate by page fault between host and device.",
    points: [
      "One pointer valid on both sides; pages move on demand.",
      "Prefetch hints (cudaMemPrefetchAsync) hide migration stalls.",
      "Great for productivity; hot loops still prefer explicit copies.",
    ],
  },
  {
    id: "occupancy-latency", domain: "performance", title: "Latency Hiding & Occupancy",
    kind: "interactive",
    interactiveId: "occupancy",
    summary: "Resident warps are your shield against memory stalls — tune what limits them.",
    points: [],
  },
  {
    id: "tiling", domain: "performance", title: "Tiling via Shared Memory",
    kind: "interactive",
    interactiveId: "tiling",
    summary: "Stage a tile into shared memory once; reuse it many times.",
    points: [],
  },
  {
    id: "instruction-throughput", domain: "performance", title: "Instruction Throughput",
    kind: "concept",
    summary: "Fewer, faster instructions win: fast math, intrinsics, unrolling.",
    points: [
      "-use_fast_math trades precision for speed on transcendentals.",
      "Intrinsics (__fmaf, __expf) map to single hardware ops.",
      "#pragma unroll removes loop overhead and exposes ILP.",
    ],
  },
  {
    id: "atomics", domain: "performance", title: "Atomic Operations",
    kind: "interactive",
    interactiveId: "atomics",
    summary: "Hardware read-modify-write units — correctness without explicit locks.",
    points: [],
  },
  {
    id: "streams", domain: "async", title: "CUDA Streams",
    kind: "interactive",
    interactiveId: "streams",
    summary: "Queued work that overlaps copies with compute across streams.",
    points: [],
  },
  {
    id: "async-copies", domain: "async", title: "Asynchronous Copies",
    kind: "concept",
    summary: "cudaMemcpyAsync only overlaps when the host buffer is pinned.",
    points: [
      "Pageable memory forces a staging bounce through pinned memory anyway.",
      "cudaHostAlloc pins buffers so DMA engines read them directly.",
      "Events let you fence stages without blocking the CPU.",
    ],
  },
  {
    id: "graphs", domain: "async", title: "CUDA Graphs",
    kind: "interactive",
    interactiveId: "graphs",
    summary: "Capture a dependency graph once; replay with near-zero launch overhead.",
    points: [],
  },
  {
    id: "multi-gpu", domain: "async", title: "Multi-GPU Communication",
    kind: "concept",
    summary: "UVA gives one address space; P2P lets GPUs talk directly.",
    points: [
      "Unified Virtual Addressing makes every pointer globally unique.",
      "cudaMemcpyPeerAsync crosses GPUs without host staging when topology allows.",
      "NVLink topology decides whether peer transfers bypass the CPU.",
    ],
  },
  {
    id: "nvcc-pipeline", domain: "tooling", title: "NVCC Compilation Pipeline",
    kind: "interactive",
    interactiveId: "nvcc",
    summary: "One .cu splits into host C++ and device PTX/SASS, then links back together.",
    points: [],
  },
  {
    id: "ptx-sass", domain: "tooling", title: "PTX vs SASS",
    kind: "concept",
    summary: "Portable virtual assembly versus real machine code.",
    points: [
      "PTX is human-readable, versioned, JIT-compiled at load time.",
      "SASS is per-chip machine code — inspect with cuobjdump/nvdisasm.",
      "Fatbinaries carry both: speed today, compatibility tomorrow.",
    ],
  },
  {
    id: "nsight-systems", domain: "tooling", title: "Nsight Systems",
    kind: "concept",
    summary: "System-wide timeline: find gaps, sync stalls and API overhead first.",
    points: [
      "Trace CPU API calls beside kernel executions and memcpy lanes.",
      "Look for idle GPU stretches — usually a hidden synchronization.",
    ],
  },
  {
    id: "nsight-compute", domain: "tooling", title: "Nsight Compute",
    kind: "concept",
    summary: "Kernel-level deep dive: SOL roofline, memory tables, stall reasons.",
    points: [
      "Speed-of-Light section compares achieved vs peak compute/memory.",
      "Warp-state sampling names the stall: long scoreboard, barrier, branch.",
    ],
  },
  {
    id: "cublas", domain: "ecosystem", title: "cuBLAS",
    kind: "concept",
    summary: "Battle-tested dense linear algebra: GEMM, solvers, batched modes.",
    points: [
      "Column-major layouts — mind transposes when coming from C arrays.",
      "Tensor-core paths activate via math modes (TF32/FP16).",
    ],
  },
  {
    id: "cudnn", domain: "ecosystem", title: "cuDNN",
    kind: "concept",
    summary: "Deep-learning primitives: convolutions, pooling, RNNs, attention helpers.",
    points: [
      "Heuristics pick convolution algorithms per shape — benchmark with autotuning.",
      "Tensor cores accelerate mixed-precision training paths.",
    ],
  },
  {
    id: "thrust", domain: "ecosystem", title: "Thrust",
    kind: "concept",
    summary: "STL-style parallel algorithms: sort, reduce, scan, transform.",
    points: [
      "device_vector + thrust::reduce replaces hand-written reductions.",
      "Fusion via transform iterators avoids intermediate allocations.",
    ],
  },
  {
    id: "bindings", domain: "ecosystem", title: "Host Language Bindings",
    kind: "concept",
    summary: "Drive CUDA from Python and friends without writing C++.",
    points: [
      "CuPy mirrors NumPy onto the GPU; PyCUDA exposes raw kernels.",
      "Numba JIT-compiles Python kernels with @cuda.jit decorators.",
    ],
  },
];

export function topicById(id: string): AtlasTopic | undefined {
  return TOPICS.find((t) => t.id === id);
}
export const INTERACTIVE_IDS = TOPICS.filter((t) => t.kind === "interactive").map((t) => t.interactiveId!);
