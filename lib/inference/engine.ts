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
