"use client";
import React from "react";
import { LAUNCH_SCENE } from "@/content/cuda/scenes";

export default function CodePane({
  hotId,
  onSeek,
}: {
  hotId: string | null;
  onSeek?: (t: number) => void;
}) {
  return (
    <aside className="codePane" aria-label="Kernel source, click a line to jump the timeline there">
      <h5 className="codePaneTitle">{LAUNCH_SCENE.fileLabel}</h5>
      <ol className="codeLines">
        {LAUNCH_SCENE.code.map((line) => (
          <li
            key={line.id}
            id={line.id}
            className={hotId === line.id ? "hot" : ""}
            onClick={() => line.seek !== undefined && onSeek?.(line.seek)}
            style={{ cursor: line.seek !== undefined ? "pointer" : "default" }}
          >
            <span className="ln" aria-hidden="true" />
            <span>
              {line.parts.map((p, i) =>
                p.cls ? (
                  <span key={i} className={p.cls}>{p.text}</span>
                ) : (
                  <React.Fragment key={i}>{p.text}</React.Fragment>
                )
              )}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
