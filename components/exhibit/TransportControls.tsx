"use client";
import React, { useEffect, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";

export default function TransportControls({ store }: { store: TimelineStore }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const unA = store.subscribe((ev) => {
      if (ev === "play") setPlaying(true);
      if (ev === "pause") setPlaying(false);
    });
    const unB = store.subscribe((ev) => {
      if (ev === "speed") setSpeed(store.speed);
    });
    return () => { unA(); unB(); };
  }, [store]);

  const speeds: [number, string][] = [[1, "1×"], [2, "2×"], [0.5, "½×"]];

  return (
    <div className="controls">
      <button
        className="btn btnPrimary btnSm"
        id="runBtn"
        aria-pressed={playing}
        onClick={() => {
          if (store.t >= 1) store.seek(0);
          store.togglePlay();
        }}
      >
        {playing ? <>❚❚&nbsp;&nbsp;PAUSE</> : <>▶&nbsp;&nbsp;RUN</>}
      </button>
      <button className="btn btnSecondary btnSm" aria-label="Step back in time" onClick={() => store.stepBack()}>
        ⏪&nbsp;&nbsp;BACK
      </button>
      <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>
        ⟳&nbsp;&nbsp;RESET
      </button>
      <button className="btn btnSecondary btnSm" onClick={() => store.stepForward()}>
        ⏭&nbsp;&nbsp;STEP
      </button>
      <div className="seg" role="radiogroup" aria-label="Playback speed" style={{ marginLeft: 6 }}>
        {speeds.map(([v, text]) => (
          <button
            key={text}
            type="button"
            role="radio"
            aria-checked={speed === v}
            onClick={() => store.setSpeed(v)}
          >
            {text}
          </button>
        ))}
      </div>
      <span className="chip" style={{ marginLeft: "auto" }}>
        DRAG TIME · CLICK CODE · CLICK ANY OBJECT TO INSPECT
      </span>
    </div>
  );
}
