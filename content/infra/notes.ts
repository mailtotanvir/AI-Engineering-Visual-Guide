export interface SceneNote {
  title: string;
  module: string;
  overview: string;
  keyConcepts: { heading: string; body: string }[];
  mathDeepDive?: {
    title: string;
    equation: string;
    explanation: string;
  };
  realWorldEngineering: string[];
}

export const SCENE_NOTES: Record<string, SceneNote> = {
  "nvlink-topology": {
    title: "NVLink Mesh & NVSwitch Scale-Up Architecture",
    module: "Module 1: Silicon & Node Architecture",
    overview: "Inside an 8-GPU scale-up server (such as HGX H100/H200 or B200), traditional PCIe bus interconnects are completely inadequate for distributed tensor-parallel GEMM operations. NVLink provides high-bandwidth, low-latency, point-to-point links interconnected via on-board NVSwitch ASICs, turning 8 physical GPUs into a single unified shared-memory domain with up to 3.6 TB/s bisection bandwidth.",
    keyConcepts: [
      {
        heading: "Full-Mesh vs Switched Topology",
        body: "Early NVLink generations used direct point-to-point mesh routing, limiting scale-up to 4 or 8 GPUs with non-uniform hop latencies. NVSwitch introduces an on-node crossbar switch that delivers flat, uniform, non-blocking single-hop latency across all 8 GPUs simultaneously.",
      },
      {
        heading: "Load/Store Memory Semantics",
        body: "NVLink operates with native hardware-level memory read/write semantics rather than packetized network socket protocols. A GPU thread can directly dereference a global memory pointer located in another GPU's HBM with ~100ns latency.",
      },
      {
        heading: "Scale-Up vs Scale-Out Boundary",
        body: "The physical baseboard marks the fundamental boundary in distributed training. Intra-node communication over NVLink is 10–20x faster than inter-node communication over InfiniBand or RoCE v2, dictating where Tensor Parallelism (intra-node) stops and Pipeline/Data Parallelism (inter-node) begins.",
      },
    ],
    mathDeepDive: {
      title: "Bisection Bandwidth Formulation",
      equation: "B_{bisection} = \\frac{N_{GPU}}{2} \\times L_{links} \\times BW_{link} \\times 2 \\quad \\text{[Bidirectional]}",
      explanation: "For an 8-GPU H100 baseboard with 18 NVLink-4 links per GPU running at 50 GB/s bidirectional (25 GB/s each direction), bisection bandwidth across any bisection cut equals 4 GPUs * 18 links * 50 GB/s = 3.6 TB/s total bandwidth.",
    },
    realWorldEngineering: [
      "Hardware NVLink CRC counters must be monitored via nvidia-smi nvlink -s; replay bursts indicate degraded PCB traces or thermal expansion issues.",
      "Tensor Parallelism (TP) degree should never exceed the number of GPUs connected via NVLink (typically TP <= 8). Splitting TP across InfiniBand causes severe communication stalls.",
      "NVSwitch SHARP (Scalable Hierarchical Aggregation and Reduction Protocol) offloads AllReduce reductions directly into the switch hardware.",
    ],
  },

  "pcie-cxl-bottleneck": {
    title: "PCIe Gen5 vs CXL Host Bus Limits",
    module: "Module 1: Silicon & Node Architecture",
    overview: "While GPU-to-GPU interconnects operate in terabytes per second, CPU-to-GPU communication remains bound to the host PCIe bus. PCIe Gen5 x16 provides 64 GB/s unidirectional theoretical bandwidth (effective ~50-55 GB/s). Compute Express Link (CXL) introduces cache coherency and unified memory pooling over the PCIe physical layer.",
    keyConcepts: [
      {
        heading: "Host-to-Device (H2D) Transfer Bottleneck",
        body: "Transferring training batches from CPU system RAM to GPU High Bandwidth Memory (HBM) involves PCIe bus latency and bandwidth limits. Unpinned memory requires allocating a temporary kernel page, double-buffering the payload, and triggering CPU interrupt cycles.",
      },
      {
        heading: "Pinned Memory (cudaHostAlloc / cudaHostRegister)",
        body: "Page-locked (pinned) host memory prevents the OS virtual memory subsystem from paging data to disk. The GPU DMA engine can directly read pinned host memory via PCIe bus mastering without CPU intervention.",
      },
      {
        heading: "CXL Memory Pooling & Coherency",
        body: "CXL.mem and CXL.cache protocols allow GPUs and CPUs to share a coherent, cache-consistent address space, eliminating explicit cudaMemcpy operations for heterogeneous pipelines.",
      },
    ],
    mathDeepDive: {
      title: "Effective Transfer Latency Model",
      equation: "T_{transfer} = \\tau_{latency} + \\frac{S_{payload}}{BW_{effective}} \\quad \\text{where } BW_{effective} = \\eta \\cdot BW_{raw}",
      explanation: "For a 1 GB batch transferred over PCIe Gen5 x16 (raw 64 GB/s, efficiency eta = 0.85 -> 54.4 GB/s), with 4.5 microseconds bus initiation latency, total transfer time is ~18.38 ms. Over NVLink at 900 GB/s, the same transfer takes only 1.11 ms.",
    },
    realWorldEngineering: [
      "Always use pinned host memory (DataLoader pin_memory=True in PyTorch) to enable asynchronous DMA transfers via non-default CUDA streams.",
      "Check NUMA node affinity: allocating host memory on CPU Socket 1 while targeting a GPU connected to CPU Socket 0 forces traffic through slow inter-socket QPI/UPI links.",
      "PCIe AER (Advanced Error Reporting) logs provide early warnings of link degradation (e.g., links falling back from Gen5 x16 to Gen3 x8).",
    ],
  },

  "hbm-memory-wall": {
    title: "HBM3e Bandwidth & Roofline Knee",
    module: "Module 1: Silicon & Node Architecture",
    overview: "High-Bandwidth Memory (HBM3e) utilizes 3D-stacked DRAM dies connected to the GPU processor via a silicon interposer with thousands of microscopic microbumps. The Roofline Model identifies the exact arithmetic intensity (FLOPs/Byte) required to transition an operation from memory-bandwidth-bound to compute-bound.",
    keyConcepts: [
      {
        heading: "Silicon Interposer & Through-Silicon Vias (TSVs)",
        body: "Unlike standard GDDR6 chips connected across motherboard traces, HBM stacks sit on the same substrate silicon interposer as the GPU die, providing 1024-bit wide buses per stack with massive aggregate memory bandwidth (up to 3.35 TB/s on H200, 8.0 TB/s on B200).",
      },
      {
        heading: "The Roofline Knee & Arithmetic Intensity",
        body: "Arithmetic intensity is the ratio of operations performed to bytes transferred from memory (FLOP/Byte). The knee point = Peak Compute / Peak Memory Bandwidth. For an H100 with 1,000 TFLOPs FP16 compute and 3.35 TB/s HBM bandwidth, the knee is ~298 FLOPs/Byte.",
      },
      {
        heading: "Memory-Bound vs Compute-Bound Kernels",
        body: "Element-wise activations (SiLU, GELU, LayerNorm) and un-fused attention have low arithmetic intensity (< 10 FLOP/Byte) and waste 95% of GPU tensor cores waiting on HBM. Large GEMMs (matrix multiplications) have high intensity (> 500 FLOP/Byte) and fully saturate compute.",
      },
    ],
    mathDeepDive: {
      title: "Attainable Performance Formulation",
      equation: "P_{attainable} = \\min\\left( P_{peak}, \\; I_{arithmetic} \\times BW_{mem} \\right) \\quad \\text{[FLOP/s]}",
      explanation: "When operational intensity I < (P_peak / BW_mem), attainable compute scales linearly with memory bandwidth. Only when I exceeds the roofline knee does performance reach the horizontal ceiling of peak tensor core throughput.",
    },
    realWorldEngineering: [
      "FlashAttention-2/3 overcomes the memory wall by tiling Q, K, V blocks into high-speed SRAM (18-33 TB/s), avoiding intermediate HBM read/writes for the N x N attention matrix.",
      "Triton and CUDA kernel fusion combine consecutive element-wise operations into a single kernel launch to maximize data reuse in L1/L2 cache.",
      "Monitor SM occupancy vs DRAM bandwidth utilization using Nsight Compute to pinpoint memory-bound bottlenecks.",
    ],
  },

  "hgx-node-anatomy": {
    title: "HGX Server Baseboard Anatomy",
    module: "Module 1: Silicon & Node Architecture",
    overview: "A modern enterprise AI server (such as an 8x H100/B200 HGX system) is a complex electro-mechanical computing engine designed for 10.2 kW of power delivery, balanced PCIe Gen5 switching trees, and dedicated high-speed scale-out networking for each GPU.",
    keyConcepts: [
      {
        heading: "Dual-Socket Host CPU & PCIe Switch Tree",
        body: "Two host CPUs (e.g., dual Intel Xeon or AMD EPYC) connect to 4 PCIe Gen5 switch fabrics (e.g., Broadcom PEX). Each switch pairs 2 GPUs with 2 dedicated 400Gbps network interfaces (NICs) to maintain direct peer-to-peer data paths.",
      },
      {
        heading: "1:1 GPU-to-NIC Ratio",
        body: "In production distributed training, every GPU requires its own dedicated 400Gbps ConnectX-7 NIC. Sharing one NIC among multiple GPUs creates immediate inter-node network bottlenecks during AllGather and ReduceScatter phases.",
      },
      {
        heading: "Dedicated DPU Management Fabric",
        body: "BlueField-3 Data Processing Units (DPUs) offload storage virtualization, NVMe-oF target controllers, and cluster health telemetry, isolating host OS kernels from network interruptions.",
      },
    ],
    mathDeepDive: {
      title: "Intra-Node vs Inter-Node Bandwidth Ratio",
      equation: "R_{scale} = \\frac{BW_{NVLink}}{BW_{NIC}} = \\frac{900 \\text{ GB/s}}{50 \\text{ GB/s}} = 18\\times",
      explanation: "With 900 GB/s NVLink per GPU and a 400 Gbps (50 GB/s) NIC per GPU, intra-node bandwidth is 18x higher than inter-node fabric bandwidth. This physical asymmetry requires 3D parallelism to strictly isolate high-frequency tensor parallel collectives within the node.",
    },
    realWorldEngineering: [
      "Ensure OSFP/QSFP optical transceiver cables are seated with proper bend radius; excessive bend creates optical signal attenuation and high packet error rates.",
      "Verify that PCIe switches operate in Gen5 speed (32 GT/s) with 16 lanes per device; link training failures can silently drop speeds to Gen4 or Gen3.",
      "Configure nvidia-peermem kernel modules to enable direct RDMA transfers between CX-7 NICs and GPU HBM over the PCIe switch tree.",
    ],
  },

  "infiniband-vs-roce": {
    title: "InfiniBand vs RoCE v2 Transport Mechanics",
    module: "Module 2: Interconnects & Cluster Topologies",
    overview: "Distributed deep learning requires lossless network fabrics. Unlike standard TCP/IP where packet drops are resolved via slow retransmission timeouts, AI fabrics use either native InfiniBand (with hardware credit-based flow control) or RoCE v2 (RDMA over Converged Ethernet with Priority Flow Control and Explicit Congestion Notification).",
    keyConcepts: [
      {
        heading: "Hardware Credit-Based Flow Control (InfiniBand)",
        body: "InfiniBand switches maintain credit buffers for each receiver. A sender only transmits packets when receiver buffer credits are available, guaranteeing zero packet drops in the fabric with microsecond latency.",
      },
      {
        heading: "Priority Flow Control (PFC) & ECN (RoCE v2)",
        body: "RoCE v2 runs on Ethernet. Priority Flow Control (IEEE 802.1Qbb) sends PAUSE frames when switch ingress buffers cross high watermarks. Explicit Congestion Notification (ECN / RFC 3168) marks packets (CE) to trigger sender-side rate reduction (DCQCN).",
      },
      {
        heading: "PFC Deadlocks & Headroom Sizing",
        body: "If PAUSE frames propagate upstream in a circular dependency across multiple switches, the entire fabric experiences a PFC deadlock, freezing all training jobs cluster-wide until switches are rebooted.",
      },
    ],
    mathDeepDive: {
      title: "PFC Headroom Buffer Requirement",
      equation: "B_{headroom} = \\left( 2 \\times \\tau_{prop} + \\tau_{switch} \\right) \\times BW + \\text{Jitter Margin}",
      explanation: "For a 100-meter fiber cable (500ns propagation each way) running 400 Gbps (50 GB/s) with 400ns switch processing time, buffer headroom must be >= (1400ns * 50 GB/s) * 1.5 = ~105 KB per port to prevent packet drops before the PAUSE frame halts the sender.",
    },
    realWorldEngineering: [
      "In RoCE v2 clusters, enable Dynamic ECN tuning and monitor PFC pause frame counters; nonzero PFC storms require immediate buffer threshold adjustments.",
      "InfiniBand Subnet Manager (OpenSM) topology routing should use fat-tree routing (ftree) or adaptive routing (ar) to ensure collision-free collective paths.",
      "Use rdma-core and ibv_rc_pingpong to verify raw RDMA latency (< 1.5 microseconds) before starting multi-node training.",
    ],
  },

  "fat-tree-rail-optimized": {
    title: "Rail-Optimized Fat-Tree & Dragonfly+ Fabrics",
    module: "Module 2: Interconnects & Cluster Topologies",
    overview: "In multi-thousand GPU clusters, network cabling architecture determines whether collective communication scales or collapses under congestion. Rail-optimized fat-tree networks map each GPU ordinal position to an independent leaf switch rail, perfectly mirroring the communication structure of 3D parallel distributed training.",
    keyConcepts: [
      {
        heading: "Rail Optimization Principle",
        body: "In a cluster of 8-GPU nodes, all GPU 0s connect to Leaf Switch Rail 0, all GPU 1s to Leaf Switch Rail 1, and so on. In Data Parallel and Pipeline Parallel collectives, communication flows exclusively within individual rails, eliminating cross-rail contention.",
      },
      {
        heading: "Non-Blocking Fat-Tree (1:1 Oversubscription)",
        body: "A non-blocking Fat-Tree provides equal uplink and downlink bandwidth at every switch tier, guaranteeing full bisection bandwidth regardless of traffic permutation across nodes.",
      },
      {
        heading: "Dragonfly+ Topologies",
        body: "Dragonfly+ organizes switches into groups with dense intra-group optical links and sparse global inter-group links, reducing optical transceiver and cable counts by 30–40% compared to traditional 3-tier fat trees.",
      },
    ],
    mathDeepDive: {
      title: "Fat-Tree Oversubscription Ratio",
      equation: "R_{oversub} = \\frac{N_{downlinks} \\times BW_{down}}{N_{uplinks} \\times BW_{up}} \\quad \\text{[1.0 = Non-Blocking]}",
      explanation: "A leaf switch with 32x 400Gbps downlinks to servers and 16x 400Gbps uplinks to spines has an oversubscription ratio of 2:1 (0.5 bandwidth availability), reducing inter-leaf collective throughput by 50% under worst-case all-to-all permutations.",
    },
    realWorldEngineering: [
      "Maintain a 1:1 non-blocking ratio for the compute fabric. Oversubscription is only acceptable on separate storage and management networks.",
      "Label all fiber cables by Node ID and GPU Rail index; cross-cabling GPU 0 into Rail 1 causes severe silent performance degradation in NCCL communicators.",
      "Use optical cable monitors (DDM) to continuously log optical power levels (Tx/Rx power in dBm) to catch failing lasers before link drops occur.",
    ],
  },

  "ring-vs-tree-allreduce": {
    title: "Ring vs Tree AllReduce Collective Physics",
    module: "Module 2: Interconnects & Cluster Topologies",
    overview: "AllReduce is the most frequent collective communication primitive in distributed data-parallel and Megatron tensor-parallel training. The choice between Ring AllReduce and Tree AllReduce represents a fundamental trade-off between bandwidth utilization and communication latency.",
    keyConcepts: [
      {
        heading: "Ring AllReduce (Bandwidth-Optimal)",
        body: "Ranks form a logical ring. Tensors are split into N chunks. In ReduceScatter phase, chunks are passed around the ring in N-1 steps. In AllGather phase, reduced chunks are broadcast in another N-1 steps. Total volume sent is 2 * (N-1)/N * S.",
      },
      {
        heading: "Tree AllReduce (Latency-Optimal)",
        body: "Ranks form a binomial or double-binary tree. Reduction flows up to the root in log2(N) steps and broadcasts back down in log2(N) steps. Faster for small messages where link initiation latency dominates.",
      },
      {
        heading: "NCCL Algorithm Selection Heuristic",
        body: "NCCL automatically calculates expected execution time for both algorithms based on tensor size S, node count N, bus bandwidth B, and latency alpha, switching dynamically from Tree to Ring above threshold tensor sizes (typically > 500 KB to 2 MB).",
      },
    ],
    mathDeepDive: {
      title: "Algorithmic Time Complexity",
      equation: "T_{ring} = 2 \\left( \\frac{N - 1}{N} \\right) \\frac{S}{B} + 2(N - 1)\\alpha \\quad \\text{vs} \\quad T_{tree} = 2 \\log_2(N) \\frac{S}{B} + 2 \\log_2(N)\\alpha",
      explanation: "As N grows large, (N-1)/N approaches 1.0, making Ring transfer time independent of rank count (2 * S / B). However, latency scales linearly with N (2*(N-1)*alpha), whereas Tree latency scales logarithmically (2*log2(N)*alpha).",
    },
    realWorldEngineering: [
      "Set NCCL_ALGO=RING or NCCL_ALGO=TREE in environment variables during debugging to benchmark actual communication overhead.",
      "Bucket small gradient tensors into contiguous buffers (e.g., PyTorch DDP bucket_cap_mb=25) to avoid thousands of high-latency small AllReduce calls.",
      "Enable CUDA graph capture on communication kernels to eliminate CPU launch overhead between consecutive collective operations.",
    ],
  },

  "incast-adaptive-routing": {
    title: "Network Incast, Microbursts & Packet Spraying",
    module: "Module 2: Interconnects & Cluster Topologies",
    overview: "Network incast occurs when hundreds or thousands of GPU senders simultaneously transmit data packets to a single destination switch port during AllGather or ReduceScatter collectives. This instant microburst overwhelms switch egress buffers, triggering tail latency inflation and packet drops.",
    keyConcepts: [
      {
        heading: "The Incast Phenomenon",
        body: "In synchronized distributed training, all workers complete backward computation at nearly the same millisecond and initiate collective communications simultaneously, generating massive synchronized traffic surges.",
      },
      {
        heading: "Hash Polarization in ECMP",
        body: "Equal-Cost Multi-Path (ECMP) hashes flow 5-tuples (IP, Port) to select uplinks. Because long-lived AI collective flows share identical tuple structures, multiple heavy flows collide on the same physical link while adjacent links remain completely idle.",
      },
      {
        heading: "Packet Spraying & Adaptive Routing",
        body: "Adaptive routing switches break large flows into fine-grained packets or flowlets and spray them across all available parallel links based on real-time link queue depths, reordering packets in hardware at the receiving NIC.",
      },
    ],
    mathDeepDive: {
      title: "Switch Buffer Incast Saturation",
      equation: "Q_{depth} = \\sum_{i=1}^{k} BW_{in, i} \\times \\Delta t - BW_{out} \\times \\Delta t \\quad \\text{where } k \\gg 1",
      explanation: "When k = 64 nodes transmit at 400 Gbps into a single 400 Gbps egress port, buffer queue depth expands at 63 * 50 GB/s = 3.15 TB/s. A standard 32 MB switch buffer overflows in ~10 microseconds unless flow control kicks in.",
    },
    realWorldEngineering: [
      "Enable Adaptive Routing (AR) in InfiniBand switches or Dynamic Load Balancing (DLB) on RoCE fabrics to eliminate ECMP hash polarization.",
      "Use NCCL_BUFFSIZE=4194304 (4 MB) or 8 MB to optimize DMA ring buffers for high-bandwidth burst absorbing.",
      "Implement staggered collective initiation or priority queueing to smooth incast peaks during MoE (Mixture of Experts) all-to-all dispatches.",
    ],
  },

  "gpudirect-storage": {
    title: "GPUDirect Storage (GDS) vs POSIX Bounce Buffers",
    module: "Module 3: Distributed Storage & Checkpointing",
    overview: "Traditional file I/O follows the POSIX standard: data is read from NVMe flash storage into host kernel memory (page cache), copied into host user-space memory, and finally transferred across PCIe into GPU memory. GPUDirect Storage (GDS) establishes a direct DMA path from NVMe-oF controllers directly into GPU High Bandwidth Memory.",
    keyConcepts: [
      {
        heading: "Elimination of CPU Bounce Buffers",
        body: "Traditional I/O requires 3 memory copies and 2 CPU context switches. GDS uses peer-to-peer DMA over PCIe, eliminating intermediate CPU memory staging and freeing CPU cores for data preprocessing.",
      },
      {
        heading: "CPU Utilization Reduction",
        body: "Streaming multi-gigabyte dataset batches at 50 GB/s using POSIX I/O consumes 60%–80% of host CPU cycles in memory copy and kernel interrupt handling. GDS drops host CPU utilization to under 2%.",
      },
      {
        heading: "NVMe-oF Remote Flash Storage",
        body: "GDS works seamlessly over remote NVMe-over-Fabrics (RoCE/InfiniBand), allowing multi-node clusters to stream training datasets from high-throughput distributed storage arrays directly into GPU memory.",
      },
    ],
    mathDeepDive: {
      title: "End-to-End I/O Latency Breakdown",
      equation: "T_{POSIX} = T_{NVMe} + 2\\cdot T_{copy} + T_{PCIe, H2D} + T_{ctx} \\quad \\text{vs} \\quad T_{GDS} = T_{NVMe} + T_{DMA, direct}",
      explanation: "GDS eliminates both the kernel-to-user copy (T_copy) and the host-to-device transfer (T_PCIe, H2D), reducing end-to-end data ingest latency by up to 70% and increasing sustained sequential read bandwidth to 95% of line rate.",
    },
    realWorldEngineering: [
      "Verify GDS driver status using gdscheck -p; ensure cuFile library is loaded and direct I/O mode is active.",
      "Format local scratch NVMe arrays with XFS and direct block alignment (4KB / 64KB) to maximize GDS DMA efficiency.",
      "For training datasets, store data in uncompressed binary chunks (e.g., NumPy memory-maps or Arrow files) compatible with GDS cuFileRead.",
    ],
  },

  "daly-checkpoint-opt": {
    title: "Daly's Formula: Optimal Checkpoint Frequency",
    module: "Module 3: Distributed Storage & Checkpointing",
    overview: "In large-scale AI training with thousands of GPUs, hardware components inevitably fail. Checkpointing saves model weights and optimizer states to persistent storage. Daly's (and Young's) formula determines the exact mathematical checkpoint interval that minimizes lost compute time.",
    keyConcepts: [
      {
        heading: "The Checkpointing Trade-Off",
        body: "Checkpointing too frequently incurs heavy I/O blocking overhead (delta). Checkpointing too infrequently results in catastrophic lost compute (rework time) when a node crashes and the run must roll back to the last save point.",
      },
      {
        heading: "Stochastic Failure Probability (Poisson Process)",
        body: "Cluster failures follow a Poisson distribution with Mean Time Between Failures (MTBF). If single-GPU MTBF is 3 years, a cluster of 16,384 GPUs experiences a hardware failure approximately every 1.6 hours.",
      },
      {
        heading: "Tiered Asynchronous Checkpointing",
        body: "State is quickly snapshotted to local node NVMe flash in 2–5 seconds (blocking), then uploaded to cloud object storage (S3/GCS) in the background asynchronously without pausing GPU training.",
      },
    ],
    mathDeepDive: {
      title: "Daly's Optimal Interval Formulation",
      equation: "\\tau_{opt} = \\sqrt{2 \\cdot \\delta \\cdot \\text{MTBF}} - \\delta \\quad \\text{where } \\delta = \\text{checkpoint write time}",
      explanation: "For a cluster with MTBF = 10 hours (36,000s) and checkpoint dump time delta = 180s (3 min), optimal interval tau_opt = sqrt(2 * 180 * 36000) - 180 = 3600 - 180 = 3420 seconds (~57 minutes).",
    },
    realWorldEngineering: [
      "Implement PyTorch Distributed Checkpoint (torch.distributed.checkpoint) for non-blocking asynchronous state saving.",
      "Track cluster MTBF continuously in monitoring dashboards and dynamically adjust checkpoint frequency if failure rates spike.",
      "Use distributed deduplication: save optimizer states in sharded FP32 slices while saving model weights in BF16.",
    ],
  },

  "data-ingest-streaming": {
    title: "Petabyte Data Streaming & Worker Prefetching",
    module: "Module 3: Distributed Storage & Checkpointing",
    overview: "As GPU compute speeds increase, data ingestion becomes the primary bottleneck in large-scale pre-training. An 8-GPU node training a vision-language model can consume over 40,000 samples per second, requiring high-throughput data streaming, on-the-fly tokenization, and ring-buffered prefetching.",
    keyConcepts: [
      {
        heading: "Deterministic Shard Shuffling",
        body: "Instead of centralizing the dataset index across 10,000 ranks (which crashes metadata servers), each rank deterministically computes its pseudo-random sample partition using seed permutations.",
      },
      {
        heading: "Multi-Process Ring Buffers",
        body: "DataLoader worker processes stream chunks from cloud storage, decompress records, tokenize text, and populate a shared-memory ring buffer. The GPU simply pops pre-assembled tensors without waiting on disk I/O.",
      },
      {
        heading: "Ray & NVIDIA DALI Hardware Acceleration",
        body: "Frameworks like Ray Data and NVIDIA DALI offload image decoding, JPEG decompression, and data augmentation directly to GPU hardware NVDEC/JPEG engines, bypassing host CPU cores.",
      },
    ],
    mathDeepDive: {
      title: "Data Starvation Condition",
      equation: "T_{ingest} = \\frac{S_{sample} \\times B_{batch}}{BW_{storage}} + T_{decode} \\le T_{forward+backward}",
      explanation: "If total batch ingest and decompression time exceeds the GPU compute execution time of forward + backward pass, GPUs enter an idle starve state, directly reducing Model FLOPs Utilization (MFU).",
    },
    realWorldEngineering: [
      "Group small dataset files into large 100MB–500MB webdataset/tar shards to maximize sequential read throughput from object stores.",
      "Set num_workers = 4 to 8 per GPU and enable persistent_workers=True in PyTorch DataLoaders to avoid worker recreation overhead between epochs.",
      "Use local NVMe SSDs as a read-through cache for frequently accessed validation splits.",
    ],
  },

  "checkpoint-resume-mttr": {
    title: "Distributed Resume & Fast MTTR",
    module: "Module 3: Distributed Storage & Checkpointing",
    overview: "When a multi-thousand GPU training job crashes due to a node failure, Mean Time to Recover (MTTR) determines how many GPU-hours are lost. Naive recovery approaches cause thundering-herd metadata bottlenecks that can stall clusters for over an hour.",
    keyConcepts: [
      {
        heading: "Thundering Herd on Storage",
        body: "If 16,384 ranks simultaneously attempt to open a monolithic checkpoint file from a central NFS server, storage metadata controllers lock up and crash. Checkpoint state must be pre-sharded per rank.",
      },
      {
        heading: "Warm Container Image Pooling",
        body: "Kubernetes nodes pre-pull massive 20GB+ AI training container images (CUDA, PyTorch, NCCL dependencies) so replacement pods start in under 5 seconds rather than minutes.",
      },
      {
        heading: "Sub-Minute Elastic Rejoin",
        body: "Modern orchestration frameworks use hot-standby spare nodes and peer-to-peer weight broadcasting to restore rank state and resume the training step loop in under 60 seconds.",
      },
    ],
    mathDeepDive: {
      title: "Recovery Time Formulation",
      equation: "T_{MTTR} = T_{detect} + T_{cordon+swap} + T_{pod\\_init} + \\frac{S_{weights}}{BW_{rank\\_io}} + T_{barrier\\_sync}",
      explanation: "With fast health probes (T_detect = 15s), automated node swap (T_swap = 10s), warm pod start (T_init = 5s), parallel sharded load (30 GB / 2 GB/s = 15s), and NCCL init (T_sync = 10s), total MTTR is ~55 seconds.",
    },
    realWorldEngineering: [
      "Use Safetensors format for zero-copy memory mapping of weight tensors directly into GPU HBM.",
      "Maintain a pool of 2%–5% hot-standby GPU nodes pre-configured with active network fabric connections.",
      "Automate checkpoint integrity validation (verifying SHA-256 hashes or tensor non-NaN checks) before releasing the previous checkpoint version.",
    ],
  },

  "gang-scheduling-kueue": {
    title: "Gang Scheduling & All-or-Nothing Allocation",
    module: "Module 4: Cluster Scheduling & Orchestration",
    overview: "Distributed training jobs possess a strict atomic scheduling requirement: either all N worker pods start simultaneously, or none should start. Partial scheduling causes deadlocks where multiple jobs hold parts of the cluster while waiting indefinitely for missing ranks.",
    keyConcepts: [
      {
        heading: "The Distributed Deadlock Problem",
        body: "Job A acquires 40 of 64 nodes; Job B acquires 24 of 64 nodes. Neither job can start execution because distributed collective communicators require all ranks to initialize. Both jobs hold GPUs idle forever without gang scheduling.",
      },
      {
        heading: "Kubernetes Kueue & Volcano Schedulers",
        body: "Kueue and Volcano provide admission control and gang reservation in Kubernetes. Workloads wait in logical priority queues until the complete quota of GPU resources is available in a single atomic scheduling transaction.",
      },
      {
        heading: "Slurm Job Arrays & Heterogeneous Reservations",
        body: "In HPC environments, Slurm manages exclusive node reservations with strict time limits, ensuring all ranks in an sbatch job allocation initialize concurrently.",
      },
    ],
    mathDeepDive: {
      title: "Cluster Starvation Risk Model",
      equation: "P_{deadlock} = 1 - \\prod_{j=1}^{M} \\left( 1 - \\frac{U_j}{C_{total}} \\right) \\quad \\text{without atomic gang admission}",
      explanation: "Without gang scheduling, as cluster utilization U increases toward capacity C_total, the probability of multiple competing distributed jobs entering an unresolvable partial allocation state approaches 1.0.",
    },
    realWorldEngineering: [
      "Configure Kueue LocalQueues and ClusterQueues with strict queue preemption rules to allow high-priority pretraining jobs to preempt development runs.",
      "Set pod-group minMember annotations in Volcano to match total distributed world size (world_size = nodes * 8).",
      "Implement automated watchdog timers: terminate and requeue any job that fails to complete NCCL rank handshake within 120 seconds of pod creation.",
    ],
  },

  "topology-aware-placement": {
    title: "Topology-Aware Placement & Switch-Hop Minimization",
    module: "Module 4: Cluster Scheduling & Orchestration",
    overview: "A distributed job running across 64 nodes can be placed within a single spine switch block or scattered across multiple datacenter pods. Topology-aware schedulers understand the physical network hierarchy and pack communicating ranks to minimize switch hops and cross-tier link contention.",
    keyConcepts: [
      {
        heading: "Switch Hierarchy Latency Penalty",
        body: "Intra-rack communication (Leaf hop) takes ~1 microsecond. Inter-rack spine communication (Spine hop) takes ~2.5 microseconds. Inter-pod core communication (Core hop) takes 5+ microseconds with higher risk of link oversubscription.",
      },
      {
        heading: "Hierarchical 3D Parallelism Mapping",
        body: "Map Tensor Parallelism (TP=8) strictly inside the node (NVLink). Map Pipeline Parallelism (PP) to adjacent nodes on the same Leaf switch. Map Data Parallelism (DP) across Spine switches where latency is least critical.",
      },
      {
        heading: "Bin-Packing Algorithms",
        body: "Topology schedulers use tree-based best-fit bin-packing to allocate nodes belonging to the smallest common ancestor switch sub-tree.",
      },
    ],
    mathDeepDive: {
      title: "Collective Communication Slowdown Factor",
      equation: "S_{comm} = 1.0 + \\sum_{h=1}^{H} w_h \\cdot \\left( \\text{Hops}_h - 1 \\right)",
      explanation: "Where w_h is the latency penalty weight per switch tier. Scattering ranks across core switches increases average hop count from 1 to 5, resulting in a 35%–50% slowdown in communication-heavy AllGather phases.",
    },
    realWorldEngineering: [
      "Use the Kubernetes Topology-Aware Scheduling plugin or Slurm --switches=N@timeout flag to enforce strict rack locality.",
      "Generate a physical cluster network topology graph (topology.xml) and pass it to NCCL via NCCL_TOPO_DUMP_FILE for optimal ring formation.",
      "Never allow multi-tenant fragmentations to break contiguous node blocks; run periodic cluster defragmentation during low-load windows.",
    ],
  },

  "straggler-detection": {
    title: "Straggler Detection & Collective Barrier Lag",
    module: "Module 4: Cluster Scheduling & Orchestration",
    overview: "Synchronous distributed training operates in lock-step: every GPU must complete its forward, backward, and all-reduce steps before any GPU can begin the next step. A single straggler GPU running 5% slower throttles the entire multi-thousand GPU cluster to its degraded speed.",
    keyConcepts: [
      {
        heading: "Root Causes of Hardware Stragglers",
        body: "Stragglers are caused by thermal throttling (clogged liquid cooling channels), PCIe bus errors falling back to lower generation speeds, memory clock downclocking, or noisy-neighbor host CPU interrupts.",
      },
      {
        heading: "The Collective Barrier Multiplier Effect",
        body: "In a 10,000-GPU cluster, if 1 GPU slows down by 100ms per step, all 9,999 other GPUs sit idle at the collective barrier, wasting 999.9 GPU-seconds of compute on every single training step.",
      },
      {
        heading: "NCCL Flight Recorders & DCGM Telemetry",
        body: "NVIDIA Data Center GPU Manager (DCGM) and NCCL flight recorders capture per-rank kernel duration histograms, instantly highlighting the outlier rank responsible for barrier wait times.",
      },
    ],
    mathDeepDive: {
      title: "Throughput Degradation Formula",
      equation: "T_{cluster\\_step} = \\max_{i=1}^{N} \\left( T_{compute, i} + T_{comm, i} \\right) \\implies \\text{Throughput Loss} = \\frac{T_{straggler} - T_{nominal}}{T_{straggler}}",
      explanation: "Even with straggler fraction f = 0.0001 (1 out of 10,000 GPUs), if that GPU runs at 1.25x step time, effective cluster throughput drops by exactly 20%, costing hundreds of thousands of dollars per day in lost compute.",
    },
    realWorldEngineering: [
      "Set up Prometheus alerts on DCGM_FI_DEV_POWER_VIOLATION and DCGM_FI_DEV_THERMAL_VIOLATION to flag throttling GPUs in real time.",
      "Implement in-training barrier timers: if a rank exceeds nominal step duration by > 3 standard deviations for 3 consecutive steps, automatically cordon the node.",
      "Run automated daily micro-benchmarks (NCCL all_reduce_perf and GEMM burn-in) on freshly provisioned nodes before admitting them to active jobs.",
    ],
  },

  "mig-hardware-slicing": {
    title: "MIG Hardware Slicing vs Time-Slicing",
    module: "Module 4: Cluster Scheduling & Orchestration",
    overview: "Multi-Instance GPU (MIG) technology enables a single physical GPU (such as an A100 or H100) to be partitioned into up to 7 completely isolated hardware instances. Each instance has dedicated Streaming Multiprocessors (SMs), memory controllers, and L2 cache crossbars for deterministic Quality of Service (QoS).",
    keyConcepts: [
      {
        heading: "Hard Hardware Partitioning vs Time-Slicing",
        body: "Software time-slicing shares SMs and cache across processes, causing cache thrashing and unpredictable p99 latency spikes when co-located jobs compete. MIG provides physical hardware boundaries with zero cross-tenant interference.",
      },
      {
        heading: "MIG Instance Profiles (1g.10gb to 7g.80gb)",
        body: "Profiles define the exact allocation of hardware resources. For example, 1g.10gb allocates 14 SMs, 10 GB HBM, and 1/7th of total memory bandwidth—ideal for lightweight inference or embedding models.",
      },
      {
        heading: "Multi-Tenant Security & Fault Isolation",
        body: "A fatal error or out-of-memory (OOM) crash in one MIG slice terminates only that specific instance without affecting other active slices running on the same physical silicon.",
      },
    ],
    mathDeepDive: {
      title: "MIG Resource Slicing Invariant",
      equation: "\\sum_{k=1}^{K} \\text{Profile}_{SM, k} \\le SM_{total} \\quad \\text{and} \\quad \\sum_{k=1}^{K} \\text{Profile}_{HBM, k} \\le HBM_{total}",
      explanation: "On an H100 (132 enabled SMs, 80GB HBM), instances are allocated across 7 hardware partitions (e.g., two 3g.40gb slices or seven 1g.10gb slices), guaranteeing deterministic memory bandwidth to each tenant.",
    },
    realWorldEngineering: [
      "Use NVIDIA GPU Operator for Kubernetes to dynamically provision MIG devices as native k8s extended resources (nvidia.com/mig-1g.10gb).",
      "MIG does not support NVLink peer-to-peer transfers between slices on the same GPU; use full GPUs for distributed training and MIG for inference serving.",
      "Monitor MIG instance utilization via nvidia-smi mig -lgi to prevent under-utilized static partitions.",
    ],
  },

  "silent-data-corruption": {
    title: "Silent Data Corruption (SDC) & Transient Bit-Flips",
    module: "Module 5: Reliability, Thermal & Power Grid",
    overview: "Silent Data Corruption (SDC) refers to arithmetic or memory errors that occur without triggering hardware ECC interrupts or OS kernel panics. In massive clusters training trillion-parameter models, undetected bit-flips in matrix multiplications produce gradient explosions, loss spikes, and poisoned weights.",
    keyConcepts: [
      {
        heading: "Root Causes of SDC",
        body: "Sub-micron silicon defects, high-energy cosmic neutron strikes, subtle voltage fluctuations, and thermal degradation on aging tensor core circuits can produce incorrect arithmetic results (e.g., 1 + 1 = 3).",
      },
      {
        heading: "Loss Spikes & Weight Poisoning",
        body: "An SDC event in a self-attention projection matrix can cause an activation value of 1e6 instead of 1.0. During backward pass, this propagates infinite/NaN gradients that permanently corrupt Adam optimizer momentum buffers.",
      },
      {
        heading: "Canary Matrix Multiplications & Checksums",
        body: "Training frameworks inject periodic deterministically verifiable GEMM calculations (canaries) every 100 steps. If the output checksum differs from the expected value by even 1 LSB, the offending GPU is instantly isolated.",
      },
    ],
    mathDeepDive: {
      title: "Cluster SDC Probability Model",
      equation: "P_{SDC\\_fleet} = 1 - \\left( 1 - \\lambda_{SDC} \\right)^{N_{GPU} \\times T_{hours}}",
      explanation: "If single-GPU SDC rate lambda is 1 per 100,000 GPU-hours, a cluster of 16,384 GPUs operating for 30 days (11.8M GPU-hours) has a > 99.99% probability of experiencing multiple SDC events during the run.",
    },
    realWorldEngineering: [
      "Implement gradient norm clipping and automated rollback: if gradient norm exceeds 10x moving average, discard the step and load the previous checkpoint.",
      "Run DCGM Diagnostic Level 3 (nvvs -t 3) including tensor core stress tests to identify degrading silicon before job assignment.",
      "Log full-precision checksums of model weights at each checkpoint to verify historical weight integrity.",
    ],
  },

  "rack-power-liquid-cooling": {
    title: "100kW+ Rack Envelopes & Direct-to-Chip Liquid Cooling",
    module: "Module 5: Reliability, Thermal & Power Grid",
    overview: "Modern AI compute racks packed with next-generation GPUs (such as NVL72 or dense H100 pods) draw 40kW to 130kW+ per rack. Air cooling reaches its physical thermodynamic limit around 15–20kW per rack. Direct-to-Chip Liquid Cooling (DLC) is mandatory to sustain 1,000W+ TDP processors without thermal throttling.",
    keyConcepts: [
      {
        heading: "Direct-to-Chip Cold Plates",
        body: "Micro-channel copper cold plates are mounted directly on the GPU and host CPU heat spreaders. De-ionized treated water flows across the micro-fins, absorbing heat directly at the source with 3,000x the volumetric heat capacity of air.",
      },
      {
        heading: "Coolant Distribution Units (CDUs)",
        body: "CDUs manage the closed-loop secondary fluid circuit inside the rack, regulating temperature, flow rate (GPM), and pressure while transferring heat via plate heat exchangers to the facility primary water loop.",
      },
      {
        heading: "Thermal Throttling Hysteresis",
        body: "When GPU junction temperatures cross thermal limits (e.g., 85°C), the internal power management unit throttles clock frequencies from 1.8 GHz down to 800 MHz, cutting compute throughput in half to prevent silicon damage.",
      },
    ],
    mathDeepDive: {
      title: "Liquid Cooling Heat Transfer Equation",
      equation: "Q = \\dot{m} \\times C_p \\times \\Delta T \\implies \\dot{m} = \\frac{P_{rack}}{C_p \\times (T_{out} - T_{in})}",
      explanation: "To dissipate P_rack = 120 kW with water (C_p = 4.184 kJ/kg*K) and a 10°C temperature delta (T_in=30°C, T_out=40°C), the CDU must circulate m = 120 / (4.184 * 10) = 2.87 kg/s (~45.5 Gallons Per Minute) of coolant continuously.",
    },
    realWorldEngineering: [
      "Monitor rack CDU pressure drop and coolant conductivity in real-time; rising conductivity indicates ion contamination or corrosion.",
      "Implement automated emergency rack power capping (via IPMI/Redfish) if CDU water pump redundancy is lost.",
      "Maintain ambient data hall temperatures above the dew point to prevent condensation on cold plate fittings.",
    ],
  },

  "predictive-node-drain": {
    title: "Predictive Health Checks & Autonomous Node Draining",
    module: "Module 5: Reliability, Thermal & Power Grid",
    overview: "Rather than waiting for a hardware component to crash hard and abort an in-flight training run, predictive telemetry monitors early warning indicators (ECC error rates, PCIe replay counters, NVLink degradation) and autonomously drains suspect nodes at the next scheduled checkpoint boundary.",
    keyConcepts: [
      {
        heading: "Pre-Failure Signatures",
        body: "Hardware rarely dies without warning. Correctable single-bit ECC error bursts often precede uncorrectable multi-bit failures; NVLink CRC retry spikes precede link dropouts; optical transceiver power drops precede fiber disconnection.",
      },
      {
        heading: "Checkpoint Boundary Cordon & Drain",
        body: "When a node exceeds risk thresholds, the orchestrator marks the node as cordoned. At the very next step checkpoint save, the node is cleanly drained, a hot-standby node is substituted, and training continues without job abortion.",
      },
      {
        heading: "Automated Hardware Triage & RMA",
        body: "Drained nodes automatically run synthetic stress tests (memory burn-in, NVLink all-reduce loops). If failure is confirmed, the system opens an automated hardware RMA ticket with the vendor.",
      },
    ],
    mathDeepDive: {
      title: "Predictive Drain vs Reactive Crash Cost",
      equation: "C_{drain} = T_{swap} \\times \\text{BurnRate} \\quad \\ll \\quad C_{crash} = \\left( T_{rework} + T_{MTTR} \\right) \\times \\text{BurnRate}",
      explanation: "A proactive drain takes ~30 seconds (costing ~$50 in compute burn). A hard crash causes 30 minutes of lost rework plus 10 minutes MTTR recovery on a 4,096-GPU cluster (costing ~$15,000 in wasted GPU burn).",
    },
    realWorldEngineering: [
      "Integrate DCGM health alerts with Kubernetes Node Problem Detector (NPD) to automate node condition updates.",
      "Set alert thresholds for NVLink replays: > 1,000 replays per minute triggers immediate proactive drain flag.",
      "Maintain automated audit logs of all node replacements to track vendor batch failure trends.",
    ],
  },

  "pue-carbon-grid": {
    title: "Datacenter PUE & Carbon-Aware Shifting",
    module: "Module 5: Reliability, Thermal & Power Grid",
    overview: "Large-scale AI clusters consume tens of megawatts of electrical power. Power Usage Effectiveness (PUE) measures facility energy efficiency. Carbon-aware scheduling optimizes training throughput against renewable energy availability and local grid carbon intensity curves.",
    keyConcepts: [
      {
        heading: "Power Usage Effectiveness (PUE)",
        body: "PUE is the ratio of Total Facility Power to IT Equipment Power. Legacy air-cooled datacenters operate at PUE 1.4–1.6 (40–60% overhead on fans and chillers). Liquid-cooled facilities achieve PUE 1.10–1.15.",
      },
      {
        heading: "Temporal & Spatial Compute Shifting",
        body: "Batch pre-training jobs with flexible deadlines can dynamically modulate power draw or migrate across global datacenter regions to follow peak solar and wind generation windows.",
      },
      {
        heading: "Grid Demand Response & Power Capping",
        body: "During peak municipal grid demand, datacenters execute automated GPU power capping (e.g., capping H100 TDP from 700W to 500W), reducing facility power by 25% while maintaining 85% compute throughput.",
      },
    ],
    mathDeepDive: {
      title: "PUE & Facility Cost Formulation",
      equation: "\\text{PUE} = \\frac{P_{total}}{P_{IT}} = \\frac{P_{IT} + P_{cooling} + P_{loss}}{P_{IT}} \\implies \\text{Cost}_{power} = P_{IT} \\times \\text{PUE} \\times \\text{Hours} \\times \\frac{\\text{\\$/kWh}}{1000}",
      explanation: "For a 10 MW IT cluster operating for 1 year (8,760 hours) at $0.08/kWh: PUE 1.5 costs $10.51M in electricity; PUE 1.12 costs $7.85M, saving $2.66M annually purely through efficient liquid cooling.",
    },
    realWorldEngineering: [
      "Query real-time grid carbon intensity APIs (e.g., Electricity Maps) in the scheduler queue admission controller.",
      "Use dynamic voltage and frequency scaling (DVFS) via nvidia-smi -pl to cap peak power draw during grid peak pricing hours.",
      "Design closed-loop cooling towers with waste-heat capture for district heating systems in cold climates.",
    ],
  },

  "mfu-vs-mbu-accounting": {
    title: "Model FLOPs Utilization (MFU) vs MBU Accounting",
    module: "Module 6: FinOps & Capacity Economics",
    overview: "Hardware FLOPS ratings provided on spec sheets represent theoretical peak limits under ideal conditions. Model FLOPs Utilization (MFU) and Model Bandwidth Utilization (MBU) are the gold-standard metrics that measure true hardware efficiency during actual distributed execution.",
    keyConcepts: [
      {
        heading: "Model FLOPs Utilization (MFU)",
        body: "MFU measures the ratio of theoretical matrix operations required by the transformer architecture (6 * Params * Tokens per step) to the peak theoretical hardware FLOPS of the cluster. World-class pretraining runs achieve 45%–55% MFU.",
      },
      {
        heading: "Hardware FLOPs Utilization (HFU)",
        body: "HFU includes recomputation (activation checkpointing) FLOPs. While HFU may be 65%, true MFU measures only productive forward/backward work. Comparing MFU to HFU exposes recomputation overhead.",
      },
      {
        heading: "Model Bandwidth Utilization (MBU)",
        body: "During autoregressive inference token decoding, the system is memory-bound. MBU measures the fraction of peak HBM memory bandwidth achieved while loading model weights and KV cache per token.",
      },
    ],
    mathDeepDive: {
      title: "MFU Mathematical Formulation",
      equation: "\\text{MFU} = \\frac{\\text{Tokens/sec} \\times 6 \\times N_{\\text{params}}}{N_{\\text{GPUs}} \\times \\text{Peak FLOPs}_{\\text{spec}}} \\quad \\text{[for standard transformer]}",
      explanation: "For a 70B parameter model training at 3,200 tokens/sec across 64 H100 GPUs (peak FP16 = 989 TFLOPs each): MFU = (3200 * 6 * 70e9) / (64 * 989e12) = 1.344e15 / 6.329e16 = 21.2%. Optimizing kernels to reach 50% MFU doubles throughput to 7,500 tokens/sec without adding hardware.",
    },
    realWorldEngineering: [
      "Measure MFU at every scale step during cluster bring-up; a sudden drop in MFU when scaling from 64 to 512 GPUs indicates network communication bottlenecks.",
      "Profile pipeline bubbles in 1F1B schedules: bubble fraction F_bubble = (p - 1) / (p - 1 + m), where p is pipeline depth and m is number of microbatches.",
      "Incorporate FlashAttention, fused SwiGLU, and FP8 precision to maximize arithmetic intensity and MFU.",
    ],
  },

  "cluster-tco-modeling": {
    title: "Cluster CapEx vs OpEx: Amortized TCO Breakdown",
    module: "Module 6: FinOps & Capacity Economics",
    overview: "Building and operating an AI compute cluster involves massive capital expenditures (CapEx) for silicon, optics, and datacenter infrastructure, paired with ongoing operational expenditures (OpEx) for power, cooling, network transit, and engineering operations.",
    keyConcepts: [
      {
        heading: "Silicon & Optics CapEx Breakdown",
        body: "In a state-of-the-art AI cluster, GPU compute nodes represent ~70% of hardware CapEx, high-speed InfiniBand/RoCE networking and optical transceivers represent ~20%, and storage arrays represent ~10%.",
      },
      {
        heading: "Depreciation Horizon & Silicon Obsolescence",
        body: "AI hardware depreciates rapidly over a 3-year economic lifecycle due to generational compute density leaps. Every hour an expensive cluster sits idle or blocked on I/O directly destroys amortized investment value.",
      },
      {
        heading: "Power & Facility OpEx",
        body: "Over a 3-year operating period, electricity consumption (IT load + cooling) can equal 25%–35% of initial hardware acquisition costs.",
      },
    ],
    mathDeepDive: {
      title: "Hourly Total Cost of Ownership (TCO)",
      equation: "\\text{TCO}_{\\text{hour}} = \\frac{\\text{CapEx}_{\\text{total}}}{3 \\times 8760 \\times \\text{Utilization}} + \\left( P_{\\text{rack}} \\times \\text{PUE} \\times \\text{\\$/kWh} \\right) + \\text{OpEx}_{\\text{ops}}",
      explanation: "For an 8x H100 server costing $300,000 CapEx over 3 years at 85% utilization, amortized hardware cost is $13.43/hour. With 10.2kW power at PUE 1.2 and $0.08/kWh ($0.98/hour), total effective cost is ~$15.50/node-hour ($1.94/GPU-hour).",
    },
    realWorldEngineering: [
      "Audit optical transceiver failure rates: transceivers account for up to 80% of cluster network hardware replacements.",
      "Track cluster idle time metrics; enforce automated shutdown or spot reclamation of unallocated GPU partitions.",
      "Negotiate multi-year utility power purchase agreements (PPAs) to lock in stable electricity rates for AI datacenters.",
    ],
  },

  "token-cost-unit-economics": {
    title: "Cost Per Million Tokens: Pretraining vs Serving",
    module: "Module 6: FinOps & Capacity Economics",
    overview: "Unit economics bridges the gap between infrastructure engineering and product viability. Calculating the exact cost per million tokens for both pretraining runs and inference serving endpoints enables disciplined capacity planning and margin modeling.",
    keyConcepts: [
      {
        heading: "Pretraining Token Cost Formula",
        body: "Pretraining cost is directly proportional to model parameter count, training token volume, and GPU rental rate, inversely proportional to hardware MFU.",
      },
      {
        heading: "Inference Serving Cost Structure",
        body: "Inference unit economics depends on time-to-first-token (TTFT prefill cost), inter-token latency (decode memory bandwidth cost), batch size efficiency, and KV cache memory capacity.",
      },
      {
        heading: "FinOps Margin Optimization",
        body: "Improving training MFU from 35% to 52% on a 15-trillion token run saves over $2.5M in compute bills; optimizing inference batching cuts serving cost per user request by 4x.",
      },
    ],
    mathDeepDive: {
      title: "Pretraining Total Cost Formulation",
      equation: "\\text{Cost}_{\\text{run}} = \\frac{6 \\times N_{\\text{params}} \\times N_{\\text{tokens}}}{\\text{Peak FLOPs}_{\\text{GPU}} \\times \\text{MFU} \\times 3600} \\times \\text{Rate}_{\\text{GPU-hour}}",
      explanation: "Training an 8B model on 15T tokens on H100 GPUs ($2.00/hr, 989 TFLOPs peak) at 50% MFU: Total GPU-hours = (6 * 8e9 * 15e12) / (989e12 * 0.50 * 3600) = 404,448 hours * $2.00 = $808,897 ($0.054 per 1M training tokens).",
    },
    realWorldEngineering: [
      "Continuously log cost-per-token metrics to business intelligence dashboards to detect cost regressions in fine-tuning pipelines.",
      "Use vLLM or TensorRT-LLM continuous batching and PagedAttention to maximize inference token throughput per dollar.",
      "Implement prompt caching for system prompts and repetitive contexts to eliminate redundant prefill FLOPs.",
    ],
  },

  "spot-interruption-arbitrage": {
    title: "Spot Capacity Arbitrage & Preemption Resilience",
    module: "Module 6: FinOps & Capacity Economics",
    overview: "Cloud spot (preemptible) GPU instances are priced at 60%–75% discounts compared to on-demand instances. However, cloud providers can reclaim spot instances with only 30 to 120 seconds notice. Building a preemption-resilient training framework unlocks millions of dollars in compute savings.",
    keyConcepts: [
      {
        heading: "Preemption Notice Window",
        body: "When AWS/GCP/Azure issues a spot termination notice (via cloud metadata API), the training orchestrator has 30–120 seconds to snapshot local optimizer states, flush rank buffers, and exit gracefully.",
      },
      {
        heading: "Fast Local-Flash State Dumping",
        body: "Writing a 100GB checkpoint directly to cloud S3 over the WAN takes minutes and fails the spot deadline. Fast local NVMe streaming dumps state in < 15 seconds, followed by out-of-band upload.",
      },
      {
        heading: "Dynamic Elastic Resharding",
        body: "If a 64-node cluster loses 8 nodes to spot preemption, elastic frameworks (such as TorchElastic / Oobleck) reshard model and data parallel ranks across the remaining 56 nodes within 60 seconds without human intervention.",
      },
    ],
    mathDeepDive: {
      title: "Spot Arbitrage Net Cost Benefit",
      equation: "\\text{Net Savings} = 1 - \\frac{\\text{Rate}_{\\text{spot}} \\times \\left( T_{\\text{run}} + T_{\\text{rework}} \\right)}{\\text{Rate}_{\\text{on-demand}} \\times T_{\\text{run}}} \\quad \\text{where } T_{\\text{rework}} \\ll T_{\\text{run}}",
      explanation: "If spot discount is 65% (Rate_spot = 0.35 * Rate_on-demand) and preemption interruptions add 5% overhead in rework time (T_rework = 0.05 * T_run), total cost is 0.35 * 1.05 = 36.75% of on-demand cost—achieving net 63.25% dollar savings.",
    },
    realWorldEngineering: [
      "Poll cloud metadata endpoints (e.g., http://169.254.169.254/latest/meta-data/spot/instance-action) every 2 seconds from a background daemon.",
      "Distribute spot allocations across multiple cloud availability zones and GPU instance families to minimize correlated multi-node preemption events.",
      "Maintain a hybrid cluster strategy: anchor critical pipeline parallel stages on reserved nodes while running data-parallel workers on spot capacity.",
    ],
  },
};
