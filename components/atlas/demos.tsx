"use client";
import React, { useEffect, useRef, useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  BANKS, BANK_LANES,
  computeAtomicRace, computeBankState,
  graphSavings, occupancyModel, streamSchedule, tilingTraffic,
} from "@/lib/scenes/atlasState";

export function BanksDemo() {
  const [stride, setStride] = useState(1);
  const [, force] = useState(0);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(4200);
  const store = storeRef.current;
  const s = computeBankState(stride, store.t);

  useEffect(() => store.subscribe((ev) => { if (ev === "tick") { force((x) => x + 1); } }), [store]);

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">STRIDE</span>
        <input type="range" className="slider" style={{ width: 220 }} min={1} max={8} step={1} value={stride}
          aria-label="Address stride between neighbouring threads"
          onChange={(e) => { setStride(Number(e.target.value)); store.seek(0); }} />
        <span className="configChip">STRIDE = {stride}</span>
        <button className="btn btnPrimary btnSm" onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN</button>
        <span className="chip" data-testid="bank-cycles">CYCLES · {s.cyclesDone}/{s.cycles}</span>
        <span className="chip" style={{ color: s.maxConflicts > 1 ? "var(--rose)" : "var(--teal)", borderColor: s.maxConflicts > 1 ? "var(--rose)" : "var(--teal)" }}>
          {s.maxConflicts === 1 ? "CONFLICT-FREE" : `${s.maxConflicts}-WAY CONFLICT`}
        </span>
      </div>

      <svg viewBox="0 0 940 340" role="img" aria-label="Thirty-two threads addressing thirty-two shared memory banks"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {(() => {
          const stackAt: Record<number, number> = {};
          return Array.from({ length: BANK_LANES }, (_, i) => {
            const done = s.laneOrder.includes(i);
            const b = s.bankOf[i];
            if (done) stackAt[b] = (stackAt[b] ?? -1) + 1;
            const hitY = done ? 24 + (stackAt[b] ?? 0) * 8 : null;
            void b;
            return (
              <g key={"laneRow" + i}>
                <circle cx={30} cy={22 + i * 9} r={5}
                  style={{ fill: done ? "var(--teal)" : "rgba(159,182,187,.35)" }} />
                <text x={42} y={25.5 + i * 9} className="lblMono">{`T${i}`}</text>
                {hitY !== null && (
                  <circle cx={160 + s.bankOf[i] * 24 + 10} cy={hitY + 4} r={3.5}
                    style={{ fill: "var(--teal)" }} opacity={0.95} />
                )}
              </g>
            );
          });
        })()}
        {Array.from({ length: BANKS }, (_, b) => {
          const hot = s.conflictsPerBank[b] > 1;
          const lit = s.addresses.some((a, i) => a === b && s.laneOrder.includes(i));
          return (
            <g key={"b" + b}>
              <rect x={150 + b * 24} y={14} width={20} height={296} rx={4}
                style={{ fill: hot ? "rgba(255,127,165,.12)" : lit ? "var(--teal-dim)" : "rgba(16,32,43,.5)", stroke: hot ? "var(--rose)" : "rgba(159,182,187,.18)", strokeOpacity: hot ? 0.7 : 1 }} />
              <text x={160 + b * 24} y={326} textAnchor="middle" className="lblMono">{b}</text>
            </g>
          );
        })}
      </svg>

      <p className="raceCaption" aria-live="polite">
        {s.maxConflicts === 1
          ? "Conflict-free: all sixteen addresses land on distinct banks in one cycle."
          : `${s.distinctBanks} banks serve ${BANK_LANES} lanes → ${s.maxConflicts} accesses serialize per bank. Same data, more cycles.`}
      </p>
    </div>
  );
}

