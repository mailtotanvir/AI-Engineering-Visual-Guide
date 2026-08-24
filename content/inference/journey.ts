export interface InfJourneyEntry {
  id: string;
  num: string;
  kicker: string;
  title: string;
  blurb: string;
}

export const INF_JOURNEY: InfJourneyEntry[] = [
  { id: "decode-loop", num: "01", kicker: "FOUNDATIONS", title: "One token at a time",
    blurb: "An LLM never writes a sentence — it predicts the next token, then does it again." },
  { id: "prefill-decode", num: "02", kicker: "TWO PHASES", title: "Prefill reads. Decode writes.",
    blurb: "Your prompt is ingested in parallel; generation streams one token per step." },
  { id: "latency-timeline", num: "03", kicker: "METRICS & SLOs", title: "TTFT, TPOT and goodput",
    blurb: "The three numbers every inference SLO is made of." },
  { id: "kv-cache", num: "04", kicker: "THE KV ECONOMY", title: "Half a megabyte per token",
    blurb: "Attention remembers its past in the KV cache — memory becomes the budget." },
  { id: "paged-kv", num: "05", kicker: "PAGED ATTENTION", title: "End the fragmentation tax",
    blurb: "Reserve exact blocks on demand instead of worst-case contiguous slabs." },
  { id: "continuous-batching", num: "06", kicker: "BATCHING", title: "Never leave a slot empty",
    blurb: "A request finishes? Swap the next one in mid-generation." },
  { id: "sampling", num: "07", kicker: "DECODING STRATEGIES", title: "Shape the distribution",
    blurb: "Temperature, top-k and top-p sculpt probabilities before the dice roll." },
  { id: "speculative", num: "08", kicker: "SPECULATIVE DECODING", title: "Draft cheaply, verify once",
    blurb: "A small model guesses several tokens; the big model checks them in one pass." },
];

export function infIndex(id: string): number {
  return INF_JOURNEY.findIndex((j) => j.id === id);
}
export function infNeighbors(id: string) {
  const i = infIndex(id);
  return {
    prev: i > 0 ? INF_JOURNEY[i - 1] : null,
    next: i >= 0 && i < INF_JOURNEY.length - 1 ? INF_JOURNEY[i + 1] : null,
  };
}
