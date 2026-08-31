"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { INF_JOURNEY, INF_MODULES, infIndex, infModuleOf, infNeighbors } from "@/content/inference/journey";

export default function InfShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const i = infIndex(id);
  const entry = INF_JOURNEY[i];
  const mod = infModuleOf(id);
  const { prev, next } = infNeighbors(id);

  useEffect(() => {
    const sec = document.getElementById(`inf-${id}`);
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,[role=slider]")) return;
      if (e.key === "ArrowRight" && next) window.location.assign("/inference/scenes/" + next.id + "/");
      else if (e.key === "ArrowLeft" && prev) window.location.assign("/inference/scenes/" + prev.id + "/");
    };
    sec.addEventListener("keydown", onKey);
    return () => sec.removeEventListener("keydown", onKey);
  }, [id, next, prev]);

  if (!entry) return <>{children}</>;

  return (
    <section id={`inf-${id}`} className="sceneSec" tabIndex={-1} aria-label={`Inference scene ${entry.num}, ${entry.title}`}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/inference/">INFERENCE</Link> <i>/</i> {mod ? <Link href={`/inference/#m-${mod.id}`}>MODULE {mod.num}</Link> : "JOURNEY"} <i>/</i> <b>{entry.kicker}</b>
        </nav>
        <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
          <div>
            <p className="kicker"><b>SCENE {entry.num} / 24</b> · {mod ? mod.name.toUpperCase() : entry.title.toUpperCase()}</p>
            <h2 className="sec-title">{entry.title}</h2>
            <p className="sec-sub">{entry.blurb}</p>
          </div>
        </div>
        {children}
        <div className="journeyFoot">
          {prev ? (
            <Link className="btn btnSecondary btnSm" href={`/inference/scenes/${prev.id}/`}>← {prev.num} · {prev.title}</Link>
          ) : (
            <Link className="btn btnGhost btnSm" href="/inference/">← WORLD HOME</Link>
          )}
          <div className="dots" role="list" aria-label="Journey progress">
            {INF_JOURNEY.map((j) => (
              <Link key={j.id} role="listitem" aria-label={j.title}
                href={`/inference/scenes/${j.id}/`}
                className={"dot" + (j.id === id ? " on" : "")} />
            ))}
          </div>
          {next ? (
            <Link className="btn btnPrimary btnSm" href={`/inference/scenes/${next.id}/`}>{next.num} · {next.title} →</Link>
          ) : (
            <Link className="btn btnPrimary btnSm" href="/inference/atlas/">ATLAS →</Link>
          )}
        </div>
      </div>
    </section>
  );
}
