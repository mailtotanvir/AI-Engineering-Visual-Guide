export interface InfraDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const INFRA_DOMAINS: InfraDomain[] = [
  { id: "silicon-node", num: "01", name: "Silicon & Node Architecture", blurb: "GPU baseboards, NVLink switches, PCIe/CXL topologies, and HBM memory interfaces." },
  { id: "fabric-interconnect", num: "02", name: "Cluster Fabric & Interconnects", blurb: "InfiniBand vs RoCE v2, Rail-Optimized Fat-Trees, NCCL collectives, and congestion control." },
  { id: "storage-io", num: "03", name: "Storage Fabric & Checkpointing", blurb: "GPUDirect Storage, NVMe-oF, Daly optimal checkpointing, and distributed dataset streaming." },
  { id: "orchestration", num: "04", name: "Scheduling & Orchestration", blurb: "Gang scheduling, topology-aware placement, straggler elimination, and MIG hardware slicing." },
  { id: "reliability", num: "05", name: "Reliability & Fault Domains", blurb: "Silent Data Corruption (SDC), MTBF modeling, health probes, and autonomous node draining." },
  { id: "thermal-power", num: "06", name: "Thermal, Power & Datacenter", blurb: "Direct-to-chip liquid cooling, 100kW+ rack envelopes, CDU mechanics, and PUE economics." },
  { id: "finops", num: "07", name: "FinOps & Cluster Economics", blurb: "Model FLOPs Utilization (MFU), CapEx/OpEx modeling, cost per token, and spot instance arbitrage." },
  { id: "telemetry", num: "08", name: "Fleet Telemetry & Diagnostics", blurb: "NCCL flight recorders, DCGM GPU telemetry, switch buffer counters, and automated triage." },
];

