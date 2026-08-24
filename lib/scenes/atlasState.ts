export const BANKS = 32;
export const BANK_LANES = 32;

export interface BankState {
  addresses: number[];
  bankOf: number[];
  conflictsPerBank: number[];
  maxConflicts: number;
  cycles: number;
  laneOrder: number[];
  done: boolean;
  cyclesDone: number;
  distinctBanks: number;
}

export function computeBankState(stride: number, tIn: number): BankState {
  const s = Math.min(8, Math.max(1, Math.round(stride)));
  const t = Math.min(1, Math.max(0, tIn));
  const addresses = Array.from({ length: BANK_LANES }, (_, i) => (i * s) % BANKS);
  const bankOf = addresses.map((a) => a % BANKS);
  const conflictsPerBank = new Array(BANKS).fill(0);
  bankOf.forEach((b) => conflictsPerBank[b]++);
  const maxConflicts = Math.max(...conflictsPerBank);
  const distinctBanks = conflictsPerBank.filter((c) => c > 0).length;
  const cycles = Math.ceil(BANK_LANES / Math.max(1, distinctBanks));
  const p = seg(t, 0.08, 0.92);
  const accessesDone = Math.min(BANK_LANES, Math.floor(p * BANK_LANES));
  const cyclesDone = Math.min(cycles, Math.floor((accessesDone / BANK_LANES) * cycles));
  return {
    addresses,
    bankOf,
    conflictsPerBank,
    maxConflicts,
    cycles,
    laneOrder: Array.from({ length: accessesDone }, (_, i) => i),
    done: accessesDone >= BANK_LANES,
    cyclesDone,
    distinctBanks,
  };
}

function seg(v: number, a: number, b: number) { return Math.min(1, Math.max(0, (v - a) / (b - a))); }

export interface OccupancyModel {
  warpsPerBlock: number;
  blocksResident: number;
  residentWarps: number;
  occupancy: number;
  limit: "registers" | "warp-slots" | "block-cap";
}

const MAX_WARP_SLOTS = 64;
const REGS_PER_SM = 65536;
const MAX_THREADS_PER_BLOCK = 1024;

export function occupancyModel(regsPerThread: number, threadsPerBlock: number): OccupancyModel {
  const regs = Math.min(255, Math.max(8, Math.round(regsPerThread)));
  const tpb = Math.min(MAX_THREADS_PER_BLOCK, Math.max(32, Math.round(threadsPerBlock / 32) * 32));
  const warpsPerBlock = Math.ceil(tpb / 32);
  const byRegs = Math.floor(REGS_PER_SM / (regs * tpb));
  const byWarps = Math.floor(MAX_WARP_SLOTS / warpsPerBlock);
  const byCap = Math.floor(MAX_THREADS_PER_BLOCK / tpb);
  const blocksResident = Math.max(1, Math.min(byRegs, byWarps, byCap));
  const residentWarps = blocksResident * warpsPerBlock;
  const occupancy = residentWarps / MAX_WARP_SLOTS;
  const limit: OccupancyModel["limit"] =
    byRegs <= byWarps && byRegs <= byCap ? "registers" : byWarps <= byCap ? "warp-slots" : "block-cap";
  return { warpsPerBlock, blocksResident, residentWarps, occupancy, limit };
}

export interface TilingTraffic {
  naiveLoads: number;
  tiledLoads: number;
  ratio: number;
}

export function tilingTraffic(gridTiles = 4, kTiles = 4, tileElems = 256): TilingTraffic {
  const outputs = gridTiles * gridTiles;
  const naiveLoads = outputs * kTiles * tileElems;
  const tiledLoads = gridTiles * kTiles * tileElems + outputs * tileElems;
  return { naiveLoads, tiledLoads, ratio: naiveLoads / tiledLoads };
}

export interface GanttBar {
  lane: string;
  label: string;
  start: number;
  end: number;
  kind: "copy" | "compute";
}

