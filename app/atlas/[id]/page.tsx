import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  BanksDemo, OccupancyDemo, TilingDemo,
  AtomicsDemo, StreamsDemo, GraphsDemo, NvccFlow,
} from "@/components/atlas/demos";
import { DOMAINS, DOMAIN_COLORS, TOPICS } from "@/content/cuda/atlas";

export function generateStaticParams() {
  return TOPICS.filter((t) => t.kind === "interactive").map((t) => ({ id: t.interactiveId! }));
}

const DEMOS: Record<string, ReactNode> = {
  banks: <BanksDemo />,
  occupancy: <OccupancyDemo />,
  tiling: <TilingDemo />,
  atomics: <AtomicsDemo />,
  streams: <StreamsDemo />,
  graphs: <GraphsDemo />,
  nvcc: <NvccFlow />,
};

export default function Page({ params }: { params: { id: string } }) {
  const topic = TOPICS.find((t) => t.interactiveId === params.id);
  if (!topic || topic.kind !== "interactive") notFound();
  const domain = DOMAINS.find((d) => d.id === topic.domain)!;
  const color = DOMAIN_COLORS[topic.domain] ?? "var(--teal)";

  return (
    <main>
      <section className="sceneSec" aria-label={`Atlas exhibit, ${topic.title}`}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            CUDA <i>/</i> ATLAS <i>/</i> {domain.name.toUpperCase()} <i>/</i> <b>{topic.title.toUpperCase()}</b>
          </nav>
          <div className="sec-head">
            <div>
              <p className="kicker"><b>ATLAS EXHIBIT</b> · {domain.name.toUpperCase()}</p>
              <h2 className="sec-title">{topic.title}</h2>
              <p className="sec-sub">{topic.summary}</p>
            </div>
            <Link className="iconBtn" href="/atlas/">← ALL ENTRIES</Link>
          </div>
          {DEMOS[params.id]}
        </div>
      </section>
    </main>
  );
}