export function OccupancyDemo() {
  const [regs, setRegs] = useState(40);
  const [tpb, setTpb] = useState(256);
  const m = occupancyModel(regs, tpb);
  const LIMIT_COLOR = m.limit === "registers" ? "var(--rose)" : m.limit === "warp-slots" ? "var(--gold)" : "var(--cyan)";

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">REGS / THREAD</span>
        <input type="range" className="slider" style={{ width: 170 }} min={8} max={255} step={8} value={regs}
          aria-label="Registers per thread" onChange={(e) => setRegs(Number(e.target.value))} />
        <span className="configChip">{regs}</span>
        <span className="kicker" style={{ marginLeft: 12 }}>THREADS / BLOCK</span>
        <input type="range" className="slider" style={{ width: 170 }} min={32} max={1024} step={32} value={tpb}
          aria-label="Threads per block" onChange={(e) => setTpb(Number(e.target.value))} />
        <span className="configChip">{tpb}</span>
      </div>

      <svg viewBox="0 0 900 210" role="img" aria-label="Warp slots of one streaming multiprocessor filling up"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {Array.from({ length: 64 }, (_, w) => {
          const active = w < m.residentWarps;
          return (
            <rect key={w} x={20 + (w % 16) * 55} y={16 + Math.floor(w / 16) * 44} width={48} height={34} rx={6}
              style={{
                fill: active ? "var(--teal-dim)" : "rgba(16,32,43,.5)",
                stroke: active ? "var(--teal)" : "rgba(159,182,187,.16)",
              }} />
          );
        })}
        <text x={20} y={196} className="lblStrong">
          {m.residentWarps} / 64 WARP SLOTS RESIDENT · {m.blocksResident} BLOCK{m.blocksResident === 1 ? "" : "S"}
        </text>
      </svg>

      <div className="controls" style={{ marginTop: "var(--s3)" }}>
        <span className="kicker">OCCUPANCY</span>
        <span className="bigCount" style={{ fontSize: 30 }}>{Math.round(m.occupancy * 100)}%</span>
        <span className="chip" style={{ color: LIMIT_COLOR, borderColor: LIMIT_COLOR }}>LIMITED BY {m.limit.toUpperCase()}</span>
      </div>
      <p className="raceCaption">
        {m.occupancy >= 0.66
          ? "Plenty of warps in flight — memory stalls can hide behind arithmetic."
          : "Thin residency. When these few warps stall on memory, the SM has nothing else to run."}
      </p>
    </div>
  );
}

export function TilingDemo() {
  const [tiled, setTiled] = useState(false);
  const [p, setP] = useState(0);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(5200);
  const store = storeRef.current;

  useEffect(() => {
    return store.subscribe((ev, t) => ev === "tick" && setP(t));
  }, [store]);

  const traffic = tilingTraffic();
  const loaded = Math.round((tiled ? traffic.tiledLoads : traffic.naiveLoads) * p);

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["naive", "tiled"] as const).map((m) => (
          <button key={m}
            className={"btn btnSm " + ((m === "tiled") === tiled ? "btnPrimary" : "btnSecondary")}
            aria-pressed={tiled === (m === "tiled")}
            onClick={() => { setTiled(m === "tiled"); store.reset(); }}>
            {m.toUpperCase()}
          </button>
        ))}
        <button className="btn btnPrimary btnSm" onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN</button>
        <span className="configChip" data-testid="tiling-loads">GLOBAL LOADS · {loaded.toLocaleString("en-US")}</span>
      </div>

      <svg viewBox="0 0 900 190" role="img" aria-label="Matrix multiply traffic: global loads versus shared memory reuse"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={20} y={30} className="lblStrong">{tiled ? "TILED · STAGE TILE ONCE, REUSE FROM SHARED" : "NAIVE · EVERY OUTPUT READS THE FULL ROW FROM GLOBAL"}</text>
        {[0, 1].map((row) =>
          Array.from({ length: 8 }, (_, i) => (
            <rect key={`${row}-${i}`} x={20 + i * 108} y={50 + row * 60} width={96} height={48} rx={8}
              style={{
                fill: row === 0 ? (tiled ? "var(--teal-dim)" : "rgba(255,127,165,.10)") : "var(--bg3)",
                stroke: row === 0 ? (tiled ? "var(--teal)" : "var(--rose)") : "rgba(159,182,187,.2)",
                strokeDasharray: row === 1 && !tiled ? "4 4" : undefined,
              }} />
          ))
        )}
        <text x={68} y={80} textAnchor="middle" className="lblMono">{tiled ? "SHARED TILE" : "GLOBAL ROW"}</text>
        <text x={68} y={140} textAnchor="middle" className="lblMono">OUTPUT TILE</text>
        <text x={480} y={84} className="lblMono">
          {tiled ? "load K-tile once per block → every thread reuses it on-chip" : "each of the 16 output tiles re-reads the same K rows"}
        </text>
      </svg>

      <p className="raceCaption" aria-live="polite">
        {p >= 1
          ? `Final tally — tiled moved ${traffic.ratio.toFixed(1)}× less data through global memory.`
          : `Watch the load counter. ${tiled ? "Shared memory absorbs the reuse." : "Global memory pays for every reuse."}`}
      </p>
    </div>
  );
}

