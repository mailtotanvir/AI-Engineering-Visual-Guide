"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import { buildMiniLaunch } from "@/lib/scenes/miniLaunch";

export default function InstrumentDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(5200);
  const store = storeRef.current;

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [labels, setLabels] = useState(false);
  const [progress, setProgress] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const scene = buildMiniLaunch(svgRef.current);
    const unTick = store.subscribe((ev, t) => {
      if (ev !== "tick") return;
      scene.render(t);
      setProgress(t);
      if (barRef.current) barRef.current.style.width = t * 100 + "%";
    });
    scene.render(store.t);
    return () => { unTick(); store.pause(); scene.destroy(); };
  }, [store]);

  const stages: [number, string][] = [
    [0.02, "LAUNCH PACKET"],
    [0.07, "BLOCKS SPAWN"],
    [0.26, "SCHEDULING"],
    [0.5, "WARPS EXECUTE"],
    [0.62, "MEMORY STORE"],
    [0.95, "LOOP RESET"],
  ];
  const stageLabel =
    progress <= 0.02 ? "READY" : [...stages].reverse().find(([a]) => progress >= a)?.[1] ?? "RUNNING";

  return (
    <div>
      <svg ref={svgRef} viewBox="0 0 420 260" role="img"
        aria-label="Interactive miniature kernel launch controlled by the instruments below"
        style={{ width: "100%", height: "auto", display: "block" }} />
      <div className="tlTrack" style={{ height: 8, marginTop: "var(--s3)", borderRadius: 4 }} aria-hidden="true">
        <div className="tlFill" ref={barRef} style={{ width: 0 }} />
      </div>
      <p className="kicker" aria-live="polite" style={{ margin: "var(--s2) 0 0" }}>{stageLabel}</p>

      <div className="controls" style={{ marginTop: "var(--s3)" }}>
        <button
          className="btn btnPrimary btnSm"
          aria-pressed={playing}
          onClick={() => {
            if (store.t >= 1) store.seek(0);
            store.togglePlay();
          }}
        >
          {playing ? <>❚❚&nbsp;&nbsp;PAUSE</> : <>▶&nbsp;&nbsp;RUN</>}
        </button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳&nbsp;&nbsp;RESET</button>
        <button className="btn btnSecondary btnSm" onClick={() => store.nudge(0.04)}>⏭&nbsp;&nbsp;STEP</button>
        <button
          className={"btn btnSm " + (labels ? "btnGoldO" : "btnGhost")}
          aria-pressed={labels}
          onClick={() => {
            const v = !labels;
            setLabels(v);
            svgRef.current?.classList.toggle("showLabels", v);
          }}
        >
          INSPECT
        </button>
        <div className="seg" role="radiogroup" aria-label="Playback speed">
          <button type="button" role="radio" aria-checked={speed === 1} onClick={() => { setSpeed(1); store.setSpeed(1); }}>1×</button>
          <button type="button" role="radio" aria-checked={speed === 0.5} onClick={() => { setSpeed(0.5); store.setSpeed(0.5); }}>½×</button>
        </div>
      </div>
    </div>
  );
}
