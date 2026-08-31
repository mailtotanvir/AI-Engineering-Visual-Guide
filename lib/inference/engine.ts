export interface TokVocabEntry { text: string }

const VOCAB_WORDS = [
  "the", "of", "and", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are",
  "transformer", "inference", "token", "tokens", "model", "models", "cache", "memory",
  "attention", "gpu", "prompt", "generate", "generates", "sequence", "sequences", "next",
  "predicts", "prediction", "engine", "serving", "batch", "stream", "compute", "bandwidth",
];
const VOCAB_SUBS = [
  "ing", "tion", "ers", "ed", "ly", "er", "est", "pre", "post", "un", "re", "de", "con",
  "trans", "form", "attn", "kv", "llm", "ai",
];

export const TOKEN_VOCAB = Array.from(
  new Set([...VOCAB_WORDS.map((w) => w.toLowerCase()), ...VOCAB_SUBS])
).sort();

export interface Token {
  id: number;
  text: string;
}

function hashId(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 48000 + 256;
}

export function tokenize(input: string): Token[] {
  const out: Token[] = [];
  const chunks = input.match(/\s+|[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) ?? [];
  for (const chunkRaw of chunks) {
    const chunk = chunkRaw;
    if (/^\s+$/.test(chunk)) {
      if (out.length && !out[out.length - 1].text.startsWith("▁")) {
        out.push({ id: hashId("▁"), text: "▁" });
      }
      continue;
    }
    if (/^[^A-Za-z]+$/.test(chunk)) {
      for (const ch of chunk) out.push({ id: hashId(ch), text: ch });
      continue;
    }
    let rest = chunk;
    while (rest.length) {
      const lower = rest.toLowerCase();
      const match =
        TOKEN_VOCAB.filter((v) => v.length > 1 && lower.startsWith(v)).sort((a, b) => b.length - a.length)[0] ??
        lower[0];
      out.push({ id: hashId(match), text: match });
      rest = rest.slice(match.length);
    }
  }
  return out.slice(0, 64);
}

export function mergeSteps(tokens: Token[]): Token[][] {
  return [tokens];
}

/* ---------------- KV cache ---------------- */

export interface KvConfig {
  layers: number;
  kvHeads: number;
  headDim: number;
  bytesPerElement: number;
}

export const KV_CFG_7B_FP16: KvConfig = { layers: 32, kvHeads: 32, headDim: 128, bytesPerElement: 2 };

export function kvBytesPerToken(cfg: KvConfig): number {
  return 2 * cfg.layers * cfg.kvHeads * cfg.headDim * cfg.bytesPerElement;
}

export function kvCacheBytes(cfg: KvConfig, tokens: number, batch = 1): number {
  return kvBytesPerToken(cfg) * tokens * batch;
}

export function mb(bytes: number): string {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

/* ---------------- sampling ---------------- */

export const BASE_LOGITS = [-1.4, 0.6, -0.9, 2.1, -0.2, 0.9, -1.8, 1.2];

export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export interface SampleResult {
  kept: number[];
  probs: number[];
  picked: number;
}

export function applySampling(
  logits: number[],
  opts: { temp: number; topK: number; topP: number; pickFrac: number }
): SampleResult {
  const temp = Math.max(0.01, opts.temp);
  const scaled = logits.map((l) => l / temp);
  const order = scaled.map((_, i) => i).sort((a, b) => scaled[b] - scaled[a]);
  let kept = order.slice(0, Math.max(1, Math.min(opts.topK, order.length)));
  const probsAll = softmax(scaled);
  let acc = 0;
  const nucleus: number[] = [];
  for (const idx of kept) {
    nucleus.push(idx);
    acc += probsAll[idx];
    if (acc >= opts.topP) break;
  }
  kept = nucleus;
  const raw = softmax(kept.map((i) => scaled[i]));
  const probs = raw.map((r) => r / raw.reduce((a, b) => a + b, 0));
  let c = 0;
  let picked = kept[kept.length - 1];
  for (let i = 0; i < kept.length; i++) {
    c += probs[i];
    if (c >= opts.pickFrac) { picked = kept[i]; break; }
  }
  return { kept, probs, picked };
}

/* ---------------- speculative decoding ---------------- */

export interface SpecStep {
  draftTokens: boolean[];
  accepted: number;
  bonus: boolean;
}
export const SPEC_STEPS: SpecStep[] = [
  { draftTokens: [true, true, false, true], accepted: 1, bonus: true },
  { draftTokens: [true, false, true, false], accepted: 0, bonus: true },
  { draftTokens: [true, true, true, false], accepted: 2, bonus: true },
  { draftTokens: [false, true, false, false], accepted: 0, bonus: true },
  { draftTokens: [true, false, false, true], accepted: 1, bonus: true },
];

export function specThroughput(steps: SpecStep[], draftCostFrac = 0.25): { baseline: number; spec: number } {
  const cycles = steps.length;
  const specTokens = steps.reduce((a, s) => a + s.accepted + 1, 0);
  const targetSteps = cycles;
  const draftCost = cycles * draftCostFrac * targetSteps;
  return {
    baseline: cycles,
    spec: targetSteps + draftCost,
    ...{ specTokens },
  } as { baseline: number; spec: number };
}

/* ---------------- continuous batching ---------------- */

export interface ReqJob {
  id: string;
  arrival: number;
  len: number;
}

export interface BatchLane {
  job: ReqJob;
  segs: { start: number; end: number }[];
  finishedAt: number;
  paddedCells?: number[];
}

export function scheduleBatching(
  jobs: ReqJob[],
  mode: "static" | "continuous"
): { lanes: BatchLane[]; makespan: number; wastedSlots: number } {
  const lanes: BatchLane[] = [];
  let wasted = 0;
  if (mode === "static") {
    const start = Math.max(...jobs.map((j) => j.arrival));
    const end = start + Math.max(...jobs.map((j) => j.len));
    jobs.forEach((j) => {
      const fin = start + j.len;
      const pad = Array.from({ length: end - j.len }, (_, k) => j.len + k);
      wasted += end - j.len;
      lanes.push({ job: j, segs: [{ start, end: fin }], finishedAt: fin, paddedCells: pad });
    });
    return { lanes, makespan: end, wastedSlots: wasted };
  }
  const slots: (BatchLane | null)[] = [null, null, null, null];
  const queue = [...jobs].sort((a, b) => a.arrival - b.arrival);
  const active: BatchLane[] = [];
  let now = 0;
  const events = new Set<number>([0]);
  jobs.forEach((j) => events.add(j.arrival));
  while (queue.length || active.some(Boolean)) {
    for (let s = 0; s < slots.length; s++) {
      if (!slots[s] && queue.length && queue[0].arrival <= now) {
        const j = queue.shift()!;
        const lane: BatchLane = { job: j, segs: [], finishedAt: 0 };
        slots[s] = lane;
        active.push(lane);
      }
    }
    let nextEvent = Infinity;
    active.forEach((lane) => {
      if (!lane) return;
      const lastSeg = lane.segs[lane.segs.length - 1];
      const runFrom = lastSeg && lastSeg.end === now ? now : now;
      const remaining = lane.job.len - lane.segs.reduce((a, sg) => a + sg.end - sg.start, 0);
      const slice = Math.min(remaining, 1);
      if (lastSeg && lastSeg.end === now) lastSeg.end = now + slice;
      else lane.segs.push({ start: now, end: now + slice });
      void runFrom;
      nextEvent = Math.min(nextEvent, now + slice);
      if (lane.segs.reduce((a, sg) => a + sg.end - sg.start, 0) >= lane.job.len) {
        lane.finishedAt = now + slice;
        const si = slots.indexOf(lane);
        if (si >= 0) slots[si] = null;
        events.add(now + slice);
      }
    });
    now = nextEvent === Infinity ? now + 1 : Math.max(nextEvent, now + 0.0001);
  }
  const makespan = Math.max(...lanes.map((l) => l.finishedAt));
  return { lanes, makespan, wastedSlots: 0 };
}

/* ============ Handbook extensions (M2-M8) ============ */

/* ---- M2: silicon & memory wall ---- */
export interface SiliconSpec {
  id: string; name: string; peakTflops: number; memGB: number;
  memBandwidthTBs: number; flexibility: "high" | "medium" | "specialized";
  notes: string;
}
export const SILICON_SPECS: SiliconSpec[] = [
  { id: "cpu", name: "CPU (server core count)", peakTflops: 4.6, memGB: 2048, memBandwidthTBs: 0.4, flexibility: "high",
    notes: "Latency-optimized control planes; wide caches hide irregular access." },
  { id: "gpu", name: "GPU (H100 SXM)", peakTflops: 989, memGB: 80, memBandwidthTBs: 3.35, flexibility: "medium",
    notes: "Thousands of cores + Tensor Cores; the general-purpose accelerator." },
  { id: "tpu", name: "TPU v5e", peakTflops: 394, memGB: 16, memBandwidthTBs: 1.2, flexibility: "medium",
    notes: "Systolic arrays wired for dense matrix workloads at scale." },
  { id: "lpu", name: "Groq LPU", peakTflops: 750, memGB: 230, memBandwidthTBs: 80, flexibility: "specialized",
    notes: "Deterministic compile-time scheduling; SRAM replaces HBM waits." },
  { id: "inferentia", name: "AWS Inferentia2", peakTflops: 190, memGB: 32, memBandwidthTBs: 0.8, flexibility: "specialized",
    notes: "NeuronCore v2 stack; cost-per-token play inside AWS." },
];
export function arithmeticIntensity(flops: number, bytesMoved: number): number {
  return flops / bytesMoved;
}
/** Roofline: achievable TFLOPs given hardware peak and operational intensity. */
export function rooflineTflops(peakTflops: number, bandwidthTBs: number, intensity: number): number {
  const bw = bandwidthTBs * 1e12 / 1e12; // TFLOP per second of bandwidth floor
  return Math.min(peakTflops, bw * intensity);
}
/** Decode of a 7B model in FP16: ~14 GB of weights streamed per token. */
export const DECODE_WEIGHT_BYTES_7B_FP16 = 7e9 * 2;
export function decodeTokenTimeMs(memBandwidthTBs: number, bytesPerToken = DECODE_WEIGHT_BYTES_7B_FP16): number {
  return (bytesPerToken / (memBandwidthTBs * 1e12)) * 1000;
}
export function warpOccupancy(smWarps: number, maxWarps: number): number {
  return smWarps / maxWarps;
}
export const H100_SM = { sms: 132, warpsPerSm: 64, tensorCorePerSm: 4 };
export function residentWarps(activeFraction: number): number {
  return Math.round(H100_SM.sms * H100_SM.warpsPerSm * activeFraction);
}

/* ---- M3: quantization & compilation ---- */
export const PRECISION_RUNGS = [
  { name: "FP32", bits: 32 }, { name: "BF16/FP16", bits: 16 },
  { name: "INT8", bits: 8 }, { name: "FP8", bits: 8 },
  { name: "INT4", bits: 4 }, { name: "FP4", bits: 4 },
] as const;
export function quantModelGB(paramsB: number, bits: number): number {
  return paramsB * (bits / 8);
}
export function quantSavingsGB(paramsB: number, fromBits: number, toBits: number): number {
  return quantModelGB(paramsB, fromBits) - quantModelGB(paramsB, toBits);
}
/** Scale = maxAbs / maxQuantLevel; dequantized value rounds back within the grid. */
export function quantizeSymmetric(values: number[], bits: number): {
  scale: number; quantized: number[]; dequantized: number[]; maxErr: number } {
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)));
  const levels = 2 ** (bits - 1) - 1;
  const scale = maxAbs / levels;
  const quantized = values.map((v) => Math.round(v / scale));
  const dequantized = quantized.map((q) => q * scale);
  const maxErr = Math.max(...values.map((v, i) => Math.abs(v - dequantized[i])));
  return { scale, quantized, dequantized, maxErr };
}
/** Relative error of an evenly spread set of magnitudes at a bit width. */
export function quantRelErr(bits: number): number {
  return 1 / (2 ** (bits - 1) - 1) / 2;
}
export interface FusionGroup { nodes: number; launches: number }
export function launchSavings(groups: FusionGroup[]): number {
  const before = groups.reduce((a, g) => a + g.nodes, 0);
  const after = groups.reduce((a, g) => a + g.launches, 0);
  return before - after;
}

