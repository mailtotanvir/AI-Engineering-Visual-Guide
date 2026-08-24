"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import { WARP_LANES, computeWarpState } from "@/lib/scenes/warpsState";

const X0 = 34;
const PITCH = 26;
const BASE_Y = 170;

export default function Warps() {
  const svgRef = useRef<SVGSVGElement>(null);
  const capRef = useRef<HTMLSpanElement>(null);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(8000);
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
    type TagMap = { rect: SVGRectElement; text: SVGTextElement; circle: SVGCircleElement };

    const laneDots: SVGCircleElement[] = [];
    for (let i = 0; i < WARP_LANES; i++) {
      laneDots.push(el("circle", { cx: X0 + i * PITCH + 8, cy: BASE_Y, r: 8 }, svg));
    }
    const pathA = el("text", { x: X0 - 6, y: BASE_Y - 66, class: "raceLane" }, svg);
    txt(pathA, "PATH A · if (tid % 2 == 0)");
    const pathB = el("text", { x: X0 - 6, y: BASE_Y + 92, class: "raceLane" }, svg);
    txt(pathB, "PATH B · else");
    const instr = el("text", { x: 900 - 24, y: 40, "text-anchor": "end", class: "lblStrong" }, svg);
    txt(instr, "INSTRUCTION 0");
    const branchMark = el("rect", { x: X0 + 15.5 * PITCH - 2, y: BASE_Y - 80, width: 4, height: 240, rx: 2, class: "warpLine" }, svg);

    let lastPhase = "";
    const un = store.subscribe((ev, t) => {
      if (ev !== "tick") return;
      const s = computeWarpState(t);
      for (let i = 0; i < WARP_LANES; i++) {
        const d = laneDots[i];
        d.setAttribute("cx", String(X0 + i * PITCH + 8));
        d.setAttribute("cy", String(BASE_Y + s.laneOffsetY[i]));
        d.setAttribute("fill-opacity", String(s.laneActive[i]));
        d.setAttribute("fill", s.isEven[i] ? "var(--teal)" : "var(--cyan)");
      }
      instr.textContent = `INSTRUCTION ${s.instructions}`;
      branchMark.style.opacity = s.phase === "unified" ? "0" : String(0.5 * Math.min(1, s.splitProgress * 3));
      if (s.phase !== lastPhase && capRef.current) {
        lastPhase = s.phase;
        capRef.current.textContent =
          s.phase === "unified" ? "32 lanes march through instructions together — that is one warp."
          : s.phase === "split" ? "Branch ahead. The warp splits into two masks."
          : s.phase === "pathA" ? "Path A executes while sixteen lanes sit disabled."
          : s.phase === "pathB" ? "Now path B — the waiting lanes replay their half."
          : "Paths merge back into one warp. That round-trip is the cost of divergence.";
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
        <svg ref={svgRef} viewBox="0 0 900 340" role="img"
          aria-label="One warp of thirty-two lanes diverging around a branch and reconverging" />
        <p className="raceCaption" aria-live="polite"><span ref={capRef}>32 lanes march through instructions together — that is one warp.</span></p>
        <div className="controls" style={{ marginTop: "var(--s3)" }}>
          <button className="btn btnPrimary btnSm" aria-pressed={playing}
            onClick={() => { if (store.t >= 1) store.seek(0); store.togglePlay(); }}>
            {playing ? <>❚❚&nbsp;&nbsp;PAUSE</> : <>▶&nbsp;&nbsp;RUN</>}
          </button>
          <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳&nbsp;&nbsp;RESET</button>
          <span className="chip" style={{ marginLeft: "auto" }}>
            <i style={{ background: "var(--teal)", display: "inline-block", width: 7, height: 7, borderRadius: 2, marginRight: 7 }} />EVEN LANES
            <i style={{ background: "var(--cyan)", display: "inline-block", width: 7, height: 7, borderRadius: 2, margin: "0 7px 0 14px" }} />ODD LANES
          </span>
        </div>
      </div>
    </div>
  );
}

function txt(e: SVGTextElement, s: string) { e.textContent = s; }
