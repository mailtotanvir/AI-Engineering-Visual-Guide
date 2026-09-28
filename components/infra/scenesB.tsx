"use client";

import React, { useState } from "react";
import {
  jobPlacementLocalityScore,
  stragglerSyncPenaltyMs,
  migProfileSpec,
  clusterMtbfHours,
  datacenterPowerBreakdown,
  rackThermalMargin,
  computeMFU,
  trainingUnitEconomics,
} from "@/lib/infra/engine";

/* ================= 13 GangSchedulingKueue ================= */
export function GangSchedulingKueue() {
  const [isGangActive, setIsGangActive] = useState(true);
  const [activeJobs, setActiveJobs] = useState(3);

  const clusterCapacityGpus = 64;
  const gpusPerJob = 24; // 3 jobs need 72 GPUs, but only 64 exist!

  const allocated = isGangActive ? 48 : 64;
  const isDeadlocked = !isGangActive && activeJobs * gpusPerJob > clusterCapacityGpus;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <button className={"btn " + (isGangActive ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsGangActive(true)}>
          Kueue Gang Scheduling (Atomic)
        </button>
        <button className={"btn " + (!isGangActive ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setIsGangActive(false)}>
          Standard Scheduler (Partial)
        </button>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          Queued Jobs: <b>{activeJobs}</b>
          <input type="range" min={1} max={4} step={1} value={activeJobs} onChange={(e) => setActiveJobs(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8, borderLeft: "3px solid " + (isDeadlocked ? "var(--rose)" : "var(--teal)") }}>
          <div style={{ fontSize: 12, color: "var(--ink2)" }}>CLUSTER STATUS</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: isDeadlocked ? "var(--rose)" : "var(--teal)", marginTop: 2 }}>
            {isDeadlocked ? "DISTRIBUTED DEADLOCK" : isGangActive ? "2 JOBS RUNNING (1 QUEUED)" : "RUNNING"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink2)", marginTop: 4 }}>
            Allocated: {allocated} / {clusterCapacityGpus} GPUs
          </div>
        </div>

        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "var(--ink2)" }}>ALLOCATION MECHANISM</div>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--ink)", lineHeight: 1.4 }}>
            {isGangActive
              ? "All 24 ranks scheduled simultaneously. If full quota is unavailable, job waits in queue without holding GPUs idle."
              : "Partial scheduling assigns 16 ranks to Job 3 while 8 ranks are missing. All jobs freeze waiting for ranks."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= 14 TopologyAwarePlacement ================= */
export function TopologyAwarePlacement() {
  const [sameRack, setSameRack] = useState(8);
  const [sameSpine, setSameSpine] = useState(0);
  const [interPod, setInterPod] = useState(0);

  const { avgHopCount, commSlowdownFactor } = jobPlacementLocalityScore({ sameRack, sameSpine, interPod });

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Same Rack Nodes: <b>{sameRack}</b>
          <input type="range" min={0} max={16} step={1} value={sameRack} onChange={(e) => setSameRack(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Same Spine Nodes: <b>{sameSpine}</b>
          <input type="range" min={0} max={16} step={1} value={sameSpine} onChange={(e) => setSameSpine(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Inter-Pod Nodes: <b>{interPod}</b>
          <input type="range" min={0} max={16} step={1} value={interPod} onChange={(e) => setInterPod(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>AVERAGE NETWORK HOPS</span>
          <div style={{ fontSize: 28, fontWeight: "bold", color: avgHopCount <= 1.5 ? "var(--teal)" : "#FF9E7A" }}>
            {avgHopCount.toFixed(2)} <span style={{ fontSize: 14 }}>Hops / Message</span>
          </div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>COMMUNICATION SLOWDOWN</span>
          <div style={{ fontSize: 28, fontWeight: "bold", color: commSlowdownFactor <= 1.1 ? "var(--teal)" : "var(--rose)" }}>
            +{((commSlowdownFactor - 1.0) * 100).toFixed(1)}% <span style={{ fontSize: 14 }}>Latency Penalty</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 15 StragglerDetection ================= */
export function StragglerDetection() {
  const [slowdownFrac, setSlowdownFrac] = useState(0.25); // 25% slower
  const [hasStraggler, setHasStraggler] = useState(true);

  const baselineStepMs = 450;
  const { effectiveStepMs, throughputDropFrac } = stragglerSyncPenaltyMs(baselineStepMs, hasStraggler ? 1 : 0, slowdownFrac);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <button className={"btn " + (hasStraggler ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setHasStraggler(!hasStraggler)}>
          {hasStraggler ? "Straggler Present (1 Node)" : "Clean Fleet (Nominal)"}
        </button>
        {hasStraggler && (
          <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
            Degradation: <b>+{(slowdownFrac * 100).toFixed(0)}% step time</b>
            <input type="range" min={0.05} max={1.0} step={0.05} value={slowdownFrac} onChange={(e) => setSlowdownFrac(Number(e.target.value))} />
          </label>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>EFFECTIVE STEP TIME</span>
          <div style={{ fontSize: 28, fontWeight: "bold", color: hasStraggler ? "var(--rose)" : "var(--teal)" }}>
            {effectiveStepMs.toFixed(0)} <span style={{ fontSize: 14 }}>ms (Baseline: 450 ms)</span>
          </div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>FLEET THROUGHPUT LOSS</span>
          <div style={{ fontSize: 28, fontWeight: "bold", color: hasStraggler ? "var(--rose)" : "var(--teal)" }}>
            -{(throughputDropFrac * 100).toFixed(1)}% <span style={{ fontSize: 14 }}>Across All 10,000 GPUs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 16 MigHardwareSlicing ================= */
export function MigHardwareSlicing() {
  const [slice, setSlice] = useState<"1g.10gb" | "2g.20gb" | "3g.40gb" | "4g.40gb" | "7g.80gb">("1g.10gb");
  const spec = migProfileSpec(slice);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(["1g.10gb", "2g.20gb", "3g.40gb", "4g.40gb", "7g.80gb"] as const).map((s) => (
          <button key={s} className={"btn btnSm " + (slice === s ? "btnPrimary" : "btnSecondary")} onClick={() => setSlice(s)}>
            MIG {s}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>STREAMING MULTIPROCESSORS</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--gold)" }}>{spec.sms} <span style={{ fontSize: 14 }}>SMs (of 132)</span></div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>ISOLATED HBM CAPACITY</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--teal)" }}>{spec.memoryGB} <span style={{ fontSize: 14 }}>GB</span></div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>MEMORY BANDWIDTH</span>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--cyan)" }}>{spec.memoryBwGBs} <span style={{ fontSize: 14 }}>GB/s</span></div>
        </div>
      </div>
      <p className="raceCaption">
        Up to <b>{spec.maxInstances} concurrent isolated instances</b> can run on a single physical 80GB H100 with zero noisy-neighbor interference.
      </p>
    </div>
  );
}

/* ================= 17 SilentDataCorruption ================= */
export function SilentDataCorruption() {
  const [fleetGpus, setFleetGpus] = useState(16384);
  const [days, setDays] = useState(30);

  const mtbfHours = clusterMtbfHours(500000, fleetGpus, 0.0001);
  const totalGpuHours = fleetGpus * days * 24;
  const sdcRisk = 1 - Math.exp(-totalGpuHours / 10000000); // 1 per 10M GPU hours

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Cluster Size: <b>{fleetGpus.toLocaleString()} GPUs</b>
          <input type="range" min={1024} max={32768} step={1024} value={fleetGpus} onChange={(e) => setFleetGpus(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Training Run: <b>{days} Days</b>
          <input type="range" min={7} max={90} step={7} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>CLUSTER HARD FAILURE MTBF</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--gold)" }}>
            {mtbfHours.toFixed(1)} <span style={{ fontSize: 14 }}>Hours between crashes</span>
          </div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>SDC BITFLIP PROBABILITY</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: sdcRisk > 0.5 ? "var(--rose)" : "var(--teal)" }}>
            {(sdcRisk * 100).toFixed(1)}% <span style={{ fontSize: 14 }}>during run</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 18 RackPowerLiquidCooling ================= */
export function RackPowerLiquidCooling() {
  const [rackKw, setRackKw] = useState(100);
  const maxCoolingKw = 130;

  const { marginKw, isThrottlingRisk, tempRiseCelsius } = rackThermalMargin(rackKw, maxCoolingKw);
  const flowGpm = (rackKw / (4.184 * 10)) * 15.85; // GPM conversion

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Rack IT Load: <b>{rackKw} kW</b>
          <input type="range" min={20} max={150} step={5} value={rackKw} onChange={(e) => setRackKw(Number(e.target.value))} />
        </label>
        <span className="configChip" style={{ marginLeft: "auto", color: isThrottlingRisk ? "var(--rose)" : "var(--teal)", borderColor: "currentColor" }}>
          STATUS · <b>{isThrottlingRisk ? "THERMAL THROTTLE RISK" : "COOLING MARGIN NOMINAL"}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>CDU WATER FLOW RATE</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--cyan)" }}>
            {flowGpm.toFixed(1)} <span style={{ fontSize: 14 }}>Gallons / Minute (GPM)</span>
          </div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>COOLING CAPACITY MARGIN</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: marginKw < 0 ? "var(--rose)" : "var(--gold)" }}>
            {marginKw.toFixed(0)} <span style={{ fontSize: 14 }}>kW Headroom</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 19 PredictiveNodeDrain ================= */
export function PredictiveNodeDrain() {
  const [mode, setMode] = useState<"proactive" | "reactive">("proactive");
  const cost = mode === "proactive" ? 50 : 15000;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className={"btn " + (mode === "proactive" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setMode("proactive")}>
          Autonomous Pre-Failure Drain (Checkpoint Boundary)
        </button>
        <button className={"btn " + (mode === "reactive" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setMode("reactive")}>
          Reactive Hard Crash (Kernel Panic)
        </button>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Cost of Hardware Failure Event (4,096 GPUs):</div>
        <div style={{ fontSize: 32, fontWeight: "bold", color: mode === "proactive" ? "var(--teal)" : "var(--rose)", margin: "4px 0" }}>
          ${cost.toLocaleString()} <span style={{ fontSize: 16 }}>({mode === "proactive" ? "30s hot node swap" : "30 min lost rework + 10 min MTTR"})</span>
        </div>
      </div>
    </div>
  );
}

/* ================= 20 PueCarbonGrid ================= */
export function PueCarbonGrid() {
  const [cooling, setCooling] = useState<"air" | "direct-liquid" | "immersion">("direct-liquid");
  const itLoadKw = 10000; // 10 MW
  const { coolingKw, totalPowerKw, pue } = datacenterPowerBreakdown(itLoadKw, cooling);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className={"btn " + (cooling === "direct-liquid" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setCooling("direct-liquid")}>
          Direct Liquid (PUE 1.15)
        </button>
        <button className={"btn " + (cooling === "air" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setCooling("air")}>
          Air-Cooled (PUE 1.45)
        </button>
        <button className={"btn " + (cooling === "immersion" ? "btnPrimary" : "btnSecondary") + " btnSm"} onClick={() => setCooling("immersion")}>
          Immersion (PUE 1.05)
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>FACILITY PUE RATING</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: pue < 1.2 ? "var(--teal)" : "var(--rose)" }}>{pue.toFixed(2)}</div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>COOLING OVERHEAD POWER</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--gold)" }}>{(coolingKw / 1000).toFixed(2)} MW</div>
        </div>
      </div>
    </div>
  );
}

/* ================= 21 MfuVsMbuAccounting ================= */
export function MfuVsMbuAccounting() {
  const [tokensPerSec, setTokensPerSec] = useState(4500);
  const [paramsB, setParamsB] = useState(70);
  const numGpus = 64;
  const peakTflops = 989; // H100

  const flopsPerToken = 6 * paramsB * 1e9;
  const mfu = computeMFU(tokensPerSec, flopsPerToken, numGpus, peakTflops);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Throughput: <b>{tokensPerSec} tok/s</b>
          <input type="range" min={1000} max={8000} step={250} value={tokensPerSec} onChange={(e) => setTokensPerSec(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Model: <b>{paramsB}B Params</b>
          <input type="range" min={8} max={405} step={8} value={paramsB} onChange={(e) => setParamsB(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Model FLOPs Utilization (MFU):</div>
        <div style={{ fontSize: 32, fontWeight: "bold", color: mfu > 0.45 ? "var(--teal)" : mfu > 0.3 ? "var(--gold)" : "var(--rose)", margin: "4px 0" }}>
          {(mfu * 100).toFixed(1)}% <span style={{ fontSize: 16 }}>(World Class Target: 45% - 55%)</span>
        </div>
      </div>
    </div>
  );
}

/* ================= 22 ClusterTcoModeling ================= */
export function ClusterTcoModeling() {
  const [numGpus, setNumGpus] = useState(1024);
  const [gpuHourlyRate, setGpuHourlyRate] = useState(2.25);

  const { clusterHourlyBurn, totalRunCostDollars } = trainingUnitEconomics(numGpus, gpuHourlyRate, 50000, 15);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Cluster GPUs: <b>{numGpus}</b>
          <input type="range" min={128} max={4096} step={128} value={numGpus} onChange={(e) => setNumGpus(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Rate / GPU-Hour: <b>${gpuHourlyRate.toFixed(2)}</b>
          <input type="range" min={1.5} max={4.0} step={0.25} value={gpuHourlyRate} onChange={(e) => setGpuHourlyRate(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Cluster Hourly Burn Rate:</div>
        <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--gold)", marginTop: 4 }}>
          ${clusterHourlyBurn.toLocaleString()} / Hour
        </div>
      </div>
    </div>
  );
}

/* ================= 23 TokenCostUnitEconomics ================= */
export function TokenCostUnitEconomics() {
  const [tokensTrillion, setTokensTrillion] = useState(15);
  const [paramsB, setParamsB] = useState(8);

  const { totalRunCostDollars, costPerMillionTokens } = trainingUnitEconomics(512, 2.0, 35000, tokensTrillion);

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Tokens: <b>{tokensTrillion} Trillion</b>
          <input type="range" min={1} max={25} step={1} value={tokensTrillion} onChange={(e) => setTokensTrillion(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>TOTAL TRAINING RUN COST</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--gold)" }}>${(totalRunCostDollars / 1000).toFixed(0)}k</div>
        </div>
        <div style={{ background: "var(--bg3)", padding: 14, borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink2)" }}>COST / 1M TRAINING TOKENS</span>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--teal)" }}>${costPerMillionTokens.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}

/* ================= 24 SpotInterruptionArbitrage ================= */
export function SpotInterruptionArbitrage() {
  const [discountFrac, setDiscountFrac] = useState(0.65); // 65% spot discount

  const onDemandCost = 1000000;
  const spotCost = onDemandCost * (1 - discountFrac) * 1.05; // 5% rework overhead
  const netSavings = ((onDemandCost - spotCost) / onDemandCost) * 100;

  return (
    <div className="panel" style={{ padding: "var(--s5)" }}>
      <div className="controls" style={{ marginBottom: "var(--s4)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 8 }}>
          Spot Discount: <b>{(discountFrac * 100).toFixed(0)}%</b>
          <input type="range" min={0.4} max={0.8} step={0.05} value={discountFrac} onChange={(e) => setDiscountFrac(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ background: "var(--bg3)", padding: 16, borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "var(--ink2)" }}>Net Compute Bill Savings (after preemption rework):</div>
        <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--teal)", marginTop: 4 }}>
          {netSavings.toFixed(1)}% Cost Reduction
        </div>
      </div>
    </div>
  );
}
