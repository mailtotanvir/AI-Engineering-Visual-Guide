import { describe, expect, it } from "vitest";
import { WARP_LANES, computeWarpState } from "@/lib/scenes/warpsState";
import {
  ACCESS_LANES, MEMORY_ROW,
  addressesFor, computeAccessState, accessClusters,
} from "@/lib/scenes/memoryState";
import { DEBUG_CELLS, computeDebugState } from "@/lib/scenes/debugState";
import { checkChallenge, CHALLENGE_TEMPLATE } from "@/lib/scenes/challenge";
import { JOURNEY, journeyNeighbors } from "@/content/cuda/journey";

describe("warp divergence state", () => {
  const snap = (t: number) => JSON.stringify(computeWarpState(t));
  it("is scrub-safe", () => {
    const fwd = snap(0.7);
    void computeWarpState(0.1);
    void computeWarpState(1);
    expect(snap(0.7)).toBe(fwd);
  });
  it("walks the five phases in order", () => {
    expect(computeWarpState(0.05).phase).toBe("unified");
    expect(computeWarpState(0.25).phase).toBe("split");
    expect(computeWarpState(0.45).phase).toBe("pathA");
    expect(computeWarpState(0.7).phase).toBe("pathB");
    expect(computeWarpState(0.95).phase).toBe("reconverged");
  });
  it("splits evens up and odds down; all lanes active again at end", () => {
    const mid = computeWarpState(0.5);
    expect(mid.laneOffsetY[0]).toBeLessThan(0);
    expect(mid.laneOffsetY[1]).toBeGreaterThan(0);
    expect(mid.laneActive[0]).toBeGreaterThan(mid.laneActive[1]);
    const end = computeWarpState(1);
    end.laneActive.forEach((a) => expect(a).toBe(1));
    end.laneOffsetY.forEach((o) => expect(o).toBe(0));
  });
});

describe("coalescing duel", () => {
  it("coalesced touches neighbours: one transaction", () => {
    const s = computeAccessState("coalesced", 1);
    expect(s.transactions).toBe(1);
    expect(s.addresses).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(accessClusters("coalesced")).toHaveLength(1);
  });
  it("strided scatters into many transactions", () => {
    const addrs = addressesFor("strided");
    expect(addrs).toHaveLength(ACCESS_LANES);
    expect(new Set(addrs).size).toBe(ACCESS_LANES);
    const s = computeAccessState("strided", 1);
    expect(s.transactions).toBeGreaterThan(1);
  });
  it("glow respects row bounds and completes for both patterns", () => {
    for (const p of ["coalesced", "strided"] as const) {
      const s = computeAccessState(p, 1);
      expect(s.done).toBe(true);
      s.cellGlow.forEach((g) => expect(g).toBeGreaterThanOrEqual(0));
      expect(MEMORY_ROW).toBeGreaterThan(Math.max(...s.addresses));
    }
  });
});

describe("debug kernel writes", () => {
  it("offByOne skips element 0 and flags out-of-bounds", () => {
    const s = computeDebugState(1, "offByOne");
    expect(s.missing).toContain(0);
    expect(s.outOfBounds).toBeGreaterThan(0);
    expect(s.collisions.some((c) => c > 0)).toBe(false);
  });
  it("wrongVar collides on early cells and starves the rest", () => {
    const s = computeDebugState(1, "wrongVar");
    expect(s.collisions.slice(0, 4).every((c) => c === 3)).toBe(true);
    expect(s.missing.length).toBe(DEBUG_CELLS - 4);
  });
  it("fixed mapping covers everything exactly once", () => {
    const s = computeDebugState(1, "fixed");
    expect(s.missing).toHaveLength(0);
    expect(s.outOfBounds).toBe(0);
    expect(s.collisions.every((c) => c === 0)).toBe(true);
  });
  it("is scrub-safe", () => {
    const a = JSON.stringify(computeDebugState(0.44, "wrongVar"));
    void computeDebugState(1, "fixed");
    expect(JSON.stringify(computeDebugState(0.44, "wrongVar"))).toBe(a);
  });
});

describe("challenge checker", () => {
  it("accepts the canonical line", () => {
    expect(checkChallenge(CHALLENGE_TEMPLATE.replace("int i = 0; // ← fix me",
      "int i = blockIdx.x * blockDim.x + threadIdx.x;")).ok).toBe(true);
  });
  it("rejects stubs and near-misses with useful reasons", () => {
    expect(checkChallenge(CHALLENGE_TEMPLATE).ok).toBe(false);
    expect(checkChallenge("int i = 0;").ok).toBe(false);
    expect(checkChallenge("int i = threadIdx.x;\nadd<<<8,32>>>(a,b,c,N);").ok).toBe(false);
    expect(checkChallenge("int i = blockIdx.x + blockDim.x + threadIdx.x;\nadd<<<8,32>>>(a,b,c,N);").ok).toBe(false);
  });
  it("requires the launch site to still exist", () => {
    const r = checkChallenge("int i = blockIdx.x * blockDim.x + threadIdx.x;");
    expect(r.ok).toBe(false);
    expect(r.hasLaunch).toBe(false);
  });
});

describe("journey grows to full story", () => {
  it("has ten scenes in teaching order", () => {
    expect(JOURNEY).toHaveLength(10);
    expect(JOURNEY.map((j) => j.id)).toEqual([
      "the-problem", "meet-the-gpu", "first-kernel", "threads", "thread-indexing",
      "warps", "memory", "descent", "debug", "challenge",
    ]);
  });
  it("neighbors stay consistent after growth", () => {
    const last = JOURNEY[JOURNEY.length - 1];
    expect(journeyNeighbors(last.id).prev?.id).toBe("debug");
    expect(journeyNeighbors(last.id).next).toBeNull();
  });
});
