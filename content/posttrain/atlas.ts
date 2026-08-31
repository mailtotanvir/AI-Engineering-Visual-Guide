export interface PostDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const POST_DOMAINS: PostDomain[] = [
  { id: "foundations", num: "01", name: "SFT Foundations", blurb: "Base model vs instruct model, prompt masking, and the LoRA / QLoRA memory trade." },
  { id: "data-eng", num: "02", name: "Data Engineering & Synthetic", blurb: "Curation heuristics, MinHash dedup, embedding clusters, and synthetic generation loops." },
  { id: "deepdive", num: "03", name: "SFT Deep Dive", blurb: "Low-rank adaptation math, QLoRA layouts, catastrophic forgetting, domain adaptation." },
  { id: "preference", num: "04", name: "Preference & Alignment", blurb: "Bradley-Terry, RLHF + PPO, DPO, and the IPO / KTO / SimPO variant family." },
  { id: "reasoning", num: "05", name: "Reasoning & Verifiable Rewards", blurb: "RLVR oracles, GRPO without a critic, chain-of-thought, and pass@k scaling." },
  { id: "safety", num: "06", name: "Safety & Constitutional AI", blurb: "Red-team loops, refusal calibration, RLAIF critics, and the helpfulness frontier." },
  { id: "evals", num: "07", name: "Evaluation & Benchmarking", blurb: "Contamination guardrails, judge bias audits, and uncertainty-aware reporting." },
  { id: "deploy", num: "08", name: "Advanced Capabilities & Deployment", blurb: "Multimodal and agentic alignment, GPTQ / AWQ / FP8, distillation, serving prep." },
];

