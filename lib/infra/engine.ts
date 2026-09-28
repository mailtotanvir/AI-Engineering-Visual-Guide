/* Deterministic math & simulations for World 06: Infrastructure.
   Every formula, metric, and simulation is rigorously modeled for high-depth engineering inquiry. */

/* =============== Module 1: Silicon & Node Architecture =============== */

/** Bisection bandwidth (GB/s unidirectional or bidirectional). */
export function bisectionBandwidth(links: number, linkBwGBs: number, bidirectional = true): number {
  return links * linkBwGBs * (bidirectional ? 2 : 1);
}

/** NVLink vs PCIe Host-to-Device transfer latency & throughput. */
export function h2dTransferTimeMs(sizeMB: number, bandwidthGBs: number, latencyUs: number): number {
  if (bandwidthGBs <= 0) return 0;
  const transferSec = (sizeMB / 1024) / bandwidthGBs;
  return (latencyUs / 1000) + (transferSec * 1000);
}

/** HBM3e Memory Bandwidth Saturation & Arithmetic Intensity threshold.
 *  Roofline peak: operational intensity (FLOP/byte) where compute meets memory bound. */
export function rooflineKnee(peakTflops: number, peakMemBwTBps: number): number {
  if (peakMemBwTBps <= 0) return 0;
  return (peakTflops * 1e12) / (peakMemBwTBps * 1e12); // FLOP/Byte
}

/** Operational regime check */
export function rooflineAttainableTflops(intensity: number, peakTflops: number, peakMemBwTBps: number): {
  attainableTflops: number;
  regime: "memory-bound" | "compute-bound";
} {
  const knee = rooflineKnee(peakTflops, peakMemBwTBps);
  if (intensity < knee) {
    return { attainableTflops: intensity * peakMemBwTBps, regime: "memory-bound" };
  }
  return { attainableTflops: peakTflops, regime: "compute-bound" };
}

/* =============== Module 2: Interconnects & Cluster Topologies =============== */

/** Ring AllReduce execution time:
 *  T_ring = 2 * ((N - 1) / N) * (S / B) + 2 * (N - 1) * alpha
 *  where N = ranks, S = message size in Bytes, B = link bandwidth in B/s, alpha = link latency in s. */
export function ringAllReduceTimeMs(ranks: number, sizeMB: number, linkBwGBs: number, latencyUs: number): number {
  if (ranks <= 1 || linkBwGBs <= 0) return 0;
  const sizeBytes = sizeMB * 1024 * 1024;
  const bwBytesPerSec = linkBwGBs * 1e9;
  const alphaSec = latencyUs * 1e-6;
  const transferSec = 2 * ((ranks - 1) / ranks) * (sizeBytes / bwBytesPerSec);
  const latencySec = 2 * (ranks - 1) * alphaSec;
  return (transferSec + latencySec) * 1000;
}

/** Tree AllReduce execution time:
 *  T_tree = 2 * log2(N) * (S / B) + 2 * log2(N) * alpha */
export function treeAllReduceTimeMs(ranks: number, sizeMB: number, linkBwGBs: number, latencyUs: number): number {
  if (ranks <= 1 || linkBwGBs <= 0) return 0;
  const sizeBytes = sizeMB * 1024 * 1024;
  const bwBytesPerSec = linkBwGBs * 1e9;
  const alphaSec = latencyUs * 1e-6;
  const log2N = Math.log2(ranks);
  const transferSec = 2 * log2N * (sizeBytes / bwBytesPerSec);
  const latencySec = 2 * log2N * alphaSec;
  return (transferSec + latencySec) * 1000;
}

/** RoCE v2 Priority Flow Control (PFC) Headroom Buffer requirement (Bytes).
 *  Buffer = 2 * RTT * Bandwidth + Processing Jitter Headroom */
export function pfcHeadroomBytes(cableLengthMeters: number, bandwidthGbps: number, switchProcessingNs: number): number {
  // Speed of light in copper/fiber ~ 5 ns/m
  const propagationDelayNs = cableLengthMeters * 5;
  const roundTripNs = (propagationDelayNs * 2) + switchProcessingNs;
  const bandwidthBytesPerNs = (bandwidthGbps * 1e9) / 8 / 1e9;
  return Math.ceil(roundTripNs * bandwidthBytesPerNs * 1.5); // 1.5x safety headroom
}

/** Fat-Tree Oversubscription ratio: Uplink Bandwidth / Downlink Bandwidth */
export function oversubscriptionRatio(downlinks: number, uplinks: number, linkSpeedGbps = 400): {
  ratio: number;
  isNonBlocking: boolean;
  bisectionBwTbps: number;
} {
  const downBw = downlinks * linkSpeedGbps;
  const upBw = uplinks * linkSpeedGbps;
  const ratio = downBw / Math.max(1, upBw);
  return {
    ratio,
    isNonBlocking: ratio <= 1.0,
    bisectionBwTbps: (Math.min(downBw, upBw) * 2) / 1000,
  };
}

