"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TimelineStore } from "@/lib/engine/timeline";
import { LaunchScene, Selection } from "@/lib/scene/launchScene";
import CodePane from "./CodePane";
import TimelineBar from "./TimelineBar";
import TransportControls from "./TransportControls";
import { LAUNCH_SCENE, inspectInfo } from "@/content/cuda/scenes";
import { LaunchConfig, launchSummary } from "@/lib/engine/launchConfig";

export default function LaunchExhibit() {
  const svgRef = useRef<SVGSVGElement>(null);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore();
  const store = storeRef.current;

  const [status, setStatus] = useState("READY · PRESS RUN");
  const [hotCode, setHotCode] = useState<string | null>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [explorer, setExplorer] = useState(false);
  const [cfg, setCfg] = useState<LaunchConfig>({ blocks: 4, threadsPerBlock: 256 });
  const [MonacoComp, setMonacoComp] = useState<React.ComponentType<{
    hotLineId: string | null;
    onSeek: (t: number) => void;
    onConfigChange: (c: LaunchConfig) => void;
  }> | null>(null);
  const sceneRef = useRef<LaunchScene | null>(null);
  const secRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    import("./MonacoKernel")
      .then((m) => live && setMonacoComp(() => m.default))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const scene = new LaunchScene(svgRef.current, {
      onSelect: (sel) => setSel(sel),
      onSeekRequest: (t) => store.seek(t),
    });
    scene.setConfig(cfg);
    sceneRef.current = scene;
    const unTick = store.subscribe((ev, t) => {
      if (ev === "tick") scene.render(t);
    });
    const unStage = store.subscribe((_ev, _t, stageKey) => {
      if (stageKey === "ready") setStatus("READY · PRESS RUN");
      else if (stageKey === "done") setStatus("COMPLETE");
      else {
        const st = LAUNCH_SCENE.codeForStage;
        type K = keyof typeof st;
        const label = (
          {
            cpu: "CPU PREPARES", launch: "KERNEL LAUNCH", grid: "GRID CREATED",
            sched: "BLOCKS SCHEDULED", exec: "WARPS EXECUTE", store: "MEMORY STORE",
          } as Record<string, string>
        )[stageKey] || stageKey.toUpperCase();
        setStatus(label);
        setHotCode((st as Record<string, string>)[stageKey] || null);
      }
    });
    scene.render(0);
    return () => {
      unTick();
      unStage();
      store.pause();
      scene.destroy();
    };
  }, [store]);

  useEffect(() => {
    sceneRef.current?.setConfig(cfg);
  }, [cfg]);

  useEffect(() => {
    document.body.classList.toggle("explorer", explorer);
    if (explorer) pillRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setExplorer(false);
    document.addEventListener("keydown", esc);
    return () => {
      document.body.classList.remove("explorer");
      document.removeEventListener("keydown", esc);
    };
  }, [explorer]);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.(".tlTrack")) return;
      if ((e.target as HTMLElement)?.closest?.("button")) return;
      if (e.code === "Space") {
        e.preventDefault();
        store.togglePlay();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        store.reset();
      } else if (e.key === "ArrowRight") store.nudge(0.02);
      else if (e.key === "ArrowLeft") store.nudge(-0.02);
    };
    sec.addEventListener("keydown", onKey);
    return () => sec.removeEventListener("keydown", onKey);
  }, [store]);

  const info = sel ? inspectInfo(sel.key, cfg.threadsPerBlock) : null;
  const hotLineNumber = LAUNCH_SCENE.code.findIndex((l) => l.id === hotCode) + 1 || null;

  return (
    <section
      ref={secRef}
      id="exhibit-launch"
      className={explorer ? "exOpen" : ""}
      aria-label="Exhibit one, the launch"
      tabIndex={-1}
    >
      <div className="wrap">
        <div className="sec-head">
          <div>
            <p className="kicker"><b>EXHIBIT 01</b> · THE LAUNCH</p>
            <h2 className="sec-title">{LAUNCH_SCENE.title}</h2>
          </div>
          <div className="headSide">
            <span className="statusChip" aria-live="polite">
              <span className="statusDot" aria-hidden="true" />
              <span>{status}</span>
            </span>
            <span className="configChip">{launchSummary(cfg)}</span>
            <button
              className="iconBtn"
              aria-expanded={explorer}
              onClick={() => setExplorer(!explorer)}
            >
              ⤢&nbsp;EXPLORE
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="exGrid">
            {MonacoComp ? (
              <MonacoComp
                hotLineId={hotCode}
                onSeek={(t) => store.seek(t)}
                onConfigChange={setCfg}
              />
            ) : (
              <CodePane hotId={hotCode} onSeek={(t) => store.seek(t)} />
            )}
            <div className="canvasWrap">
              <svg
                ref={svgRef}
                viewBox="0 0 1200 620"
                role="img"
                aria-label="GPU diagram: the host launches a kernel; the grid materializes, is scheduled onto six SMs, executes in lockstep waves, and stores results to global memory. Click any object to inspect it."
              />
              <div className={"inspCard" + (info ? " show" : "")} role="status">
                <div className="inspHead">
                  <span className="kicker">{info?.kick}</span>
                  <button className="inspClose" aria-label="Close inspector" onClick={() => setSel(null)}>×</button>
                </div>
                <h4>{info?.title}</h4>
                <p>{info?.body}</p>
                {info?.link && (
                  <Link className="linkArrow" href={info.link} style={{ display: "inline-block", marginTop: 12 }}>
                    {info.linkLabel}
                  </Link>
                )}
              </div>
              <div className="legend">
                {LAUNCH_SCENE.legend.map((l) => (
                  <span key={l.label}>
                    <i style={{ background: l.color }} />{l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="exFoot">
            <TimelineBar store={store} />
            <TransportControls store={store} />
          </div>
        </div>
      </div>
      {explorer && (
        <button ref={pillRef} className="exitPill" onClick={() => setExplorer(false)}>← EXIT EXPLORER</button>
      )}
    </section>
  );
}
