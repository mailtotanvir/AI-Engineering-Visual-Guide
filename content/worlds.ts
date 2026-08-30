export interface World {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  blurb: string;
  accent: string;
  status: "live" | "planned";
  href?: string;
  scenes?: number;
  entries?: number;
  /** The physical story this world tells in the observatory. */
  flow: readonly string[];
  /** One concise editorial idea shown when the world is in focus. */
  thesis: string;
}

export const WORLDS: World[] = [
  {
    id: "cuda",
    name: "CUDA Engineering",
    shortName: "CUDA",
    tagline: "How a kernel runs",
    blurb: "Launch, threads, warps, memory geography, tooling — the machine under the code.",
    accent: "var(--teal)",
    status: "live",
    href: "/cuda/",
    scenes: 10,
    entries: 24,
    flow: ["THREADS", "BLOCKS", "SMs", "MEMORY"],
    thesis: "A million tiny workers become one visible machine.",
  },
  {
    id: "inference",
    name: "Inference Engineering",
    shortName: "Inference",
    tagline: "How tokens are served",
    blurb: "Prefill vs decode, the KV economy, batching, sampling, speculation.",
    accent: "var(--iris)",
    status: "live",
    href: "/inference/",
    scenes: 8,
    entries: 17,
    flow: ["PROMPT", "PREFILL", "KV", "DECODE"],
    thesis: "Follow one request as memory turns into language.",
  },
  {
    id: "training-scale",
    name: "Training at Scale",
    shortName: "Training",
    tagline: "Pre-training · distributed compute",
    blurb: "Objectives, data curation, scaling laws, 3D parallelism, precision numerics, and run diagnostics.",
    accent: "var(--gold)",
    status: "live",
    href: "/training/",
    scenes: 21,
    entries: 28,
    flow: ["DATA", "BATCHES", "GRADIENTS", "WEIGHTS"],
    thesis: "Watch information become a change in the model.",
  },
  {
    id: "post-training",
    name: "Post-Training & Distillation",
    shortName: "Post-Training",
    tagline: "SFT · RLHF · DPO · distillation",
    blurb: "From base weights to assistant: instruction tuning, preference optimization, logit matching, data synthesis.",
    accent: "var(--cyan)",
    status: "planned",
    flow: ["TRACES", "PREFERENCES", "SIGNAL", "BEHAVIOR"],
    thesis: "See raw capability shaped into useful behavior.",
  },
  {
    id: "evals",
    name: "Evaluation",
    shortName: "Evals",
    tagline: "Measuring what matters",
    blurb: "Benchmark design, contamination, LLM-as-judge, regression gates, capability tracking.",
    accent: "var(--rose)",
    status: "planned",
    flow: ["INPUT", "MODEL", "JUDGE", "REGRESSION"],
    thesis: "Turn model behavior into evidence you can trust.",
  },
  {
    id: "ai-runtime",
    name: "AI Runtime",
    shortName: "AI Runtime",
    tagline: "Agents · harnesses · RAG",
    blurb: "Agentic loops, harness engineering, retrieval pipelines, tool use, memory systems.",
    accent: "#7FE3FF",
    status: "planned",
    flow: ["REQUEST", "PLAN", "TOOL", "STATE"],
    thesis: "Step inside the loop between intention and action.",
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    shortName: "Infra",
    tagline: "Clusters · cost · reliability",
    blurb: "Interconnects, schedulers, failure domains, capacity planning, cost per million tokens.",
    accent: "#FF9E7A",
    status: "planned",
    flow: ["TRAFFIC", "SCHEDULER", "GPUs", "STORAGE"],
    thesis: "Trace demand through the systems that keep it alive.",
  },
  {
    id: "safety-alignment",
    name: "Safety & Alignment",
    shortName: "Safety",
    tagline: "Guardrails by construction",
    blurb: "Refusals, red-teaming, jailbreak surfaces, monitoring for drift and misuse.",
    accent: "var(--lime)",
    status: "planned",
    flow: ["PROMPT", "POLICY", "DECISION", "MONITOR"],
    thesis: "Inspect the boundaries that make capability dependable.",
  },
];

export function worldById(id: string): World | undefined {
  return WORLDS.find((w) => w.id === id);
}