export function AtomicsDemo() {
  const [, force] = useState(0);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(4200);
  const store = storeRef.current;
  const s = computeAtomicRace(store.t);

  useEffect(() => store.subscribe((ev) => ev === "tick" && force((x) => x + 1)), [store]);

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className="btn btnPrimary btnSm" onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN THE RACE</button>
        <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>⟳&nbsp;&nbsp;RESET</button>
        <span className="chip">8 WORKERS × 12 INCREMENTS</span>
      </div>

      <svg viewBox="0 0 900 200" role="img" aria-label="Unsafe read-write race versus hardware atomic increments"
        style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={20} y={40} className="lblStrong" style={{ fill: "var(--rose)" }}>UNSAFE counter += 1</text>
        <text x={880} y={40} textAnchor="end" className="bigCount" style={{ fill: "var(--rose)", fontSize: 30 }}>{s.unsafeValue}</text>
        <text x={20} y={120} className="lblStrong" style={{ fill: "var(--teal)" }}>ATOMICADD(&amp;counter, 1)</text>
        <text x={880} y={120} textAnchor="end" className="bigCount" style={{ fontSize: 30 }}>{s.safeValue}</text>
        <text x={20} y={168} className="lblMono">LOST UPDATES · {s.lostUpdates}</text>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <circle cx={430 + i * 56} cy={30} r={7} style={{ fill: "var(--iris)", opacity: 0.4 + 0.6 * Math.min(1, s.sparks[i] / 12) }} />
            <text x={430 + i * 56} y={52} textAnchor="middle" className="lblMono">{s.sparks[i]}</text>
          </g>
        ))}
      </svg>

      <p className="raceCaption" aria-live="polite">
        {s.done
          ? `Race over. ${s.lostUpdates} increments silently vanished on the unsafe path — the atomic unit serialized them instead.`
          : "Both counters start at zero and receive identical increments…"}
      </p>
    </div>
  );
}

