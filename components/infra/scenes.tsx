"use client";

import React, { useState } from "react";
import { TimelineStore } from "@/lib/engine/timeline";
import {
  bisectionBandwidth,
  h2dTransferTimeMs,
  rooflineKnee,
  rooflineAttainableTflops,
  ringAllReduceTimeMs,
  treeAllReduceTimeMs,
  pfcHeadroomBytes,
  oversubscriptionRatio,
  storageThroughputGBs,
  optimalCheckpointIntervalSec,
  checkpointRecoveryTimeMin,
} from "@/lib/infra/engine";

const storeOf = (() => {
  const cache = new Map<string, TimelineStore>();
  return (key: string, dur: number) => {
    if (!cache.has(key)) cache.set(key, new TimelineStore(dur));
    return cache.get(key)!;
  };
})();

function useTick(store: TimelineStore) {
  const [, force] = useState(0);
  React.useEffect(() => store.subscribe((ev) => ev === "tick" && force((x) => x + 1)), [store]);
}

function RunReset({ store }: { store: TimelineStore }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        className="btn btnPrimary btnSm"
        onClick={() => {
          if (store.t >= 1) store.seek(0);
          store.togglePlay();
        }}
      >
        {store.playing ? <>❚❚ PAUSE</> : <>▶ RUN</>}
      </button>
      <button className="btn btnSecondary btnSm" onClick={() => store.reset()}>
        ⟳ RESET
      </button>
    </div>
  );
}

