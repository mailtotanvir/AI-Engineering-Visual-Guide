import { describe, expect, it } from "vitest";
import {
  TRAIN_CFG_7B, TRAIN_CFG_405B, PRECISIONS,
  activationGB, attentionPairs, attentionScoreGB, bubbleFraction,
  causalMaskFraction, chinchillaTokensB, clmTargets, cosineLr, fmtGB,
  kvCacheGB, kvSavings, mlmTargets, quantStep, ringBytesN, ringSteps,
  ropeAngle, ropeRotate, scalingLoss, segmentsFor, shardedMemoryGB,
  trainGpuHours, trainMemoryGB,
} from "@/lib/training/engine";
import { TRAIN_JOURNEY, trainNeighbors } from "@/content/training/journey";
import { TRAIN_DOMAINS, TRAIN_TOPICS } from "@/content/training/atlas";
import { WORLDS } from "@/content/worlds";

describe("memory math & precision", () => {
  it("AdamW mixed precision is 16 bytes/param for bf16", () => {
    expect(trainMemoryGB(7)).toBeCloseTo(7 * 16, 5);
    expect(shardedMemoryGB(70, 8, 4)).toBeCloseTo(trainMemoryGB(70) / 32, 5);
  });

  it("checkpointing stores O(√L) boundaries, far below O(L)", () => {
    const full = activationGB(32, 4096, 4, 4096, false);
    const ck = activationGB(32, 4096, 4, 4096, true);
    expect(ck).toBeLessThan(full * 0.2);
    expect(segmentsFor(32)).toBe(6);
  });

  it("quantization step sizes reflect mantissa bit width", () => {
    const bf16 = PRECISIONS.find((p) => p.name === "BF16")!;
    expect(quantStep(bf16)).toBeCloseTo(Math.pow(2, -8), 5);
  });
});

describe("attention & objectives math", () => {
  it("causal mask forbids ~50% of the attention matrix", () => {
    expect(causalMaskFraction(4096)).toBeCloseTo(0.5, 2);
  });

  it("CLM scores N-1 targets per pass while MLM scores ~15%", () => {
    expect(clmTargets(100)).toBe(99);
    expect(mlmTargets(100, 0.15)).toBe(15);
  });

  it("attention pairs grow quadratically O(N^2)", () => {
    expect(attentionPairs(4096)).toBe(16777216);
    expect(attentionPairs(8192)).toBe(67108864);
  });

  it("GQA 8:1 saves 87.5% of KV cache memory", () => {
    expect(kvSavings(32, 4)).toBe(0.875);
  });

  it("RoPE rotates 2D vector pairs deterministically", () => {
    const angle = ropeAngle(4, 0, 64);
    const rotated = ropeRotate(1, 0, angle);
    expect(Math.hypot(rotated.x, rotated.y)).toBeCloseTo(1, 5);
  });
});

describe("ring all-reduce & pipeline bubble", () => {
  it("runs exactly 2(N-1) steps of N sends", () => {
    const steps = ringSteps(4);
    expect(steps).toHaveLength(2 * (4 - 1) * 4);
  });

  it("per-GPU traffic approaches 2x tensor size", () => {
    expect(ringBytesN(2, 100)).toBe(100);
    expect(ringBytesN(8, 100)).toBe(175);
    expect(ringBytesN(1000, 100)).toBeCloseTo(199.8, 1);
  });

  it("pipeline bubble matches (p-1)/(m+p-1)", () => {
    expect(bubbleFraction(1, 4)).toBeCloseTo(3 / 4);
    expect(bubbleFraction(12, 4)).toBeCloseTo(3 / 15);
  });
});

describe("scaling laws & budgets", () => {
  it("chinchilla ratio is 20 tokens per parameter", () => {
    expect(chinchillaTokensB(7)).toBe(140);
    expect(chinchillaTokensB(405)).toBe(8100);
  });

  it("cosine learning rate schedule warms up and decays smoothly", () => {
    expect(cosineLr(0, 1000)).toBe(0); // start warmup at 0
    expect(cosineLr(20, 1000)).toBeCloseTo(1.0, 2); // peak after warmup
    expect(cosineLr(1000, 1000)).toBeCloseTo(0.1, 2); // min LR floor
  });
});

describe("training journey & atlas structure", () => {
  it("has 21 scenes with unique ids", () => {
    expect(TRAIN_JOURNEY).toHaveLength(21);
    expect(new Set(TRAIN_JOURNEY.map((j) => j.id)).size).toBe(21);
  });

  it("neighbors chain without gaps", () => {
    expect(trainNeighbors("token-diet").prev).toBeNull();
    expect(trainNeighbors("token-diet").next?.id).toBe("clm-vs-mlm");
    expect(trainNeighbors("telemetry").next).toBeNull();
  });

  it("every scene-linked atlas topic points at a real scene", () => {
    const ids = new Set(TRAIN_JOURNEY.map((j) => j.id));
    TRAIN_TOPICS.filter((t) => t.kind === "scene").forEach((t) => {
      expect(ids.has(t.scene!)).toBe(true);
    });
  });

  it("covers 6 domains with non-empty topics", () => {
    expect(TRAIN_DOMAINS).toHaveLength(6);
    TRAIN_DOMAINS.forEach((d) => {
      expect(TRAIN_TOPICS.some((t) => t.domain === d.id)).toBe(true);
    });
  });
});

describe("training world registry", () => {
  it("training-scale is live with 21 scenes and 28 entries", () => {
    const w = WORLDS.find((x) => x.id === "training-scale")!;
    expect(w.status).toBe("live");
    expect(w.href).toBe("/training/");
    expect(w.scenes).toBe(21);
    expect(w.entries).toBe(28);
  });
});
