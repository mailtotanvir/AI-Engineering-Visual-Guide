import { describe, expect, it } from "vitest";
import { computeState, simulateKernelLaunch, DEFAULT_LAUNCH, _internal } from "@/lib/engine/simulation";
import { STAGES, stageOf } from "@/lib/engine/stages";

describe("stage table", () => {
  it("is monotonic and covers [0,1]", () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].a).toBeGreaterThanOrEqual(STAGES[i - 1].a);
    }
    expect(stageOf(0).k).toBe("cpu");
    expect(stageOf(0.999).k).toBe("done");
    expect(STAGES[0].a).toBe(0);
    expect(STAGES[STAGES.length - 1].b).toBeGreaterThan(1);
  });
  it("maps mid-stage samples to the right stage", () => {
    expect(stageOf(0.05).label).toBe("CPU PREPARES");
    expect(stageOf(0.15).label).toBe("KERNEL LAUNCH");
    expect(stageOf(0.25).label).toBe("GRID CREATED");
    expect(stageOf(0.45).label).toBe("BLOCKS SCHEDULED");
    expect(stageOf(0.65).label).toBe("WARPS EXECUTE");
    expect(stageOf(0.85).label).toBe("MEMORY STORE");
  });
});

describe("computeState purity (scrub-safe)", () => {
  const snap = (t: number) => JSON.stringify(computeState(t));
  it("reproduces identical states when scrubbing backwards", () => {
    const forward = snap(0.37);
    void computeState(0.9);
    void computeState(0.05);
    expect(snap(0.37)).toBe(forward);
  });
  it("clamps t into [0,1]", () => {
    expect(computeState(-2).t).toBe(0);
    expect(computeState(5).t).toBe(1);
  });
  it("keeps opacities in range and heat arrays sized", () => {
    for (let t = 0; t <= 1.0001; t += 0.037) {
      const s = computeState(t);
      for (const b of s.blocks) {
        expect(b.opacity).toBeGreaterThanOrEqual(0);
        expect(b.opacity).toBeLessThanOrEqual(1.001);
        b.heat.forEach((h) => {
          expect(h).toBeGreaterThanOrEqual(0);
          expect(h).toBeLessThanOrEqual(1.001);
        });
        expect(b.heat).toHaveLength(8);
      }
      s.memFill.forEach((f) => {
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1.001);
      });
    }
  });
  it("applies spotlight anchors per stage", () => {
    expect(computeState(0.6).spotlight).toEqual({ cpu: 0.15, core: 1, staging: 0.3, memory: 0.25 });
    expect(computeState(0.85).spotlight.memory).toBe(1);
    expect(computeState(0.85).spotlight.core).toBeCloseTo(0.72, 5);
    expect(computeState(0.25).spotlight.staging).toBe(1);
  });
  it("seats blocks only after their flight window", () => {
    const early = computeState(_internal.arriveAt(3) - 0.01).blocks[3];
    const late = computeState(_internal.arriveAt(3) + 0.01).blocks[3];
    expect(early.seated).toBe(false);
    expect(late.seated).toBe(true);
    expect(late.x).toBeCloseTo(late.x, 5);
  });
  it("fills memory monotonically", () => {
    let prev = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const f = computeState(t).memFill[10];
      expect(f).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = f;
    }
  });
});

describe("simulateKernelLaunch event contract", () => {
  it("emits ordered events covering the full lifecycle", () => {
    const ev = simulateKernelLaunch(DEFAULT_LAUNCH);
    const types = ev.map((e) => e.type);
    for (const required of ["KERNEL_LAUNCH", "GRID_CREATED", "WARP_FORMED", "BLOCK_SCHEDULED", "THREAD_EXECUTE", "MEMORY_STORE", "KERNEL_COMPLETE"]) {
      expect(types).toContain(required);
    }
    for (let i = 1; i < ev.length; i++) {
      expect(ev[i].t).toBeGreaterThanOrEqual(ev[i - 1].t);
    }
    ev.forEach((e) => {
      expect(e.t).toBeGreaterThanOrEqual(0);
      expect(e.t).toBeLessThanOrEqual(1.001);
    });
  });
});