export function streamSchedule(mode: "serial" | "streams", chunks = 2): { bars: GanttBar[]; makespan: number } {
  const unit = 1 / (mode === "serial" ? chunks * 3 : chunks * 2 + (chunks - 1));
  const bars: GanttBar[] = [];
  if (mode === "serial") {
    for (let c = 0; c < chunks; c++) {
      bars.push({ lane: "H2D", label: `A${c} →`, start: (c * 3) * unit, end: (c * 3 + 1) * unit, kind: "copy" });
      bars.push({ lane: "SM", label: `K${c}`, start: (c * 3 + 1) * unit, end: (c * 3 + 2) * unit, kind: "compute" });
      bars.push({ lane: "D2H", label: `← C${c}`, start: (c * 3 + 2) * unit, end: (c * 3 + 3) * unit, kind: "copy" });
    }
    return { bars, makespan: 1 };
  }
  let cursor = 0;
  for (let c = 0; c < chunks; c++) {
    const copyStart = Math.max(cursor, (c * 2) * unit);
    bars.push({ lane: `S${c} H2D`, label: `A${c} →`, start: copyStart, end: copyStart + unit, kind: "copy" });
    const kStart = copyStart + unit;
    bars.push({ lane: `S${c} K`, label: `K${c}`, start: kStart, end: kStart + unit, kind: "compute" });
    cursor = copyStart + unit;
    if (c > 0) cursor = Math.min(cursor, kStart);
  }
  const makespan = Math.max(...bars.map((b) => b.end));
  return { bars, makespan };
}

export function graphSavings(kernels = 6, work = 0.14): { serialBars: GanttBar[]; graphBars: GanttBar[]; savedPct: number } {
  const overhead = 0.08;
  const serialBars: GanttBar[] = [];
  let cur = 0;
  for (let i = 0; i < kernels; i++) {
    serialBars.push({ lane: "LAUNCH", label: `L${i}`, start: cur, end: cur + overhead, kind: "copy" });
    cur += overhead;
    serialBars.push({ lane: "EXEC", label: `K${i}`, start: cur, end: cur + work, kind: "compute" });
    cur += work;
  }
  const graphBars: GanttBar[] = [{ lane: "GRAPH", label: `${kernels} nodes · one replay`, start: overhead * 2, end: overhead * 2 + kernels * work, kind: "compute" }];
  graphBars.push({ lane: "CAPTURE", label: "capture once", start: 0, end: overhead * 2, kind: "copy" });
  return { serialBars, graphBars, savedPct: Math.round((1 - (overhead * 2 + kernels * work) / cur) * 100) };
}

export type NvccStageKind = "source" | "host" | "device" | "ptx" | "sass" | "link";

export interface NvccStage {
  id: string;
  label: string;
  file: string;
  kind: NvccStageKind;
  note: string;
}

export const NVCC_STAGES: NvccStage[] = [
  { id: "cu", label: "SOURCE", file: "vector_add.cu", kind: "source", note: "One file, two worlds: host C++ plus __global__ device code." },
  { id: "split", label: "SPLIT COMPILATION", file: "cudafe++", kind: "device", note: "nvcc separates host code from device code before compiling either." },
  { id: "host", label: "HOST C++", file: "vector_add.cpp.o", kind: "host", note: "Host half compiles with your system compiler into a plain object file." },
  { id: "ptx", label: "VIRTUAL ISA", file: "vector_add.ptx", kind: "ptx", note: "PTX is portable assembly — it ships inside the binary and JITs forward to future GPUs." },
  { id: "sass", label: "MACHINE CODE", file: "sm_89.cubin", kind: "sass", note: "SASS is the real instructions for one compute capability, baked at build time." },
  { id: "fatbin", label: "FATBINARY LINK", file: "vector_add", kind: "link", note: "Host object + PTX + SASS are glued into one executable that runs everywhere." },
];

export interface AtomicRaceState {
  t: number;
  unsafeValue: number;
  safeValue: number;
  lostUpdates: number;
  sparks: number[];
  done: boolean;
}

export function computeAtomicRace(tIn: number, workers = 8, incsEach = 12): AtomicRaceState {
  const t = Math.min(1, Math.max(0, tIn));
  const total = workers * incsEach;
  const p = seg(t, 0.05, 0.95);
  const safeValue = Math.round(p * total);
  const unsafeValue = Math.round(p * total * 0.62);
  const lostUpdates = safeValue - unsafeValue;
  const sparks: number[] = [];
  for (let i = 0; i < workers; i++) sparks.push(Math.round(p * incsEach));
  return { t, unsafeValue, safeValue, lostUpdates, sparks, done: t >= 0.95 };
}
