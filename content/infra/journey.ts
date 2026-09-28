export interface InfraJourneyEntry {
  id: string;
  num: string;
  module: number;
  kicker: string;
  title: string;
  blurb: string;
}

export interface InfraModule {
  id: number;
  name: string;
  tagline: string;
}

export const INFRA_MODULES: InfraModule[] = [
  { id: 1, name: "Silicon & Node Architecture", tagline: "The physical baseboard: NVLink meshes, PCIe Gen5 bottlenecks, and HBM3e bandwidth physics." },
  { id: 2, name: "Interconnects & Cluster Topologies", tagline: "High-radix Fat-Trees, Rail-Optimized fabrics, InfiniBand vs RoCE, and collective communication physics." },
  { id: 3, name: "Distributed Storage & Checkpointing", tagline: "GPUDirect Storage, asynchronous checkpointing pipelines, Daly interval optimization, and IO starvation." },
  { id: 4, name: "Cluster Scheduling & Orchestration", tagline: "Gang scheduling, topology-aware placement, straggler elimination, and multi-tenant hardware partitioning." },
  { id: 5, name: "Reliability, Thermal & Power Grid", tagline: "Silent Data Corruption (SDC), 100kW+ liquid-cooled rack envelopes, autonomous node draining, and PUE economics." },
  { id: 6, name: "FinOps & Capacity Economics", tagline: "Model FLOPs Utilization (MFU), cluster TCO, spot vs reserved arbitrage, and cost per million tokens." },
];