/* ---- M4: radix prefix caching ---- */
export interface RadixNode {
  prefix: string; tokens: number; hits: number;
  children: string[];
}
export const RADIX_TREE: RadixNode[] = [
  { prefix: "/", tokens: 0, hits: 3, children: ["sys", "chat"] },
  { prefix: "/sys=claude-md", tokens: 412, hits: 918, children: ["usr-a", "usr-b"] },
  { prefix: "/sys=claude-md/usr-a", tokens: 88, hits: 402, children: [] },
  { prefix: "/sys=claude-md/usr-b", tokens: 64, hits: 351, children: [] },
  { prefix: "/chat/turn-1..7", tokens: 1580, hits: 236, children: ["turn-8"] },
  { prefix: "/chat/turn-1..8", tokens: 210, hits: 88, children: [] },
];
/** First-hit reuse: cached tokens of the longest matched prefix for a request. */
export function radixHitTokens(tree: RadixNode[], requestPrefix: string): number {
  const matches = tree.filter((n) => n.prefix !== "/" && requestPrefix.startsWith(n.prefix));
  if (!matches.length) return 0;
  return Math.max(...matches.map((n) => n.tokens));
}
export function prefixSaveMs(prefillMsPerKtok: number, cachedTokens: number): number {
  return (cachedTokens / 1000) * prefillMsPerKtok;
}
export function flashAttentionFlops(seqLen: number, dHead: number): number {
  return 4 * seqLen * seqLen * dHead;
}

