"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { TRAIN_JOURNEY, trainIndex, trainNeighbors } from "@/content/training/journey";

export default function TrainShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const i = trainIndex(id);
  const entry = TRAIN_JOURNEY[i];
  const { prev, next } = trainNeighbors(id);

  useEffect(() => {
    const sec = document.getElementById(`train-${id}`);
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,[role=slider]")) return;
      if (e.key === "ArrowRight" && next) window.location.assign("/training/scenes/" + next.id + "/");
      else if (e.key === "ArrowLeft" && prev) window.location.assign("/training/scenes/" + prev.id + "/");
    };
    sec.addEventListener("keydown", onKey);
    return () => sec.removeEventListener("keydown", onKey);
  }, [id, next, prev]);

  if (!entry) return <>{children}</>;

  return (
    <section id={`train-${id}`} className="sceneSec" tabIndex={-1} aria-label={`Training scene ${entry.num}, ${entry.title}`}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/training/">TRAINING</Link> <i>/</i> JOURNEY <i>/</i> <b>{entry.kicker}</b>
        </nav>
        <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
          <div>
            <p className="kicker"><b>SCENE {entry.num}</b> · {entry.title.toUpperCase()}</p>
            <h2 className="sec-title">{entry.title}</h2>
            <p className="sec-sub">{entry.blurb}</p>
          </div>
        </div>
        {children}
        <div className="journeyFoot">
          {prev ? (
            <Link className="btn btnSecondary btnSm" href={`/training/scenes/${prev.id}/`}>← {prev.num} · {prev.title}</Link>
          ) : (
            <Link className="btn btnGhost btnSm" href="/training/">← WORLD HOME</Link>
          )}
          <div className="dots" role="list" aria-label="Journey progress">
            {TRAIN_JOURNEY.map((j) => (
              <Link key={j.id} role="listitem" aria-label={j.title}
                href={`/training/scenes/${j.id}/`}
                className={"dot" + (j.id === id ? " on" : "")} />
            ))}
          </div>
          {next ? (
            <Link className="btn btnPrimary btnSm" href={`/training/scenes/${next.id}/`}>{next.num} · {next.title} →</Link>
          ) : (
            <Link className="btn btnPrimary btnSm" href="/training/atlas/">ATLAS →</Link>
          )}
        </div>
      </div>
    </section>
  );
}