/* =============== Module 3: Storage Fabric & Checkpointing =============== */

/** GPUDirect Storage vs POSIX Buffered IO throughput (GB/s).
 *  GDS avoids double-buffering via CPU page cache and bounce buffers. */
export function storageThroughputGBs(nvmeRawGBs: number, mode: "gds" | "posix-cached" | "posix-direct"): {
  effectiveGBs: number;
  cpuOverheadFrac: number;
  pcieHops: number;
} {
  switch (mode) {
    case "gds":
      return { effectiveGBs: nvmeRawGBs * 0.94, cpuOverheadFrac: 0.02, pcieHops: 1 };
    case "posix-direct":
      return { effectiveGBs: nvmeRawGBs * 0.65, cpuOverheadFrac: 0.28, pcieHops: 3 };
    case "posix-cached":
      return { effectiveGBs: Math.min(nvmeRawGBs * 0.45, 12.0), cpuOverheadFrac: 0.55, pcieHops: 4 };
  }
}

/** Daly's / Young's Optimal Checkpoint Interval (seconds):
 *  tau_opt = sqrt(2 * delta * MTBF) - delta (when delta << MTBF)
 *  where delta = time to dump checkpoint, MTBF = cluster Mean Time Between Failures. */
export function optimalCheckpointIntervalSec(dumpTimeSec: number, mtbfHours: number): {
  optimalIntervalSec: number;
  optimalIntervalHours: number;
  wasteFrac: number;
} {
  const mtbfSec = mtbfHours * 3600;
  if (mtbfSec <= 0 || dumpTimeSec <= 0) return { optimalIntervalSec: 0, optimalIntervalHours: 0, wasteFrac: 0 };
  const tau = Math.sqrt(2 * dumpTimeSec * mtbfSec) - dumpTimeSec;
  const safeTau = Math.max(60, tau);
  // Waste = (dumpTime / tau) + (0.5 * tau / MTBF)
  const waste = (dumpTimeSec / safeTau) + (0.5 * safeTau / mtbfSec);
  return {
    optimalIntervalSec: safeTau,
    optimalIntervalHours: safeTau / 3600,
    wasteFrac: Math.min(1, waste),
  };
}

/** Checkpoint Resume Blast-Radius and MTTR recovery time. */
export function checkpointRecoveryTimeMin(
  modelWeightsGB: number,
  storageBwGBs: number,
  initProtocolSec: number,
  ranks: number
): number {
  if (storageBwGBs <= 0) return 0;
  const perRankPayload = modelWeightsGB / ranks;
  const ioSec = perRankPayload / (storageBwGBs / ranks);
  const collectiveSyncSec = Math.log2(ranks) * 1.5;
  return (initProtocolSec + ioSec + collectiveSyncSec) / 60;
}

/* =============== Module 4: Cluster Scheduling & Orchestration =============== */

/** Network Hop Penalty in multi-tier Fat-Tree / Spine-Leaf topology. */
export function jobPlacementLocalityScore(nodesAllocated: { sameRack: number; sameSpine: number; interPod: number }): {
  avgHopCount: number;
  commSlowdownFactor: number;
} {
  const total = nodesAllocated.sameRack + nodesAllocated.sameSpine + nodesAllocated.interPod;
  if (total <= 0) return { avgHopCount: 0, commSlowdownFactor: 1.0 };
  const hops = (nodesAllocated.sameRack * 1 + nodesAllocated.sameSpine * 3 + nodesAllocated.interPod * 5) / total;
  const slowdown = 1.0 + (hops - 1) * 0.18;
  return { avgHopCount: hops, commSlowdownFactor: slowdown };
}

/** Straggler Synchronization Delay in synchronous distributed step. */
export function stragglerSyncPenaltyMs(baselineStepMs: number, stragglerFraction: number, stragglerSlowdownFrac: number): {
  effectiveStepMs: number;
  throughputDropFrac: number;
} {
  // If even 1 worker in synchronous gang takes (1 + slowdown) time, the whole gang stalls
  const effectiveStep = stragglerFraction > 0 ? baselineStepMs * (1 + stragglerSlowdownFrac) : baselineStepMs;
  const throughputDrop = (effectiveStep - baselineStepMs) / effectiveStep;
  return { effectiveStepMs: effectiveStep, throughputDropFrac: throughputDrop };
}