export const INFRA_JOURNEY: InfraJourneyEntry[] = [
  /* Module 1: Silicon & Node Architecture */
  {
    id: "nvlink-topology",
    num: "01",
    module: 1,
    kicker: "SILICON FABRIC",
    title: "NVLink mesh & NVSwitch scale-up",
    blurb: "Inside the 8-GPU baseboard: how full-mesh NVLink provides 900 GB/s to 3.6 TB/s bisection bandwidth, blurring the boundary between chip and bus.",
  },
  {
    id: "pcie-cxl-bottleneck",
    num: "02",
    module: 1,
    kicker: "HOST BUS",
    title: "PCIe Gen5 vs CXL host-to-device limits",
    blurb: "Host CPU-to-GPU transfer bottlenecks, bounce buffers, pinned memory semantics, and how CXL cache coherency rewires memory pooling.",
  },
  {
    id: "hbm-memory-wall",
    num: "03",
    module: 1,
    kicker: "MEMORY WALL",
    title: "HBM3e bandwidth saturation & roofline knee",
    blurb: "The arithmetic intensity threshold where high-bandwidth memory reaches saturation and GPU compute switches from memory-bound to compute-bound.",
  },
  {
    id: "hgx-node-anatomy",
    num: "04",
    module: 1,
    kicker: "NODE ANATOMY",
    title: "The modern AI server: HGX baseboard layout",
    blurb: "8x GPUs, dual x86/ARM host sockets, 8x CX-7 NICs, BlueField-3 DPUs, and PCIe Gen5 retimers configured for zero-contention scale-up.",
  },

  /* Module 2: Interconnects & Cluster Topologies */
  {
    id: "infiniband-vs-roce",
    num: "05",
    module: 2,
    kicker: "FABRIC PROTOCOLS",
    title: "InfiniBand vs RoCE v2: Lossless transport mechanics",
    blurb: "Credit-based flow control vs PFC/ECN pause frames, packet drops, tail latency spikes, and tuning headroom to prevent deadlocks.",
  },
  {
    id: "fat-tree-rail-optimized",
    num: "06",
    module: 2,
    kicker: "TOPOLOGY",
    title: "Rail-optimized Fat-Tree & Dragonfly+ fabrics",
    blurb: "Grouping GPU ordinal ranks onto dedicated spine rails to eliminate cross-rail traffic during tensor and pipeline parallel collectives.",
  },
  {
    id: "ring-vs-tree-allreduce",
    num: "07",
    module: 2,
    kicker: "COLLECTIVES",
    title: "Ring vs Tree AllReduce: Bandwidth vs latency physics",
    blurb: "Why ring topologies saturate maximum wire bandwidth for large tensors while binomial/double-binary trees win on latency for small payloads.",
  },
  {
    id: "incast-adaptive-routing",
    num: "08",
    module: 2,
    kicker: "CONGESTION",
    title: "Network incast, microbursts & packet spraying",
    blurb: "When thousands of GPUs send AllGather traffic simultaneously: buffer bloat, incast packet drops, and dynamic adaptive packet spraying.",
  },

  /* Module 3: Distributed Storage & Checkpointing */
  {
    id: "gpudirect-storage",
    num: "09",
    module: 3,
    kicker: "STORAGE IO",
    title: "GPUDirect Storage (GDS) vs POSIX bounce buffers",
    blurb: "Bypassing the CPU host memory and OS page cache with direct DMA from NVMe-oF flash into GPU HBM, slashing CPU utilization from 60% to 2%.",
  },
  {
    id: "daly-checkpoint-opt",
    num: "10",
    module: 3,
    kicker: "CHECKPOINTING",
    title: "Daly's formula: Optimal checkpoint frequency",
    blurb: "Balancing the I/O cost of writing state against the compute waste of re-executing lost steps under stochastic cluster failure rates.",
  },
  {
    id: "data-ingest-streaming",
    num: "11",
    module: 3,
    kicker: "DATA PIPELINE",
    title: "Petabyte data streaming & worker prefetching",
    blurb: "Preventing GPU starvation during multimodal pre-training: chunked shard streaming, ring buffer prefetching, and asynchronous Ray/DALI workers.",
  },
  {
    id: "checkpoint-resume-mttr",
    num: "12",
    module: 3,
    kicker: "RECOVERY",
    title: "Checkpoint blast-radius & sub-minute MTTR",
    blurb: "Resuming 16,384 GPU ranks without metadata server stampedes: distributed rank sharding, peer-to-peer weight broadcasting, and fast initialization.",
  },

  /* Module 4: Cluster Scheduling & Orchestration */
  {
    id: "gang-scheduling-kueue",
    num: "13",
    module: 4,
    kicker: "ORCHESTRATION",
    title: "Gang scheduling & all-or-nothing allocation",
    blurb: "Why distributed AI jobs cannot tolerate partial scheduling: deadlock prevention, Kueue/Volcano admission controllers, and Slurm reservations.",
  },
  {
    id: "topology-aware-placement",
    num: "14",
    module: 4,
    kicker: "PLACEMENT",
    title: "Topology-aware packing & switch-hop minimization",
    blurb: "Bin-packing ranks to ensure high-communication tensor parallel domains share the same NVLink baseboard and leaf switch, avoiding spine bottlenecks.",
  },
  {
    id: "straggler-detection",
    num: "15",
    module: 4,
    kicker: "DIAGNOSTICS",
    title: "Straggler detection & collective barrier lag",
    blurb: "How a single degraded GPU running 5% slower stalls the entire 10,000-GPU synchronous collective barrier, and how NCCL flight recorders catch it.",
  },
  {
    id: "mig-hardware-slicing",
    num: "16",
    module: 4,
    kicker: "MULTI-TENANCY",
    title: "MIG hardware slicing vs time-sliced virtualization",
    blurb: "Partitioning an H100 into up to 7 isolated GPU instances with dedicated SMs, memory controllers, and L2 cache crossbars for guaranteed QoS.",
  },

  /* Module 5: Reliability, Thermal & Power Grid */
  {
    id: "silent-data-corruption",
    num: "17",
    module: 5,
    kicker: "RELIABILITY",
    title: "Silent Data Corruption (SDC) & transient bit-flips",
    blurb: "Cosmic rays, voltage droops, and undetected matrix math errors: why gradient norms explode and how hardware checksums & periodic canary audits catch them.",
  },
  {
    id: "rack-power-liquid-cooling",
    num: "18",
    module: 5,
    kicker: "THERMAL & POWER",
    title: "100kW+ rack envelopes & direct-to-chip liquid cooling",
    blurb: "Managing 1,000W TDP silicon: cold plates, coolant distribution units (CDUs), facility water loops, and thermal throttling hysteresis curves.",
  },
  {
    id: "predictive-node-drain",
    num: "19",
    module: 5,
    kicker: "AUTONOMOUS OPS",
    title: "Predictive health checks & autonomous node draining",
    blurb: "Detecting PCIe bus error bursts, uncorrectable ECC trends, and optical transceiver degradation before a hard node crash destroys the training run.",
  },
  {
    id: "pue-carbon-grid",
    num: "20",
    module: 5,
    kicker: "SUSTAINABILITY",
    title: "Datacenter PUE & temporal compute shifting",
    blurb: "Power Usage Effectiveness dynamics: shifting non-urgent batch pre-training jobs across global datacenters to follow green grid energy supply curves.",
  },

  /* Module 6: FinOps & Capacity Economics */
  {
    id: "mfu-vs-mbu-accounting",
    num: "21",
    module: 6,
    kicker: "EFFICIENCY",
    title: "Model FLOPs Utilization (MFU) vs MBU accounting",
    blurb: "Measuring true hardware efficiency: separating kernel execution time, communication overhead, bubble time, and memory bandwidth limits.",
  },
  {
    id: "cluster-tco-modeling",
    num: "22",
    module: 6,
    kicker: "FINOPS",
    title: "Cluster CapEx vs OpEx: Amortized TCO breakdown",
    blurb: "Silicon depreciation, optical transceiver replacement rates, power contracts, datacenter shell leases, and the hidden cost of idle GPU hours.",
  },
  {
    id: "token-cost-unit-economics",
    num: "23",
    module: 6,
    kicker: "UNIT ECONOMICS",
    title: "Cost per million tokens: Pretraining vs serving",
    blurb: "Calculating the exact dollar cost of a 15-trillion token pretraining run, and mapping infrastructure efficiency directly to token margins.",
  },
  {
    id: "spot-interruption-arbitrage",
    num: "24",
    module: 6,
    kicker: "CAPACITY",
    title: "Spot instance arbitrage & zero-overhead recovery",
    blurb: "Slashing compute bills by 60–70% using preemptible spot instances paired with sub-30-second asynchronous snapshotting and dynamic rank rejoining.",
  },
];

export function infraIndex(id: string): number {
  return INFRA_JOURNEY.findIndex((j) => j.id === id);
}

export function infraModuleOf(id: string): InfraModule | undefined {
  const entry = INFRA_JOURNEY.find((j) => j.id === id);
  if (!entry) return undefined;
  return INFRA_MODULES.find((m) => m.id === entry.module);
}

export function infraNeighbors(id: string): {
  prev?: InfraJourneyEntry;
  next?: InfraJourneyEntry;
} {
  const i = infraIndex(id);
  if (i < 0) return {};
  return {
    prev: i > 0 ? INFRA_JOURNEY[i - 1] : undefined,
    next: i + 1 < INFRA_JOURNEY.length ? INFRA_JOURNEY[i + 1] : undefined,
  };
}

export function infraCount(): number {
  return INFRA_JOURNEY.length;
}
