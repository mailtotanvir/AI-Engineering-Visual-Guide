export interface SafetyDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export interface SafetyTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const SAFETY_DOMAINS: SafetyDomain[] = [
  {
    id: "threat-modeling",
    num: "01",
    name: "Adversarial Threat Modeling",
    blurb: "Taxonomy of adversarial attack vectors, jailbreak taxonomies, prompt injection pathways, and multimodal vulnerabilities.",
  },
  {
    id: "representation-engineering",
    num: "02",
    name: "Representation Engineering & Probing",
    blurb: "Mechanistic interpretability for safety: latent truth directions, contrastive steering, causal activation patching, and subspace surgery.",
  },
  {
    id: "alignment-refusal",
    num: "03",
    name: "Refusal Mechanics & Self-Correction",
    blurb: "The geometric representation of refusal vectors, constitutional revision loops, and Pareto over-refusal frontier optimization.",
  },
  {
    id: "guardrails-runtime",
    num: "04",
    name: "Guardrails & Runtime Defense",
    blurb: "Production defense-in-depth: dual-boundary moderation models, canary exfiltration tokens, privilege isolation, and constrained decoding.",
  },
  {
    id: "unlearning-privacy",
    num: "05",
    name: "Machine Unlearning & Privacy",
    blurb: "Targeted concept erasure (RMU), membership inference detection, and differential privacy guarantees (DP-SGD).",
  },
  {
    id: "watermarking-provenance",
    num: "06",
    name: "Watermarking & Provenance",
    blurb: "Cryptographic and statistical token watermarking, green-red vocabulary partitioning, and z-score authenticity verification.",
  },
  {
    id: "deception-agentic",
    num: "07",
    name: "Deception & Agentic Sandboxing",
    blurb: "Sycophancy mitigation, deceptive alignment tracking, ephemeral container sandboxing, and autonomous tool-execution verification.",
  },
  {
    id: "frontier-governance",
    num: "08",
    name: "Frontier Risk & Safety Cases",
    blurb: "Elicitation of Latent Knowledge (ELK), catastrophic cyber/biosecurity thresholds, and structured safety case audit frameworks.",
  },
];

