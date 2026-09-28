export interface SafetySceneMeta {
  id: string;
  num: string;
  title: string;
  module: string;
  summary: string;
  focus: string;
  threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "DEFENSE" | "GOVERNANCE";
}

export interface SafetyModuleMeta {
  id: string;
  num: string;
  title: string;
  tagline: string;
  description: string;
  scenes: SafetySceneMeta[];
}

export const SAFETY_MODULES: SafetyModuleMeta[] = [
  {
    id: "module-1",
    num: "01",
    title: "Threat Models & Adversarial Attack Surfaces",
    tagline: "Exploiting context, tokens & multimodal boundaries",
    description: "How adversaries bypass safety alignment via in-context saturation, gradient-based suffixes, indirect injection, and cross-modal perturbations.",
    scenes: [
      {
        id: "many-shot-jailbreaking",
        num: "01",
        title: "Many-Shot In-Context Jailbreaking",
        module: "Module 1: Attack Surfaces",
        summary: "Overwhelming safety policy priors by saturating context windows with dozens of benign dialogue demonstrations.",
        focus: "Context window scaling & attention distribution flattening",
        threatLevel: "CRITICAL",
      },
      {
        id: "adversarial-suffixes-gcg",
        num: "02",
        title: "Greedy Coordinate Gradients (GCG)",
        module: "Module 1: Attack Surfaces",
        summary: "Universal discrete token optimization that constructs transferable adversarial suffixes overriding refusal conditioning.",
        focus: "Token gradient search & cross-model transferability",
        threatLevel: "CRITICAL",
      },
      {
        id: "prompt-injection-indirect",
        num: "03",
        title: "Indirect Prompt Injection & Tool Poisoning",
        module: "Module 1: Attack Surfaces",
        summary: "Untrusted web content, email payloads, and poisoned RAG documents hijacking autonomous agent execution.",
        focus: "Data vs instruction boundary confusion",
        threatLevel: "HIGH",
      },
      {
        id: "multimodal-jailbreaks",
        num: "04",
        title: "Multimodal & Cross-Domain Perturbations",
        module: "Module 1: Attack Surfaces",
        summary: "Visual typography, imperceptible pixel noise, and audio harmonics bypassing visual-language guardrails.",
        focus: "Cross-modality alignment discrepancy",
        threatLevel: "HIGH",
      },
    ],
  },
  {
    id: "module-2",
    num: "02",
    title: "Representation Engineering & Mechanistic Safety",
    tagline: "Steering, patching & dissecting model latent states",
    description: "Inspecting and altering the residual stream to discover truthfulness directions, patch refusal circuits, and surgically remove toxic concepts.",
    scenes: [
      {
        id: "steering-vectors-caa",
        num: "05",
        title: "Contrastive Activation Addition (CAA)",
        module: "Module 2: Representation Engineering",
        summary: "Extracting direction vectors from contrastive pairs and steering model activations at inference time.",
        focus: "Latent steering vector math & activation clamping",
        threatLevel: "DEFENSE",
      },
      {
        id: "linear-probes-truthfulness",
        num: "06",
        title: "Linear Probing & Latent Truthfulness",
        module: "Module 2: Representation Engineering",
        summary: "Training linear classifiers on internal layers to detect when a model's latent representation knows a statement is false.",
        focus: "Probing geometry & truthfulness classification",
        threatLevel: "DEFENSE",
      },
      {
        id: "activation-patching-safety",
        num: "07",
        title: "Causal Activation Patching for Refusals",
        module: "Module 2: Representation Engineering",
        summary: "Intervening on specific attention heads and MLP layers to isolate the exact causal circuit that fires refusal tokens.",
        focus: "Circuit discovery & mediation analysis",
        threatLevel: "DEFENSE",
      },
      {
        id: "representation-surgery-unlearning",
        num: "08",
        title: "Subspace Erasure & Representation Surgery",
        module: "Module 2: Representation Engineering",
        summary: "Projecting model weight matrices orthogonal to dangerous concept subspaces to permanently disable hazardous knowledge.",
        focus: "Null-space projection & rank-1 weight surgery",
        threatLevel: "DEFENSE",
      },
    ],
  },
  {
    id: "module-3",
    num: "03",
    title: "Refusal Mechanics & Constitutional Alignment",
    tagline: "Geometry of safety boundaries and self-correction",
    description: "The mathematical structure of refusal directions in activation space, multi-turn constitutional critique loops, and over-refusal Pareto frontiers.",
    scenes: [
      {
        id: "refusal-geometry",
        num: "09",
        title: "The Geometry of Refusal Vectors",
        module: "Module 3: Refusal Mechanics",
        summary: "How post-training aligns the model's residual stream onto a single 1D refusal subspace that governs compliance.",
        focus: "Activation cosine similarity & refusal thresholding",
        threatLevel: "DEFENSE",
      },
      {
        id: "constitutional-ai-critique",
        num: "10",
        title: "Constitutional AI Critique & Revision Loops",
        module: "Module 3: Refusal Mechanics",
        summary: "Automated multi-turn self-critique where a model evaluates candidate outputs against written principles and rewires responses.",
        focus: "Constitutional rule weighting & iterative revision",
        threatLevel: "DEFENSE",
      },
      {
        id: "over-refusal-frontier",
        num: "11",
        title: "The Over-Refusal Sensitivity Frontier",
        module: "Module 3: Refusal Mechanics",
        summary: "Navigating the tension between refusing adversarial attacks and falsely rejecting benign queries containing trigger words.",
        focus: "Pareto curves & false-positive refusal minimization",
        threatLevel: "MEDIUM",
      },
      {
        id: "representation-noising-rmu",
        num: "12",
        title: "Representation Misdirection (RMU)",
        module: "Module 3: Refusal Mechanics",
        summary: "Optimizing hidden states on forget-sets to align with fixed random noise vectors while preserving retain-set utility.",
        focus: "Biosecurity unlearning & retention loss balancing",
        threatLevel: "DEFENSE",
      },
    ],
  },
  {
    id: "module-4",
    num: "04",
    title: "Guardrail Systems & Multi-Agent Defense",
    tagline: "Input/output filters, firewalls & privilege isolation",
    description: "Production defense-in-depth: Llama Guard classifiers, semantic firewalls, multi-agent privilege compartmentalization, and constrained decoding.",
    scenes: [
      {
        id: "llama-guard-moderation",
        num: "13",
        title: "Llama Guard Dual-Layer Moderation",
        module: "Module 4: Guardrail Systems",
        summary: "Deploying lightweight specialized safety classification models at both ingress (prompt) and egress (generation) boundaries.",
        focus: "Taxonomy violation codes & latency trade-offs",
        threatLevel: "DEFENSE",
      },
      {
        id: "semantic-firewalls-canaries",
        num: "14",
        title: "Semantic Firewalls & Canary Tokens",
        module: "Module 4: Guardrail Systems",
        summary: "Embedding cryptographic canary tokens and structural delimiters in system prompts to instantly detect prompt exfiltration.",
        focus: "Leakage detection & regex delimiter containment",
        threatLevel: "DEFENSE",
      },
      {
        id: "multi-agent-privilege-isolation",
        num: "15",
        title: "Multi-Agent Privilege Separation",
        module: "Module 4: Guardrail Systems",
        summary: "Compartmentalizing un-trusted user-facing agents from privileged tool-executors through dual-boundary gateway verifiers.",
        focus: "Principle of least privilege & quarantine zones",
        threatLevel: "DEFENSE",
      },
      {
        id: "constrained-decoding-filters",
        num: "16",
        title: "Constrained Decoding & Logit Filtering",
        module: "Module 4: Guardrail Systems",
        summary: "Modifying token sampling probabilities in real time using grammar constraints, regex masks, and safety logit biases.",
        focus: "Logit suppression & grammar-guided state machines",
        threatLevel: "DEFENSE",
      },
    ],
  },
  {
    id: "module-5",
    num: "05",
    title: "Automated Red Teaming, Watermarking & Privacy",
    tagline: "Tree search attacks, synthetic watermarking & DP-SGD",
    description: "Algorithmic safety stress-testing via Tree of Attacks, statistical token watermarking verification, and differential privacy guarantees.",
    scenes: [
      {
        id: "automated-red-teaming-tap",
        num: "17",
        title: "Tree of Attacks with Pruning (TAP)",
        module: "Module 5: Red Teaming & Privacy",
        summary: "Automated red-teaming orchestrators using tree-search exploration, branching prompt mutations, and evaluator pruning.",
        focus: "Adversarial search trees & mutation scoring",
        threatLevel: "HIGH",
      },
      {
        id: "statistical-watermarking",
        num: "18",
        title: "Statistical Token Watermarking (Green/Red)",
        module: "Module 5: Red Teaming & Privacy",
        summary: "Partitioning the vocabulary into pseudo-random green/red lists based on prior tokens to verify AI-generated text provenance.",
        focus: "Z-score detection thresholds & entropy bounds",
        threatLevel: "DEFENSE",
      },
      {
        id: "membership-inference-attacks",
        num: "19",
        title: "Membership Inference & Data Memorization",
        module: "Module 5: Red Teaming & Privacy",
        summary: "Probing whether a specific private record was included in training data by analyzing token loss distributions and per-example perplexity.",
        focus: "Perplexity ratio tests & memorization probes",
        threatLevel: "HIGH",
      },
      {
        id: "differential-privacy-dp-sgd",
        num: "20",
        title: "Differential Privacy in Fine-Tuning (DP-SGD)",
        module: "Module 5: Red Teaming & Privacy",
        summary: "Provable privacy guarantees via per-sample gradient clipping and calibrated Gaussian noise addition during fine-tuning.",
        focus: "Privacy budget (epsilon, delta) & gradient clipping",
        threatLevel: "DEFENSE",
      },
    ],
  },
  {
    id: "module-6",
    num: "06",
    title: "Deception, Frontier Risks & Governance",
    tagline: "Sycophancy, sandboxing, latent knowledge & safety cases",
    description: "Tackling existential frontier risks: reward gaming sycophancy, agentic sandboxing, eliciting latent knowledge (ELK), and verifiable safety cases.",
    scenes: [
      {
        id: "sycophancy-deceptive-alignment",
        num: "21",
        title: "Sycophancy & Deceptive Alignment",
        module: "Module 6: Deception & Governance",
        summary: "Models flattering user misconceptions or faking alignment during evaluation while optimizing for hidden objectives.",
        focus: "Reward gaming & scratchpad unfaithfulness",
        threatLevel: "CRITICAL",
      },
      {
        id: "sandboxing-tool-verification",
        num: "22",
        title: "Agent Sandboxing & Syscall Interception",
        module: "Module 6: Deception & Governance",
        summary: "Executing agent code in isolated gVisor/Firecracker microVMs with eBPF syscall filtering and dry-run impact simulation.",
        focus: "Blast-radius containment & side-effect verification",
        threatLevel: "DEFENSE",
      },
      {
        id: "elicitation-latent-knowledge",
        num: "23",
        title: "Elicitation of Latent Knowledge (ELK)",
        module: "Module 6: Deception & Governance",
        summary: "Measuring the divergence between what an AI model genuinely 'knows' internally versus what it reports to a human overseer.",
        focus: "Internal belief vs external report divergence",
        threatLevel: "GOVERNANCE",
      },
      {
        id: "safety-eval-eval-suites",
        num: "24",
        title: "Safety Cases & Frontier Evaluation Protocols",
        module: "Module 6: Deception & Governance",
        summary: "Constructing structured, evidence-backed safety cases establishing bounded autonomous replication and cyber-offense risks.",
        focus: "Capability thresholds & multi-party audit gates",
        threatLevel: "GOVERNANCE",
      },
    ],
  },
];

export const ALL_SAFETY_SCENES = SAFETY_MODULES.flatMap((m) => m.scenes);

export function getSafetySceneById(id: string): SafetySceneMeta | undefined {
  return ALL_SAFETY_SCENES.find((s) => s.id === id);
}

export function getAdjacentSafetyScenes(id: string): {
  prev?: SafetySceneMeta;
  next?: SafetySceneMeta;
} {
  const idx = ALL_SAFETY_SCENES.findIndex((s) => s.id === id);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? ALL_SAFETY_SCENES[idx - 1] : undefined,
    next: idx < ALL_SAFETY_SCENES.length - 1 ? ALL_SAFETY_SCENES[idx + 1] : undefined,
  };
}