/* ================= 01 NvlinkTopology ================= */
export function NvlinkTopology() {
  useTick(storeOf("nvlink", 6000));
  const store = storeOf("nvlink", 6000);
  const t = store.t;
  const [linksPerGpu, setLinksPerGpu] = useState(18); // H100 default
  const [linkBw, setLinkBw] = useState(50); // 50 GB/s bidirectional
  const bisection = bisectionBandwidth(linksPerGpu * 4, linkBw, true);

  const gpus = [
    { id: 0, x: 120, y: 80, name: "GPU 0" },
    { id: 1, x: 260, y: 80, name: "GPU 1" },
    { id: 2, x: 400, y: 80, name: "GPU 2" },
    { id: 3, x: 540, y: 80, name: "GPU 3" },
    { id: 4, x: 120, y: 220, name: "GPU 4" },
    { id: 5, x: 260, y: 220, name: "GPU 5" },
    { id: 6, x: 400, y: 220, name: "GPU 6" },
    { id: 7, x: 540, y: 220, name: "GPU 7" },
  ];

  const switches = [
    { id: "S0", x: 190, y: 150 },
    { id: "S1", x: 330, y: 150 },
    { id: "S2", x: 470, y: 150 },
    { id: "S3", x: 610, y: 150 },
  ];

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <RunReset store={store} />
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Links / GPU: <b>{linksPerGpu}</b>
          <input type="range" min={6} max={18} step={6} value={linksPerGpu} onChange={(e) => setLinksPerGpu(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Link Speed: <b>{linkBw} GB/s</b>
          <input type="range" min={25} max={100} step={25} value={linkBw} onChange={(e) => setLinkBw(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: "#FF9E7A", borderColor: "rgba(255, 158, 122, 0.4)" }}>
          BISECTION BW · <b>{(bisection / 1000).toFixed(2)} TB/s</b>
        </span>
      </div>

      <svg viewBox="0 0 740 300" role="img" aria-label="NVLink switched mesh architecture" style={{ width: "100%", height: "auto", background: "var(--bg3)", borderRadius: 10 }}>
        {/* NVSwitch cross connections */}
        {gpus.map((g) =>
          switches.map((s) => (
            <line
              key={`${g.id}-${s.id}`}
              x1={g.x}
              y1={g.y}
              x2={s.x}
              y2={s.y}
              stroke="rgba(255, 158, 122, 0.15)"
              strokeWidth={1.5}
            />
          ))
        )}

        {/* Animated packet pulses */}
        {store.playing &&
          gpus.slice(0, 4).map((g, idx) => {
            const target = switches[idx % switches.length];
            const px = g.x + (target.x - g.x) * ((t * 4 + idx * 0.25) % 1);
            const py = g.y + (target.y - g.y) * ((t * 4 + idx * 0.25) % 1);
            return <circle key={`pulse-${idx}`} cx={px} cy={py} r={3.5} fill="#FF9E7A" />;
          })}

        {/* NVSwitch Chips */}
        {switches.map((s, idx) => (
          <g key={s.id}>
            <rect x={s.x - 22} y={s.y - 14} width={44} height={28} rx={6} fill="#1F2937" stroke="#FF9E7A" strokeWidth={1.5} />
            <text x={s.x} y={s.y + 4} textAnchor="middle" fill="#FF9E7A" fontSize={11} fontFamily="var(--font-m, monospace)" fontWeight="bold">
              NVS{idx}
            </text>
          </g>
        ))}

        {/* GPU Nodes */}
        {gpus.map((g) => (
          <g key={g.id}>
            <rect x={g.x - 34} y={g.y - 20} width={68} height={40} rx={8} fill="var(--bg2)" stroke="var(--teal)" strokeWidth={1.5} />
            <text x={g.x} y={g.y - 2} textAnchor="middle" fill="var(--ink)" fontSize={12} fontWeight="600">
              {g.name}
            </text>
            <text x={g.x} y={g.y + 12} textAnchor="middle" fill="var(--ink2)" fontSize={9.5} fontFamily="var(--font-m, monospace)">
              {linksPerGpu * linkBw} GB/s
            </text>
          </g>
        ))}

        <text x={24} y={282} fill="var(--ink2)" fontSize={11} fontFamily="var(--font-m, monospace)">
          NON-BLOCKING FULL-MESH VIA 4x NVSWITCH FABRIC · FLAT SINGLE-HOP LATENCY (~100ns)
        </text>
      </svg>
      <p className="raceCaption" style={{ marginTop: 12 }}>
        {t <= 0
          ? "All 8 GPUs communicate simultaneously over dedicated NVSwitch crossbars with zero bus contention."
          : `Active Tensor Parallel All-to-All broadcast at ${(bisection / 1000).toFixed(2)} TB/s aggregate bandwidth.`}
      </p>
    </div>
  );
}

/* ================= 02 PcieCxlBottleneck ================= */
export function PcieCxlBottleneck() {
  const [sizeMB, setSizeMB] = useState(1024); // 1 GB
  const [isCxl, setIsCxl] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  const bwGBs = isCxl ? 64 : isPinned ? 52 : 28;
  const latencyUs = isCxl ? 0.3 : isPinned ? 4.5 : 18.0;
  const transferTimeMs = h2dTransferTimeMs(sizeMB, bwGBs, latencyUs);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <button className={"btn " + (!isCxl ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsCxl(false)}>
          PCIe Gen5 Mode
        </button>
        <button className={"btn " + (isCxl ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsCxl(true)}>
          CXL 3.0 Coherent Fabric
        </button>
        {!isCxl && (
          <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
            Pinned Memory (cudaHostAlloc)
          </label>
        )}
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          Payload: <b>{sizeMB} MB</b>
          <input type="range" min={128} max={4096} step={128} value={sizeMB} onChange={(e) => setSizeMB(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid " + (isCxl ? "var(--cyan)" : "#FF9E7A") }}>
          <div style={{ fontSize: 12, color: "var(--ink2)", textTransform: "uppercase" }}>Transfer Latency & Time</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--ink)", margin: "4px 0" }}>
            {transferTimeMs.toFixed(2)} <span style={{ fontSize: 16 }}>ms</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink2)" }}>Effective Throughput: <b>{bwGBs} GB/s</b> (Bus Latency: {latencyUs} µs)</div>
        </div>

        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid var(--gold)" }}>
          <div style={{ fontSize: 12, color: "var(--ink2)", textTransform: "uppercase" }}>Host CPU Overhead</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: isCxl ? "var(--teal)" : isPinned ? "var(--gold)" : "var(--rose)", margin: "4px 0" }}>
            {isCxl ? "< 1%" : isPinned ? "3%" : "42%"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink2)" }}>{isCxl ? "Direct cache coherency (Zero bounce copies)" : isPinned ? "Direct DMA via PCIe master" : "Page-fault staging in kernel memory"}</div>
        </div>
      </div>

      <svg viewBox="0 0 700 120" role="img" aria-label="Host to Device Memory Pipeline" style={{ width: "100%", height: "auto" }}>
        <rect x={20} y={25} width={160} height={70} rx={8} fill="var(--bg2)" stroke="var(--ink3)" />
        <text x={100} y={55} textAnchor="middle" fill="var(--ink)" fontSize={13} fontWeight="bold">HOST CPU RAM</text>
        <text x={100} y={75} textAnchor="middle" fill="var(--ink2)" fontSize={11}>{isPinned ? "Pinned Pages (DMA Locked)" : "Paged Virtual Memory"}</text>

        <line x1={180} y1={60} x2={520} y2={60} stroke={isCxl ? "var(--cyan)" : "#FF9E7A"} strokeWidth={3} strokeDasharray={isPinned ? "none" : "6,4"} />
        <polygon points="515,55 525,60 515,65" fill={isCxl ? "var(--cyan)" : "#FF9E7A"} />
        <text x={350} y={48} textAnchor="middle" fill={isCxl ? "var(--cyan)" : "#FF9E7A"} fontSize={12} fontFamily="var(--font-m, monospace)" fontWeight="bold">
          {isCxl ? "CXL 3.0 (Zero-Copy Cache Coherent)" : isPinned ? "PCIe Gen5 x16 DMA Direct" : "Double-Buffered Page Copy"}
        </text>

        <rect x={520} y={25} width={160} height={70} rx={8} fill="var(--bg2)" stroke="var(--teal)" />
        <text x={600} y={55} textAnchor="middle" fill="var(--ink)" fontSize={13} fontWeight="bold">GPU HBM3e</text>
        <text x={600} y={75} textAnchor="middle" fill="var(--teal)" fontSize={11}>3.35 TB/s Local Bus</text>
      </svg>
    </div>
  );
}

