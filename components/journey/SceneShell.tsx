"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { JOURNEY, journeyIndex, journeyNeighbors } from "@/content/cuda/journey";

export default function SceneShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const i = journeyIndex(id);
  const entry = JOURNEY[i];
  const { prev, next } = journeyNeighbors(id);

  useEffect(() => {
    const sec = document.getElementById(`scene-${id}`);
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,[role=slider]")) return;
      if (e.key === "ArrowRight" && next) window.location.assign(next.href);
      else if (e.key === "ArrowLeft" && prev) window.location.assign(prev.href);
    };
    sec.addEventListener("keydown", onKey);
    return () => sec.removeEventListener("keydown", onKey);
  }, [id, next, prev]);

  if (!entry) return <>{children}</>;

  return (
    <section id={`scene-${id}`} className="sceneSec" tabIndex={-1} aria-label={`Scene ${entry.num}, ${entry.title}`}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Journey breadcrumb">
          CUDA <i>/</i> JOURNEY <i>/</i> <b>{entry.kicker}</b>
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
            <Link className="btn btnSecondary btnSm" href={prev.href}>← {prev.num} · {prev.title}</Link>
          ) : (
            <span />
          )}
          <div className="dots" role="list" aria-label="Journey progress">
            {JOURNEY.map((j) => (
              <Link
                key={j.id}
                href={j.href}
                role="listitem"
                aria-label={`${j.num} ${j.title}`}
                className={"dot" + (j.id === id ? " on" : "")}
              />
            ))}
          </div>
          {next ? (
            <Link className="btn btnPrimary btnSm" href={next.href}>{next.num} · {next.title} →</Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
