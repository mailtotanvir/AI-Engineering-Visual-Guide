export type AccessPattern = "coalesced" | "strided";
export const ACCESS_LANES = 8;
export const MEMORY_ROW = 24;

export interface MemoryTier {
  key: string;
  label: string;
  distance: string;
  body: string;
}

export const TIERS: MemoryTier[] = [
  { key: "registers", label: "REGISTERS", distance: "IN REACH", body: "Private to one thread. Fastest by miles — and scarcest." },
  { key: "shared", label: "SHARED MEMORY", distance: "SAME ROOM", body: "On-chip, shared inside one block. Near-fast; sized in kilobytes." },
  { key: "global", label: "GLOBAL MEMORY", distance: "ACROSS TOWN", body: "Huge device DRAM. Wide but slow — the trip dominates the work." },
];

export interface AccessState {
  pattern: AccessPattern;
  addresses: number[];
  transactions: number;
  clusters: number[][];
  laneProgress: number[];
  cellGlow: number[];
  done: boolean;
}

export function addressesFor(pattern: AccessPattern): number[] {
  const a: number[] = [];
  for (let i = 0; i < ACCESS_LANES; i++) a.push(pattern === "coalesced" ? i : (i * 3) % MEMORY_ROW);
  return a;
}

function clusterAddresses(addrs: number[]): number[][] {
  const sorted = Array.from(new Set(addrs)).sort((x, y) => x - y);
  const clusters: number[][] = [];
  let cur: number[] = [];
  sorted.forEach((addr, i) => {
    if (i === 0 || addr === sorted[i - 1] + 1) cur.push(addr);
    else { clusters.push(cur); cur = [addr]; }
  });
  if (cur.length) clusters.push(cur);
  return clusters;
}

export function computeAccessState(pattern: AccessPattern, tIn: number): AccessState {
  const t = Math.min(1, Math.max(0, tIn));
  const addresses = addressesFor(pattern);
  const clusters = clusterAddresses(addresses);
  const transactions = clusters.length;

  const windowStart = pattern === "coalesced" ? 0.08 : 0.2;
  const span = pattern === "coalesced" ? 0.34 : 0.68;
  const p = seg(t, windowStart, windowStart + span);
  const doneClusters = Math.min(transactions, Math.floor(p * transactions));

  const laneProgress = addresses.map(() => 0);
  const cellGlow: number[] = new Array(MEMORY_ROW).fill(0);
  for (let ci = 0; ci < doneClusters; ci++) {
    for (const addr of clusters[ci]) {
      cellGlow[addr] = 1;
      addresses.forEach((a, li) => { if (a === addr) laneProgress[li] = 1; });
    }
  }
  return { pattern, addresses, transactions, clusters, laneProgress, cellGlow, done: p >= 1 };
}

function seg(v: number, a: number, b: number) {
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}

export const ACCESS_WINDOWS: Record<AccessPattern, { start: number; span: number }> = {
  coalesced: { start: 0.08, span: 0.34 },
  strided: { start: 0.2, span: 0.68 },
};

export function accessClusters(pattern: AccessPattern): number[][] {
  return clusterAddresses(addressesFor(pattern));
}