/* ================= 03 HbmMemoryWall ================= */
export function HbmMemoryWall() {
  const [peakTflops, setPeakTflops] = useState(989); // H100 FP16
  const [peakMemTBps, setPeakMemTBps] = useState(3.35); // HBM3e
  const [intensity, setIntensity] = useState(150); // FLOP/Byte

  const knee = rooflineKnee(peakTflops, peakMemTBps);
  const { attainableTflops, regime } = rooflineAttainableTflops(intensity, peakTflops, peakMemTBps);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Intensity: <b>{intensity} FLOP/Byte</b>
          <input type="range" min={5} max={600} step={5} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          HBM BW: <b>{peakMemTBps} TB/s</b>
          <input type="range" min={1.5} max={8.0} step={0.25} value={peakMemTBps} onChange={(e) => setPeakMemTBps(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: regime === "memory-bound" ? "var(--rose)" : "var(--teal)", borderColor: "currentColor" }}>
          REGIME · <b>{regime.toUpperCase()}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>ROOFLINE KNEE (COMPUTE THRESHOLD)</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--gold)" }}>{knee.toFixed(1)} <span style={{ fontSize: 14 }}>FLOP/Byte</span></div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>ATTAINABLE PERFORMANCE</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: regime === "compute-bound" ? "var(--teal)" : "#FF9E7A" }}>
            {attainableTflops.toFixed(1)} <span style={{ fontSize: 14 }}>TFLOPs ({((attainableTflops / peakTflops) * 100).toFixed(0)}% Peak)</span>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 700 220" role="img" aria-label="Roofline Model Chart" style={{ width: "100%", height: "auto", background: "var(--bg3)", borderRadius: 10 }}>
        {/* Axes */}
        <line x1={60} y1={180} x2={660} y2={180} stroke="var(--ink3)" strokeWidth={1.5} />
        <line x1={60} y1={180} x2={60} y2={20} stroke="var(--ink3)" strokeWidth={1.5} />

        {/* Roofline Sloped ceiling & Horizontal ceiling */}
        {/* Knee point at x = 60 + knee*0.8, y = 50 */}
        <line x1={60} y1={180} x2={Math.min(600, 60 + knee * 0.9)} y2={50} stroke="var(--gold)" strokeWidth={3} />
        <line x1={Math.min(600, 60 + knee * 0.9)} y1={50} x2={660} y2={50} stroke="var(--teal)" strokeWidth={3} />

        {/* Current Operating Point */}
        <circle cx={Math.min(660, 60 + intensity * 0.9)} cy={Math.max(50, 180 - (attainableTflops / peakTflops) * 130)} r={7} fill="#FF9E7A" stroke="#fff" strokeWidth={2} />

        <text x={Math.min(660, 60 + intensity * 0.9)} y={Math.max(35, 160 - (attainableTflops / peakTflops) * 130)} textAnchor="middle" fill="#FF9E7A" fontSize={12} fontWeight="bold">
          {intensity} FLOP/B ({attainableTflops.toFixed(0)} TFLOPs)
        </text>

        <text x={70} y={196} fill="var(--ink2)" fontSize={10} fontFamily="var(--font-m, monospace)">0 FLOP/Byte (Memory-Bound)</text>
        <text x={650} y={196} textAnchor="end" fill="var(--ink2)" fontSize={10} fontFamily="var(--font-m, monospace)">600+ FLOP/Byte (Compute-Bound)</text>
        <text x={50} y={30} textAnchor="end" fill="var(--ink2)" fontSize={10} fontFamily="var(--font-m, monospace)">PEAK</text>
      </svg>
      <p className="raceCaption" style={{ marginTop: 10 }}>
        {intensity < knee
          ? "Memory-Bound: Tensor cores sit idle waiting on HBM memory bus. Use kernel fusion (FlashAttention) to increase intensity."
          : "Compute-Bound: Arithmetic intensity exceeds the knee point. Tensor cores are fully saturated at peak matrix throughput."}
      </p>
    </div>
  );
}