/* ---- M5: grammar masking ---- */
export interface GrammarState {
  state: string;
  allowed: number[];       // token ids allowed next
  description: string;
}
export const JSON_GRAMMAR: GrammarState[] = [
  { state: "start", allowed: [11], description: "expect an object brace" },
  { state: "key", allowed: [3, 7], description: "expect a key name" },
  { state: "colon", allowed: [12], description: "expect a colon" },
  { state: "value", allowed: [5, 9], description: "expect a value" },
  { state: "end", allowed: [13], description: "expect a closing brace" },
];
/** Masked sampling: prob of each allowed token renormalized over allowed set. */
export function maskedSample(logits: number[], allowed: number[], pickFrac: number): {
  kept: number[]; probs: number[]; picked: number } {
  const kept = [...allowed].sort((a, b) => logits[b] - logits[a]);
  const raw = softmax(kept.map((i) => logits[i]));
  const s = raw.reduce((a, b) => a + b, 0);
  const probs = raw.map((r) => r / s);
  let c = 0, picked = kept[kept.length - 1];
  for (let i = 0; i < kept.length; i++) {
    c += probs[i];
    if (c >= pickFrac) { picked = kept[i]; break; }
  }
  return { kept, probs, picked };
}

/* ---- M6: chunked prefill & PD disaggregation ---- */
export interface ChunkPlan {
  chunkSizes: number[]; decodeStallMs: number; ttftMs: number;
}
/** Monolithic prefill stalls every co-batched decode for the whole prompt duration. */
export function prefillSchedule(promptTokens: number, decodeRateTps: number, chunkTokens: number, decodeCoBatched: number): ChunkPlan {
  if (chunkTokens <= 0) {
    const stall = (promptTokens / 1000) * 0; // per-ktok ms supplied below in callers
    return { chunkSizes: [promptTokens], decodeStallMs: stall, ttftMs: stall };
  }
  const chunks: number[] = [];
  let left = promptTokens;
  while (left > 0) { const c = Math.min(chunkTokens, left); chunks.push(c); left -= c; }
  return { chunkSizes: chunks, decodeStallMs: 0, ttftMs: chunks.length * (chunkTokens / 1000) * 1000 / 1000 };
}
/** Stall comparison in ms, using per-1000-token prefill cost. */
export function decodeStallMs(promptTokens: number, prefillMsPerKtok: number, chunkTokens: number | null): number {
  if (chunkTokens === null) return (promptTokens / 1000) * prefillMsPerKtok;
  const n = Math.ceil(promptTokens / chunkTokens);
  return n * (chunkTokens / 1000) * prefillMsPerKtok; // same total prefill work, spread across steps
}
export function kvTransferTimeMs(kvBytes: number, linkGBs: number): number {
  return (kvBytes / (linkGBs * 1e9)) * 1000;
}

