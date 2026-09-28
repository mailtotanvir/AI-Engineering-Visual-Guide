import { describe, expect, it } from "vitest";
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
  jobPlacementLocalityScore,
  stragglerSyncPenaltyMs,
  migProfileSpec,
  clusterMtbfHours,
  datacenterPowerBreakdown,
  rackThermalMargin,
  computeMFU,
  trainingUnitEconomics,
} from "@/lib/infra/engine";
import { INFRA_JOURNEY, INFRA_MODULES, infraIndex, infraNeighbors } from "@/content/infra/journey";
import { INFRA_DOMAINS, INFRA_TOPICS } from "@/content/infra/atlas";
import { SCENE_NOTES } from "@/content/infra/notes";

describe("Infrastructure Mathematical Engine", () => {
  it("calculates bisection bandwidth correctly", () => {
    // 72 links * 50 GB/s * 2 (bidirectional) = 7200 GB/s = 7.2 TB/s
    const bw = bisectionBandwidth(72, 50, true);
    expect(bw).toBe(7200);
  });

  it("models host to device transfer latency", () => {
    const t = h2dTransferTimeMs(1024, 64, 4.5);
    expect(t).toBeGreaterThan(15);
    expect(t).toBeLessThan(25);
  });

  it("calculates roofline knee and operational regime", () => {
    const knee = rooflineKnee(989, 3.35);
    expect(knee).toBeCloseTo(295.22, 1);

    const memBound = rooflineAttainableTflops(50, 989, 3.35);
    expect(memBound.regime).toBe("memory-bound");
    expect(memBound.attainableTflops).toBeCloseTo(167.5, 1);

    const compBound = rooflineAttainableTflops(400, 989, 3.35);
    expect(compBound.regime).toBe("compute-bound");
    expect(compBound.attainableTflops).toBe(989);
  });

  it("models Ring vs Tree AllReduce trade-offs", () => {
    // Large tensor favors Ring
    const ringTime = ringAllReduceTimeMs(64, 100, 50, 1.5);
    const treeTime = treeAllReduceTimeMs(64, 100, 50, 1.5);
    expect(ringTime).toBeLessThan(treeTime);

    // Small tensor favors Tree
    const ringSmall = ringAllReduceTimeMs(64, 0.05, 50, 1.5);
    const treeSmall = treeAllReduceTimeMs(64, 0.05, 50, 1.5);
    expect(treeSmall).toBeLessThan(ringSmall);
  });

  it("calculates RoCE PFC headroom buffer requirements", () => {
    const headroom = pfcHeadroomBytes(100, 400, 400);
    expect(headroom).toBeGreaterThan(50000);
    expect(headroom).toBeLessThan(200000);
  });

  it("evaluates oversubscription ratios", () => {
    const nonBlock = oversubscriptionRatio(32, 32, 400);
    expect(nonBlock.isNonBlocking).toBe(true);
    expect(nonBlock.ratio).toBe(1.0);

    const block = oversubscriptionRatio(32, 16, 400);
    expect(block.isNonBlocking).toBe(false);
    expect(block.ratio).toBe(2.0);
  });

  it("evaluates GPUDirect Storage vs POSIX throughput", () => {
    const gds = storageThroughputGBs(64, "gds");
    const posix = storageThroughputGBs(64, "posix-cached");
    expect(gds.effectiveGBs).toBeGreaterThan(posix.effectiveGBs);
    expect(gds.cpuOverheadFrac).toBeLessThan(posix.cpuOverheadFrac);
  });

  it("computes Daly optimal checkpoint interval", () => {
    const { optimalIntervalSec, optimalIntervalHours, wasteFrac } = optimalCheckpointIntervalSec(120, 8);
    expect(optimalIntervalSec).toBeGreaterThan(2000);
    expect(optimalIntervalHours).toBeGreaterThan(0.5);
    expect(wasteFrac).toBeGreaterThan(0);
    expect(wasteFrac).toBeLessThan(0.3);
  });

  it("models straggler penalty on collective step", () => {
    const clean = stragglerSyncPenaltyMs(400, 0, 0.25);
    expect(clean.effectiveStepMs).toBe(400);
    expect(clean.throughputDropFrac).toBe(0);

    const degraded = stragglerSyncPenaltyMs(400, 1, 0.25);
    expect(degraded.effectiveStepMs).toBe(500);
    expect(degraded.throughputDropFrac).toBe(0.2);
  });

  it("validates MIG profiles", () => {
    const p1g = migProfileSpec("1g.10gb");
    expect(p1g.sms).toBe(14);
    expect(p1g.memoryGB).toBe(10);
    expect(p1g.maxInstances).toBe(7);
  });

  it("computes MFU and training unit economics", () => {
    const mfu = computeMFU(45000, 6 * 70e9, 64, 989);
    expect(mfu).toBeGreaterThan(0.25);
    expect(mfu).toBeLessThan(0.60);

    const econ = trainingUnitEconomics(512, 2.0, 35000, 15);
    expect(econ.clusterHourlyBurn).toBe(1024);
    expect(econ.costPerMillionTokens).toBeGreaterThan(0.01);
  });
});

describe("Infrastructure Content & Journey", () => {
  it("contains 6 modules and exactly 24 scenes", () => {
    expect(INFRA_MODULES.length).toBe(6);
    expect(INFRA_JOURNEY.length).toBe(24);
  });

  it("provides valid navigation neighbor links", () => {
    const first = INFRA_JOURNEY[0];
    const neighbors0 = infraNeighbors(first.id);
    expect(neighbors0.prev).toBeUndefined();
    expect(neighbors0.next).toBeDefined();

    const last = INFRA_JOURNEY[INFRA_JOURNEY.length - 1];
    const neighborsLast = infraNeighbors(last.id);
    expect(neighborsLast.next).toBeUndefined();
    expect(neighborsLast.prev).toBeDefined();
  });

  it("has complete notes for every scene in the journey", () => {
    for (const scene of INFRA_JOURNEY) {
      const note = SCENE_NOTES[scene.id];
      expect(note, `Scene ${scene.id} missing in SCENE_NOTES`).toBeDefined();
      expect(note.keyConcepts.length).toBeGreaterThanOrEqual(2);
      expect(note.realWorldEngineering.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("has complete atlas domains and topic bindings", () => {
    expect(INFRA_DOMAINS.length).toBe(8);
    expect(INFRA_TOPICS.length).toBeGreaterThanOrEqual(16);

    for (const topic of INFRA_TOPICS) {
      if (topic.kind === "scene" && topic.scene) {
        expect(infraIndex(topic.scene)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