/* ================= 04 HgxNodeAnatomy ================= */
export function HgxNodeAnatomy() {
  const [selectedComp, setSelectedComp] = useState<string>("gpu");

  const specs: Record<string, { title: string; desc: string; bw: string; role: string }> = {
    gpu: { title: "8x SXM5 / B200 GPUs", desc: "Primary tensor matrix accelerators with on-package HBM3e high-bandwidth memory stacks.", bw: "900 GB/s - 3.6 TB/s NVLink per GPU", role: "Compute Engine" },
    nvswitch: { title: "4x NVSwitch Chips", desc: "Non-blocking on-board crossbar routing engine with hardware SHARP reduction offload.", bw: "3.2 - 7.2 TB/s aggregate crossbar", role: "Scale-Up Fabric" },
    cpu: { title: "Dual x86/ARM Host Sockets", desc: "Host CPUs managing job startup, dataset stream ingestion, and system orchestration.", bw: "64 GB/s PCIe Gen5 x16 per socket", role: "Host Orchestration" },
    nic: { title: "8x 400Gbps CX-7 NICs", desc: "Dedicated network interface cards maintaining a 1:1 ratio with each GPU for scale-out.", bw: "400 Gbps (50 GB/s) per rail", role: "Scale-Out Interconnect" },
    dpu: { title: "BlueField-3 DPU", desc: "Dedicated data processing unit managing out-of-band telemetry and NVMe-oF storage queues.", bw: "200-400 Gbps Storage Fabric", role: "Storage / Security" },
  };

  const curr = specs[selectedComp] || specs.gpu;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.keys(specs).map((k) => (
          <button
            key={k}
            className={"btn btnSm " + (selectedComp === k ? "btnPrimary" : "btnSecondary")}
            onClick={() => setSelectedComp(k)}
          >
            {specs[k].title.split(" ")[1] || specs[k].title}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <svg viewBox="0 0 450 280" role="img" aria-label="HGX Server Architecture" style={{ width: "100%", height: "auto", background: "var(--bg3)", borderRadius: 8 }}>
          {/* Baseboard boundary */}
          <rect x={15} y={15} width={420} height={250} rx={10} fill="none" stroke="rgba(255, 158, 122, 0.4)" strokeWidth={1.5} strokeDasharray="4,4" />
          <text x={25} y={35} fill="rgba(255, 158, 122, 0.7)" fontSize={10} fontFamily="var(--font-m, monospace)">HGX BASEBOARD ENCLOSURE (10.2 kW)</text>

          {/* CPUs */}
          <g onClick={() => setSelectedComp("cpu")} style={{ cursor: "pointer" }}>
            <rect x={35} y={60} width={80} height={50} rx={6} fill={selectedComp === "cpu" ? "rgba(70,227,200,0.3)" : "var(--bg2)"} stroke="var(--teal)" strokeWidth={1.5} />
            <text x={75} y={85} textAnchor="middle" fill="var(--ink)" fontSize={11} fontWeight="bold">CPU 0</text>
            <rect x={35} y={130} width={80} height={50} rx={6} fill={selectedComp === "cpu" ? "rgba(70,227,200,0.3)" : "var(--bg2)"} stroke="var(--teal)" strokeWidth={1.5} />
            <text x={75} y={155} textAnchor="middle" fill="var(--ink)" fontSize={11} fontWeight="bold">CPU 1</text>
          </g>

          {/* NVSwitches */}
          <g onClick={() => setSelectedComp("nvswitch")} style={{ cursor: "pointer" }}>
            <rect x={145} y={60} width={45} height={180} rx={6} fill={selectedComp === "nvswitch" ? "rgba(255, 158, 122, 0.3)" : "#1F2937"} stroke="#FF9E7A" strokeWidth={1.5} />
            <text x={167} y={155} textAnchor="middle" fill="#FF9E7A" fontSize={11} fontWeight="bold" transform="rotate(-90, 167, 155)">
              4x NVSWITCH
            </text>
          </g>

          {/* 8 GPUs */}
          <g onClick={() => setSelectedComp("gpu")} style={{ cursor: "pointer" }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const gx = 220 + (i % 4) * 48;
              const gy = i < 4 ? 60 : 130;
              return (
                <rect
                  key={i}
                  x={gx}
                  y={gy}
                  width={42}
                  height={55}
                  rx={5}
                  fill={selectedComp === "gpu" ? "rgba(92,200,255,0.3)" : "var(--bg2)"}
                  stroke="var(--cyan)"
                  strokeWidth={1.5}
                />
              );
            })}
            <text x={315} y={205} textAnchor="middle" fill="var(--cyan)" fontSize={11} fontWeight="bold">8x SXM5 / B200 GPUs</text>
          </g>

          {/* NICs */}
          <g onClick={() => setSelectedComp("nic")} style={{ cursor: "pointer" }}>
            <rect x={35} y={200} width={80} height={40} rx={6} fill={selectedComp === "nic" ? "rgba(255,196,107,0.3)" : "var(--bg2)"} stroke="var(--gold)" strokeWidth={1.5} />
            <text x={75} y={225} textAnchor="middle" fill="var(--gold)" fontSize={10} fontWeight="bold">8x CX-7 NICs</text>
          </g>

          {/* DPU */}
          <g onClick={() => setSelectedComp("dpu")} style={{ cursor: "pointer" }}>
            <rect x={220} y={220} width={186} height={32} rx={6} fill={selectedComp === "dpu" ? "rgba(164,143,255,0.3)" : "var(--bg2)"} stroke="var(--iris)" strokeWidth={1.5} />
            <text x={313} y={240} textAnchor="middle" fill="var(--iris)" fontSize={10} fontWeight="bold">BlueField-3 DPU (Storage Fabric)</text>
          </g>
        </svg>

        <div style={{ background: "var(--bg2)", padding: 18, borderRadius: 8, border: "1px solid var(--hair2)" }}>
          <span className="kicker" style={{ color: "#FF9E7A" }}>{curr.role}</span>
          <h3 style={{ margin: "6px 0 10px 0", fontSize: 18, color: "var(--ink)" }}>{curr.title}</h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink2)", marginBottom: 14 }}>{curr.desc}</p>
          <div style={{ background: "var(--bg3)", padding: 10, borderRadius: 6, borderLeft: "3px solid #FF9E7A" }}>
            <div style={{ fontSize: 11, color: "var(--ink2)", textTransform: "uppercase" }}>Bandwidth / Spec</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--gold)", marginTop: 2 }}>{curr.bw}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 05 InfinibandVsRoce ================= */
