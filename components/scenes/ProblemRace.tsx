"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import { PAIRS, computeRaceState } from "@/lib/scenes/problemState";

const CELL_W = 40;
const GAP = 10;
const X0 = 90;

export default function ProblemRace() {
  const svgRef = useRef<SVGSVGElement>(null);
  const capRef = useRef<HTMLSpanElement>(null);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(5200);
  const store = storeRef.current;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const el = <K extends keyof TagMap>(n: K, a: Record<string, string | number>, p: Element): TagMap[K] => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, String(a[k]));
      p.appendChild(e);
      return e as TagMap[K];
    };
    type TagMap = { rect: SVGRectElement; text: SVGTextElement; polygon: SVGPolygonElement };

    txt(el("text", { x: 24, y: 96, class: "raceLane" }, svg), "CPU · SERIAL");
    txt(el("text", { x: 24, y: 216, class: "raceLane" }, svg), "GPU · PARALLEL");

    const cpuCells: SVGRectElement[] = [];
    const gpuCells: SVGRectElement[] = [];
    for (let i = 0; i < PAIRS; i++) {
      const x = X0 + i * (CELL_W + GAP);
      cpuCells.push(el("rect", { x, y: 70, width: CELL_W, height: 44, rx: 6, class: "raceCell" }, svg));
      gpuCells.push(el("rect", { x, y: 190, width: CELL_W, height: 44, rx: 6, class: "raceCell" }, svg));
    }
    const cursor = el("polygon", { points: "0,58 8,44 -8,44", fill: "var(--iris)", opacity: 0 }, svg);
    const wave = el("rect", { x: X0 - 10, y: 180, width: PAIRS * (CELL_W + GAP), height: 64, rx: 10, style: "fill:rgba(70,227,200,.08)" }, svg);
    const gpuStamp = el("text", { x: X0 + (PAIRS * (CELL_W + GAP)) / 2, y: 218, "text-anchor": "middle", class: "lblStrong", opacity: 0 }, svg);
    txt(gpuStamp, "ALL 16 AT ONCE");

    let lastCap = "";
    const un = store.subscribe((ev, t) => {
      if (ev !== "tick") return;
      const s = computeRaceState(t);
      for (let i = 0; i < PAIRS; i++) {
        cpuCells[i].classList.toggle("cpuDone", i < s.cpuDone);
        gpuCells[i].classList.toggle("gpuDone", s.gpuDone);
      }
      if (s.cpuCursor === null) cursor.setAttribute("opacity", "0");
      else {
        const i = s.cpuCursor;
        const cx = X0 + i * (CELL_W + GAP) + CELL_W / 2;
        cursor.setAttribute("points", `${cx},62 ${cx + 9},48 ${cx - 9},48`);
        cursor.setAttribute("opacity", "1");
      }
      wave.style.opacity = String(s.gpuFlash);
      gpuStamp.setAttribute("opacity", String(Math.max(s.gpuFlash, s.gpuDone ? 0.9 : 0)));
      let cap: string;
      if (t <= 0.01) cap = "Press RUN. Both chips must add the same sixteen pairs.";
      else if (!s.gpuDone && !s.cpuCursor) cap = "Ready…";
      else if (!s.gpuDone && s.cpuCursor !== null) cap = `CPU is on pair ${Math.min(PAIRS, s.cpuDone + 1)} of ${PAIRS}…`;
      else if (!s.cpuCursor && s.gpuDone) cap = "Both lanes finished. Same answer.";
      else cap = `The GPU finished all ${PAIRS} while the CPU was still on pair ${Math.min(PAIRS, s.cpuDone + 1)}.`;
      if (cap !== lastCap && capRef.current) {
        lastCap = cap;
        capRef.current.textContent = cap;
      }
    });
    const unP = store.subscribe((ev) => {
      if (ev === "play") setPlaying(true);
      if (ev === "pause") setPlaying(false);
    });
    return () => { un(); unP(); svg.replaceChildren(); };
  }, [store]);

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)" }}>
        <svg ref={svgRef} viewBox="0 0 900 300" role="img"
          aria-label="Two lanes: a CPU adding sixteen pairs one by one, and a GPU adding them all simultaneously" />
        <p className="raceCaption" aria-live="polite"><span ref={capRef}>Press RUN. Both chips must add the same sixteen pairs.</span></p>
        <div className="controls" style={{ marginTop: "var(--s3)" }}>
          <button className="btn btnPrimary btnSm" aria-pressed={playing}
            onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
            {playing ? <>❚❚&nbsp;&nbsp;PAUSE</> : <>▶&nbsp;&nbsp;RUN</>}
          </button>
          <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳&nbsp;&nbsp;RESET</button>
          <span className="chip" style={{ marginLeft: "auto" }}>SAME WORK · SAME ANSWER · DIFFERENT CLOCKS</span>
        </div>
      </div>
    </div>
  );
}

type TagMap = { rect: SVGRectElement; text: SVGTextElement; polygon: SVGPolygonElement };
function txt(e: SVGTextElement, s: string) { e.textContent = s; }