export function StreamsDemo() {
  const [mode, setMode] = useState<"serial" | "streams">("serial");
  const [p, setP] = useState(0);
  const storeRef = useRef<TimelineStore | null>(null);
  if (!storeRef.current) storeRef.current = new TimelineStore(5000);
  const store = storeRef.current;

  useEffect(() => {
    return store.subscribe((ev, t) => ev === "tick" && setP(t));
  }, [store]);

  const schedule = streamSchedule(mode);
  const LANE_Y: Record<string, number> = {};
  schedule.bars.forEach((b) => { if (!(b.lane in LANE_Y)) LANE_Y[b.lane] = Object.keys(LANE_Y).length; });
  const lanes = Object.keys(LANE_Y).length;
  const H = 60 + lanes * 46;
  const playX = p * 900;

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        {(["serial", "streams"] as const).map((m) => (
          <button key={m} className={"btn btnSm " + (mode === m ? "btnPrimary" : "btnSecondary")}
            aria-pressed={mode === m}
            onClick={() => { setMode(m); store.reset(); }}>
            {m === "serial" ? "DEFAULT STREAM" : "TWO STREAMS"}
          </button>
        ))}
        <button className="btn btnPrimary btnSm" onClick={() => { store.seek(0); store.play(); }}>▶&nbsp;&nbsp;RUN</button>
        <span className="configChip">MAKESPAN · {Math.round(schedule.makespan * 100)}</span>
      </div>

      <svg viewBox={`0 0 900 ${H}`} role="img" aria-label="Timeline of copies and kernels"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {Object.keys(LANE_Y).map((lane, li) => (
          <text key={"lbl" + lane} x={12} y={70 + li * 46 + 22} className="lblMono">{lane}</text>
        ))}
        {schedule.bars.map((b, bi) => {
          const li = LANE_Y[b.lane];
          const x = 90 + b.start * 800;
          const w = (b.end - b.start) * 800;
          const passed = playX >= x + w || p >= 1;
          const active = playX >= x && playX < x + w && p > 0;
          return (
            <g key={bi}>
              <rect x={x} y={70 + li * 46} width={w} height={34} rx={8}
                style={{
                  fill: passed ? (b.kind === "compute" ? "var(--teal-dim)" : "rgba(92,200,255,.25)")
                    : active ? "rgba(255,196,107,.25)" : "rgba(16,32,43,.6)",
                  stroke: passed ? (b.kind === "compute" ? "var(--teal)" : "var(--cyan)")
                    : active ? "var(--gold)" : "rgba(159,182,187,.25)",
                }} />
              <text x={x + w / 2} y={70 + li * 46 + 21} textAnchor="middle" className="lblMono">{b.label}</text>
            </g>
          );
        })}
        {p > 0 && p < 1 && <line x1={playX} y1={58} x2={playX} y2={H - 14} stroke="var(--gold)" strokeWidth={2} />}
      </svg>

      <p className="raceCaption" aria-live="polite">
        {mode === "streams"
          ? "Chunk B's copy overlaps chunk A's kernel — the copy engines and SMs work simultaneously."
          : "One queue: copy waits for kernel waits for copy. The GPU idles between chunks."}
        {" "}Requires pinned host buffers for true async copies.
      </p>
    </div>
  );
}

export function GraphsDemo() {
  const [launched, setLaunched] = useState(false);
  const gs = graphSavings();

  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <button className={"btn btnSm " + (launched ? "btnPrimary" : "btnSecondary")} onClick={() => setLaunched(true)}>
          ▶&nbsp;&nbsp;LAUNCH {launched ? "AGAIN VIA GRAPH" : "6 KERNELS"}
        </button>
        {!launched && <span className="chip">SIX TINY KERNELS · LAUNCH OVERHEAD DOMINATES</span>}
      </div>

      <svg viewBox="0 0 900 230" role="img" aria-label="Repeated individual launches versus one graph replay"
        style={{ width: "100%", height: "auto", display: "block" }}>
        {!launched ? (
          <>
            {gs.serialBars.map((b, i) => {
              const li = b.lane === "EXEC" ? 1 : 0;
              const x = 20 + b.start * 850, w = (b.end - b.start) * 850;
              return (
                <g key={i}>
                  <rect x={x} y={40 + li * 54} width={Math.max(w, 3)} height={36} rx={6}
                    style={{ fill: b.kind === "compute" ? "var(--teal-dim)" : "rgba(255,127,165,.18)", stroke: b.kind === "compute" ? "var(--teal)" : "var(--rose)" }} />
                </g>
              );
            })}
            <text x={20} y={30} className="lblMono">LAUNCH OVERHEAD (rose) vs REAL WORK (teal)</text>
            <text x={20} y={196} className="lblStrong">EVERY LAUNCH PAYS A TAX — SIX TIMES OVER</text>
          </>
        ) : (
          <>
            {gs.graphBars.map((b, i) => {
              const li = i;
              const x = 20 + b.start * 850, w = Math.max((b.end - b.start) * 850, 4);
              return (
                <g key={i}>
                  <rect x={x} y={40 + li * 54} width={w} height={36} rx={6}
                    style={{ fill: b.kind === "compute" ? "var(--teal-dim)" : "rgba(92,200,255,.2)", stroke: b.kind === "compute" ? "var(--teal)" : "var(--cyan)" }} />
                  <text x={x + 10} y={63 + li * 54} className="lblMono">{b.label}</text>
                </g>
              );
            })}
            <text x={20} y={196} className="lblStrong" style={{ fill: "var(--teal)" }}>
              ONE CAPTURE · ONE REPLAY · ~{gs.savedPct}% LESS OVERHEAD
            </text>
          </>
        )}
      </svg>
      <p className="raceCaption">
        Graphs capture the dependency DAG once; cudaGraphLaunch replays the whole topology with driver-level efficiency.
      </p>
    </div>
  );
}