export function InfinibandVsRoce() {
  const [cableMeters, setCableMeters] = useState(100);
  const [switchNs, setSwitchNs] = useState(400);
  const [bwGbps, setBwGbps] = useState(400);

  const headroomBytes = pfcHeadroomBytes(cableMeters, bwGbps, switchNs);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Cable Length: <b>{cableMeters}m</b>
          <input type="range" min={10} max={300} step={10} value={cableMeters} onChange={(e) => setCableMeters(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Switch Latency: <b>{switchNs}ns</b>
          <input type="range" min={150} max={1000} step={50} value={switchNs} onChange={(e) => setSwitchNs(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: "var(--cyan)", borderColor: "rgba(92,200,255,0.4)" }}>
          REQUIRED PFC HEADROOM · <b>{(headroomBytes / 1024).toFixed(1)} KB / Port</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid var(--teal)" }}>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--teal)", fontSize: 16 }}>Native InfiniBand (NDR / XDR)</h4>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.5 }}>
            Uses link-layer <b>credit-based flow control</b>. Senders only transmit when switch receive buffers have open credits. Zero drops by construction, zero PFC pause storms.
          </p>
        </div>
        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid #FF9E7A" }}>
          <h4 style={{ margin: "0 0 6px 0", color: "#FF9E7A", fontSize: 16 }}>RoCE v2 Lossless Ethernet</h4>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.5 }}>
            Relies on <b>PFC (802.1Qbb) + ECN/DCQCN</b>. Requires precise headroom buffer reservation of {(headroomBytes / 1024).toFixed(1)} KB to prevent packet drops before PAUSE frames halt the sender.
          </p>
        </div>
      </div>

      <svg viewBox="0 0 700 130" role="img" aria-label="PFC Headroom vs Credit Buffer" style={{ width: "100%", height: "auto" }}>
        <rect x={20} y={30} width={200} height={70} rx={6} fill="var(--bg2)" stroke="var(--ink3)" />
        <text x={120} y={55} textAnchor="middle" fill="var(--ink)" fontSize={12} fontWeight="bold">SENDER NIC</text>
        <text x={120} y={75} textAnchor="middle" fill="var(--ink2)" fontSize={10.5}>400 Gbps Output Queue</text>

        <line x1={220} y1={65} x2={460} y2={65} stroke="var(--cyan)" strokeWidth={2.5} />
        <text x={340} y={55} textAnchor="middle" fill="var(--cyan)" fontSize={11} fontFamily="var(--font-m, monospace)">
          {cableMeters}m Fiber ({(cableMeters * 5).toFixed(0)}ns RTT delay)
        </text>

        <rect x={460} y={30} width={220} height={70} rx={6} fill="var(--bg2)" stroke="#FF9E7A" />
        <text x={570} y={55} textAnchor="middle" fill="var(--ink)" fontSize={12} fontWeight="bold">SWITCH INGRESS BUFFER</text>
        <rect x={480} y={68} width={180} height={18} rx={4} fill="var(--bg3)" stroke="var(--ink3)" />
        <rect x={480} y={68} width={Math.min(180, (headroomBytes / 200000) * 180)} height={18} rx={4} fill="#FF9E7A" opacity={0.7} />
        <text x={570} y={81} textAnchor="middle" fill="#fff" fontSize={9.5} fontFamily="var(--font-m, monospace)">
          PFC Headroom: {(headroomBytes / 1024).toFixed(1)} KB
        </text>
      </svg>
    </div>
  );
}

