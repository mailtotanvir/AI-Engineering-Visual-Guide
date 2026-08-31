export interface SceneNote {
  id: string;
  module: string;
  title: string;
  overview: string;
  keyConcepts: { heading: string; body: string }[];
  mathDeepDive?: { title: string; equation: string; explanation: string };
  realWorldEngineering: string[];
}

export const SCENE_NOTES: Record<string, SceneNote> = {
  "sft-basics": {
    id: "sft-basics",
    module: "Module 1: SFT Foundations",
    title: "From base model to assistant — the SFT pipeline",
    overview: "A base model only completes text; it has never been asked to answer. Supervised Fine-Tuning reshapes the same weights with tens of thousands of prompt→ideal-response pairs, so the mode of the distribution lands on helpful assistant behavior instead of plausible web text.",
    keyConcepts: [
      { heading: "The Blunt Instrument Problem", body: "A base model trained on petabytes of web text will answer a question by continuing it — often with more questions. Distribution alignment moves probability mass from 'any plausible continuation' to 'the response a good assistant would give'." },
      { heading: "Scale Disparity", body: "Pre-training consumes petabytes (trillions of tokens); post-training consumes megabytes-to-gigabytes (millions of tokens). A ratio of 10,000:1 or more means a tiny, high-signal dataset steers an enormous, low-signal substrate." },
      { heading: "What SFT Teaches", body: "Format (markdown, lists, code fences), turn-taking (stop when the answer ends), instruction following, and a shallow layer of domain competence — not new world knowledge." }
    ],
    mathDeepDive: {
      title: "Data Scale Disparity",
      equation: "ratio = (pre_tokens_B × 10⁹) / (post_tokens_M × 10⁶)",
      explanation: "For 15 trillion pre-training tokens and 1 million post-training tokens the ratio is 15,000×. That asymmetry is why a few days of SFT can radically change behavior without disturbing learned knowledge."
    },
    realWorldEngineering: [
      "Llama-family instruct models use on the order of 10⁵–10⁶ curated SFT examples; quality dominates quantity at this stage.",
      "Teams commonly mix public instruction sets (FLAN, ShareGPT-style) with thousands of in-house demonstrations for tone and policy."
    ]
  },

  "sft-targets": {
    id: "sft-targets",
    module: "Module 1: SFT Foundations",
    title: "Prompt masking: loss only where it matters",
    overview: "In an SFT sequence, the prompt tokens are inputs we condition on, not behavior we want to copy. Masking the prompt (loss weight 0) focuses every gradient on the completion positions, improving sample efficiency and preventing the model from learning to generate prompts.",
    keyConcepts: [
      { heading: "Token Masking", body: "labels = [-100] * prompt_len + completion_tokens. Cross-entropy ignores positions labelled -100, so only the assistant's tokens are scored." },
      { heading: "Effective Epochs", body: "Because fewer positions carry loss, the same token budget is 'spent' more densely on behavior. Effective epochs = steps × global_batch / dataset_tokens." },
      { heading: "Overfit Signature", body: "The classic SFT failure: training loss keeps falling while validation loss turns upward. Track the gap (valid − train) per checkpoint." }
    ],
    mathDeepDive: {
      title: "Masked Cross-Entropy",
      equation: "L = − (1 / |y|) · Σ_(t ∈ completion) log P(y_t | y_<t ; Θ)",
      explanation: "The loss is the mean negative log-likelihood over completion positions only. With masking, a 512-token example with a 384-token prompt trains on 128 scored positions."
    },
    realWorldEngineering: [
      "TRL and LLaMA-Factory expose this as train_on_inputs=False (Axolotl); getting it wrong silently halves training efficiency.",
      "Packing multiple short examples into one 4k sequence with correct attention separation is a standard throughput trick — and a standard correctness bug when masks leak across boundaries."
    ]
  },

  "peft-lora": {
    id: "peft-lora",
    module: "Module 1: SFT Foundations",
    title: "LoRA & QLoRA: the parameter-efficient memory trade",
    overview: "Instead of updating every weight, LoRA freezes the base model and learns tiny low-rank matrices whose product approximates the needed weight change. QLoRA stacks 4-bit quantization of the frozen base on top, turning a multi-GPU job into a single-GPU job.",
    keyConcepts: [
      { heading: "Low-Rank Adapters", body: "The weight update ΔW is factorized as B·A where A is r×d and B is d×r. With r ≪ d, trainable parameters collapse to a fraction of a percent." },
      { heading: "4-bit Base", body: "QLoRA stores the frozen base in NF4 (~0.5 bytes/param) with double quantization and paged optimizers, while LoRA adapters stay in bf16." },
      { heading: "Merge at Deploy", body: "After training, W' = W + B·A merges back into the base weights, so inference cost is identical to the original model — zero latency overhead." }
    ],
    mathDeepDive: {
      title: "LoRA Memory Ledger",
      equation: "QLoRA_GB ≈ params_B × 0.55  +  lora_params_M × 16B/param ÷ 10⁹",
      explanation: "A 7B model needs ~3.9 GB for the 4-bit base plus a few GB of adapters and optimizer state; a full fine-tune of the same model needs ~7 × 16 = 112 GB."
    },
    realWorldEngineering: [
      "r=8–64 on q_proj/k_proj/v_proj/o_proj + MLP is the practical sweet spot; higher rank helps style-heavy domains more than factual recall.",
      "QLoRA made it routine to fine-tune a 33B model on a single 24GB consumer GPU — the democratization moment for instruction tuning."
    ]
  },

  "data-filter": {
    id: "data-filter",
    module: "Module 2: Data Engineering & Synthetic Data",
    title: "Curation heuristics and the data taxonomy",
    overview: "Post-training datasets are tiny, so every example has outsized influence. Curation combines cheap heuristics (length, symbol ratios, language ID), classifier scoring, and a deliberate taxonomy so capability coverage is designed, not accidental.",
    keyConcepts: [
      { heading: "Heuristic Filters", body: "Drop examples with degenerate repetition, broken encoding, extreme symbol ratios, or wrong language. These cheap rules remove the majority of low-quality candidates." },
      { heading: "Taxonomy Design", body: "Build a tree: instruction following, multi-turn dialogue, code, reasoning, safety, creative writing. Budget counts per leaf so weak leaves are filled rather than duplicated." },
      { heading: "Quality over Quantity", body: "LIMA showed ~1,000 excellent examples can beat 50k mediocre ones. Deduplication and per-leaf curation matter more than raw scale." }
    ],
    mathDeepDive: {
      title: "Dedup Impact",
      equation: "dup_rate = 1 − unique_prompts / total_prompts",
      explanation: "Near-duplicate prompts teach the model to parrot one phrasing. Keeping unique-prompt share high preserves output diversity at generation time."
    },
    realWorldEngineering: [
      "Production pipelines score every candidate with a fast quality classifier and sample the kept set per taxonomy leaf, not globally.",
      "Safety leaves are budgeted separately — you cannot rely on the general distribution to include enough refusal and boundary examples."
    ]
  },

  "clustering": {
    id: "clustering",
    module: "Module 2: Data Engineering & Synthetic Data",
    title: "Embedding diversity and MinHash deduplication",
    overview: "Embedding-space clustering turns an unstructured pile of examples into a measurable distribution. MinHash-LSH removes near-duplicates cheaply; cluster counts expose which capability regions are over- and under-represented.",
    keyConcepts: [
      { heading: "MinHash + LSH", body: "Shingle each document, hash it into a signature, bucket via locality-sensitive hashing. Near-duplicates collide without an O(n²) all-pairs comparison." },
      { heading: "Cluster Coverage", body: "Embed prompts, cluster with k-means or HDBSCAN, then inspect cluster sizes. A single cluster holding 40% of the data is a diversity bug." },
      { heading: "Deliberate Rebalancing", body: "Downsample bloated clusters, synthesize examples for empty ones. Coverage is a design decision." }
    ],
    mathDeepDive: {
      title: "Signature Similarity",
      equation: "J(A, B) ≈ agree(MinHash_sig_A, MinHash_sig_B) / signature_length",
      explanation: "The fraction of matching min-hashes estimates Jaccard similarity between document shingle sets; LSH turns that estimate into cheap candidate pairs."
    },
    realWorldEngineering: [
      "The FineWeb and Dolma pipelines dedup trillions of tokens with MinHash-LSH before any model sees the data.",
      "Teams keep a 'cluster dashboard' during SFT data review — removing one over-represented cluster often fixes a specific behavioral tic."
    ]
  },

  "synthetic-self": {
    id: "synthetic-self",
    module: "Module 2: Data Engineering & Synthetic Data",
    title: "Self-Instruct, Evol-Instruct, and model collapse",
    overview: "When human demonstrations are scarce, models generate their own training data: seed prompts are expanded (Self-Instruct) or evolved into harder variants (Evol-Instruct), answered, filtered, and fed back. Without fresh external grounding, repeated self-training degrades diversity — model collapse.",
    keyConcepts: [
      { heading: "Self-Instruct Loop", body: "Seed prompts → LLM generates new prompts + responses → filter → add to dataset. Bootstrap coverage quickly from ~175 seed tasks." },
      { heading: "Evol-Instruct", body: "Each generation rewrites prompts to be more complex, constrained, or multi-step — WizardLM's recipe for escalating difficulty." },
      { heading: "Collapse Guard", body: "Mix synthetic data with human/curated data each round, and track output entropy. Pure self-training rounds slowly shrink the distribution's tails." }
    ],
    mathDeepDive: {
      title: "Retention Under Replay",
      equation: "retention = 1 − forgetting_rate × (1 − replay_share)",
      explanation: "Keeping a fraction of real data in every synthetic round bounds capability loss: a 10% forgetting rate with 30% replay retains ~93% of the original distribution."
    },
    realWorldEngineering: [
      "Orca and Phi-style curricula show synthetic data quality depends on reasoning traces, not just answers — generate the rationale, then grade it.",
      "Every synthetic round should end at a rejection gate (next scene); unfiltered self-training is how collapse sneaks in."
    ]
  },

  "samp-reject": {
    id: "samp-reject",
    module: "Module 2: Data Engineering & Synthetic Data",
    title: "Rejection sampling: the quality gate",
    overview: "Rejection sampling turns the generator into a dataset: sample k candidate responses per prompt, score them (model judge, verifier, or unit tests), keep the best, discard the rest. Iterated, this is both a data engine and a weak form of RL.",
    keyConcepts: [
      { heading: "Sample-then-Select", body: "Draw k completions at moderate temperature, score each, keep the top one per prompt. The kept set is 'on the model's own distribution but above its median'." },
      { heading: "Verifiers First", body: "Where a checker exists (math, code), use it — it cannot be fooled by fluent prose. Model judges are the fallback for open-ended tasks." },
      { heading: "Iterate", body: "Fine-tune on the kept set, regenerate, re-filter. Each round the kept-set bar rises; that ratchet is the training signal." }
    ],
    mathDeepDive: {
      title: "Coverage of the Kept Set",
      equation: "keep_rate = kept / (prompts × k) — quality ≈ P(top-1 of k is correct)",
      explanation: "If a model's per-sample accuracy is 40%, best-of-8 rejection sampling lifts the kept-set accuracy substantially — the same math that powers pass@k evaluation."
    },
    realWorldEngineering: [
      "Llama 2's SFT and later Llama 3 post-training rounds both lean on rejection sampling from increasingly capable checkpoints.",
      "Cheap trick that matters: dedupe kept responses per prompt — best-of-k loves to keep near-identical winners."
    ]
  },

  "lora-math": {
    id: "lora-math",
    module: "Module 3: SFT Deep Dive",
    title: "Why low-rank adaptation works",
    overview: "Fine-tuning updates empirically live in low-dimensional subspaces: the change to a big weight matrix is close to low rank. LoRA exploits that by learning ΔW = B·A directly, freezing the original W and training only the small factors.",
    keyConcepts: [
      { heading: "The Factorization", body: "For a d×d weight matrix, full fine-tuning trains d² parameters; LoRA trains 2·r·d. With d=4096 and r=16, that is ~0.4% of the original." },
      { heading: "Initialization", body: "A starts Gaussian, B starts at zero — so ΔW = 0 at step one and the pretrained function is preserved exactly when training begins." },
      { heading: "Scaling α", body: "The update is scaled by α/r. Changing rank without re-tuning α silently changes the effective learning rate." }
    ],
    mathDeepDive: {
      title: "Trainable Parameter Share",
      equation: "params_lora = target_frac · params_B · 10⁹ · (4·r·d) / d²,   frac = params_lora / (params_B × 10³M)",
      explanation: "For 7B params with 50% of matrices targeted at r=16, d=4096: about 5.4M trainable parameters — under 0.1% of the model."
    },
    realWorldEngineering: [
      "Target all attention projections plus MLP up/down projections for quality; attention-only LoRA underperforms on style and knowledge tasks.",
      "Adapter dropout and rank-stabilized scaling (rsLoRA) are common fixes when r grows past ~64."
    ]
  },

  "qlora-memory": {
    id: "qlora-memory",
    module: "Module 3: SFT Deep Dive",
    title: "QLoRA memory layout, byte by byte",
    overview: "QLoRA's contribution is an accounting trick plus two engineering details: NF4 quantization matched to the weight distribution, and paged optimizers that spill optimizer state to CPU RAM on memory spikes.",
    keyConcepts: [
      { heading: "NF4 + Double Quantization", body: "NormalFloat4 matches the empirical distribution of trained weights better than uniform int4. Quantizing the quantization constants saves ~0.4 bits/param." },
      { heading: "Paged Optimizers", body: "NVIDIA unified memory lets AdamW's moments page between GPU and CPU RAM, absorbing the activation-memory spikes of long sequences." },
      { heading: "The Ledger", body: "4-bit base + bf16 adapters + fp32 optimizer moments for adapters only. Everything big is frozen; everything trainable is tiny." }
    ],
    mathDeepDive: {
      title: "Full Fine-Tune vs QLoRA",
      equation: "full_GB = params_B × 16   vs   qlora_GB ≈ params_B × 0.55 + adapters",
      explanation: "7B model: full fine-tune ≈ 112 GB (bf16 weights, bf16 grads, fp32 Adam moments and master copy). QLoRA ≈ 3.9 GB base + <2 GB adapters — a 20× reduction."
    },
    realWorldEngineering: [
      "Gradient checkpointing plus QLoRA is what makes 13B-class fine-tunes fit on 16–24GB cards.",
      "Beware merged-precision loss: merging bf16 adapters into an NF4 base, then dequantizing, can lose a little quality — merge into a bf16 copy for deployment."
    ]
  },

  "forgetting": {
    id: "forgetting",
    module: "Module 3: SFT Deep Dive",
    title: "Catastrophic forgetting and the retention math",
    overview: "Specializing a model on new-domain data quietly erodes general capability. Continued pre-training (CPT) injects knowledge deeply but forgets fast; SFT shapes behavior gently but learns shallowly. The mitigation in both cases is rehearsal.",
    keyConcepts: [
      { heading: "CPT vs SFT", body: "CPT (raw tokens, next-token objective) moves the distribution far and risks forgetting. SFT (demonstrations) moves behavior with less collateral damage." },
      { heading: "Replay Buffers", body: "Mix 10–30% general-domain data into every domain-adaptation run. The model keeps rehearsing what it must not forget." },
      { heading: "Distillation Bridges", body: "Add a KL term pulling the fine-tuned model's outputs toward the frozen base on general prompts — a soft leash on drift." }
    ],
    mathDeepDive: {
      title: "Retention Bound",
      equation: "retention = 1 − forgetting_rate × (1 − replay_share)",
      explanation: "A domain run with forgetting rate 0.4 and 25% replay retains 70% of general capability; the same run without replay retains 60%."
    },
    realWorldEngineering: [
      "Medical- and legal-domain fine-tunes routinely fail public benchmarks that weren't in scope — measure retention with a frozen general eval suite.",
      "A practical recipe: CPT on 1–5B domain tokens with 20% replay, then a short SFT on domain instructions with 10% general instructions."
    ]
  },

  "bradley-terry": {
    id: "bradley-terry",
    module: "Module 4: Preference & Alignment",
    title: "Bradley-Terry: preferences as probabilities",
    overview: "Ask a human 'is A better than B?' and the answer is noisy. Bradley-Terry turns pairwise comparisons into a scalar reward per response, where the probability A wins is a sigmoid of the reward gap. It is the statistical foundation under RLHF, DPO, and every variant.",
    keyConcepts: [
      { heading: "The Model", body: "Each response gets a latent reward r. P(y_w ≻ y_l) = σ(r_w − r_l). Fit rewards by maximizing the likelihood of observed human choices." },
      { heading: "The Loss", body: "Reward-model training minimizes −log σ(r_w − r_l) over pairs. A well-fit model ranks held-out pairs correctly; its accuracy is the ceiling of everything downstream." },
      { heading: "Why Pairs", body: "Pairwise 'which is better' is far more reliable than absolute 1–10 scoring. Humans are consistent comparators, inconsistent scorers." }
    ],
    mathDeepDive: {
      title: "Preference Loss",
      equation: "L_RM = −log σ(r_w − r_l) = −log P(y_w ≻ y_l)",
      explanation: "Reward margin of 2.2 gives σ(2.2) ≈ 0.90 → loss 0.105. Margin 0 gives loss log 2 ≈ 0.693, the maximum a binary comparison can contribute."
    },
    realWorldEngineering: [
      "Reward-model accuracy on held-out pairs is typically 65–75% — every downstream RLHF run inherits that noise ceiling.",
      "Annotator disagreement is data: many teams train an ensemble of reward models and treat disagreement as an uncertainty signal."
    ]
  },

  "rlhf-ppo": {
    id: "rlhf-ppo",
    module: "Module 4: Preference & Alignment",
    title: "RLHF: PPO with a KL tether",
    overview: "With a trained reward model, PPO optimizes the policy to maximize reward — but an unconstrained optimizer will exploit every flaw in the reward model. The KL penalty against the frozen reference policy is what keeps alignment optimization honest.",
    keyConcepts: [
      { heading: "Four Models in Memory", body: "Policy (training), reference (frozen), reward model (frozen), value/critic (training). That quadruple memory bill is why PPO is expensive." },
      { heading: "Clipped Objective", body: "PPO clips the probability ratio to [1−ε, 1+ε] so one batch cannot move the policy far enough to escape the trust region." },
      { heading: "GAE", body: "Generalized Advantage Estimation blends multi-step TD residuals with parameter λ, trading bias against variance in the credit assignment." }
    ],
    mathDeepDive: {
      title: "PPO Objective + Penalty",
      equation: "L = E[ min( ρ·A, clip(ρ, 1−ε, 1+ε)·A ) ] − β·KL(π ‖ π_ref),   ρ = π(a)/π_old(a)",
      explanation: "The clip keeps updates local; the KL term pays a per-token rent for drifting from the reference policy. β is the dial between alignment gains and reward-model exploitation."
    },
    realWorldEngineering: [
      "InstructGPT used β around 0.01–0.1; too small and responses drift into reward-hacked degeneracy within a few hundred steps.",
      "PPO at scale typically runs the reward model and reference policy on separate GPUs and batches rollouts — the pipeline is a mini distributed-systems project."
    ]
  },

  "dpo-family": {
    id: "dpo-family",
    module: "Module 4: Preference & Alignment",
    title: "DPO: alignment without the reward model",
    overview: "DPO's insight is algebraic: the closed-form solution of the KL-constrained reward maximization lets you rewrite the reward in terms of the policy itself. Substitute that into Bradley-Terry and the reward model disappears — you optimize the policy directly on preference pairs.",
    keyConcepts: [
      { heading: "Implicit Reward", body: "r(x, y) = β·log(π(y|x)/π_ref(y|x)) + constant. The policy's log-ratio against the reference IS the reward." },
      { heading: "Simpler Pipeline", body: "Two models in memory (policy + reference), one supervised loss, no rollouts. DPO is to PPO what a sedan is to a crane." },
      { heading: "The Heirs", body: "IPO adds a margin target to fight overfitting; KTO drops pairs for win/loss labels; SimPO drops the reference model and length-normalizes instead." }
    ],
    mathDeepDive: {
      title: "DPO Loss",
      equation: "L_DPO = −log σ( β·[ (log π(y_w) − log π_ref(y_w)) − (log π(y_l) − log π_ref(y_l)) ] )",
      explanation: "With β=0.1, pushing the chosen response's implicit reward 5 nats above the rejected one gives σ(0.5) ≈ 0.62 → loss 0.48; separation must reach 20+ nats before the loss approaches zero."
    },
    realWorldEngineering: [
      "DPO's biggest practical win is operational: one stage, offline data, standard SFT infrastructure.",
      "Known failure mode: unbounded log-ratios push chosen and rejected likelihoods both DOWN — monitor absolute log-probs, not just the margin. SimPO/IPO exist partly for this."
    ]
  },

  "rlvr-math": {
    id: "rlvr-math",
    module: "Module 5: Reasoning & Verifiable Rewards",
    title: "RLVR: rewards you can verify",
    overview: "Human preference labels are noisy and expensive. For math, code, and structured tasks there is a better oracle: check the answer. A python interpreter, a unit-test suite, or an exact-answer comparator gives a reward signal that is deterministic, cheap, and impossible to charm with fluent prose.",
    keyConcepts: [
      { heading: "The Oracle Set", body: "Math: exact-match or SymPy equivalence. Code: compile + hidden tests. Agentic tasks: did the tool call succeed? These are rule-based rewards (RLVR)." },
      { heading: "Format Matters", body: "Answers must be extractable — 'put the final number in \\boxed{}'. A correct answer in the wrong format earns partial or zero reward, so format compliance gets its own reward component." },
      { heading: "No Reward Model", body: "Because rewards are computed, not learned, there is no reward model to over-optimize. The failure mode shifts from reward hacking to overfitting the train problem distribution." }
    ],
    mathDeepDive: {
      title: "Verifiable Reward",
      equation: "R = 1·[correct] + 0.1·[format_ok] · [not correct]",
      explanation: "Binary correctness dominates; a small format reward shapes parseability without letting the model profit from well-formatted wrong answers."
    },
    realWorldEngineering: [
      "DeepSeek-R1 and OpenAI's o-series are the canonical demonstrations: RL on verifiable rewards alone elicits long self-correcting chains of thought.",
      "Infrastructure is the hard part: sandboxed code execution at thousands of rollouts/step, with timeout and memory limits per sample."
    ]
  },

  "grpo-elim": {
    id: "grpo-elim",
    module: "Module 5: Reasoning & Verifiable Rewards",
    title: "GRPO: group-relative advantage, no critic",
    overview: "PPO's value model exists to reduce the variance of a single rollout's return estimate. GRPO deletes it: for each prompt, sample a group of G responses, then use the group's own reward statistics as the baseline. Advantages become a simple normalization inside the group.",
    keyConcepts: [
      { heading: "Group Baseline", body: "For each prompt, sample G completions, compute rewards, and set A_i = (r_i − mean) / (std + ε). The group mean replaces the learned value function." },
      { heading: "What You Save", body: "No critic model in memory, no value-function training instability, no GAE hyperparameters. The memory bill drops by one full model." },
      { heading: "What You Pay", body: "G× more rollouts per prompt per step. Compute moves from parameters (critic) to sampling (rollouts) — usually a good trade for reasoning workloads." }
    ],
    mathDeepDive: {
      title: "Group Advantage & the Memory Bill",
      equation: "A_i = (r_i − μ_group) / (σ_group + ε);   saved_GB = critic_params_B × 16",
      explanation: "Deleting a 7B critic saves ~112 GB of training state — often the difference between a feasible and infeasible reasoning-RL run."
    },
    realWorldEngineering: [
      "DeepSeekMath introduced GRPO; DeepSeek-R1 scaled it to emergent long reasoning with groups of 8–64 samples.",
      "Watch group reward variance: when every sample in a group is right (or wrong), advantages are ~0 and the batch contributes nothing — curriculum on prompt difficulty matters."
    ]
  },

  "cot-gains": {
    id: "cot-gains",
    module: "Module 5: Reasoning & Verifiable Rewards",
    title: "Chain-of-thought and test-time compute",
    overview: "Reasoning models spend inference-time tokens to buy accuracy: generate multiple chains of thought, vote or verify, and the effective answer quality climbs with compute — a curve that did not exist for one-shot completions.",
    keyConcepts: [
      { heading: "System 1 vs System 2", body: "Direct answers are fast intuition; long CoT is deliberation. RLVR training teaches the model when to deliberate and how to backtrack within a single generation." },
      { heading: "Self-Consistency", body: "Sample k chains, take the majority answer. Accuracy rises with k with diminishing returns — majority voting cancels independent reasoning errors." },
      { heading: "Pass@k", body: "The probability that at least one of k samples is correct. RLVR training improves both the single-sample accuracy and the tail — pass@k curves shift up wholesale." }
    ],
    mathDeepDive: {
      title: "Test-Time Scaling",
      equation: "pass@k = 1 − C(n−k, c) / C(n, c);   self-consistency ≈ p^(1/(k·0.55))",
      explanation: "Unbiased pass@k over n graded samples with c correct. If single-sample accuracy is 40%, majority voting over 8 samples behaves like a much sharper estimator."
    },
    realWorldEngineering: [
      "Reasoning tokens cost real latency and money: a 4k-token CoT at 50 tok/s adds 80 seconds per answer. Production routers send easy queries to a short-CoT model.",
      "Length-controlled evals matter: naive RLVR can inflate CoT length to mine format rewards without improving correctness."
    ]
  },

  "redteam": {
    id: "redteam",
    module: "Module 6: Safety & Constitutional AI",
    title: "Red-teaming and jailbreak decay",
    overview: "Safety training needs adversarial data, and adversaries iterate. Automated red-teaming uses an attack model (or the target itself) to search for jailbreaks, the failures are labeled, added to training, and the loop repeats. Measurable success: the jailbreak success rate falls exponentially per round.",
    keyConcepts: [
      { heading: "Attack Surfaces", body: "Role-play framing, hypotheticals, encoding tricks, multi-turn grooming, and tool-mediated exfiltration. Each gets its own probe family." },
      { heading: "The Loop", body: "Attack → classify (did it succeed?) → add to preference/SFT data → retrain → re-attack. Each round compounds." },
      { heading: "Measure Honestly", body: "Report jailbreak success rate per probe family. Aggregate averages hide the family that still fails 40% of the time." }
    ],
    mathDeepDive: {
      title: "Jailbreak Decay",
      equation: "success_rate(R) = initial × decay^R,   e.g. 0.8 × 0.55^R",
      explanation: "At 80% initial success and 0.55 decay per round: 44% after one round, 24% after two, 13% after three. Exponential in rounds — which is why sustained red-teaming, not one-off audits, is the mechanism."
    },
    realWorldEngineering: [
      "Production programs run continuous adversarial campaigns with fresh attack models; a static probe suite is stale the day it ships.",
      "Every confirmed jailbreak becomes at least one SFT refusal and one preference pair — the data engine is the deliverable, not the report."
    ]
  },

  "refusal-train": {
    id: "refusal-train",
    module: "Module 6: Safety & Constitutional AI",
    title: "Refusal calibration and the over-refusal trap",
    overview: "A model that refuses everything is safe and useless. Refusal training walks a frontier: enough refusals on genuinely harmful inputs, without the quadratic helpfulness tax of refusing benign look-alikes (medical questions, historical discussion, security research).",
    keyConcepts: [
      { heading: "The Frontier", body: "Each safety-training intensity yields a point (refusal_rate, helpfulness). Over-refusal cost grows quadratically because false refusals compound across a conversation." },
      { heading: "Boundary Data", body: "Curate near-boundary pairs: same surface form, one harmful one benign. The model must learn the decision variable, not the surface pattern." },
      { heading: "Calibration Check", body: "Evalidate on both a harmful-prompt suite (want: high refusal) and an over-refusal suite like XSTest (want: low refusal). One number hides the failure." }
    ],
    mathDeepDive: {
      title: "Refusal Frontier",
      equation: "refusals = min(1, s · w);   helpfulness = 1 − 0.35 · refusals²",
      explanation: "With safety training s=0.8 and refusal weight w=0.5: refusals 0.40, helpfulness 0.944. Pushing w to 1.0 gives refusals 0.80 but helpfulness drops to 0.776 — the trap made visible."
    },
    realWorldEngineering: [
      "Post-launch telemetry: track false-refusal complaints separately from true-positive refusals; regressions show up as a helpfulness dip on benign clusters.",
      "Constitutional or rubric-based synthetic boundary data lets you generate near-boundary pairs at scale without hand-writing thousands."
    ]
  },

  "rlaif-constit": {
    id: "rlaif-constit",
    module: "Module 6: Safety & Constitutional AI",
    title: "Constitutional AI: AI critics judging AI actors",
    overview: "RLAIF replaces human preference labelers with an AI judge that grades responses against a written constitution. Constitutional AI combines that with self-critique: the model critiques its own draft, revises, and the revised responses become preference data.",
    keyConcepts: [
      { heading: "Critique → Revise", body: "Generate a response, ask the model to critique it against a principle, then rewrite. The revised pair (original vs revised) is a training example with no human in the loop." },
      { heading: "The Constitution", body: "A set of principles (harmless, honest, non-manipulative...) written in natural language. Editing the constitution edits behavior — governance becomes a text file." },
      { heading: "Judge Calibration", body: "AI judges agree with human panels ~70–75% baseline; agreement improves with judge scale and better rubrics but never reaches parity on edge cases." }
    ],
    mathDeepDive: {
      title: "Violation Decay & Judge Agreement",
      equation: "violations(p) = 0.42 × 0.6^p;   agreement(n) = 0.72 + 0.2·log₁₀(max(10,n)/1000) (capped 0.95)",
      explanation: "Each constitutional revision pass cuts the violation rate roughly in half, while judge reliability grows only logarithmically in judge scale — the asymmetry that keeps humans in the loop."
    },
    realWorldEngineering: [
      "Anthropic's CAI showed the full loop: harmless and helpful both improve with AI feedback when the constitution is clear and the judge is prompted for pairwise comparison.",
      "Operational risk: the judge inherits the base model's biases. Audit RLAIF labels against a human holdout set before trusting the loop."
    ]
  },

  "benchmark-contam": {
    id: "benchmark-contam",
    module: "Module 7: Evaluation & Benchmarking",
    title: "Contamination: the silent score inflator",
    overview: "If benchmark items leaked into training data, the score measures memorization, not capability. Contamination is post-training's special vulnerability: SFT and RLHF datasets are scraped, and popular benchmarks are all over the web.",
    keyConcepts: [
      { heading: "The Tell", body: "Compare accuracy on seen vs. structurally identical unseen items. A large uplift is contamination evidence; clean models show near-parity." },
      { heading: "Guardrails", body: "N-gram and embedding dedup against benchmark corpora before training; hold-out canaries; report both split accuracies when parity cannot be proven." },
      { heading: "Rotating Targets", body: "Benchmarks saturate and leak. Private refresh sets, live leaderboards, and newly written items keep the signal alive." }
    ],
    mathDeepDive: {
      title: "Contamination Uplift",
      equation: "uplift = acc_seen − acc_unseen,   with CI half-width = 1.96·√(p(1−p)/n)",
      explanation: "An 8-point uplift with a ±2-point CI is strong evidence; an 8-point uplift with a ±9-point CI is noise. Always report the interval with the gap."
    },
    realWorldEngineering: [
      "GSM8K and MATH variants appear verbatim across instruction datasets scraped from GitHub and forums — dedup against eval sets is now table stakes.",
      "Report both numbers: 'MATH 62.3 (contamination-checked: uplift 1.1 ± 0.8 vs unseen split)' reads very differently from a bare 62.3."
    ]
  },

  "llm-judge-bias": {
    id: "llm-judge-bias",
    module: "Module 7: Evaluation & Benchmarking",
    title: "LLM-as-a-judge: auditing the referee",
    overview: "LLM judges scale preference evaluation to thousands of comparisons, but they carry measurable biases: position (preferring the first answer), length (preferring the longer), and self-preference. An unaudited judge corrupts every win-rate downstream.",
    keyConcepts: [
      { heading: "Positional Bias", body: "Run every comparison twice with answers swapped. Win-rate flips reveal order dependence; report the bias-corrected average." },
      { heading: "Length Bias", body: "Verbose answers win more than their quality warrants. Length-controlled win rates (AlpacaEval-LC) strip the confound." },
      { heading: "Judge Elo", body: "Pairwise win rates convert to Elo via a Bradley-Terry fit — the same model as Module 4, now scoring models instead of responses." }
    ],
    mathDeepDive: {
      title: "Positional Bias & Elo",
      equation: "bias = |p_first − 0.5|;   ΔElo = 400·log₁₀( wr / (1 − wr) )",
      explanation: "A judge that prefers the first answer 70% of the time carries bias 0.2 — enough to flip close comparisons. A 64% win rate converts to +128 Elo; a 55% rate, only +40."
    },
    realWorldEngineering: [
      "MT-Bench and Chatbot Arena popularized the pattern: judge rubric + swap-augmented pairs + length control.",
      "Self-preference is real: a judge from the same model family rates its own outputs higher. Use a judge from a different family, or an ensemble."
    ]
  },

  "eval-uncertainty": {
    id: "eval-uncertainty",
    module: "Module 7: Evaluation & Benchmarking",
    title: "Honest reporting: confidence intervals on every score",
    overview: "A benchmark score without an interval is a point estimate pretending to be a fact. On a 500-item benchmark, a 70% score carries a ±4-point 95% CI — enough to make most adjacent-leaderboard comparisons meaningless.",
    keyConcepts: [
      { heading: "Normal Approximation", body: "CI half-width = 1.96·√(p(1−p)/n). It shrinks with √n: doubling items improves precision by only 41%." },
      { heading: "Overlapping Intervals", body: "Model A at 71.2 ± 1.5 vs Model B at 69.8 ± 1.6: the difference is inside the noise. Claim improvement only when intervals separate." },
      { heading: "Paired Tests", body: "McNemar's test on the same items is sharper than comparing two independent CIs — items both models get right carry no information about the difference." }
    ],
    mathDeepDive: {
      title: "CI Half-Width",
      equation: "h = 1.96 · √( p(1−p) / n ),   e.g. p=0.7, n=500 → h ≈ ±0.040",
      explanation: "70% on 500 items is 70% ± 4.0 points at 95% confidence. Beating a rival by 1.5 points on that benchmark is not evidence of anything."
    },
    realWorldEngineering: [
      "Publish n and the interval next to every headline number — the HELM and lm-eval-harness conventions make this near-default in serious reports.",
      "For pass@k and small-sample reasoning evals, use bootstrap CIs; the normal approximation is poor near 0/1 accuracy."
    ]
  },

  "mm-agentic": {
    id: "mm-agentic",
    module: "Module 8: Advanced Capabilities & Deployment",
    title: "Multimodal and agentic alignment",
    overview: "Post-training extends beyond text: interleaved image/audio tokens need their own alignment data, and agentic models must not just answer but act — emitting well-formed tool calls with faithful arguments. Both extend the SFT/RL toolkit with new reward surfaces.",
    keyConcepts: [
      { heading: "Token Mix", body: "An image costs hundreds-to-thousands of tokens via a vision encoder. Token budgeting across modalities decides context economics and which modality dominates gradients." },
      { heading: "Tool-Call Success", body: "Success decomposes: syntax valid × arguments faithful × execution succeeds. Training on execution traces (with retries) teaches repair behavior." },
      { heading: "Trajectory Credit", body: "A 30-step agent run has one outcome signal. Per-step credit blurs as 1/√steps — hence step-level verifiers, process rewards, and short-horizon curricula." }
    ],
    mathDeepDive: {
      title: "Composite Tool Success",
      equation: "success = min(1, s_syntax · s_args + (1 − s_syntax · s_args) · retry_gain);   blur = 1/√steps",
      explanation: "95% syntax × 90% argument fidelity = 85.5% base; a 30% recovery from retries lifts it to ~90%. Meanwhile a 30-step trajectory's credit signal blurs to ~0.18 — outcome-only RL on long horizons is nearly signal-free."
    },
    realWorldEngineering: [
      "Agentic post-training runs on real execution sandboxes (shell, browsers, APIs) with per-step telemetry; success rate on held-out tasks is the KPI, not loss.",
      "Multimodal preference data is scarce and expensive; most pipelines bootstrap it by projecting text preferences onto multimodal conversations."
    ]
  },

  "quant-gptq": {
    id: "quant-gptq",
    module: "Module 8: Advanced Capabilities & Deployment",
    title: "Post-training quantization: GPTQ, AWQ, FP8",
    overview: "Trained weights are too fat to serve. Post-training quantization compresses them after training, using calibration data to choose rounding that preserves the layer's function: GPTQ via iterative second-order error compensation, AWQ via activation-aware scaling, FP8 via calibrated ranges.",
    keyConcepts: [
      { heading: "GPTQ", body: "Quantize columns one at a time, redistributing each column's rounding error into the not-yet-quantized weights via the inverse Hessian. 4-bit with group size 128 is the sweet spot." },
      { heading: "AWQ", body: "Protect the ~1% of salient weight channels (large activations) by per-channel scaling instead of mixed precision — hardware-friendly, no outliers stored separately." },
      { heading: "FP8 Calibration", body: "Dynamic ranges need a calibration pass; too few calibration samples inflates KL divergence against the bf16 reference." }
    ],
    mathDeepDive: {
      title: "Quantization Error & Retained Quality",
      equation: "err ≈ 2^(−r) · √(1/group) · 0.5;   retained ≈ 1 − 4·err;   VRAM = params_B · bits/8",
      explanation: "4-bit, group 128: err ≈ 0.0028 → ~98.9% quality retained. A 70B model: 140 GB at bf16 vs 35 GB at 4-bit — the difference between a node and a laptop."
    },
    realWorldEngineering: [
      "Quantize the final aligned model, not an earlier checkpoint — alignment is where behavior lives, and PTQ after alignment preserves it.",
      "Always eval the quantized model on your task suite: per-layer error compounds non-uniformly, and 4-bit can cost 1–3 points on reasoning-heavy sets."
    ]
  },

  "infer-opt": {
    id: "infer-opt",
    module: "Module 8: Advanced Capabilities & Deployment",
    title: "Deployment: distillation and serving prep",
    overview: "The last mile converts a good model into a shippable one: distill capability into a smaller student, calibrate for FP8 serving, and verify the deployed artifact reproduces the evaluated behavior — not a nearby cousin.",
    keyConcepts: [
      { heading: "KL Distillation", body: "The student minimizes KL against the teacher's softened distribution (temperature T), inheriting the teacher's dark knowledge — relative probabilities — not just its argmax." },
      { heading: "Calibration Sets", body: "FP8 serving quantization uses a few hundred representative samples to fix activation ranges. Too few samples inflates output KL versus the reference." },
      { heading: "Evals on the Shipped Artifact", body: "Re-run the full eval suite on the quantized, exported model. The artifact you serve is the artifact you score." }
    ],
    mathDeepDive: {
      title: "Distillation Loss & Serving Memory",
      equation: "L = T² · KL( softmax(z_t/T) ‖ softmax(z_s/T) );   VRAM_GB = params_B · bits/8 · (1 + overhead)",
      explanation: "The T² factor keeps gradient magnitudes comparable across temperatures. A 7B model at 4-bit needs ~3.5 GB of weights — plus 15–40% for KV cache and runtime overhead depending on batch and context."
    },
    realWorldEngineering: [
      "Sequence-level distillation (train the student on the teacher's sampled outputs) usually beats pure logit distillation for aligned behavior.",
      "Ship with the calibration recipe recorded: samples, quantization scheme, and the eval delta vs bf16 — reproducibility is part of the artifact."
    ]
  },
};