export function NvccFlow() {
  const [step, setStep] = useState(0);
  const total = 6;
  useEffect(() => {
    const iv = setInterval(() => setStep((x) => (x + 1) % (total + 1)), 1400);
    return () => clearInterval(iv);
  }, []);


  return (
    <div>
      <div className="controls" style={{ marginBottom: "var(--s4)" }}>
        <span className="kicker">$ nvcc -arch=sm_89 vector_add.cu -o vector_add</span>
        <span className="configChip" style={{ marginLeft: "auto" }}>STAGE {Math.min(step, total)} / {total}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          ["SOURCE", "vector_add.cu", "source"],
          ["SPLIT COMPILATION", "cudafe++", "device"],
          ["HOST C++", "vector_add.cpp.o", "host"],
          ["VIRTUAL ISA (PTX)", "vector_add.ptx", "ptx"],
          ["MACHINE CODE (SASS)", "sm_89.cubin", "sass"],
          ["FATBINARY LINK", "vector_add ✓", "link"],
        ].map(([label, file], i) => {
          const kindMap: Record<string, string> = { SOURCE: "source", "SPLIT COMPILATION": "device", "HOST C++": "host", "VIRTUAL ISA (PTX)": "ptx", "MACHINE CODE (SASS)": "sass", "FATBINARY LINK": "link" };
          const active = i <= step;
          const colors: Record<string, string> = {
            source: "var(--ink2)", device: "var(--gold)", host: "var(--lime)",
            ptx: "var(--cyan)", sass: "var(--teal)", link: "var(--iris)",
          };
          const c = colors[kindMap[label]] ?? "var(--ink2)";
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "11px 16px",
              borderRadius: 10, border: `1px solid ${active ? c : "var(--hair2)"}`,
              background: active ? "var(--bg3)" : "transparent",
              opacity: active ? 1 : 0.45, transition: "all .3s ease",
            }}>
              <span className="kicker" style={{ color: active ? c : "var(--ink3)", minWidth: 190 }}>{label}</span>
              <code className="lblMono">{file}</code>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--ink2)" }}>
                {active ? [
                  "One file, two worlds: host C++ plus __global__ device code.",
                  "nvcc separates host code from device code before compiling either.",
                  "Host half compiles with your system compiler into a plain object.",
                  "PTX is portable assembly — JIT-compiles forward onto future GPUs.",
                  "SASS is real instructions baked for this exact compute capability.",
                  "Host object + PTX + SASS glue into one runnable executable.",
                ][i] : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="raceCaption" style={{ marginTop: "var(--s3)" }}>
        Inspect artifacts yourself: <b>nvdisasm sm_89.cubin</b> reads SASS, <b>cuobjdump -ptx</b> prints PTX.
      </p>
    </div>
  );
}