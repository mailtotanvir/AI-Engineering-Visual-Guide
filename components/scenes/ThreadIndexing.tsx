"use client";
import React, { useEffect, useRef, useState } from "react";
import { IDX_BLOCKS, IDX_BLOCK_SIZE, IDX_CELLS, globalIndex } from "@/lib/scenes/indexing";

const B = IDX_BLOCK_SIZE;

export default function ThreadIndexing() {
  const [b, setB] = useState(1);
  const [t, setT] = useState(5);
  const i = globalIndex(b, t);

  const pathRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);
  const bracketRef = useRef<SVGPathElement>(null);
  const boxRefs = useRef<(SVGRectElement | null)[]>([]);
  const rafRef = useRef(0);
  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [litTerm, setLitTerm] = useState<string | null>(null);
  const first = useRef(true);

  const dotX = 40 + b * 265 + 17.5 + t * 25;
  const cellX = 40 + i * 32 + 15;

  useEffect(() => {
    const d = `M ${dotX} 86 C ${dotX} 185, ${cellX} 150, ${cellX} 240`;
    pathRef.current?.setAttribute("d", d);
    pathRef.current?.setAttribute("opacity", "1");
    if (first.current) {
      first.current = false;
      cometRef.current?.setAttribute("cx", String(dotX));
      cometRef.current?.setAttribute("cy", String(86));
      cometRef.current?.setAttribute("opacity", "1");
      return;
    }
    if (document.documentElement.classList.contains("reduced")) {
      cometRef.current?.setAttribute("cx", String(cellX));
      cometRef.current?.setAttribute("cy", String(240));
      cometRef.current?.setAttribute("opacity", "1");
      return;
    }
    cancelAnimationFrame(rafRef.current);
    const start = performance.now(), D = 450;
    const c1x = dotX, c1y = 186, c2x = cellX, c2y = 150;
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / D);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const v = 1 - e;
      const x = v * v * v * dotX + 3 * v * v * e * c1x + 3 * v * e * e * c2x + e * e * e * cellX;
      const y = v * v * v * 86 + 3 * v * v * e * c1y + 3 * v * e * e * c2y + e * e * e * 240;
      cometRef.current?.setAttribute("cx", String(x));
      cometRef.current?.setAttribute("cy", String(y));
      cometRef.current?.setAttribute("opacity", "1");
      if (u < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dotX, cellX]);

  useEffect(() => () => {
    if (litTimer.current) clearTimeout(litTimer.current);
    if (brTimer.current) clearTimeout(brTimer.current);
  }, []);

  const pulseTerm = (term: string) => {
    setLitTerm(term);
    if (litTimer.current) clearTimeout(litTimer.current);
    litTimer.current = setTimeout(() => setLitTerm(null), 1100);
    if (term === "b") {
      const el = boxRefs.current[b];
      el?.classList.add("flash");
      setTimeout(() => el?.classList.remove("flash"), 1000);
    }
    if (term === "B") {
      const bx = 40 + b * 265, x1 = bx + 17.5, x2 = bx + 17.5 + 175;
      bracketRef.current?.setAttribute("d", `M ${x1} 52 H ${x2} M ${x1} 46 v12 M ${x2} 46 v12`);
      bracketRef.current?.setAttribute("opacity", "1");
      if (brTimer.current) clearTimeout(brTimer.current);
      brTimer.current = setTimeout(() => bracketRef.current?.setAttribute("opacity", "0"), 1400);
    }
    if (term === "t") {
      setT((v) => (v + 1 > B - 1 ? 0 : v + 1));
    }
  };

  const boxes = [];
  for (let bi = 0; bi < IDX_BLOCKS; bi++) {
    const bx = 40 + bi * 265;
    const dots = [];
    for (let j = 0; j < B; j++) {
      const cx = bx + 17.5 + j * 25;
      dots.push(
        <g key={j}>
          <circle className="ixDot" cx={cx} cy={74} r={6}
            style={bi === b && j === t ? { fill: "var(--teal)" } : undefined} />
          <circle
            className="ixDotHit" cx={cx} cy={74} r={14}
            role="button" tabIndex={-1}
            aria-label={`block ${bi}, thread ${j}`}
            onClick={() => { setB(bi); setT(j); }}
          />
        </g>
      );
    }
    boxes.push(
      <g key={bi}>
        <rect ref={(r) => { boxRefs.current[bi] = r; }} x={bx} y={30} width={210} height={88} rx={10}
          className={"ixBox" + (bi === b ? " sel" : "")} style={bi === b ? { stroke: "var(--iris)" } : undefined} />
        <text x={bx + 2} y={137} className="ixLbl">blockIdx.x = {bi}</text>
        {dots}
      </g>
    );
  }

  const cells = [];
  for (let k = 0; k < IDX_CELLS; k++) {
    cells.push(
      <g key={k}>
        <rect
          x={40 + k * 32} y={244} width={30} height={56} rx={6}
          className={"ixCell" + (k === i ? " hit" : "")}
          data-k={k}
          role="button" tabIndex={-1}
          aria-label={`element ${k}`}
          onClick={() => { setB(Math.floor(k / B)); setT(k % B); }}
        />
        <text x={55 + k * 32} y={276} className="cellNum">{k}</text>
      </g>
    );
  }

  return (
    <div className="panel">
      <div style={{ padding: "var(--s5)", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(240px,300px)", gap: "var(--s5)" }}>
        <div>
          <svg viewBox="0 0 1100 330" role="img"
            aria-label="Four blocks of eight threads above an array of thirty-two elements; the selected thread maps to exactly one element"
            style={{ width: "100%", height: "auto", display: "block" }}>
            {boxes}
            <path ref={pathRef} className="ixPath" opacity={0} />
            <circle ref={cometRef} className="comet" r={5} opacity={0} />
            <path ref={bracketRef} className="bracket" />
            {cells}
          </svg>
          <p className="idx-caption" aria-live="polite">
            <b>block {b}</b>, <b>thread {t}</b> owns element <b>{i}</b> — exactly one thread, exactly one element.
          </p>
        </div>
        <aside className="stepperCard">
          <h4 style={{ margin: "0 0 6px", fontFamily: "var(--font-m)", fontSize: 11, letterSpacing: ".16em", color: "var(--ink3)" }}>SELECT WORK</h4>
          <Stepper label="blockIdx.x" cls="vBk" color="var(--iris)" value={b}
            min={0} max={IDX_BLOCKS - 1} onChange={setB} id="bVal" term="b" onPulse={pulseTerm} />
          <Stepper label="threadIdx.x" cls="vTh" color="var(--teal)" value={t}
            min={0} max={IDX_BLOCK_SIZE - 1} onChange={setT} id="tVal" term="t" onPulse={pulseTerm} />
          <div className="stepper">
            <span className="nm" style={{ color: "var(--cyan)" }}>blockDim.x</span>
            <button type="button" className="eqV vWp" data-term="B" aria-label="Highlight blockDim in code and diagram"
              style={{ color: "var(--cyan)", background: "rgba(92,200,255,.13)" }} onClick={() => pulseTerm("B")}>{B}</button>
          </div>
          <div className="eq" aria-live="polite">
            <span className="op">i</span><span className="op">&nbsp;=&nbsp;</span>
            <button type="button" className="eqV vBk" data-term="b" onClick={() => pulseTerm("b")}>{b}</button>
            <span className="op">×</span>
            <button type="button" className="eqV vWp" data-term="B" onClick={() => pulseTerm("B")}>{B}</button>
            <span className="op">+</span>
            <button type="button" className="eqV vTh" data-term="t" onClick={() => pulseTerm("t")}>{t}</button>
            <span className="op">=</span>
            <span className="eqV vRes">{i}</span>
          </div>
          <div className="srcLine">
            <span className="tokCm">// the line every thread runs</span><br />
            int i ={" "}
            <b className="tb" data-term="b" data-lit={litTerm === "b"} onClick={() => pulseTerm("b")}
              style={litTerm === "b" ? { background: "rgba(255,255,255,.1)" } : undefined}>blockIdx.x</b>
            *<b className="tw" data-term="B" onClick={() => pulseTerm("B")}
              style={litTerm === "B" ? { background: "rgba(255,255,255,.1)" } : undefined}>blockDim.x</b>
            {" "}+<b className="tt" data-term="t" onClick={() => pulseTerm("t")}
              style={litTerm === "t" ? { background: "rgba(255,255,255,.1)" } : undefined}>threadIdx.x</b>;
          </div>
          <p className="hint">Tap any term — the code, the equation and the machine are one object seen three ways.</p>
        </aside>
      </div>
    </div>
  );
}

function Stepper({
  label, cls, color, value, min, max, onChange, id, term, onPulse,
}: {
  label: string; cls: string; color: string; value: number;
  min: number; max: number; onChange: (v: number) => void;
  id: string; term: string; onPulse: (t: string) => void;
}) {
  return (
    <div className="stepper">
      <span className="nm" style={{ color }}>{label}</span>
      <span className="stepCtl">
        <button aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1, min, max))}>−</button>
        <span className="stepVal" id={id} style={{ color }}>{value}</span>
        <button aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1, min, max))}>+</button>
      </span>
    </div>
  );
}

function clamp(v: number, a: number, b2: number) { return Math.min(b2, Math.max(a, v)); }