export interface InfraTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const INFRA_TOPICS: InfraTopic[] = [
  /* Domain 1: Silicon & Node Architecture */
  {
    id: "t-nvlink-topology",
    domain: "silicon-node",
    title: "NVLink Mesh & NVSwitch Architecture",
    kind: "scene",
    scene: "nvlink-topology",
    summary: "Dedicated high-speed interconnect fabric within an 8-GPU baseboard.",
    points: [
      "900 GB/s to 3.6 TB/s bidirectional bandwidth per GPU connects all 8 devices in a non-blocking all-to-all topology.",
      "Hardware-level memory load/store operations bypass standard OS driver queues.",
      "Forms the scale-up domain for low-latency Tensor Parallelism (TP) and intra-node Pipeline Parallelism (PP).",
    ],
  },
  {
    id: "t-pcie-cxl-bottleneck",
    domain: "silicon-node",
    title: "PCIe Gen5 vs CXL Host Bus Limits",
    kind: "scene",
    scene: "pcie-cxl-bottleneck",
    summary: "Host CPU-to-GPU transfer constraints, page locks, and memory coherency.",
    points: [
      "PCIe Gen5 x16 provides ~64 GB/s unidirectional bandwidth, a severe bottleneck compared to NVLink.",
      "Standard user buffers require double-buffering through kernel pinned pages, increasing latency and CPU overhead.",
      "CXL (Compute Express Link) introduces memory pooling and device-host cache coherency over PCIe physical layers.",
    ],
  },
  {
    id: "t-hbm-memory-wall",
    domain: "silicon-node",
    title: "HBM3e Bandwidth & Roofline Knee",
    kind: "scene",
    scene: "hbm-memory-wall",
    summary: "The arithmetic intensity boundary between memory-bound and compute-bound execution.",
    points: [
      "HBM3e stacks achieve up to 3.35 to 8.0 TB/s memory bandwidth directly on interposer silicon.",
      "Kernels with arithmetic intensity below the roofline knee (FLOPs/Byte) are bottlenecked purely by memory bus width.",
      "FlashAttention and fused kernels increase arithmetic intensity by keeping intermediate activations in fast SRAM.",
    ],
  },
  {
    id: "t-hgx-node-anatomy",
    domain: "silicon-node",
    title: "HGX Server Baseboard Anatomy",
    kind: "scene",
    scene: "hgx-node-anatomy",
    summary: "Structural layout of an enterprise 8-GPU scale-up training server.",
    points: [
      "8x SXM5/B200 GPUs mounted on an HGX baseboard interconnected via 4x NVSwitch chips.",
      "Dual host CPU sockets connect via PCIe Gen5 switches to 8 dedicated 400Gbps OSFP/QSFP network interfaces.",
      "Dedicated BlueField-3 DPUs manage out-of-band storage fabric and cluster telemetry without host kernel interruptions.",
    ],
  },
  {
    id: "c-gpu-memory-coherency",
    domain: "silicon-node",
    title: "Unified Memory & Hardware Coherency",
    kind: "concept",
    summary: "Zero-copy pointer sharing and page fault migration across GPU and CPU address spaces.",
    points: [
      "NVLink unified virtual addressing (UVA) enables transparent multi-GPU pointer dereferencing.",
      "Hardware page migration engines move physical 64KB/2MB pages on demand across the interconnect.",
      "Overuse of unmanaged page faulting degrades performance by orders of magnitude due to page-table thrashing.",
    ],
  },

  /* Domain 2: Cluster Fabric & Interconnects */
  {
    id: "t-infiniband-vs-roce",
    domain: "fabric-interconnect",
    title: "InfiniBand vs RoCE v2 Transport",
    kind: "scene",
    scene: "infiniband-vs-roce",
    summary: "Lossless Ethernet vs native InfiniBand architectures for high-throughput collectives.",
    points: [
      "InfiniBand uses hardware credit-based flow control at the link layer, guaranteeing zero packet drops by design.",
      "RoCE v2 relies on Priority Flow Control (PFC) and Explicit Congestion Notification (ECN) on standard Ethernet.",
      "Improper PFC headroom buffer sizing on RoCE causes catastrophic deadlocks and pause-frame storms.",
    ],
  },
  {
    id: "t-fat-tree-rail-optimized",
    domain: "fabric-interconnect",
    title: "Rail-Optimized Fat-Tree Fabrics",
    kind: "scene",
    scene: "fat-tree-rail-optimized",
    summary: "Topology cabling design optimized for 3D parallel distributed training patterns.",
    points: [
      "GPUs in ordinal positions 0 through 7 across all servers connect to independent Leaf switches (Rails 0-7).",
      "Collective operations within a tensor/pipeline parallel rank group remain entirely on their dedicated rail switch.",
      "Eliminates cross-rail traffic collisions and reduces the total switch radix required for non-blocking scale.",
    ],
  },
  {
    id: "t-ring-vs-tree-allreduce",
    domain: "fabric-interconnect",
    title: "Ring vs Tree AllReduce Collective Physics",
    kind: "scene",
    scene: "ring-vs-tree-allreduce",
    summary: "Algorithmic communication complexity as a function of payload size and node count.",
    points: [
      "Ring AllReduce sends 2*(N-1)/N * S bytes; bandwidth-optimal for large gradient tensors in data parallelism.",
      "Double-binary tree AllReduce completes in 2*log2(N) steps; latency-optimal for small tensors and barrier syncs.",
      "NCCL dynamically selects ring vs tree topologies based on tensor size threshold and cluster communicator size.",
    ],
  },
  {
    id: "t-incast-adaptive-routing",
    domain: "fabric-interconnect",
    title: "Network Incast & Dynamic Adaptive Routing",
    kind: "scene",
    scene: "incast-adaptive-routing",
    summary: "Preventing switch buffer exhaustion during simultaneous multi-rank collective bursts.",
    points: [
      "Incast occurs when hundreds of senders target the same receiver switch port simultaneously, overwhelming egress buffers.",
      "Static ECMP (Equal-Cost Multi-Path) hashing causes hash polarization and persistent hot links.",
      "Dynamic adaptive routing sprays fine-grained packet chunks across all equal-cost paths, reassembling them at the NIC.",
    ],
  },

  /* Domain 3: Storage Fabric & Checkpointing */
  {
    id: "t-gpudirect-storage",
    domain: "storage-io",
    title: "GPUDirect Storage (GDS) vs POSIX IO",
    kind: "scene",
    scene: "gpudirect-storage",
    summary: "Direct DMA path between NVMe flash storage and GPU HBM memory.",
    points: [
      "Bypasses CPU bounce buffers and OS page cache, executing DMA directly from NVMe controllers to GPU HBM.",
      "Reduces end-to-end I/O latency by 3-5x and lowers host CPU utilization from 60% to under 2%.",
      "Essential for multi-terabyte dataset streaming and sub-minute checkpoint writes.",
    ],
  },
  {
    id: "t-daly-checkpoint-opt",
    domain: "storage-io",
    title: "Daly's Formula: Optimal Checkpoint Frequency",
    kind: "scene",
    scene: "daly-checkpoint-opt",
    summary: "Mathematical optimization balancing I/O commit overhead against failure rework.",
    points: [
      "Optimal interval tau_opt = sqrt(2 * delta * MTBF) - delta, where delta is write time and MTBF is mean failure interval.",
      "Checkpointing too frequently wastes GPU cycles on I/O barriers; checkpointing too rarely wastes compute on rollback.",
      "Asynchronous tiered checkpointing saves state to local NVMe in 2 seconds while flushing to S3 in the background.",
    ],
  },
  {
    id: "t-data-ingest-streaming",
    domain: "storage-io",
    title: "Petabyte Data Ingestion & Prefetching",
    kind: "scene",
    scene: "data-ingest-streaming",
    summary: "High-throughput data loaders ensuring GPUs never starve waiting for training samples.",
    points: [
      "Multimodal token batches require multi-GB/s sustained read throughput per node.",
      "Uses ring-buffered asynchronous prefetching with Ray or NVIDIA DALI to overlap CPU decompression with GPU compute.",
      "Deterministic pseudo-random shard shuffling eliminates centralized index bottlenecks across 10,000 workers.",
    ],
  },
  {
    id: "t-checkpoint-resume-mttr",
    domain: "storage-io",
    title: "Distributed Resume & Fast MTTR",
    kind: "scene",
    scene: "checkpoint-resume-mttr",
    summary: "Minimizing Mean Time to Recover across multi-thousand rank pretraining runs.",
    points: [
      "Naive resume produces a thundering herd on metadata servers when 16,384 ranks attempt to read rank-0 weights.",
      "Sharded safetensors / ZeRO-3 partition state so each rank reads only its own slice of weights and optimizer states.",
      "Sub-minute recovery requires warm container image pools, fast health probes, and pre-allocated spare nodes.",
    ],
  },

  /* Domain 4: Scheduling & Orchestration */
  {
    id: "t-gang-scheduling-kueue",
    domain: "orchestration",
    title: "Gang Scheduling & All-or-Nothing Allocation",
    kind: "scene",
    scene: "gang-scheduling-kueue",
    summary: "Preventing distributed deadlocks in Kubernetes and Slurm cluster environments.",
    points: [
      "A distributed training job requires all N nodes to start simultaneously or zero nodes to prevent cluster starvation.",
      "Kueue and Volcano admission controllers enforce strict gang quotas and queue preemption rules.",
      "Partial allocations hold expensive GPUs idle while waiting for missing workers, causing deadlocks.",
    ],
  },
  {
    id: "t-topology-aware-placement",
    domain: "orchestration",
    title: "Topology-Aware Placement & Packing",
    kind: "scene",
    scene: "topology-aware-placement",
    summary: "Aligning job placement with the physical network switch hierarchy.",
    points: [
      "Jobs spanning multiple spine switch hops experience higher latency and cross-tier link contention.",
      "Topology schedulers pack high-communication tensor parallel domains into the same rack and leaf switch.",
      "Reduces average network hop count from 5 to 1, accelerating collective communication phases by up to 35%.",
    ],
  },
  {
    id: "t-straggler-detection",
    domain: "orchestration",
    title: "Straggler Detection & Barrier Synchronization",
    kind: "scene",
    scene: "straggler-detection",
    summary: "Diagnosing and isolating slow nodes that hold the entire cluster at barrier points.",
    points: [
      "Synchronous distributed training moves at the speed of the single slowest GPU in the communicator.",
      "A 5% clock frequency drop on one GPU causes a 5% throughput drop across 10,000 GPUs.",
      "NCCL flight recorders and DCGM telemetry detect stragglers within seconds, triggering automated node replacement.",
    ],
  },
  {
    id: "t-mig-hardware-slicing",
    domain: "orchestration",
    title: "MIG Hardware Slicing vs Time-Slicing",
    kind: "scene",
    scene: "mig-hardware-slicing",
    summary: "Hard hardware partitioning for deterministic multi-tenant inference workloads.",
    points: [
      "Multi-Instance GPU (MIG) partitions memory controllers, crossbars, and SMs into dedicated hardware instances.",
      "Unlike software time-slicing, MIG guarantees strict hardware isolation with zero cross-tenant noisy-neighbor interference.",
      "Enables running multiple isolated inference endpoints or fine-tuning jobs on a single 80GB GPU.",
    ],
  },

  /* Domain 5: Reliability & Fault Domains */
  {
    id: "t-silent-data-corruption",
    domain: "reliability",
    title: "Silent Data Corruption (SDC) & Bitflips",
    kind: "scene",
    scene: "silent-data-corruption",
    summary: "Undetected hardware calculation errors causing gradient explosion or loss spikes.",
    points: [
      "Transient hardware faults and cosmic rays can cause arithmetic bit-flips without triggering OS kernel panics.",
      "An undetected bitflip in an FP16/BF16 matrix multiplication can corrupt weight norms and ruin a multi-million-dollar run.",
      "Periodic canary matrix multiplications and gradient norm anomaly detectors isolate corrupt silicon before save.",
    ],
  },
  {
    id: "t-rack-power-liquid-cooling",
    domain: "thermal-power",
    title: "100kW+ Rack Envelopes & Direct Liquid Cooling",
    kind: "scene",
    scene: "rack-power-liquid-cooling",
    summary: "Thermal management physics for multi-kilowatt AI server racks.",
    points: [
      "Next-generation AI racks draw 40kW to 130kW+, far exceeding the 15kW practical limit of air cooling.",
      "Direct-to-chip cold plates circulate facility water directly over GPU silicon, maintaining junction temperatures under 65°C.",
      "Coolant Distribution Units (CDUs) regulate flow rates and fluid conductivity to prevent leaks and thermal runaway.",
    ],
  },
  {
    id: "t-predictive-node-drain",
    domain: "reliability",
    title: "Predictive Health Checks & Node Draining",
    kind: "scene",
    scene: "predictive-node-drain",
    summary: "Proactively evicting failing hardware before unrecoverable kernel panics occur.",
    points: [
      "Tracks pre-failure indicators: PCIe correctable error bursts, NVLink CRC replay counters, and thermal throttling events.",
      "Automated cluster controllers cordoned and drain the suspect node during the next checkpoint boundary.",
      "Replaces the failing node from a hot-standby pool without aborting or restarting the active training job.",
    ],
  },
  {
    id: "t-pue-carbon-grid",
    domain: "thermal-power",
    title: "Datacenter PUE & Carbon-Aware Shifting",
    kind: "scene",
    scene: "pue-carbon-grid",
    summary: "Optimizing energy efficiency and grid power utilization for massive compute facilities.",
    points: [
      "Power Usage Effectiveness (PUE) = Total Facility Power / IT Equipment Power; liquid-cooled facilities achieve PUE < 1.15.",
      "Carbon-aware schedulers dynamically throttle or shift batch training workloads to match renewable wind/solar generation.",
      "Thermal load balancing redistributes job allocations across datacenters to shave peak electrical demand charges.",
    ],
  },

  /* Domain 6: FinOps & Cluster Economics */
  {
    id: "t-mfu-vs-mbu-accounting",
    domain: "finops",
    title: "MFU vs MBU Hardware Efficiency Accounting",
    kind: "scene",
    scene: "mfu-vs-mbu-accounting",
    summary: "Quantifying how much of theoretical peak hardware capacity is actually utilized.",
    points: [
      "Model FLOPs Utilization (MFU) measures observed token throughput against peak theoretical matrix math capabilities.",
      "Model Bandwidth Utilization (MBU) measures memory bus saturation for memory-bound decoding workloads.",
      "World-class pretraining frameworks achieve 45%–55% MFU on H100 clusters; low MFU signals communication or I/O waste.",
    ],
  },
  {
    id: "t-cluster-tco-modeling",
    domain: "finops",
    title: "Total Cost of Ownership (TCO) Modeling",
    kind: "scene",
    scene: "cluster-tco-modeling",
    summary: "Deconstructing CapEx amortization, OpEx power, and facility leasing costs.",
    points: [
      "GPU hardware silicon depreciates over 3–4 years; optical transceivers and cables contribute 15–20% of network CapEx.",
      "Electricity and cooling represent up to 30% of lifetime cluster OpEx for high-utilization clusters.",
      "Unplanned downtime and idle recovery hours directly erode profit margins on frontier foundation model development.",
    ],
  },
  {
    id: "t-token-cost-unit-economics",
    domain: "finops",
    title: "Cost Per Million Tokens: Pretraining vs Serving",
    kind: "scene",
    scene: "token-cost-unit-economics",
    summary: "Unit economics calculating the exact compute cost of training and serving LLMs.",
    points: [
      "Pretraining cost formula: Cost = (6 * Parameters * Tokens / Peak FLOPs / MFU) * Hourly GPU Rate.",
      "A 70B parameter model trained on 15T tokens at 50% MFU requires ~$3.5M–$6M in compute burn.",
      "Inference FinOps balances KV-cache memory costs against compute batch size to minimize cost per generated token.",
    ],
  },
  {
    id: "t-spot-interruption-arbitrage",
    domain: "finops",
    title: "Spot Capacity Arbitrage & Preemption Resilience",
    kind: "scene",
    scene: "spot-interruption-arbitrage",
    summary: "Leveraging discounted spot compute instances with zero-overhead fault recovery.",
    points: [
      "Cloud spot/preemptible instances offer 60%–70% cost savings over on-demand reservations.",
      "Preemption notices (30–120s) trigger emergency asynchronous state flushes directly to local NVMe and S3.",
      "Dynamic rank resharding allows the training job to shrink or expand its parallel topology when nodes are reclaimed.",
    ],
  },
];
