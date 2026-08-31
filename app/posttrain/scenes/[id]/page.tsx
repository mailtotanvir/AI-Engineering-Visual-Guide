import { notFound } from "next/navigation";
import PostShell from "@/components/posttrain/PostShell";
import {
  BradleyTerry, BenchmarkContam, Clustering, CotGains, DataFilter, DpoFamily,
  EvalUncertainty, Forgetting, GrpoElim, InferOpt, LlmJudgeBias, LoraMath,
  MmAgentic, PeftLora, QuantGptq, QloraMemory, Redteam, RefusalTrain, RlaifConstit,
  RlhfPpo, RlvrMath, SftBasics, SftTargets, SyntheticSelf,
} from "@/components/posttrain/scenes";
import { POST_JOURNEY } from "@/content/posttrain/journey";

export function generateStaticParams() {
  return POST_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "sft-basics": <SftBasics />,
  "sft-targets": <SftTargets />,
  "peft-lora": <PeftLora />,
  "data-filter": <DataFilter />,
  "clustering": <Clustering />,
  "synthetic-self": <SyntheticSelf />,
  "lora-math": <LoraMath />,
  "qlora-memory": <QloraMemory />,
  "forgetting": <Forgetting />,
  "bradley-terry": <BradleyTerry />,
  "rlhf-ppo": <RlhfPpo />,
  "dpo-family": <DpoFamily />,
  "rlvr-math": <RlvrMath />,
  "grpo-elim": <GrpoElim />,
  "cot-gains": <CotGains />,
  "redteam": <Redteam />,
  "refusal-train": <RefusalTrain />,
  "rlaif-constit": <RlaifConstit />,
  "benchmark-contam": <BenchmarkContam />,
  "llm-judge-bias": <LlmJudgeBias />,
  "eval-uncertainty": <EvalUncertainty />,
  "mm-agentic": <MmAgentic />,
  "quant-gptq": <QuantGptq />,
  "infer-opt": <InferOpt />,
};

export default function Page({ params }: { params: { id: string } }) {
  const entry = POST_JOURNEY.find((j) => j.id === params.id);
  if (!entry || !SCENES[params.id]) notFound();
  return (
    <main>
      <PostShell id={params.id}>{SCENES[params.id]}</PostShell>
    </main>
  );
}