export interface PostTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const POST_TOPICS: PostTopic[] = [
  /* Domain 1: SFT Foundations */
  { id: "t-sft-basics", domain: "foundations", title: "Base → Assistant Pipeline", kind: "scene", scene: "sft-basics",
    summary: "How a tiny, high-signal dataset steers a huge, low-signal substrate.",
    points: [
      "Pre-training tokens outnumber post-training tokens ~10,000:1.",
      "SFT teaches format, turn-taking, and instruction following — not world knowledge.",
      "Distribution alignment moves the mode from 'plausible text' to 'assistant response'." ] },
  { id: "t-sft-targets", domain: "foundations", title: "Prompt Masking", kind: "scene", scene: "sft-targets",
    summary: "Loss scored only on completion positions.",
    points: [
      "labels = [-100] × prompt_len + completions.",
      "Masking doubles effective training efficiency on long-prompt data.",
      "Watch the valid−train loss gap for the SFT overfit signature." ] },
  { id: "t-peft-lora", domain: "foundations", title: "LoRA / QLoRA Ledger", kind: "scene", scene: "peft-lora",
    summary: "Rank-r adapters and a 4-bit base: the single-GPU fine-tune.",
    points: [
      "ΔW = B·A with A Gaussian-init, B zero-init.",
      "QLoRA: NF4 base + bf16 adapters + paged optimizers.",
      "7B QLoRA ≈ 6 GB vs full fine-tune ≈ 112 GB." ] },
  { id: "c-signal-types", domain: "foundations", title: "Signal Taxonomy", kind: "concept",
    summary: "SFT demonstrations, preference pairs, verifiable rewards, AI feedback.",
    points: [
      "Demonstrations: 'be like this'. Pairs: 'this beats that'. Verifiers: 'this is correct'.",
      "Signal cost and noise vary by orders of magnitude across the four families.",
      "Modern pipelines stack all four in sequence." ] },

  /* Domain 2: Data Engineering & Synthetic */
  { id: "t-data-filter", domain: "data-eng", title: "Curation & Taxonomy", kind: "scene", scene: "data-filter",
    summary: "Cheap heuristics plus a designed capability tree.",
    points: [
      "Symbol ratios, language ID, repetition filters remove most junk cheaply.",
      "Budget counts per taxonomy leaf, not globally.",
      "~1,000 excellent examples can beat 50k mediocre ones." ] },
  { id: "t-clustering", domain: "data-eng", title: "Dedup & Diversity", kind: "scene", scene: "clustering",
    summary: "MinHash-LSH dedup and embedding-cluster coverage audits.",
    points: [
      "LSH buckets near-duplicates without all-pairs comparison.",
      "One cluster holding 40% of prompts is a diversity bug.",
      "Rebalance: downsample bloat, synthesize for empty leaves." ] },
  { id: "t-synthetic-self", domain: "data-eng", title: "Self-Instruct → Rejection Gate", kind: "scene", scene: "synthetic-self",
    summary: "Bootstrap data from the model, then fight collapse.",
    points: [
      "Evol-Instruct escalates prompt difficulty per generation.",
      "Mix 10–30% real data into every synthetic round.",
      "Track output entropy as the collapse detector." ] },
  { id: "c-lima-lesson", domain: "data-eng", title: "The LIMA Lesson", kind: "concept",
    summary: "Quality beats quantity at the 1k-example scale.",
    points: [
      "1,000 curated responses were enough for strong instruction following.",
      "Curation labor compounds: every example has outsized influence.",
      "Deduplication is the cheapest quality win in the pipeline." ] },

  /* Domain 3: SFT Deep Dive */
  { id: "t-lora-math", domain: "deepdive", title: "Low-Rank Math", kind: "scene", scene: "lora-math",
    summary: "ΔW = B·A: why 0.4% of parameters are enough.",
    points: [
      "Fine-tune updates are empirically low-rank.",
      "α/r scaling: changing rank silently changes effective LR.",
      "Target attention + MLP projections for quality." ] },
  { id: "t-qlora-memory", domain: "deepdive", title: "QLoRA Layout", kind: "scene", scene: "qlora-memory",
    summary: "NF4, double quantization, paged AdamW — byte accounting.",
    points: [
      "NormalFloat4 matches trained weight distributions better than int4.",
      "Paged optimizers spill moments to CPU on spikes.",
      "Merge adapters into a bf16 copy for deployment." ] },
  { id: "t-forgetting", domain: "deepdive", title: "Forgetting & Retention", kind: "scene", scene: "forgetting",
    summary: "Replay buffers and distillation bridges.",
    points: [
      "CPT moves knowledge far; SFT moves behavior gently.",
      "10–30% general-domain replay bounds capability loss.",
      "Measure retention with a frozen general eval suite." ] },
  { id: "c-cpt-vs-sft", domain: "deepdive", title: "CPT vs SFT", kind: "concept",
    summary: "Choosing the injection mechanism by depth of change needed.",
    points: [
      "New domain knowledge: CPT with replay, then SFT for style.",
      "New behavior only: straight to SFT.",
      "Both: CPT → SFT is the production sequence." ] },

  /* Domain 4: Preference & Alignment */
  { id: "t-bradley-terry", domain: "preference", title: "Bradley-Terry Model", kind: "scene", scene: "bradley-terry",
    summary: "P(y_w ≻ y_l) = σ(r_w − r_l) as the alignment substrate.",
    points: [
      "Pairwise choice is far more reliable than absolute scoring.",
      "Held-out RM accuracy (~70%) is the noise ceiling for all downstream RLHF.",
      "Annotator disagreement is an uncertainty signal, not garbage." ] },
  { id: "t-rlhf-ppo", domain: "preference", title: "PPO + KL Tether", kind: "scene", scene: "rlhf-ppo",
    summary: "Four models in memory, clipped updates, per-token drift rent.",
    points: [
      "Policy, reference, reward, value — the quadruple bill.",
      "β·KL(π‖π_ref) is the dial between gains and reward hacking.",
      "Clip ε ∈ [0.1, 0.3] keeps updates inside the trust region." ] },
  { id: "t-dpo-family", domain: "preference", title: "DPO & Variants", kind: "scene", scene: "dpo-family",
    summary: "Implicit reward, no RM, and the IPO/KTO/SimPO heirs.",
    points: [
      "r = β·log(π/π_ref): the policy's own log-ratio is the reward.",
      "IPO targets a margin; KTO uses win/loss labels; SimPO drops the reference model.",
      "Monitor absolute log-probs: both sides can sink while the margin grows." ] },
  { id: "c-offline-vs-online", domain: "preference", title: "Offline vs Online Pairs", kind: "concept",
    summary: "Where preference data comes from, and why it matters.",
    points: [
      "Offline: fixed human/AI pairs, one pass, cheap.",
      "Online: sample from the current policy each round, fresher signal.",
      "Iterative DPO closes most of the gap to PPO at a fraction of the cost." ] },

  /* Domain 5: Reasoning & Verifiable Rewards */
  { id: "t-rlvr-math", domain: "reasoning", title: "Verifiable Oracles", kind: "scene", scene: "rlvr-math",
    summary: "Checkers, compilers, and tests as reward functions.",
    points: [
      "Deterministic rewards cannot be charmed by fluent prose.",
      "Format compliance earns its own small reward component.",
      "No reward model → no RM over-optimization; failure shifts to train-set overfit." ] },
  { id: "t-grpo-elim", domain: "reasoning", title: "GRPO Group Baseline", kind: "scene", scene: "grpo-elim",
    summary: "Delete the critic, normalize within the group.",
    points: [
      "A_i = (r_i − μ)/(σ + ε) over G sampled responses.",
      "Saves the entire value model (~112 GB at 7B).",
      "Zero-variance groups contribute nothing — curriculum on difficulty." ] },
  { id: "t-cot-gains", domain: "reasoning", title: "CoT & Test-Time Compute", kind: "scene", scene: "cot-gains",
    summary: "Buy accuracy with inference tokens.",
    points: [
      "Self-consistency majority voting over k chains.",
      "pass@k = 1 − C(n−k,c)/C(n,c).",
      "Reasoning tokens cost latency: route easy queries to short-CoT." ] },
  { id: "c-process-rewards", domain: "reasoning", title: "Outcome vs Process Rewards", kind: "concept",
    summary: "Score the answer or score the steps?",
    points: [
      "Outcome rewards are objective but blurry over long trajectories.",
      "Process rewards sharpen credit but need verifiers per step.",
      "Long-horizon credit blur scales as 1/√steps." ] },

  /* Domain 6: Safety & Constitutional AI */
  { id: "t-redteam", domain: "safety", title: "Red-Team Loop", kind: "scene", scene: "redteam",
    summary: "Automated adversaries and exponential jailbreak decay.",
    points: [
      "Attack → label → train → re-attack, per probe family.",
      "0.8 × 0.55^R: three rounds cut success ~6×.",
      "Aggregate averages hide the family that still fails." ] },
  { id: "t-refusal-train", domain: "safety", title: "Refusal Frontier", kind: "scene", scene: "refusal-train",
    summary: "Calibrating safety against the over-refusal tax.",
    points: [
      "Over-refusal cost grows quadratically across a conversation.",
      "Near-boundary pairs teach the decision variable, not surface patterns.",
      "Eval harmful-refusal and over-refusal suites separately." ] },
  { id: "t-rlaif-constit", domain: "safety", title: "Constitutional AI", kind: "scene", scene: "rlaif-constit",
    summary: "AI critics, self-critique, and the constitution as policy.",
    points: [
      "Critique → revise → prefer: preference data with no human in the loop.",
      "Judge agreement with humans grows only logarithmically in scale.",
      "Audit RLAIF labels against a human holdout before trusting the loop." ] },
  { id: "c-governance", domain: "safety", title: "Constitution as Governance", kind: "concept",
    summary: "Editing a text file edits model behavior.",
    points: [
      "Principles are versioned, reviewed, and diffed like code.",
      "Behavior changes are auditable back to specific principles.",
      "The governance artifact is the lever; training is the mechanism." ] },

  /* Domain 7: Evaluation & Benchmarking */
  { id: "t-benchmark-contam", domain: "evals", title: "Contamination Tells", kind: "scene", scene: "benchmark-contam",
    summary: "Seen vs unseen uplift as the honesty check.",
    points: [
      "Dedup eval items from training corpora before the run.",
      "Report both splits when parity cannot be proven.",
      "Rotating/private refresh sets keep signal alive." ] },
  { id: "t-llm-judge-bias", domain: "evals", title: "Judge Bias Audit", kind: "scene", scene: "llm-judge-bias",
    summary: "Position, length, and self-preference, measured.",
    points: [
      "Swap answers and re-judge; report bias-corrected win rates.",
      "Length-controlled win rates strip verbosity confounds.",
      "Avoid same-family judges (self-preference)." ] },
  { id: "t-eval-uncertainty", domain: "evals", title: "Uncertainty Reporting", kind: "scene", scene: "eval-uncertainty",
    summary: "Every score is a point estimate; publish the interval.",
    points: [
      "h = 1.96·√(p(1−p)/n): 500 items at 70% → ±4.0.",
      "Claim improvement only when intervals separate.",
      "McNemar's paired test is sharper than two independent CIs." ] },
  { id: "c-arena-vs-static", domain: "evals", title: "Arena vs Static Benchmarks", kind: "concept",
    summary: "Live human preference vs frozen item banks.",
    points: [
      "Arena-style Elo resists contamination but drifts with the user population.",
      "Static suites are reproducible but leak over time.",
      "Serious reports carry both." ] },

  /* Domain 8: Advanced Capabilities & Deployment */
  { id: "t-mm-agentic", domain: "deploy", title: "Multimodal & Agentic", kind: "scene", scene: "mm-agentic",
    summary: "Token mixes across modalities and composite tool success.",
    points: [
      "An image costs hundreds-to-thousands of tokens.",
      "Tool success = syntax × argument fidelity × execution, plus retry recovery.",
      "Long-horizon credit blur: 1/√steps." ] },
  { id: "t-quant-gptq", domain: "deploy", title: "GPTQ / AWQ / FP8", kind: "scene", scene: "quant-gptq",
    summary: "Post-training compression with calibration.",
    points: [
      "GPTQ compensates rounding error via the inverse Hessian.",
      "AWQ scales salient channels; no mixed precision needed.",
      "Quantize the final aligned model, then re-eval." ] },
  { id: "t-infer-opt", domain: "deploy", title: "Distill & Ship", kind: "scene", scene: "infer-opt",
    summary: "KL distillation, FP8 calibration, artifact-level evals.",
    points: [
      "T²-weighted KL inherits the teacher's dark knowledge.",
      "Sequence-level distillation beats pure logit matching for behavior.",
      "Score the artifact you serve, not its bf16 cousin." ] },
  { id: "c-recipe-table", domain: "deploy", title: "Method Cheat Sheet", kind: "concept",
    summary: "Quick-reference: method → signal → cost → use case.",
    points: [
      "SFT: demos, cheap, behavior shaping.",
      "DPO: pairs, offline, alignment without rollouts.",
      "PPO: RM scores, online, strongest but heaviest.",
      "RLVR/GRPO: verifiers, reasoning, no critic." ] },
];
