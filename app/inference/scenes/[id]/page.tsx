import { notFound } from "next/navigation";
import InfShell from "@/components/inference/InfShell";
import {
  ContinuousBatching, DecodeLoop, KvGrowth, LatencyTimeline,
  PagedKv, PrefillDecode, SamplingDemo, Speculative,
} from "@/components/inference/scenes";
import {
  AiCompiler, GraphFusion, MemoryWall, QuantLadder, SiliconMap, WarpTensor,
} from "@/components/inference/scenesB";
import {
  ChunkedPrefill, ColdStart, FinopsMig, GrammarMask, KvOffload,
  LogitsPipeline, MoeRouting, PdDisagg, RadixPrefix, TensorPipeline,
} from "@/components/inference/scenesC";
import { INF_JOURNEY } from "@/content/inference/journey";

export function generateStaticParams() {
  return INF_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "decode-loop": <DecodeLoop />,
  "prefill-decode": <PrefillDecode />,
  "latency-timeline": <LatencyTimeline />,
  "silicon-map": <SiliconMap />,
  "memory-wall": <MemoryWall />,
  "warp-tensor": <WarpTensor />,
  "quant-ladder": <QuantLadder />,
  "graph-fusion": <GraphFusion />,
  "ai-compiler": <AiCompiler />,
  "kv-cache": <KvGrowth />,
  "paged-kv": <PagedKv />,
  "radix-prefix": <RadixPrefix />,
  "logits-pipeline": <LogitsPipeline />,
  sampling: <SamplingDemo />,
  "grammar-mask": <GrammarMask />,
  "continuous-batching": <ContinuousBatching />,
  "chunked-prefill": <ChunkedPrefill />,
  "pd-disagg": <PdDisagg />,
  speculative: <Speculative />,
  "tensor-pipeline": <TensorPipeline />,
  "moe-routing": <MoeRouting />,
  "kv-offload": <KvOffload />,
  "cold-start": <ColdStart />,
  "finops-mig": <FinopsMig />,
};

export default function Page({ params }: { params: { id: string } }) {
  const entry = INF_JOURNEY.find((j) => j.id === params.id);
  if (!entry || !SCENES[params.id]) notFound();
  return (
    <main>
      <InfShell id={params.id}>{SCENES[params.id]}</InfShell>
    </main>
  );
}
