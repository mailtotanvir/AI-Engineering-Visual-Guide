import { notFound } from "next/navigation";
import TrainShell from "@/components/training/TrainShell";
import {
  BpeScene, CausalMask, Checkpointing, ClmVsMlm, ContextWindow, CrawlFilter,
  DataParallel, DedupScene, GqaScene, MemoryBudget, NormActivation, OneStep,
  OptimizerSchedule, PipelineParallel, PrecisionScene, RingAllReduce, RopeScene,
  ScalingLaws, TelemetryScene, TensorParallel, TokenDiet,
} from "@/components/training/scenes";
import { TRAIN_JOURNEY } from "@/content/training/journey";

export function generateStaticParams() {
  return TRAIN_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "token-diet": <TokenDiet />,
  "clm-vs-mlm": <ClmVsMlm />,
  "one-step": <OneStep />,
  "causal-mask": <CausalMask />,
  "context-window": <ContextWindow />,
  "crawl-filter": <CrawlFilter />,
  "dedup": <DedupScene />,
  "bpe": <BpeScene />,
  "scaling-laws": <ScalingLaws />,
  "rope": <RopeScene />,
  "norm-activation": <NormActivation />,
  "gqa": <GqaScene />,
  "memory-budget": <MemoryBudget />,
  "data-parallel": <DataParallel />,
  "ring-allreduce": <RingAllReduce />,
  "tensor-parallel": <TensorParallel />,
  "pipeline-parallel": <PipelineParallel />,
  "precision": <PrecisionScene />,
  "checkpointing": <Checkpointing />,
  "optimizer-schedule": <OptimizerSchedule />,
  "telemetry": <TelemetryScene />,
};

export default function Page({ params }: { params: { id: string } }) {
  const entry = TRAIN_JOURNEY.find((j) => j.id === params.id);
  if (!entry || !SCENES[params.id]) notFound();
  return (
    <main>
      <TrainShell id={params.id}>{SCENES[params.id]}</TrainShell>
    </main>
  );
}