/* ---- M7: parallelism & MoE ---- */
export const TP_RANKS = 4;
export function tpMemoryPerGPU(totalGB: number, ranks: number): number {
  return totalGB / ranks;
}
export function tpBubblePerLayer(layerMs: number, commMs: number): number {
  return commMs / (layerMs + commMs);
}
export interface PipeStage { layers: number; computeMs: number }
export function pipelineBubble(stages: number, microbatches: number, stageMs: number): number {
  return (stages - 1) * stageMs;
}
export const MOE_CFG = { experts: 64, activeExperts: 2, totalParamsB: 382, sharedParamsB: 6 };
export function moeActiveParamsB(cfg = MOE_CFG): number {
  const expertParamsB = (cfg.totalParamsB - cfg.sharedParamsB) / cfg.experts;
  return cfg.sharedParamsB + expertParamsB * cfg.activeExperts;
}
export function moeSparsity(cfg = MOE_CFG): number {
  return 1 - moeActiveParamsB(cfg) / cfg.totalParamsB;
}
export function expertLoadBalance(routedCounts: number[], capacity: number): { maxCap: number; dropped: number } {
  const maxLoad = Math.max(...routedCounts);
  return { maxCap: maxLoad / capacity, dropped: routedCounts.reduce((a, c) => a + Math.max(0, c - capacity), 0) };
}

