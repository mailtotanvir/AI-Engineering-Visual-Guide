/* The eight-module post-training & alignment journey — 24 scenes (3 per module).
   Mirrors the structured curriculum from Part 1 through Part 8. */

export interface PostJourneyEntry {
  id: string;
  num: string;
  module: number;
  kicker: string;
  title: string;
  blurb: string;
}

export interface PostModule {
  id: number;
  name: string;
  tagline: string;
}

export const POST_MODULES: PostModule[] = [
  { id: 1, name: "SFT Foundations", tagline: "From raw base model to instruction follower: the SFT pipeline, loss masking, and the LoRA memory trade." },
  { id: 2, name: "Data Engineering & Synthetic Data", tagline: "Curation heuristics, embedding clustering, synthetic generation loops, and the rejection gate." },
  { id: 3, name: "SFT Deep Dive", tagline: "Low-rank adaptation math, QLoRA memory layouts, catastrophic forgetting, and domain adaptation." },
  { id: 4, name: "Preference & Alignment", tagline: "Bradley-Terry, RLHF with PPO, the DPO revolution, and the KTO / IPO / SimPO frontier." },
  { id: 5, name: "Reasoning & Verifiable Rewards", tagline: "RLVR, GRPO without a critic, chain-of-thought elicitation, and pass@k gains on math and code." },
  { id: 6, name: "Safety & Constitutional AI", tagline: "Red-teaming loops, refusal calibration, RLAIF critics, and the safety/helpfulness frontier." },
  { id: 7, name: "Evaluation & Benchmarking", tagline: "Contamination guardrails, LLM-as-a-judge biases, and honest model reporting." },
  { id: 8, name: "Advanced Capabilities & Deployment", tagline: "Multimodal alignment, agentic tool use, post-training quantization, and deployment prep." },
];

