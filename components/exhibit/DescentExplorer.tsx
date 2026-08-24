"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotion } from "@/components/shell/MotionProvider";

interface Layer {
  name: string;
  cap: string;
  glyph: React.ReactNode;
}

const G = { stroke: "rgba(159,182,187,.3)", fill: "none" } as const;

function GlyphProgram() {
  return (
    <>
      <rect x="60" y="30" width="200" height="160" rx="14" className="glStroke glFill" />
      <text x="82" y="62" className="glTxt" style={{ fill: "var(--ink3)" }}>vector_add.cu</text>
      <rect x="82" y="76" width="156" height="9" rx="4" style={{ fill: "rgba(159,182,187,.22)" }} />
      <rect x="82" y="94" width="118" height="9" rx="4" style={{ fill: "rgba(159,182,187,.16)" }} />
      <rect x="82" y="112" width="156" height="9" rx="4" style={{ fill: "rgba(70,227,200,.55)" }} />
      <rect x="82" y="130" width="96" height="9" rx="4" style={{ fill: "rgba(159,182,187,.16)" }} />
      <rect x="82" y="148" width="134" height="9" rx="4" style={{ fill: "rgba(159,182,187,.16)" }} />
    </>
  );
}
function GlyphKernel() {
  return (
    <>
      <rect x="70" y="55" width="180" height="110" rx="14" className="glStroke glFill" />
      <rect x="70" y="55" width="180" height="34" rx="14" style={{ fill: "rgba(70,227,200,.14)" }} />
      <text x="88" y="77" className="glTxt" style={{ fill: "var(--teal)" }}>__global__ add()</text>
      <rect x="88" y="104" width="120" height="8" rx="4" style={{ fill: "rgba(159,182,187,.2)" }} />
      <rect x="88" y="121" width="88" height="8" rx="4" style={{ fill: "rgba(159,182,187,.14)" }} />
      <rect x="88" y="138" width="104" height="8" rx="4" style={{ fill: "rgba(159,182,187,.14)" }} />
    </>
  );
}
function GlyphGrid() {
  const cells = [];
  for (let i = 0; i < 12; i++) {
    const gx = 98 + (i % 3) * 44, gy = 38 + Math.floor(i / 3) * 37, acc = i === 5;
    cells.push(
      <rect key={i} x={gx} y={gy} width="36" height="29" rx="6"
        style={{ fill: acc ? "rgba(164,143,255,.28)" : "rgba(164,143,255,.08)", stroke: acc ? "var(--iris)" : "rgba(164,143,255,.4)" }} />
    );
  }
  return (
    <>
      {cells}
      <text x="98" y="205" className="glTxt" style={{ fill: "var(--ink3)" }}>GRID · 3 × 4 BLOCKS</text>
    </>
  );
}
function GlyphBlock() {
  const dots = [];
  for (let j = 0; j < 8; j++) {
    dots.push(<circle key={j} cx={125 + (j % 4) * 19} cy={68 + Math.floor(j / 4) * 34} r={7}
      style={{ fill: "var(--teal)", opacity: j % 2 ? 0.55 : 0.9 }} />);
  }
  return (
    <>
      <rect x="105" y="35" width="110" height="140" rx="12" style={{ fill: "rgba(164,143,255,.1)", stroke: "var(--iris)" }} />
      {dots}
      <text x="105" y="205" className="glTxt" style={{ fill: "var(--ink3)" }}>ONE BLOCK</text>
    </>
  );
}
function GlyphWarp() {
  const lanes = [];
  for (let j = 0; j < 32; j++) {
    lanes.push(<circle key={j} cx={60 + (j % 16) * 12.6} cy={j < 16 ? 86 : 126} r={4}
      style={{ fill: "var(--cyan)", opacity: j < 8 ? 0.95 : 0.6 }} />);
  }
  return (
    <>
      <rect x="42" y="52" width="236" height="108" rx="12" style={{ fill: "none", stroke: "rgba(92,200,255,.45)", strokeDasharray: "5 5" }} />
      {lanes}
      <text x="42" y="188" className="glTxt" style={{ fill: "var(--ink3)" }}>WARP · 32 LANES · LOCKSTEP</text>
    </>
  );
}
function GlyphThread() {
  return (
    <>
      <defs>
        <marker id="arrh" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--gold)" />
        </marker>
      </defs>
      <circle cx="120" cy="110" r="16" style={{ fill: "rgba(70,227,200,.18)" }} />
      <circle cx="120" cy="110" r="8" style={{ fill: "var(--teal)" }} />
      <path d="M120 74 V146 M84 110 H156" stroke="rgba(70,227,200,.35)" strokeDasharray="3 5" />
      <path d="M150 110 C 190 110, 195 110, 218 110" stroke="var(--gold)" markerEnd="url(#arrh)" />
      <rect x="222" y="92" width="44" height="36" rx="8" style={{ fill: "rgba(255,196,107,.12)", stroke: "var(--gold)" }} />
      <text x="244" y="115" textAnchor="middle" className="glTxt" style={{ fill: "var(--gold)" }}>a[i]</text>
    </>
  );
}
function GlyphSM() {
  const lanes = [];
  for (let j = 0; j < 24; j++) {
    lanes.push(<rect key={j} x={96 + (j % 8) * 17} y={96 + Math.floor(j / 8) * 26} width="12" height="16" rx="3"
      style={{ fill: `rgba(255,196,107,${j % 5 ? 0.28 : 0.6})` }} />);
  }
  return (
    <>
      <rect x="72" y="34" width="176" height="150" rx="14" style={{ fill: "rgba(255,196,107,.06)", stroke: "var(--gold)" }} />
      <rect x="88" y="50" width="144" height="22" rx="7" style={{ fill: "rgba(255,196,107,.16)" }} />
      <text x="160" y="65" textAnchor="middle" className="glTxt" style={{ fill: "var(--gold)" }}>WARP SCHEDULER</text>
      {lanes}
    </>
  );
}
function GlyphMemory() {
  return (
    <>
      <polygon points="160,30 208,74 112,74" style={{ fill: "rgba(70,227,200,.5)" }} />
      <polygon points="103,86 217,86 245,132 75,132" style={{ fill: "rgba(255,196,107,.4)" }} />
      <polygon points="63,144 257,144 285,192 35,192" style={{ fill: "rgba(255,127,165,.4)" }} />
      <text x="160" y="62" textAnchor="middle" className="glTxt" style={{ fill: "#04211B" }}>REGISTERS</text>
      <text x="160" y="115" textAnchor="middle" className="glTxt" style={{ fill: "#241703" }}>SHARED</text>
      <text x="160" y="173" textAnchor="middle" className="glTxt" style={{ fill: "#2B0A14" }}>GLOBAL</text>
    </>
  );
}

