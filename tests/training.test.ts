import { describe, expect, it } from "vitest";
import {
  TRAIN_CFG_7B, TRAIN_CFG_405B,
  activationGB, bubbleFraction, chinchillaTokensB, expertLoad, fmtGB,
  imbalance, ringBytesN, ringSteps, routeTokens, scalingLoss, segmentsFor,
  shardedMemoryGB, trainGpuHours, trainMemoryGB,
} from "@/lib/training/engine";
import { TRAIN_JOURNEY, trainNeighbors } from "@/content/training/journey";
import { TRAIN_DOMAINS, TRAIN_TOPICS } from "@/content/training/atlas";
import { WORLDS } from "@/content/worlds";

describe("memory math", () => {
  it("AdamW mixed precision is 8x weight bytes for bf16", () => {
    // 2 (w) + 2 (g) + 8 (adam) + 4 (master) = 16 bytes/param = 8x bf16
    expect(trainMemoryGB(7)).toBeCloseTo(7 * 16, 5);
    expect(shardedMemoryGB(70, 8, 4)).toBeCloseTo(trainMemoryGB(70) / 32, 5);
  });
  it("checkpointing stores O(√L) boundaries, far below O(L)", () => {
    const full = activationGB(32, 4096, 4, 4096, false);
    const ck = activationGB(32, 4096, 4, 4096, true);
    expect(ck).toBeLessThan(full * 0.2);
    expect(segmentsFor(32)).toBe(6); // ceil(sqrt(32))
  });
  it("formats bytes readably", () => {
    expect(fmtGB(512)).toBe("512.0 GB");
    expect(fmtGB(2048)).toBe("2.0 TB");
  });
});

describe("ring all-reduce", () => {
  it("runs exactly 2(N-1) steps of N sends", () => {
    const steps = ringSteps(4);
    expect(steps).toHaveLength(2 * (4 - 1) * 4);
  });
  it("per-GPU traffic approaches 2x tensor and never exceeds it", () => {
    expect(ringBytesN(2, 100)).toBe(100);
    expect(ringBytesN(8, 100)).toBe(175);
    expect(ringBytesN(1000, 100)).toBeCloseTo(199.8, 1);
  });
});

describe("pipeline bubble", () => {
  it("matches (p-1)/(m+p-1)", () => {
    expect(bubbleFraction(1, 4)).toBeCloseTo(3 / 4);
    expect(bubbleFraction(12, 4)).toBeCloseTo(3 / 15);
  });
  it("more micro-batches shrink the bubble", () => {
    expect(bubbleFraction(8, 4)).toBeLessThan(bubbleFraction(2, 4));
  });
});

describe("MoE routing", () => {
  it("routes every token exactly once", () => {
    const tokens = routeTokens(64, 8);
    const load = expertLoad(tokens, 8);
    expect(load.reduce((a, b) => a + b, 0)).toBe(64);
  });
  it("deterministic for identical inputs", () => {
    expect(routeTokens(32, 4)).toEqual(routeTokens(32, 4));
  });
  it("imbalance is at least 1 and finite", () => {
    const load = expertLoad(routeTokens(64, 8), 8);
    expect(imbalance(load)).toBeGreaterThanOrEqual(1);
    expect(imbalance(load)).toBeLessThan(8);
  });
});

describe("scaling laws & budgets", () => {
  it("chinchilla ratio is 20 tokens per parameter", () => {
    expect(chinchillaTokensB(7)).toBe(140);
    expect(chinchillaTokensB(405)).toBe(8100);
  });
  it("loss decreases monotonically toward the floor", () => {
    expect(scalingLoss(0.1)).toBeGreaterThan(scalingLoss(7));
    expect(scalingLoss(405)).toBeGreaterThan(1.69);
  });
  it("6ND cost math: 7B × 1.4T tokens on 1024 GPUs is a weeks-scale run", () => {
    const h = trainGpuHours(7, 1400, 989, 0.42, 1024);
    // 6·7e9·1.4e12 FLOPs ÷ (989e12 · 0.42 · 1024) ≈ 1.6 days
    expect(h / 24).toBeGreaterThan(0.5);
    expect(h / 24).toBeLessThan(10);
  });
});

describe("training journey & atlas", () => {
  it("has eleven scenes with unique ids", () => {
    expect(TRAIN_JOURNEY).toHaveLength(11);
    expect(new Set(TRAIN_JOURNEY.map((j) => j.id)).size).toBe(11);
  });
  it("neighbors chain without gaps", () => {
    expect(trainNeighbors("token-diet").prev).toBeNull();
    expect(trainNeighbors("token-diet").next?.id).toBe("one-step");
    expect(trainNeighbors("scaling-laws").next).toBeNull();
  });
  it("every scene-linked atlas topic points at a real scene", () => {
    const ids = new Set(TRAIN_JOURNEY.map((j) => j.id));
    TRAIN_TOPICS.filter((t) => t.kind === "scene").forEach((t) => {
      expect(ids.has(t.scene!)).toBe(true);
    });
  });
  it("covers seven domains with non-empty topics", () => {
    expect(TRAIN_DOMAINS).toHaveLength(7);
    TRAIN_DOMAINS.forEach((d) => {
      expect(TRAIN_TOPICS.some((t) => t.domain === d.id)).toBe(true);
    });
  });
});

describe("training world registry", () => {
  it("training-scale is live with an href and scene count", () => {
    const w = WORLDS.find((x) => x.id === "training-scale")!;
    expect(w.status).toBe("live");
    expect(w.href).toBe("/training/");
    expect(w.scenes).toBe(TRAIN_JOURNEY.length);
  });
  it("config presets cover the flagship scales", () => {
    expect(TRAIN_CFG_7B.paramsB).toBe(7);
    expect(TRAIN_CFG_405B.paramsB).toBe(405);
  });
});
