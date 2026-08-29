import { notFound } from "next/navigation";
import TrainShell from "@/components/training/TrainShell";
import {
  Checkpointing, DataParallel, LossCurveScene, MemoryBudget, MoERouting,
  OneStep, PipelineParallel, RingAllReduce, ScalingLaws, TensorParallel,
  TokenDiet,
} from "@/components/training/scenes";
import { TRAIN_JOURNEY } from "@/content/training/journey";

export function generateStaticParams() {
  return TRAIN_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "token-diet": <TokenDiet />,
  "one-step": <OneStep />,
  "loss-curve": <LossCurveScene />,
  "memory-budget": <MemoryBudget />,
  "data-parallel": <DataParallel />,
  "ring-allreduce": <RingAllReduce />,
  "tensor-parallel": <TensorParallel />,
  "pipeline-parallel": <PipelineParallel />,
  "checkpointing": <Checkpointing />,
  "moe-routing": <MoERouting />,
  "scaling-laws": <ScalingLaws />,
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