/* ================= 06 FatTreeRailOptimized ================= */
export function FatTreeRailOptimized() {
  const [downlinks, setDownlinks] = useState(32);
  const [uplinks, setUplinks] = useState(32);

  const { ratio, isNonBlocking, bisectionBwTbps } = oversubscriptionRatio(downlinks, uplinks, 400);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Downlinks / Leaf: <b>{downlinks}</b>
          <input type="range" min={16} max={64} step={8} value={downlinks} onChange={(e) => setDownlinks(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Uplinks / Leaf: <b>{uplinks}</b>
          <input type="range" min={8} max={64} step={8} value={uplinks} onChange={(e) => setUplinks(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: isNonBlocking ? "var(--teal)" : "var(--rose)", borderColor: "currentColor" }}>
          OVERSUBSCRIPTION · <b>{ratio.toFixed(2)}:1 ({isNonBlocking ? "NON-BLOCKING" : "BLOCKING"})</b>
        </span>
      </div>

      <svg viewBox="0 0 700 200" role="img" aria-label="Rail-Optimized Fat Tree Architecture" style={{ width: "100%", height: "auto", background: "var(--bg3)", borderRadius: 8 }}>
        {/* Spine Switches Tier */}
        {Array.from({ length: 4 }).map((_, i) => (
          <g key={`spine-${i}`}>
            <rect x={120 + i * 130} y={30} width={90} height={36} rx={6} fill="#1F2937" stroke="var(--gold)" strokeWidth={1.5} />
            <text x={165 + i * 130} y={52} textAnchor="middle" fill="var(--gold)" fontSize={11} fontWeight="bold">SPINE {i}</text>
          </g>
        ))}

        {/* Leaf Switches (Rails) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <g key={`leaf-${i}`}>
            <rect x={120 + i * 130} y={120} width={90} height={36} rx={6} fill="var(--bg2)" stroke="var(--cyan)" strokeWidth={1.5} />
            <text x={165 + i * 130} y={142} textAnchor="middle" fill="var(--cyan)" fontSize={11} fontWeight="bold">RAIL LEAF {i}</text>

            {/* Interconnect lines */}
            {Array.from({ length: 4 }).map((_, si) => (
              <line key={`link-${i}-${si}`} x1={165 + i * 130} y1={120} x2={165 + si * 130} y2={66} stroke="rgba(92,200,255,0.2)" strokeWidth={1} />
            ))}
          </g>
        ))}

        <text x={350} y={185} textAnchor="middle" fill="var(--ink2)" fontSize={11} fontFamily="var(--font-m, monospace)">
          GPU ORDINAL 0-7 ATTACHED STRICTLY TO RAIL LEAF 0-7 · ZERO CROSS-RAIL CONGESTION
        </text>
      </svg>
      <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink2)" }}>
        Total Bisection Bandwidth: <b>{bisectionBwTbps.toFixed(1)} Tbps</b> across spine plane.
      </div>
    </div>
  );
}

/* ================= 07 RingVsTreeAllreduce ================= */
export function RingVsTreeAllreduce() {
  const [ranks, setRanks] = useState(64);
  const [sizeMB, setSizeMB] = useState(100); // 100 MB gradient bucket
  const linkBw = 50; // 50 GB/s (400Gbps)
  const latencyUs = 1.5;

  const tRing = ringAllReduceTimeMs(ranks, sizeMB, linkBw, latencyUs);
  const tTree = treeAllReduceTimeMs(ranks, sizeMB, linkBw, latencyUs);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Ranks (N): <b>{ranks} GPUs</b>
          <input type="range" min={8} max={512} step={8} value={ranks} onChange={(e) => setRanks(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Tensor Size: <b>{sizeMB} MB</b>
          <input type="range" min={1} max={500} step={5} value={sizeMB} onChange={(e) => setSizeMB(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: tRing < tTree ? "var(--teal)" : "var(--gold)", borderColor: "currentColor" }}>
          OPTIMAL ALGORITHM · <b>{tRing < tTree ? "RING ALLREDUCE" : "TREE ALLREDUCE"}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid " + (tRing <= tTree ? "var(--teal)" : "var(--ink3)") }}>
          <div style={{ fontSize: 12, color: "var(--ink2)" }}>RING ALLREDUCE TIME</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--teal)", margin: "4px 0" }}>
            {tRing.toFixed(2)} <span style={{ fontSize: 16 }}>ms</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink2)" }}>Volume: 2*(N-1)/N * S = {(2 * ((ranks - 1) / ranks) * sizeMB).toFixed(1)} MB (Bandwidth-Bound)</div>
        </div>

        <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, borderLeft: "3px solid " + (tTree < tRing ? "var(--gold)" : "var(--ink3)") }}>
          <div style={{ fontSize: 12, color: "var(--ink2)" }}>TREE ALLREDUCE TIME</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--gold)", margin: "4px 0" }}>
            {tTree.toFixed(2)} <span style={{ fontSize: 16 }}>ms</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink2)" }}>Latency Steps: 2*log2(N) = {(2 * Math.log2(ranks)).toFixed(0)} hops (Latency-Bound)</div>
        </div>
      </div>

      <p className="raceCaption">
        {sizeMB > 2
          ? "Large tensor buckets (> 2MB) saturate maximum wire bandwidth with Ring AllReduce."
          : "Small tensor buckets (< 2MB) favor Tree AllReduce to avoid linear rank latency scaling."}
      </p>
    </div>
  );
}