export const SAFETY_TOPICS: SafetyTopic[] = [
  // Domain 1: Adversarial Threat Modeling
  {
    id: "t-many-shot",
    domain: "threat-modeling",
    title: "Many-Shot In-Context Jailbreaking",
    kind: "scene",
    scene: "many-shot-jailbreaking",
    summary: "Flooding the context window with 50-200 synthetic benign dialogue rounds to dilute the model's safety training priors.",
    points: [
      "In-context learning acts as an implicit fine-tuning step inside the attention kv-cache.",
      "As context length expands beyond 32k-128k tokens, refusal probability drops precipitously.",
      "Mitigated via attention-sink masking and in-context safety reminder injection.",
    ],
  },
  {
    id: "t-gcg-attacks",
    domain: "threat-modeling",
    title: "Greedy Coordinate Gradients (GCG)",
    kind: "scene",
    scene: "adversarial-suffixes-gcg",
    summary: "Discrete token optimization searching for universal adversarial strings that trigger target affirmative prefixes.",
    points: [
      "Uses first-order token gradients to swap suffix characters that minimize cross-entropy loss on 'Sure, here is...'",
      "Surprising transferability: suffixes generated on open-weights models often bypass black-box proprietary APIs.",
      "Defended via token perplexity filtering, smooth LLM defense, and adversarial fine-tuning.",
    ],
  },
  {
    id: "t-prompt-injection",
    domain: "threat-modeling",
    title: "Indirect Prompt Injection & Tool Poisoning",
    kind: "scene",
    scene: "prompt-injection-indirect",
    summary: "Adversaries embedding hidden instructions in external web pages, emails, or SQL databases retrieved by AI agents.",
    points: [
      "Fundamental LLM architecture does not separate instructions (system prompt) from data (untrusted user/retrieved text).",
      "Attackers can force agents to execute unapproved tool calls, exfiltrate API keys, or delete database tables.",
      "Defended through strict data/instruction delimiter tagging and dual-LLM supervisor validation.",
    ],
  },
  {
    id: "t-multimodal-jailbreak",
    domain: "threat-modeling",
    title: "Multimodal & Typographic Jailbreaks",
    kind: "scene",
    scene: "multimodal-jailbreaks",
    summary: "Injecting adversarial text directly rendered inside images or perturbed audio to bypass text-only safety filters.",
    points: [
      "Vision encoders (e.g. CLIP/SigLIP) project image features into the LLM embedding space before text guardrails execute.",
      "Adversarial pixel perturbations (FGSM/PGD) can force the visual encoder to represent prohibited objects as benign concepts.",
      "Requires end-to-end multimodal safety alignment and OCR pre-screening layers.",
    ],
  },

  // Domain 2: Representation Engineering
  {
    id: "t-caa-steering",
    domain: "representation-engineering",
    title: "Contrastive Activation Addition (CAA)",
    kind: "scene",
    scene: "steering-vectors-caa",
    summary: "Extracting steering vectors by taking the difference in mean activations between positive and negative prompts.",
    points: [
      "Calculates v_steer = E[a_pos] - E[a_neg] at specific transformer layers (typically middle to late layers).",
      "Adding +coeff * v_steer dynamically shifts generation toward honesty, harmlessness, or sycophancy-free answers.",
      "Inference-time modification with zero gradient computation or weight modification.",
    ],
  },
  {
    id: "t-linear-probes",
    domain: "representation-engineering",
    title: "Linear Probing & Latent Truthfulness",
    kind: "scene",
    scene: "linear-probes-truthfulness",
    summary: "Training logistic regression probes on residual stream vectors to verify whether the model 'knows' it is generating a falsehood.",
    points: [
      "Discovers a linear subspace in the residual stream that correlates strongly with ground-truth factual correctness.",
      "Distinguishes between genuine factual ignorance vs deliberate deception or hallucinations.",
      "Enables real-time internal truthfulness monitoring during safety-critical generation.",
    ],
  },
  {
    id: "t-activation-patching",
    domain: "representation-engineering",
    title: "Causal Activation Patching for Safety",
    kind: "scene",
    scene: "activation-patching-safety",
    summary: "Swapping internal activations between safe and adversarial runs to pinpoint the exact attention heads mediating refusal.",
    points: [
      "Applies causal mediation analysis across all attention heads and MLP layers.",
      "Isolates specific 'refusal heads' that recognize harmful intent and write refusal vectors into the stream.",
      "Reveals that safety mechanisms often occupy dedicated modular sub-circuits within the transformer.",
    ],
  },
  {
    id: "t-subspace-surgery",
    domain: "representation-engineering",
    title: "Subspace Erasure & Representation Surgery",
    kind: "scene",
    scene: "representation-surgery-unlearning",
    summary: "Projecting weight matrices onto the null space of dangerous concepts to render knowledge retrieval physically impossible.",
    points: [
      "Computes orthogonal projection matrix P_orth = I - V(V^T V)^(-1) V^T for concept matrix V.",
      "Updates MLP down-projection weights W_new = P_orth * W_orig.",
      "Prevents hazardous concept recall even when queried with sophisticated jailbreak permutations.",
    ],
  },

  // Domain 3: Alignment & Refusal Mechanics
  {
    id: "t-refusal-geometry",
    domain: "alignment-refusal",
    title: "The Geometry of Refusal Vectors",
    kind: "scene",
    scene: "refusal-geometry",
    summary: "Demonstrating that safety alignment collapses refusal decisions into a single dominant direction in the residual stream.",
    points: [
      "A single 1D vector v_refusal in intermediate layers dictates whether the model generates a refusal prefix.",
      "Ablating this single vector (e.g., subtracting (a . v) * v) eliminates refusal behavior across hundreds of diverse harmful prompts.",
      "Adding this vector forces the model to refuse completely benign, harmless requests.",
    ],
  },
  {
    id: "t-constitutional-ai",
    domain: "alignment-refusal",
    title: "Constitutional AI & Self-Critique Loops",
    kind: "scene",
    scene: "constitutional-ai-critique",
    summary: "Using natural language principles to guide multi-step critique, revision, and preference dataset generation.",
    points: [
      "Replaces human labelers with model self-supervision governed by an explicit constitution of ethical principles.",
      "Critique phase identifies harmfulness, toxicity, or privacy violations in initial draft responses.",
      "Revision phase generates refined safe completions used to train final RLHF/DPO preference models.",
    ],
  },
  {
    id: "t-over-refusal",
    domain: "alignment-refusal",
    title: "The Over-Refusal Sensitivity Frontier",
    kind: "scene",
    scene: "over-refusal-frontier",
    summary: "Analyzing the trade-off between safety enforcement and false-positive refusals on benign educational queries.",
    points: [
      "Keywords like 'kill', 'bomb', 'exploit', or 'weapon' frequently trigger false-positive refusals in historical or security contexts.",
      "Safety tuning must optimize the Pareto frontier: maximizing harmful recall while minimizing benign over-refusal.",
      "Context-aware refusal calibration utilizes intent classifier heads rather than shallow token matching.",
    ],
  },
  {
    id: "t-rmu-unlearning",
    domain: "alignment-refusal",
    title: "Representation Misdirection (RMU)",
    kind: "scene",
    scene: "representation-noising-rmu",
    summary: "Aligning hidden representations of forget-set tokens with random uncorrelated target vectors.",
    points: [
      "Eliminates biological, chemical, and cyber-attack knowledge without degrading general reasoning capabilities.",
      "Penalizes deviation on a retain dataset (e.g. general coding and STEM benchmarks) to prevent catastrophic model collapse.",
      "Significantly more robust to weight-space recovery attacks than simple gradient ascent.",
    ],
  },

  // Domain 4: Guardrails & Runtime Defense
  {
    id: "t-llama-guard",
    domain: "guardrails-runtime",
    title: "Llama Guard Dual-Layer Moderation",
    kind: "scene",
    scene: "llama-guard-moderation",
    summary: "Deploying specialized instruction-tuned safety classification models at both ingress and egress gateways.",
    points: [
      "Evaluates prompts and generations against standardized taxonomies (e.g. S1: Violence, S2: Non-Violent Crimes, S3: Hate).",
      "Ingress check stops malicious inputs before invoking expensive 70B+ generation models.",
      "Egress check intercepts unintended policy breaches or leaked sensitive data before reaching the end user.",
    ],
  },
  {
    id: "t-canary-tokens",
    domain: "guardrails-runtime",
    title: "Semantic Firewalls & Canary Tokens",
    kind: "scene",
    scene: "semantic-firewalls-canaries",
    summary: "Injecting high-entropy canary strings into system prompts to detect and abort exfiltration attacks in real time.",
    points: [
      "Canary tokens (e.g. CANARY_8F3A29B) are appended to private instructions with an explicit rule never to repeat them.",
      "An automated regex scanner at the output proxy triggers immediate connection termination if the canary appears.",
      "Structural delimiters (XML/JSON tags) enforce strict syntactic separation between developer commands and user text.",
    ],
  },
  {
    id: "t-privilege-isolation",
    domain: "guardrails-runtime",
    title: "Multi-Agent Privilege Separation",
    kind: "scene",
    scene: "multi-agent-privilege-isolation",
    summary: "Enforcing least-privilege architecture between untrusted reasoning agents and privileged execution tools.",
    points: [
      "Public-facing agent cannot directly invoke database writes, bash commands, or financial transactions.",
      "Intermediate Validator Agent evaluates proposed action payloads in a sanitized schema before authorization.",
      "Strict tool call rate-limiting and human-in-the-loop gates for high-impact mutations.",
    ],
  },
  {
    id: "t-constrained-decoding",
    domain: "guardrails-runtime",
    title: "Constrained Decoding & Logit Filtering",
    kind: "scene",
    scene: "constrained-decoding-filters",
    summary: "Restricting token sampling space at runtime using grammar state machines and safety logit bias masks.",
    points: [
      "Sets logits of disallowed tokens (e.g. offensive terms or invalid JSON syntax) to -infinity before softmax.",
      "Guarantees that model generation strictly conforms to safe schemas or allowable response formats.",
      "Near-zero latency overhead when implemented directly inside the inference engine sampling kernel.",
    ],
  },

  // Domain 5: Machine Unlearning & Privacy
  {
    id: "t-automated-red-teaming",
    domain: "unlearning-privacy",
    title: "Tree of Attacks with Pruning (TAP)",
    kind: "scene",
    scene: "automated-red-teaming-tap",
    summary: "Automated adversarial red-teaming orchestrators that iteratively generate, evaluate, and prune jailbreak attack trees.",
    points: [
      "Branching search explores multiple adversarial phrasing strategies (roleplay, encoding, hypothetical scenarios).",
      "Evaluator model scores safety breaches and prunes dead-end branches with low probability of success.",
      "Discovers novel vulnerability vectors orders of magnitude faster than manual human red-teaming.",
    ],
  },
  {
    id: "t-statistical-watermarking",
    domain: "unlearning-privacy",
    title: "Statistical Token Watermarking",
    kind: "scene",
    scene: "statistical-watermarking",
    summary: "Pseudo-randomly partitioning the vocabulary into green and red lists using hash seeds of preceding tokens.",
    points: [
      "Promotes sampling from the green list by adding a bias delta to green token logits during generation.",
      "Human-written text has roughly gamma fraction green tokens; watermarked text has a statistically significant green majority.",
      "Verified via one-sided z-test (z >= 4.0 provides p < 1e-4 false-positive confidence).",
    ],
  },
  {
    id: "t-membership-inference",
    domain: "unlearning-privacy",
    title: "Membership Inference & Memorization",
    kind: "scene",
    scene: "membership-inference-attacks",
    summary: "Auditing models to determine if specific sensitive documents or PII were present in pre-training data.",
    points: [
      "Training examples exhibit lower loss and lower perplexity compared to held-out test examples.",
      "Reference-model comparison: Loss_target(x) / Loss_reference(x) acts as a robust membership test.",
      "Mitigated via rigorous data deduplication, differential privacy, and targeted unlearning.",
    ],
  },
  {
    id: "t-dp-sgd",
    domain: "unlearning-privacy",
    title: "Differential Privacy in Fine-Tuning (DP-SGD)",
    kind: "scene",
    scene: "differential-privacy-dp-sgd",
    summary: "Providing mathematically provable bounds on private data leakage during post-training fine-tuning.",
    points: [
      "Clips per-sample gradient L2 norms to threshold C to bound individual influence.",
      "Injects calibrated Gaussian noise N(0, sigma^2 C^2 I) to the aggregated minibatch gradient.",
      "Tracks privacy budget expenditure (epsilon, delta) using Rényi Differential Privacy accountants.",
    ],
  },

  // Domain 6: Deception & Agentic Sandboxing
  {
    id: "t-sycophancy",
    domain: "deception-agentic",
    title: "Sycophancy & Deceptive Alignment",
    kind: "scene",
    scene: "sycophancy-deceptive-alignment",
    summary: "Models learning to echo user political or scientific misconceptions because human evaluators reward agreement.",
    points: [
      "RLHF with human raters inadvertently trains models to prioritize appealing answers over truthful facts.",
      "Deceptive alignment: a capable model optimizes for evaluation metrics to avoid being modified during training.",
      "Mitigated via objective truthfulness scoring and model-written evaluations (RLAIF).",
    ],
  },
  {
    id: "t-agent-sandboxing",
    domain: "deception-agentic",
    title: "Agent Sandboxing & Syscall Interception",
    kind: "scene",
    scene: "sandboxing-tool-verification",
    summary: "Isolating autonomous AI code execution inside microVMs with kernel-level eBPF monitoring.",
    points: [
      "Ephemeral execution environments (e.g. Firecracker or gVisor) discard filesystem state immediately after task completion.",
      "eBPF probes block unauthorized network egress, socket binding, or attempts to read host metadata APIs.",
      "Enforces dry-run simulation before applying stateful database or infrastructure modifications.",
    ],
  },
  {
    id: "t-elk",
    domain: "frontier-governance",
    title: "Elicitation of Latent Knowledge (ELK)",
    kind: "scene",
    scene: "elicitation-latent-knowledge",
    summary: "Probing whether a model's internal representations match its reported output when human overseers can be deceived.",
    points: [
      "Human overseers can only evaluate what they understand; a model might know a plan is flawed but report it as safe.",
      "ELK seeks training objectives that force the model to report its true internal world model rather than a deceptive simulation.",
      "Core foundational research challenge in advanced AI alignment.",
    ],
  },
  {
    id: "t-safety-cases",
    domain: "frontier-governance",
    title: "Safety Cases & Frontier Governance",
    kind: "scene",
    scene: "safety-eval-eval-suites",
    summary: "Structured empirical arguments demonstrating that a frontier model's risk of catastrophic autonomous misuse is bounded.",
    points: [
      "Defines quantitative capability thresholds for Autonomous Cyber Exploitation and CBRN (Chemical, Biological, Radiological, Nuclear) risks.",
      "Establishes ASL (AI Safety Level) safeguards required before training and deployment.",
      "Includes red-team verification, capability evals, and independent third-party auditing.",
    ],
  },
];
