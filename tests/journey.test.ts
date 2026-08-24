import { describe, expect, it } from "vitest";
import { clampLaunch, formatLaunch, launchSummary, parseLaunchSource } from "@/lib/engine/launchConfig";
import { globalIndex, clampBlock, clampThread, IDX_BLOCKS, IDX_BLOCK_SIZE } from "@/lib/scenes/indexing";
import { PAIRS, computeRaceState } from "@/lib/scenes/problemState";
import { JOURNEY, journeyIndex, journeyNeighbors } from "@/content/cuda/journey";

describe("launch config parsing (code → simulation)", () => {
  it("parses a valid <<<grid, block>>> launch", () => {
    const cfg = parseLaunchSource("add<<<4, 256>>>(d_a, d_b, d_c, N);");
    expect(cfg).toEqual({ blocks: 4, threadsPerBlock: 256 });
  });
  it("returns null without a launch site", () => {
    expect(parseLaunchSource("int main(){ return 0; }")).toBeNull();
  });
  it("clamps wild values into safe ranges", () => {
    expect(clampLaunch({ grid: 9999, block: 9999 })).toEqual({ blocks: 512, threadsPerBlock: 1024 });
    expect(clampLaunch({ grid: 0, block: 0 }).blocks).toBe(1);
  });
  it("rounds block size to multiples of 32", () => {
    expect(clampLaunch({ grid: 4, block: 50 }).threadsPerBlock).toBe(64);
    expect(clampLaunch({ grid: 4, block: 10 }).threadsPerBlock).toBe(32);
  });
  it("formats and summarizes", () => {
    const cfg = clampLaunch({ grid: 8, block: 256 });
    expect(formatLaunch(cfg)).toBe("<<<8, 256>>>");
    const s = launchSummary(cfg);
    expect(s).toContain("2,048 threads");
    expect(s).toContain("64 warps");
  });
});

describe("thread indexing math", () => {
  it("maps every thread to a unique element", () => {
    const seen = new Set<number>();
    for (let b = 0; b < IDX_BLOCKS; b++)
      for (let t = 0; t < IDX_BLOCK_SIZE; t++)
        seen.add(globalIndex(b, t));
    expect(seen.size).toBe(IDX_BLOCKS * IDX_BLOCK_SIZE);
  });
  it("clamps selectors into range", () => {
    expect(clampBlock(99)).toBe(IDX_BLOCKS - 1);
    expect(clampBlock(-5)).toBe(0);
    expect(clampThread(99)).toBe(IDX_BLOCK_SIZE - 1);
  });
});

describe("problem race state (pure)", () => {
  const snap = (t: number) => JSON.stringify(computeRaceState(t));
  it("is scrub-safe", () => {
    const fwd = snap(0.55);
    void computeRaceState(0.95);
    void computeRaceState(0.05);
    expect(snap(0.55)).toBe(fwd);
  });
  it("cpu progress is monotonic; gpu wave fires once mid-run", () => {
    let prev = 0;
    for (let t = 0; t <= 1.001; t += 0.02) {
      const s = computeRaceState(t);
      expect(s.cpuDone).toBeGreaterThanOrEqual(prev);
      prev = s.cpuDone;
    }
    expect(computeRaceState(0.7).gpuDone).toBe(true);
    expect(computeRaceState(0.3).gpuDone).toBe(false);
    const cross = computeRaceState(0.63).crossoverStep;
    expect(cross).toBeGreaterThan(0);
    expect(cross).toBeLessThanOrEqual(PAIRS);
  });
});

describe("journey registry integrity", () => {
  it("has unique ids and rooted hrefs", () => {
    const ids = JOURNEY.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    JOURNEY.forEach((j) => expect(j.href.startsWith("/")).toBe(true));
  });
  it("neighbors are adjacent and consistent", () => {
    for (let i = 0; i < JOURNEY.length; i++) {
      const { prev, next } = journeyNeighbors(JOURNEY[i].id);
      if (prev) expect(journeyNeighbors(prev.id).next?.id).toBe(JOURNEY[i].id);
      if (next) expect(journeyNeighbors(next.id).prev?.id).toBe(JOURNEY[i].id);
    }
    expect(journeyIndex("first-kernel")).toBeGreaterThan(-1);
  });
});
