import { describe, expect, it } from "vitest";
import {
  BANK_LANES, BANKS, computeBankState, occupancyModel,
  streamSchedule, tilingTraffic, graphSavings, computeAtomicRace, NVCC_STAGES,
} from "@/lib/scenes/atlasState";
import { DOMAINS, DOMAIN_COLORS, TOPICS } from "@/content/cuda/atlas";

describe("shared memory banks", () => {
  it.each([1, 2, 4, 8])("stride %i serializes into the expected cycle count", (stride) => {
    const s = computeBankState(stride, 1);
    expect(s.cycles).toBe(stride);
    expect(s.maxConflicts).toBe(stride);
  });
  it("stride 1 is conflict-free across all banks", () => {
    const s = computeBankState(1, 0.5);
    expect(s.addresses).toHaveLength(BANK_LANES);
    expect(new Set(s.bankOf).size).toBe(BANK_LANES);
    expect(s.distinctBanks).toBeLessThanOrEqual(BANKS);
    expect(s.cyclesDone).toBeLessThanOrEqual(s.cycles);
  });
});

describe("occupancy model", () => {
  it("fewer registers raise occupancy", () => {
    expect(occupancyModel(255, 256).occupancy)
      .toBeLessThan(occupancyModel(24, 256).occupancy);
  });
  it("reports which resource is the binding limit", () => {
    expect(["registers", "warp-slots", "block-cap"])
      .toContain(occupancyModel(40, 256).limit);
  });
  it("never exceeds hardware warp slots", () => {
    for (const regs of [8, 24, 40, 80, 160, 255])
      for (const tpb of [32, 128, 256, 512, 1024]) {
        const m = occupancyModel(regs, tpb);
        expect(m.residentWarps).toBeLessThanOrEqual(64);
        expect(m.occupancy).toBeGreaterThan(0);
      }
  });
});

describe("tiling traffic", () => {
  it("tiled moves strictly less data than naive", () => {
    const t = tilingTraffic();
    expect(t.tiledLoads).toBeLessThan(t.naiveLoads);
    expect(t.ratio).toBeGreaterThan(1);
  });
});

describe("stream schedules", () => {
  it("overlapped streams finish before the serial default", () => {
    const serial = streamSchedule("serial");
    const streams = streamSchedule("streams", 2);
    expect(streams.makespan).toBeLessThan(serial.makespan);
  });
  it("serial bars never overlap on one lane", () => {
    const { bars } = streamSchedule("serial");
    const h2d = bars.filter((b) => b.lane === "H2D");
    for (let i = 1; i < h2d.length; i++)
      expect(h2d[i].start).toBeGreaterThanOrEqual(h2d[i - 1].end);
  });
});

describe("graph savings", () => {
  it("replay removes most launch overhead", () => {
    const g = graphSavings();
    expect(g.savedPct).toBeGreaterThan(20);
  });
});

describe("nvcc pipeline order", () => {
  it("splits before producing PTX and SASS, links last", () => {
    const ids = NVCC_STAGES.map((s) => s.id);
    expect(ids.indexOf("split")).toBeLessThan(ids.indexOf("ptx"));
    expect(ids.indexOf("ptx")).toBeLessThan(ids.indexOf("sass"));
    expect(ids[ids.length - 1]).toBe("fatbin");
  });
});

describe("atomic race", () => {
  it("unsafe path loses updates; atomic path reaches full count", () => {
    const s = computeAtomicRace(1);
    expect(s.unsafeValue).toBeLessThan(s.safeValue);
    expect(s.safeValue).toBe(96);
    expect(s.lostUpdates).toBe(s.safeValue - s.unsafeValue);
  });
});

describe("atlas registry integrity", () => {
  it("covers all seven domains with unique topic ids", () => {
    expect(DOMAINS).toHaveLength(7);
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    TOPICS.forEach((t) => {
      expect(DOMAIN_COLORS[t.domain]).toBeDefined();
      expect(t.summary.length).toBeGreaterThan(10);
    });
  });
  it("every interactive topic resolves to a demo route id", () => {
    TOPICS.filter((t) => t.kind === "interactive").forEach((t) => {
      expect(t.interactiveId).toBeTruthy();
    });
    expect(TOPICS.filter((t) => t.kind === "interactive")).toHaveLength(7);
  });
});
