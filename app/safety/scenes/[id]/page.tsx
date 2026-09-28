import { notFound } from "next/navigation";
import SafetyShell from "@/components/safety/SafetyShell";
import { ALL_SAFETY_SCENES, getSafetySceneById } from "@/content/safety/journey";
import {
  ManyShotScene,
  GCGScene,
  IndirectInjectionScene,
  MultimodalJailbreakScene,
  CAASteeringScene,
  LinearProbesScene,
  ActivationPatchingScene,
  RepresentationSurgeryScene,
  RefusalGeometryScene,
  ConstitutionalAIScene,
  OverRefusalScene,
  RMUUnlearningScene,
} from "@/components/safety/scenes";
import {
  LlamaGuardScene,
  CanaryFirewallScene,
  MultiAgentPrivilegeScene,
  ConstrainedDecodingScene,
  AutomatedRedTeamingTAPScene,
  StatisticalWatermarkingScene,
  MembershipInferenceScene,
  DPSGDScene,
  SycophancyScene,
  AgentSandboxingScene,
  ELKScene,
  SafetyEvalSuitesScene,
} from "@/components/safety/scenesB";

export function generateStaticParams() {
  return ALL_SAFETY_SCENES.map((s) => ({ id: s.id }));
}

const SCENE_COMPONENTS: Record<string, React.ReactNode> = {
  // Module 1
  "many-shot-jailbreaking": <ManyShotScene />,
  "adversarial-suffixes-gcg": <GCGScene />,
  "prompt-injection-indirect": <IndirectInjectionScene />,
  "multimodal-jailbreaks": <MultimodalJailbreakScene />,

  // Module 2
  "steering-vectors-caa": <CAASteeringScene />,
  "linear-probes-truthfulness": <LinearProbesScene />,
  "activation-patching-safety": <ActivationPatchingScene />,
  "representation-surgery-unlearning": <RepresentationSurgeryScene />,

  // Module 3
  "refusal-geometry": <RefusalGeometryScene />,
  "constitutional-ai-critique": <ConstitutionalAIScene />,
  "over-refusal-frontier": <OverRefusalScene />,
  "representation-noising-rmu": <RMUUnlearningScene />,

  // Module 4
  "llama-guard-moderation": <LlamaGuardScene />,
  "semantic-firewalls-canaries": <CanaryFirewallScene />,
  "multi-agent-privilege-isolation": <MultiAgentPrivilegeScene />,
  "constrained-decoding-filters": <ConstrainedDecodingScene />,

  // Module 5
  "automated-red-teaming-tap": <AutomatedRedTeamingTAPScene />,
  "statistical-watermarking": <StatisticalWatermarkingScene />,
  "membership-inference-attacks": <MembershipInferenceScene />,
  "differential-privacy-dp-sgd": <DPSGDScene />,

  // Module 6
  "sycophancy-deceptive-alignment": <SycophancyScene />,
  "sandboxing-tool-verification": <AgentSandboxingScene />,
  "elicitation-latent-knowledge": <ELKScene />,
  "safety-eval-eval-suites": <SafetyEvalSuitesScene />,
};

export default function SafetyScenePage({ params }: { params: { id: string } }) {
  const scene = getSafetySceneById(params.id);
  const component = SCENE_COMPONENTS[params.id];

  if (!scene || !component) {
    notFound();
  }

  return <SafetyShell scene={scene}>{component}</SafetyShell>;
}