export const POST_JOURNEY: PostJourneyEntry[] = [
  /* -------- Module 1: SFT Foundations -------- */
  { id: "sft-basics", num: "01", module: 1, kicker: "SFT", title: "Supervised Fine-Tuning Fundamentals", blurb: "From base model to instruction-follower: the SFT pipeline that reshapes next-token distribution into assistant behavior." },
  { id: "sft-targets", num: "02", module: 1, kicker: "Loss", title: "SFT Loss: Prompt Masking & Completion Targets", blurb: "Cross-entropy scored only over completion positions — why prompt masking matters and what it does to effective epochs." },
  { id: "peft-lora", num: "03", module: 1, kicker: "PEFT", title: "LoRA & QLoRA: Math and Memory Layouts", blurb: "Rank-r adapters, trainable-parameter share, and the 4-bit base + bf16 LoRA memory bill vs. a full fine-tune." },

  /* -------- Module 2: Data Engineering & Synthetic -------- */
  { id: "data-filter", num: "04", module: 2, kicker: "Curation", title: "Data Curation & Quality Filtering", blurb: "Heuristic filters, language ID, and taxonomy design for instruction, multi-turn, and safety data trees." },
  { id: "clustering", num: "05", module: 2, kicker: "Diversity", title: "Embedding Clustering & Deduplication", blurb: "MinHash dedup and embedding-space clustering that keeps topic coverage balanced across the post-training corpus." },
  { id: "synthetic-self", num: "06", module: 2, kicker: "SDG", title: "Self-Instruct, Evol-Instruct & Rejection Sampling", blurb: "Synthetic data generation loops, model-collapse risk, and the quality gate that rejects low-fidelity generations." },

  /* -------- Module 3: SFT Deep Dive -------- */
  { id: "lora-math", num: "07", module: 3, kicker: "LoRA", title: "LoRA: Why Low-Rank Adaptation Works", blurb: "The ΔW = BA decomposition, target-module selection, and parameter-count math for rank and target fraction." },
  { id: "qlora-memory", num: "08", module: 3, kicker: "QLoRA", title: "QLoRA Memory: 4-bit Base, Full-Pipeline Bills", blurb: "NF4 quantization constants, PagedAdamW, and the VRAM ledger that fits a 7B tune on a single consumer GPU." },
  { id: "forgetting", num: "09", module: 3, kicker: "CPT", title: "Catastrophic Forgetting & Domain Adaptation", blurb: "Rehearsal buffers, distillation bridges, and the retention math that keeps general capability while specializing." },

  /* -------- Module 4: Preference & Alignment -------- */
  { id: "bradley-terry", num: "10", module: 4, kicker: "BT", title: "The Bradley-Terry Preference Model", blurb: "P(y_w ≻ y_l) = σ(r_w − r_l): the probability model underpinning RLHF and every preference-optimization method." },
  { id: "rlhf-ppo", num: "11", module: 4, kicker: "RLHF", title: "RLHF: Reward Models & PPO with KL Anchors", blurb: "Training a reward model from pairs, then PPO's clipped objective, GAE, and the KL penalty tethering π to π_ref." },
  { id: "dpo-family", num: "12", module: 4, kicker: "DPO", title: "DPO and Its Heirs: KTO, IPO, SimPO", blurb: "Eliminating the reward model, the implicit-reward insight, and the variant family that followed." },

  /* -------- Module 5: Reasoning & Verifiable Rewards -------- */
  { id: "rlvr-math", num: "13", module: 5, kicker: "RLVR", title: "RLVR: Rewards You Can Verify", blurb: "Math checkers, compilers, and unit tests as deterministic reward oracles — no human labels in the loop." },
  { id: "grpo-elim", num: "14", module: 5, kicker: "GRPO", title: "GRPO: Group-Relative Advantages, No Critic", blurb: "Sampling a group, normalizing rewards within it, and deleting the value network from the memory bill." },
  { id: "cot-gains", num: "15", module: 5, kicker: "CoT", title: "Chain-of-Thought & Test-Time Compute", blurb: "System 1 vs. System 2, self-consistency majority voting, and pass@k scaling on MATH and HumanEval." },

  /* -------- Module 6: Safety & Constitutional AI -------- */
  { id: "redteam", num: "16", module: 6, kicker: "Red-Team", title: "Red-Teaming & Jailbreak Decay", blurb: "Automated adversarial loops that attack the model, and the exponential decay of jailbreak success per round." },
  { id: "refusal-train", num: "17", module: 6, kicker: "Refusal", title: "Refusal Calibration & the Over-Refusal Trap", blurb: "Training refusals without breaking helpfulness: the quadratic cost of over-refusal on the frontier curve." },
  { id: "rlaif-constit", num: "18", module: 6, kicker: "CAI", title: "Constitutional AI & AI Critics (RLAIF)", blurb: "Self-critique, revision loops, and judge agreement with human panels as the violation rate decays." },

  /* -------- Module 7: Evaluation & Benchmarking -------- */
  { id: "benchmark-contam", num: "19", module: 7, kicker: "Contam", title: "Benchmark Contamination & Guardrails", blurb: "Seen vs. unseen accuracy uplift as the contamination tell, and the guardrails that keep evals honest." },
  { id: "llm-judge-bias", num: "20", module: 7, kicker: "Judge", title: "LLM-as-a-Judge: Bias Audit", blurb: "Positional flips, length bias, and judge Elo deltas — measuring and mitigating the referee's own errors." },
  { id: "eval-uncertainty", num: "21", module: 7, kicker: "Stats", title: "Reporting Uncertainty: CIs & Elo", blurb: "Confidence-interval half-widths, win-rate to Elo conversion, and why single-point leaderboard scores mislead." },

  /* -------- Module 8: Advanced Capabilities & Deployment -------- */
  { id: "mm-agentic", num: "22", module: 8, kicker: "Agents", title: "Multimodal & Agentic Alignment", blurb: "Interleaved image/audio token mix and the composite tool-call success rate of syntax plus argument fidelity." },
  { id: "quant-gptq", num: "23", module: 8, kicker: "Quant", title: "Post-Training Quantization: GPTQ, AWQ, FP8", blurb: "r-bit grouped weight error, quality retained, and the VRAM you actually need at bits-per-weight." },
  { id: "infer-opt", num: "24", module: 8, kicker: "Ship", title: "Deployment: Distillation & Serving Prep", blurb: "Teacher-student KL distillation, FP8 calibration curves, and the pipeline from checkpoint to serving." },
];

/* ---- Module index helpers ---- */

export function postIndex(id: string): number {
  return POST_JOURNEY.findIndex((j) => j.id === id);
}

export function postNeighbors(id: string): { prev: PostJourneyEntry | null; next: PostJourneyEntry | null } {
  const i = postIndex(id);
  return {
    prev: i > 0 ? POST_JOURNEY[i - 1] : null,
    next: i >= 0 && i < POST_JOURNEY.length - 1 ? POST_JOURNEY[i + 1] : null,
  };
}

export function postModuleOf(id: string): PostModule | null {
  const e = POST_JOURNEY.find((j) => j.id === id);
  return e ? POST_MODULES.find((m) => m.id === e.module) ?? null : null;
}

export function postModuleJourney(moduleId: number): PostJourneyEntry[] {
  return POST_JOURNEY.filter((j) => j.module === moduleId);
}