const LAYERS: Layer[] = [
  { name: "CUDA PROGRAM", cap: "Plain source code. One decorated line is about to change everything.", glyph: <GlyphProgram /> },
  { name: "KERNEL", cap: "__global__ void add() — the function the device runs, once per thread.", glyph: <GlyphKernel /> },
  { name: "GRID", cap: "Every block created by a single launch: add<<<4,256>>>. One call, thousands of workers.", glyph: <GlyphGrid /> },
  { name: "BLOCK", cap: "A squad of threads sharing fast memory and a scheduler slot. Here: one block, eight lanes.", glyph: <GlyphBlock /> },
  { name: "WARP", cap: "32 threads stepping through instructions together. Lockstep is why branches cost.", glyph: <GlyphWarp /> },
  { name: "THREAD", cap: "One instance of your code, with its own index — and its own piece of the answer.", glyph: <GlyphThread /> },
  { name: "SM", cap: "The streaming multiprocessor: fetches, schedules and retires warps on its lanes.", glyph: <GlyphSM /> },
  { name: "MEMORY", cap: "Registers, shared, global: small and near beats large and far. Distance is the real cost.", glyph: <GlyphMemory /> },
];

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

export default function DescentExplorer() {
  const [idx, setIdx] = useState(0);
  const [swap, setSwap] = useState<"" | "swapOut" | "swapIn">("");
  const stageRef = useRef<HTMLDivElement>(null);
  const secRef = useRef<HTMLElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { reduced } = useMotion();

  const show = (next: number, instant = false) => {
    const target = (next + LAYERS.length) % LAYERS.length;
    if (target === idx && !instant) return;
    const apply = () => setIdx(target);
    if (instant || reduced) { apply(); return; }
    setSwap("swapOut");
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => {
        apply();
        setSwap("swapIn");
        requestAnimationFrame(() => requestAnimationFrame(() => setSwap("")));
      }, 180),
    ];
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
    };
    let lock = 0;
    const stageEl = stageRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const n = performance.now();
      if (n - lock < 260 || Math.abs(e.deltaY) < 12) return;
      lock = n;
      show(e.deltaY > 0 ? idx + 1 : idx - 1);
    };
    let swipe: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => { swipe = { x: e.clientX, y: e.clientY }; };
    const up = (e: PointerEvent) => {
      if (!swipe) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) > 44 && Math.abs(dy) < 60) show(dx < 0 ? idx + 1 : idx - 1);
    };
    sec.addEventListener("keydown", onKey);
    stageEl?.addEventListener("wheel", onWheel, { passive: false });
    stageEl?.addEventListener("pointerdown", down);
    stageEl?.addEventListener("pointerup", up);
    return () => {
      sec.removeEventListener("keydown", onKey);
      stageEl?.removeEventListener("wheel", onWheel);
      stageEl?.removeEventListener("pointerdown", down);
      stageEl?.removeEventListener("pointerup", up);
    };
  });

  const L = LAYERS[idx];
  return (
    <section
      ref={secRef}
      id="exhibit-descent"
      aria-label="Exhibit two, descending through layers of abstraction"
      tabIndex={-1}
    >
      <div className="wrap">
        <div className="sec-head">
          <div>
            <p className="kicker"><b>EXHIBIT 02</b> · THE DESCENT</p>
            <h2 className="sec-title">Descend through the machine</h2>
            <p className="sec-sub">
              Each layer keeps its children visible. You are not changing pages — you are moving
              through levels of reality.
            </p>
          </div>
          <div className="headSide">
            <button className="btn btnSecondary btnSm" onClick={() => show(idx - 1)}>↑ STEP OUT</button>
            <button className="btn btnPrimary btnSm" onClick={() => show(idx + 1)}>↓ PEEL BACK</button>
          </div>
        </div>
        <div className="peelLayout">
          <nav className="rail" aria-label="Abstraction layers">
            {LAYERS.map((l, i) => (
              <button key={l.name} className={i === idx ? "on" : ""} onClick={() => show(i)}>
                <span className="railIdx">{pad2(i)}</span>
                {l.name}
              </button>
            ))}
          </nav>
          <div className={"peelStage " + swap} ref={stageRef}>
            <div className="glyphBox">
              <div className="glyphG">
                <svg viewBox="0 0 320 220" aria-hidden="true">{L.glyph}</svg>
              </div>
            </div>
            <p className="peelCap" aria-live="polite">{L.cap}</p>
            <span className="depthMeter">DEPTH {pad2(idx)} / {pad2(LAYERS.length - 1)}</span>
            <span className="hintline" style={{ marginTop: 10 }}>SCROLL · SWIPE · ARROW KEYS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
