"use client";
import React, { useEffect, useRef } from "react";
import { TimelineStore } from "@/lib/engine/timeline";

const SEGS: [string, number][] = [
  ["CPU", 12],
  ["LAUNCH", 6],
  ["GRID", 14],
  ["SCHEDULE", 22],
  ["EXECUTE", 22],
  ["STORE", 16],
  ["DONE", 8],
];
const JUMPS = [0, 0.12, 0.18, 0.32, 0.54, 0.76, 0.92];
const BG: string[] = [
  "rgba(159,182,187,.05)", "rgba(70,227,200,.06)", "rgba(164,143,255,.06)",
  "rgba(92,200,255,.06)", "rgba(70,227,200,.08)", "rgba(255,127,165,.06)",
  "rgba(123,228,149,.06)",
];

export default function TimelineBar({ store }: { store: TimelineStore }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onTick = (_ev: string, t: number) => {
      if (fillRef.current) fillRef.current.style.width = t * 100 + "%";
      if (handleRef.current) handleRef.current.style.left = t * 100 + "%";
      trackRef.current?.setAttribute("aria-valuenow", String(Math.round(t * 100)));
    };
    return store.subscribe((ev, t) => {
      if (ev === "tick") onTick(ev, t);
    });
  }, [store]);

  const seekFrom = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (r) store.seek((clientX - r.left) / r.width);
  };

  return (
    <div
      ref={trackRef}
      className="tlTrack"
      role="slider"
      tabIndex={0}
      aria-label="Execution timeline position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); store.nudge(0.02); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); store.nudge(-0.02); }
        else if (e.key === "Home") { e.preventDefault(); store.seek(0); }
        else if (e.key === "End") { e.preventDefault(); store.seek(1); }
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        seekFrom(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && seekFrom(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <div className="tlFill" ref={fillRef} />
      {SEGS.map(([label, flex], i) => (
        <div
          key={label}
          className="tlSeg"
          style={{ flex, background: BG[i], borderRight: i === SEGS.length - 1 ? "0" : undefined }}
          data-jump={JUMPS[i]}
          onClick={() => { store.pause(); store.seek(JUMPS[i]); }}
        >
          <span>{label}</span>
        </div>
      ))}
      <div className="tlHandle" ref={handleRef} />
    </div>
  );
}