/* ================= 08 IncastAdaptiveRouting ================= */
export function IncastAdaptiveRouting() {
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [concurrency, setConcurrency] = useState(32);

  const bufferDropRisk = !isAdaptive && concurrency > 16;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <button className={"btn " + (!isAdaptive ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsAdaptive(false)}>
          Static ECMP Hashing
        </button>
        <button className={"btn " + (isAdaptive ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsAdaptive(true)}>
          Dynamic Packet Spraying
        </button>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          Concurrent Senders: <b>{concurrency} nodes</b>
          <input type="range" min={8} max={64} step={8} value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} />
        </label>
      </div>

      <svg viewBox="0 0 700 160" role="img" aria-label="Incast Congestion Simulator" style={{ width: "100%", height: "auto", background: "var(--bg3)", borderRadius: 8 }}>
        {/* Senders */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={`sender-${i}`}>
            <rect x={20} y={20 + i * 26} width={90} height={20} rx={4} fill="var(--bg2)" stroke="var(--cyan)" />
            <text x={65} y={34 + i * 26} textAnchor="middle" fill="var(--cyan)" fontSize={10}>GPU Rank {i * 8}</text>
            <line
              x1={110}
              y1={30 + i * 26}
              x2={320}
              y2={isAdaptive ? 40 + i * 20 : 75}
              stroke={isAdaptive ? "var(--teal)" : bufferDropRisk ? "var(--rose)" : "#FF9E7A"}
              strokeWidth={1.5}
            />
          </g>
        ))}

        {/* Switch Core */}
        <rect x={320} y={30} width={140} height={100} rx={8} fill="#1F2937" stroke={bufferDropRisk ? "var(--rose)" : "var(--gold)"} strokeWidth={2} />
        <text x={390} y={60} textAnchor="middle" fill="var(--ink)" fontSize={12} fontWeight="bold">EGRESS SWITCH</text>
        <text x={390} y={80} textAnchor="middle" fill={bufferDropRisk ? "var(--rose)" : "var(--teal)"} fontSize={11}>
          {bufferDropRisk ? "BUFFER OVERFLOW (DROPS)" : isAdaptive ? "SPRAY BALANCED" : "STABLE QUEUE"}
        </text>

        {/* Receiver */}
        <rect x={550} y={55} width={110} height={50} rx={6} fill="var(--bg2)" stroke="var(--teal)" strokeWidth={1.5} />
        <text x={605} y={85} textAnchor="middle" fill="var(--ink)" fontSize={12} fontWeight="bold">RECEIVER NIC</text>
        <line x1={460} y1={80} x2={550} y2={80} stroke="var(--teal)" strokeWidth={3} />
      </svg>
      <p className="raceCaption" style={{ marginTop: 10 }}>
        {isAdaptive
          ? "Dynamic packet spraying chops flows into flowlets and sprays all uplinks uniformly, eliminating incast hot spots."
          : "Static ECMP hashes heavy collective flows onto the same uplink, causing buffer bloat and tail latency spikes."}
      </p>
    </div>
  );
}

