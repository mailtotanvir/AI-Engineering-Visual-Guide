import { describe, expect, it } from "vitest";
import {
  BASE_LOGITS, KV_CFG_7B_FP16,
  applySampling, kvBytesPerToken, kvCacheBytes, mb, softmax, tokenize,
} from "@/lib/inference/engine";
import { SPEC_STEPS } from "@/lib/inference/engine";
import { INF_JOURNEY, INF_MODULES, infModuleJourney, infNeighbors } from "@/content/inference/journey";
import { INF_DOMAINS, INF_TOPICS } from "@/content/inference/atlas";

describe("tokenizer", () => {
  it("is deterministic for identical input", () => {
    const a = tokenize("The transformer streams tokens.");
    const b = tokenize("The transformer streams tokens.");
    expect(a).toEqual(b);
  });
  it("produces subword ids above the special range", () => {
    const toks = tokenize("Inference serving generates tokens");
    expect(toks.length).toBeGreaterThan(3);
    toks.forEach((t) => {
      expect(t.id).toBeGreaterThanOrEqual(256);
      expect(t.text.length).toBeGreaterThan(0);
    });
  });
  it("handles punctuation and numbers without crashing", () => {
    const toks = tokenize("GPU-2024: fast??");
    expect(toks.length).toBeGreaterThan(4);
  });
  it("caps runaway input at 64 tokens", () => {
    expect(tokenize("word ".repeat(500)).length).toBeLessThanOrEqual(64);
  });
});

describe("kv cache math", () => {
  it("matches the canonical formula: 2·L·H·D·bytes", () => {
    expect(kvBytesPerToken(KV_CFG_7B_FP16)).toBe(2 * 32 * 32 * 128 * 2);
    expect(mb(kvBytesPerToken(KV_CFG_7B_FP16))).toBe("512.0 KB");
  });
  it("scales linearly with sequence and batch", () => {
    const one = kvCacheBytes(KV_CFG_7B_FP16, 1024, 1);
    expect(kvCacheBytes(KV_CFG_7B_FP16, 2048, 1)).toBe(one * 2);
    expect(kvCacheBytes(KV_CFG_7B_FP16, 1024, 8)).toBe(one * 8);
  });
});

describe("sampling", () => {
  it("probabilities over kept tokens sum to 1", () => {
    const r = applySampling(BASE_LOGITS, { temp: 0.8, topK: 8, topP: 1, pickFrac: 0.5 });
    const sum = r.probs.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
  it("top-k restricts the candidate set", () => {
    const r = applySampling(BASE_LOGITS, { temp: 1, topK: 3, topP: 1, pickFrac: 0.5 });
    expect(r.kept).toHaveLength(3);
  });
  it("top-p never exceeds the mass budget", () => {
    const r = applySampling(BASE_LOGITS, { temp: 1, topK: 8, topP: 0.5, pickFrac: 0.5 });
    const full = softmax(BASE_LOGITS);
    const keptMass = r.kept.reduce((acc, i) => acc + full[i], 0);
    expect(keptMass).toBeGreaterThanOrEqual(0.5);
  });
  it("low temperature concentrates probability into the top token", () => {
    const hot = applySampling(BASE_LOGITS, { temp: 0.1, topK: 8, topP: 1, pickFrac: 0.01 });
    const cold = applySampling(BASE_LOGITS, { temp: 2, topK: 8, topP: 1, pickFrac: 0.99 });
    const maxHot = Math.max(...hot.probs);
    const maxCold = Math.max(...cold.probs);
    expect(maxHot).toBeGreaterThan(maxCold);
  });
});

describe("speculative decoding pattern", () => {
  it("every cycle emits at least the bonus token", () => {
    SPEC_STEPS.forEach((s) => expect(s.accepted + 1).toBeGreaterThanOrEqual(1));
  });
  it("acceptance varies so the demo shows wins and rejections", () => {
    const accepts = SPEC_STEPS.map((s) => s.accepted);
    expect(Math.max(...accepts)).toBeGreaterThan(0);
    expect(Math.min(...accepts)).toBe(0);
  });
});

describe("inference journey & atlas integrity", () => {
  it("twenty-four scenes with unique ids and nums", () => {
    expect(INF_JOURNEY).toHaveLength(24);
    expect(new Set(INF_JOURNEY.map((j) => j.id)).size).toBe(24);
    expect(new Set(INF_JOURNEY.map((j) => j.num)).size).toBe(24);
  });
  it("every scene maps to a real module", () => {
    INF_JOURNEY.forEach((j) => {
      expect(INF_MODULES.find((m) => m.id === j.module)).toBeDefined();
    });
    expect(INF_MODULES).toHaveLength(8);
    INF_MODULES.forEach((m) => {
      expect(infModuleJourney(m.id).length).toBeGreaterThanOrEqual(2);
    });
  });
  it("neighbors are consistent across growth", () => {
    INF_JOURNEY.forEach((j, i) => {
      const { prev, next } = infNeighbors(j.id);
      if (prev) expect(infNeighbors(prev.id).next?.id).toBe(j.id);
      if (next) expect(infNeighbors(next.id).prev?.id).toBe(j.id);
      void i;
    });
  });
  it("atlas covers eight domains; scene entries resolve", () => {
    expect(INF_DOMAINS).toHaveLength(8);
    INF_TOPICS.forEach((t) => {
      expect(INF_DOMAINS.find((d) => d.id === t.domain)).toBeDefined();
      if (t.kind === "scene") {
        expect(INF_JOURNEY.find((j) => j.id === t.scene)).toBeDefined();
      }
    });
    expect(INF_TOPICS.filter((t) => t.kind === "scene").length).toBeGreaterThanOrEqual(6);
  });
});