/* ---- M8: cold start & FinOps ---- */
export interface ColdStartPlan {
  imagePullS: number; modelLoadS: number; kvWarmS: number;
}
export function coldStartMs(plan: ColdStartPlan): number {
  return (plan.imagePullS + plan.modelLoadS + plan.kvWarmS) * 1000;
}
export const MIG_PROFILES = [
  { name: "1g.10gb", gpus: 1 / 7, memGB: 10 },
  { name: "2g.20gb", gpus: 2 / 7, memGB: 20 },
  { name: "3g.40gb", gpus: 3 / 7, memGB: 40 },
  { name: "7g.80gb", gpus: 1, memGB: 80 },
];
/** Cost per million tokens given throughput and hourly cost. */
export function costPerMTokens(tokPerSec: number, hourlyCostUsd: number): number {
  return (hourlyCostUsd / (tokPerSec * 3600)) * 1e6;
}
/** Spot mix: expected monthly cost and interruption-bounded savings. */
export function spotMixUsd(onDemandUsd: number, spotFrac: number, spotDiscount = 0.65, retryLoss = 0.08): number {
  const spotCost = onDemandUsd * spotFrac * (1 - spotDiscount) * (1 + retryLoss);
  return onDemandUsd * (1 - spotFrac) + spotCost;
}
export function migSlicesUtilized(profileName: string, workloads: number): number {
  const p = MIG_PROFILES.find((m) => m.name === profileName);
  if (!p) return 0;
  return Math.min(1 / p.gpus, workloads) * p.gpus;
}