/* ================= 09 GpudirectStorage ================= */
export function GpudirectStorage() {
  const [mode, setMode] = useState<"gds" | "posix-direct" | "posix-cached">("gds");
  const rawNvmeBw = 64; // 64 GB/s NVMe array
  const { effectiveGBs, cpuOverheadFrac, pcieHops } = storageThroughputGBs(rawNvmeBw, mode);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className={"btn " + (mode === "gds" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setMode("gds")}>
          GPUDirect Storage (GDS)
        </button>
        <button className={"btn " + (mode === "posix-direct" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setMode("posix-direct")}>
          POSIX O_DIRECT
        </button>
        <button className={"btn " + (mode === "posix-cached" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setMode("posix-cached")}>
          POSIX Buffered (Page Cache)
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>EFFECTIVE READ SPEED</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--teal)" }}>{effectiveGBs.toFixed(1)} <span style={{ fontSize: 14 }}>GB/s</span></div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>CPU OVERHEAD</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: cpuOverheadFrac > 0.3 ? "var(--rose)" : "var(--gold)" }}>
            {(cpuOverheadFrac * 100).toFixed(0)}%
          </div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>MEMORY BOUNCE HOPS</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#FF9E7A" }}>{pcieHops} Hops</div>
        </div>
      </div>

      <p className="raceCaption">
        {mode === "gds"
          ? "GDS streams directly from NVMe flash to GPU HBM via PCIe peer-to-peer DMA, completely bypassing CPU memory."
          : "POSIX copies data through kernel space and user space memory buffers, consuming high CPU cycles."}
      </p>
    </div>
  );
}

/* ================= 10 DalyCheckpointOpt ================= */
export function DalyCheckpointOpt() {
  const [mtbfHours, setMtbfHours] = useState(8);
  const [dumpTimeSec, setDumpTimeSec] = useState(120);

  const { optimalIntervalSec, optimalIntervalHours, wasteFrac } = optimalCheckpointIntervalSec(dumpTimeSec, mtbfHours);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Cluster MTBF: <b>{mtbfHours} hrs</b>
          <input type="range" min={1} max={48} step={1} value={mtbfHours} onChange={(e) => setMtbfHours(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Dump Time (δ): <b>{dumpTimeSec}s</b>
          <input type="range" min={10} max={600} step={10} value={dumpTimeSec} onChange={(e) => setDumpTimeSec(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: "var(--gold)", borderColor: "currentColor" }}>
          OPTIMAL INTERVAL · <b>{(optimalIntervalSec / 60).toFixed(0)} min ({optimalIntervalHours.toFixed(2)}h)</b>
        </span>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Expected Compute Waste (I/O Save + Crash Rework):</div>
        <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--gold)", margin: "4px 0" }}>
          {(wasteFrac * 100).toFixed(1)}% <span style={{ fontSize: 14 }}>of total cluster compute</span>
        </div>
      </div>
      <p className="raceCaption">
        Daly’s formula: τ = √(2 · δ · MTBF) - δ balances the cost of dumping state against the risk of uncommitted step loss.
      </p>
    </div>
  );
}

/* ================= 11 DataIngestStreaming ================= */
export function DataIngestStreaming() {
  const [numWorkers, setNumWorkers] = useState(4);
  const [batchMB, setBatchMB] = useState(64);

  const ingestThroughputGBs = numWorkers * 1.8;
  const isStarving = ingestThroughputGBs < (batchMB / 1024) * 30; // 30 steps/sec

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          DataLoader Workers: <b>{numWorkers} / GPU</b>
          <input type="range" min={1} max={12} step={1} value={numWorkers} onChange={(e) => setNumWorkers(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Batch Size: <b>{batchMB} MB</b>
          <input type="range" min={16} max={256} step={16} value={batchMB} onChange={(e) => setBatchMB(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: isStarving ? "var(--rose)" : "var(--teal)", borderColor: "currentColor" }}>
          GPU STATUS · <b>{isStarving ? "DATA STARVATION" : "100% SATURATED"}</b>
        </span>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Ring Buffer Ingestion Pipeline Throughput:</div>
        <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--ink)", marginTop: 4 }}>
          {ingestThroughputGBs.toFixed(1)} GB/s
        </div>
      </div>
    </div>
  );
}

/* ================= 12 CheckpointResumeMttr ================= */
export function CheckpointResumeMttr() {
  const [ranks, setRanks] = useState(1024);
  const [weightsGB, setWeightsGB] = useState(140); // 70B BF16
  const [storageBwGBs, setStorageBwGBs] = useState(400);

  const mttrMin = checkpointRecoveryTimeMin(weightsGB, storageBwGBs, 15, ranks);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Ranks (N): <b>{ranks}</b>
          <input type="range" min={64} max={8192} step={64} value={ranks} onChange={(e) => setRanks(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Storage Bandwidth: <b>{storageBwGBs} GB/s</b>
          <input type="range" min={50} max={1000} step={50} value={storageBwGBs} onChange={(e) => setStorageBwGBs(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: mttrMin < 1.0 ? "var(--teal)" : "#FF9E7A", borderColor: "currentColor" }}>
          TOTAL MTTR · <b>{(mttrMin * 60).toFixed(0)} SECONDS</b>
        </span>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Distributed Checkpoint Recovery Breakdown:</div>
        <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--teal)", marginTop: 4 }}>
          {mttrMin < 1.0 ? "Sub-Minute Clean Resume" : `${mttrMin.toFixed(2)} Minutes`}
        </div>
      </div>
    </div>
  );
}
