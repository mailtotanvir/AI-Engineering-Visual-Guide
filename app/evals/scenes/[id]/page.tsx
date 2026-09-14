import { notFound } from "next/navigation";
import EvalShell from "@/components/evals/EvalShell";
import {
  EvalLoop, CapabilityVsAlignment, StaticVsDynamic, ItemAnatomy,
  DifficultyCalibration, CoverageTaxonomy, NgramContam, CanaryTrap,
  PrivateRotating, ExactMatch, OverlapMetrics, ProgrammaticGrading,
} from "@/components/evals/scenes";
import {
  JudgeRubric, PairwiseJudge, JudgeBias, AnnotationProtocol, InterAnnotator,
  ArenaElo, ConfidenceIntervals, PairedTests, BootstrapMultiple,
  RegressionGate, PromptRegression, OnlineDrift,
} from "@/components/evals/scenesB";
import { EVAL_JOURNEY } from "@/content/evals/journey";

export function generateStaticParams() {
  return EVAL_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "eval-loop": <EvalLoop />,
  "capability-vs-alignment": <CapabilityVsAlignment />,
  "static-vs-dynamic": <StaticVsDynamic />,
  "item-anatomy": <ItemAnatomy />,
  "difficulty-calibration": <DifficultyCalibration />,
  "coverage-taxonomy": <CoverageTaxonomy />,
  "ngram-contam": <NgramContam />,
  "canary-trap": <CanaryTrap />,
  "private-rotating": <PrivateRotating />,
  "exact-match": <ExactMatch />,
  "overlap-metrics": <OverlapMetrics />,
  "programmatic-grading": <ProgrammaticGrading />,
  "judge-rubric": <JudgeRubric />,
  "pairwise-judge": <PairwiseJudge />,
  "judge-bias": <JudgeBias />,
  "annotation-protocol": <AnnotationProtocol />,
  "inter-annotator": <InterAnnotator />,
  "arena-elo": <ArenaElo />,
  "confidence-intervals": <ConfidenceIntervals />,
  "paired-tests": <PairedTests />,
  "bootstrap-multiple": <BootstrapMultiple />,
  "regression-gate": <RegressionGate />,
  "prompt-regression": <PromptRegression />,
  "online-drift": <OnlineDrift />,
};

export default function Page({ params }: { params: { id: string } }) {
  const entry = EVAL_JOURNEY.find((j) => j.id === params.id);
  if (!entry || !SCENES[params.id]) notFound();
  return (
    <main>
      <EvalShell id={params.id}>{SCENES[params.id]}</EvalShell>
    </main>
  );
}