/** MIG (Multi-Instance GPU) Hardware Slice Sizing */
export function migProfileSpec(sliceType: "1g.10gb" | "2g.20gb" | "3g.40gb" | "4g.40gb" | "7g.80gb") {
  switch (sliceType) {
    case "1g.10gb": return { sms: 14, memoryGB: 10, memoryBwGBs: 420, maxInstances: 7 };
    case "2g.20gb": return { sms: 28, memoryGB: 20, memoryBwGBs: 840, maxInstances: 3 };
    case "3g.40gb": return { sms: 42, memoryGB: 40, memoryBwGBs: 1680, maxInstances: 2 };
    case "4g.40gb": return { sms: 56, memoryGB: 40, memoryBwGBs: 1680, maxInstances: 1 };
    case "7g.80gb": return { sms: 98, memoryGB: 80, memoryBwGBs: 3350, maxInstances: 1 };
  }
}

/* =============== Module 5: Reliability, Thermal & Power Grid =============== */

/** Cluster Mean Time Between Failures (MTBF) given single GPU component MTBF (hours) and fleet count. */
export function clusterMtbfHours(gpuMtbfHours: number, numGpus: number, uncorrectableRatePerDay: number): number {
  if (numGpus <= 0) return 0;
  const singleGpuFailureRatePerHour = (1 / gpuMtbfHours) + (uncorrectableRatePerDay / 24);
  const clusterFailureRatePerHour = singleGpuFailureRatePerHour * numGpus;
  return clusterFailureRatePerHour <= 0 ? 999999 : 1 / clusterFailureRatePerHour;
}

/** Liquid Cooling vs Air Cooling Thermal Envelope & PUE calculation. */
export function datacenterPowerBreakdown(itLoadKw: number, coolingType: "air" | "direct-liquid" | "immersion"): {
  coolingKw: number;
  facilityLossKw: number;
  totalPowerKw: number;
  pue: number;
} {
  let pue = 1.45;
  if (coolingType === "direct-liquid") pue = 1.15;
  if (coolingType === "immersion") pue = 1.05;

  const totalPowerKw = itLoadKw * pue;
  const overheadKw = totalPowerKw - itLoadKw;
  const coolingKw = overheadKw * 0.75;
  const facilityLossKw = overheadKw * 0.25;

  return { coolingKw, facilityLossKw, totalPowerKw, pue };
}

/** Rack Power Density & Thermal Throttling Margin */
export function rackThermalMargin(powerDrawKw: number, maxRackCoolingKw: number): {
  marginKw: number;
  isThrottlingRisk: boolean;
  tempRiseCelsius: number;
} {
  const marginKw = maxRackCoolingKw - powerDrawKw;
  const tempRiseCelsius = (powerDrawKw / Math.max(1, maxRackCoolingKw)) * 38;
  return {
    marginKw,
    isThrottlingRisk: marginKw < 0,
    tempRiseCelsius,
  };
}

/* =============== Module 6: FinOps & Capacity Economics =============== */

/** Model FLOPs Utilization (MFU) Calculation:
 *  MFU = (Observed Throughput Tokens/sec * Theoretical FLOPs/token) / (Num GPUs * Peak TFLOPs per GPU) */
export function computeMFU(
  tokensPerSec: number,
  flopsPerToken: number,
  numGpus: number,
  peakTflopsPerGpu: number
): number {
  if (numGpus <= 0 || peakTflopsPerGpu <= 0) return 0;
  const totalObservedFlops = tokensPerSec * flopsPerToken;
  const totalTheoreticalPeakFlops = numGpus * peakTflopsPerGpu * 1e12;
  return Math.min(1.0, totalObservedFlops / totalTheoreticalPeakFlops);
}

/** Total Cost of Ownership (TCO) & Cost per 1M Training Tokens */
export function trainingUnitEconomics(
  numGpus: number,
  gpuHourlyCost: number,
  tokensPerSec: number,
  totalTokensTrillions: number
): {
  clusterHourlyBurn: number;
  totalRunHours: number;
  totalRunCostDollars: number;
  costPerMillionTokens: number;
} {
  const clusterHourlyBurn = numGpus * gpuHourlyCost;
  const tokensPerHour = tokensPerSec * 3600;
  const totalTokens = totalTokensTrillions * 1e12;
  const totalRunHours = tokensPerHour > 0 ? totalTokens / tokensPerHour : 0;
  const totalRunCostDollars = totalRunHours * clusterHourlyBurn;
  const costPerMillionTokens = totalTokens > 0 ? (totalRunCostDollars / (totalTokens / 1e6)) : 0;

  return {
    clusterHourlyBurn,
    totalRunHours,
    totalRunCostDollars,
    costPerMillionTokens,
  };
}
