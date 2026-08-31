import { describe, expect, it } from "vitest";
import {
  DECODE_WEIGHT_BYTES_7B_FP16, H100_SM, JSON_GRAMMAR, MOE_CFG, RADIX_TREE,
  PRECISION_RUNGS, SILICON_SPECS,
  coldStartMs, costPerMTokens, decodeStallMs, decodeTokenTimeMs,
  expertLoadBalance, kvTransferTimeMs, maskedSample, moeActiveParamsB,
  moeSparsity, prefixSaveMs, quantModelGB, quantRelErr, quantizeSymmetric,
  radixHitTokens, residentWarps, rooflineTflops, spotMixUsd, tpMemoryPerGPU,
  warpOccupancy,
} from "@/lib/inference/engine";

describe("silicon & memory wall", () => {
  it("roofline clamps decode intensity to the bandwidth roof", () => {
    // 7B FP16 decode: intensity = flops/bytes = 2*7e9/14e9 = 1
    const tf = rooflineTflops(989, 3.35, 1);
    expect(tf).toBeCloseTo(3.35, 5);
  });
  it("prefill-like intensity reaches the compute roof", () => {
    expect(rooflineTflops(989, 3.35, 1000)).toBe(989);
  });
  it("decode token time on H100: 14 GB over 3.35 TB/s", () => {
    expect(DECODE_WEIGHT_BYTES_7B_FP16).toBe(14e9);
    expect(decodeTokenTimeMs(3.35)).toBeCloseTo(14e9 / 3.35e12 * 1000, 5);
  });
  it("resident warps scale with occupancy fraction", () => {
    expect(residentWarps(1)).toBe(H100_SM.sms * H100_SM.warpsPerSm);
    expect(residentWarps(0.5)).toBe((H100_SM.sms * H100_SM.warpsPerSm) / 2);
    expect(warpOccupancy(4096, H100_SM.sms * H100_SM.warpsPerSm)).toBeCloseTo(4096 / (132 * 64), 5);
  });
  it("silicon specs carry five substrates", () => {
    expect(SILICON_SPECS.map((s) => s.id)).toEqual(["cpu", "gpu", "tpu", "lpu", "inferentia"]);
  });
});

describe("quantization math", () => {
  it("model GB follows params x bits/8", () => {
    expect(quantModelGB(7, 32)).toBeCloseTo(28, 5);
    expect(quantModelGB(7, 4)).toBeCloseTo(3.5, 5);
  });
  it("precision rungs descend to FP4", () => {
    expect(PRECISION_RUNGS[PRECISION_RUNGS.length - 1].name).toBe("FP4");
  });
  it("symmetric quantization round-trips within half a grid step", () => {
    const q = quantizeSymmetric([1, -0.5, 0.25, 0.7], 8);
    expect(q.maxErr).toBeLessThanOrEqual(q.scale / 2 + 1e-9);
    expect(q.quantized.every((v) => Number.isInteger(v))).toBe(true);
  });
  it("relative error halves with each extra bit", () => {
    // grid ratio: (2^7-1)/(2^3-1) = 127/7
    expect(quantRelErr(8)).toBeCloseTo(quantRelErr(4) * (7 / 127), 6);
  });
});

describe("radix prefix caching", () => {
  it("matches the longest cached prefix", () => {
    expect(radixHitTokens(RADIX_TREE, "/sys=claude-md/usr-b/x")).toBe(64);
    expect(radixHitTokens(RADIX_TREE, "/sys=claude-md/usr-a/y")).toBe(88);
  });
  it("returns zero for an unseen root", () => {
    expect(radixHitTokens(RADIX_TREE, "/other")).toBe(0);
  });
  it("prefill savings scale with cached tokens", () => {
    expect(prefixSaveMs(40, 1000)).toBe(40);
  });
});

describe("grammar masking", () => {
  it("never selects a disallowed token", () => {
    JSON_GRAMMAR.forEach((st) => {
      const r = maskedSample([-2, -1, 0, 1, 2, 3, -3, 4, 1, 0, -1, 2, -2, 3], st.allowed, 0.99);
      expect(st.allowed).toContain(r.picked);
      expect(r.kept.every((k) => st.allowed.includes(k))).toBe(true);
      expect(r.probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    });
  });
});

describe("chunked prefill", () => {
  it("monolithic stall is the full prefill cost", () => {
    expect(decodeStallMs(30720, 90, null)).toBe(30720 / 1000 * 90);
  });
  it("chunked spreads the same total work", () => {
    expect(decodeStallMs(30720, 90, 2048)).toBeCloseTo(decodeStallMs(30720, 90, null), 0);
  });
  it("KV transfer time follows bytes over link", () => {
    expect(kvTransferTimeMs(1e9, 50)).toBeCloseTo(20, 5);
  });
});

describe("parallelism & MoE", () => {
  it("TP splits weight memory evenly", () => {
    expect(tpMemoryPerGPU(140, 4)).toBe(35);
  });
  it("MoE activates a small fraction of total parameters", () => {
    const active = moeActiveParamsB();
    expect(active).toBeGreaterThan(MOE_CFG.sharedParamsB);
    expect(active).toBeLessThan(MOE_CFG.totalParamsB / 8);
    expect(moeSparsity()).toBeGreaterThan(0.8);
  });
  it("load balancer flags over-capacity experts", () => {
    const r = expertLoadBalance([1, 3, 2, 0], 2);
    expect(r.maxCap).toBe(1.5);
    expect(r.dropped).toBe(1);
  });
});

describe("cold start & FinOps", () => {
  it("cold start sums all three phases", () => {
    expect(coldStartMs({ imagePullS: 22, modelLoadS: 38, kvWarmS: 6 })).toBe(66000);
  });
  it("cost per million tokens falls with spot mix", () => {
    const full = costPerMTokens(2400, 32.77);
    const mixed = costPerMTokens(2400, spotMixUsd(32.77, 0.5));
    expect(mixed).toBeLessThan(full);
    expect(full).toBeGreaterThan(3);
  });
});
