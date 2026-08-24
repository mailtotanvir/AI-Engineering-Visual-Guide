import { notFound } from "next/navigation";
import InfShell from "@/components/inference/InfShell";
import {
  ContinuousBatching, DecodeLoop, KvGrowth, LatencyTimeline,
  PagedKv, PrefillDecode, SamplingDemo, Speculative,
} from "@/components/inference/scenes";
import { INF_JOURNEY } from "@/content/inference/journey";

export function generateStaticParams() {
  return INF_JOURNEY.map((j) => ({ id: j.id }));
}

const SCENES: Record<string, React.ReactNode> = {
  "decode-loop": <DecodeLoop />,
  "prefill-decode": <PrefillDecode />,
  "latency-timeline": <LatencyTimeline />,
  "kv-cache": <KvGrowth />,
  "paged-kv": <PagedKv />,
  "continuous-batching": <ContinuousBatching />,
  sampling: <SamplingDemo />,
  speculative: <Speculative />,
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
