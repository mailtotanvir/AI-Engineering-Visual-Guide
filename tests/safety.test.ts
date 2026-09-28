import { describe, expect, it } from "vitest";
import {
  computeSteeredActivation,
  evaluateRefusalBoundary,
  evaluateWatermarkZScore,
  computeDPSGDPrivacyBudget,
  computeRMULoss,
  computeRefusalParetoPoint,
} from "@/lib/safety/engine";
import {
  SAFETY_MODULES,
  ALL_SAFETY_SCENES,
  getSafetySceneById,
  getAdjacentSafetyScenes,
} from "@/content/safety/journey";
import { SAFETY_DOMAINS, SAFETY_TOPICS } from "@/content/safety/atlas";
import { SAFETY_SCENE_NOTES } from "@/content/safety/notes";

describe("Safety Math Engine", () => {
  it("computes contrastive activation steering vector addition", () => {
    const base = [0.5, 0.0, -0.5];
    const pos = [[1.0, 0.5, 0.0]];
    const neg = [[-1.0, -0.5, 0.0]];
    const res = computeSteeredActivation(base, pos, neg, 1.0);

    expect(res.steered).toHaveLength(3);
    expect(res.vectorNorm).toBeGreaterThan(0);
    // steerVec = [2.0, 1.0, 0.0], steered = [2.5, 1.0, -0.5]
    expect(res.steered[0]).toBeCloseTo(2.5);
  });

  it("evaluates refusal projection boundary thresholding", () => {
    const refusalVec = [1.0, 0.0, 0.0];
    const safePrompt = [-1.0, 0.0, 0.0];
    const harmfulPrompt = [2.0, 0.0, 0.0];

    const safeRes = evaluateRefusalBoundary(safePrompt, refusalVec, 0.5);
    expect(safeRes.decision).toBe("COMPLY");

    const harmRes = evaluateRefusalBoundary(harmfulPrompt, refusalVec, 0.5);
    expect(harmRes.decision).toBe("REFUSE");
  });

  it("evaluates Kirchenbauer statistical token watermarking z-scores", () => {
    // 200 tokens, 100 expected green for gamma=0.5, std = sqrt(200*0.25) = 7.07
    const nullHypothesis = evaluateWatermarkZScore(200, 100, 0.5);
    expect(nullHypothesis.zScore).toBeCloseTo(0.0);
    expect(nullHypothesis.isWatermarked).toBe(false);

    const watermarkedText = evaluateWatermarkZScore(200, 140, 0.5);
    expect(watermarkedText.zScore).toBeGreaterThan(5.0);
    expect(watermarkedText.isWatermarked).toBe(true);
    expect(watermarkedText.pValue).toBeLessThan(1e-5);
  });

  it("computes DP-SGD differential privacy budget", () => {
    const strongDP = computeDPSGDPrivacyBudget(2.0, 0.01, 1000, 1e-5);
    expect(strongDP.epsilon).toBeLessThan(4.0);
    expect(strongDP.privacyGuarantee).toMatch(/STRONG|MODERATE/);

    const weakDP = computeDPSGDPrivacyBudget(0.2, 0.05, 5000, 1e-5);
    expect(weakDP.epsilon).toBeGreaterThan(10.0);
    expect(weakDP.privacyGuarantee).toBe("LEAKY");
  });

  it("computes RMU representation misdirection loss", () => {
    const forget = [1.0, 1.0];
    const noise = [-1.0, -1.0];
    const retain = [0.5, 0.5];
    const orig = [0.5, 0.5];

    const rmu = computeRMULoss(forget, noise, retain, orig, 1.5);
    expect(rmu.lossForget).toBeCloseTo(4.0);
    expect(rmu.lossRetain).toBeCloseTo(0.0);
    expect(rmu.lossTotal).toBeCloseTo(4.0);
  });

  it("computes over-refusal Pareto sensitivity points", () => {
    const lowSens = computeRefusalParetoPoint(0.1);
    const highSens = computeRefusalParetoPoint(0.9);

    expect(highSens.attackRefusalRate).toBeGreaterThan(lowSens.attackRefusalRate);
    expect(highSens.overRefusalRate).toBeGreaterThan(lowSens.overRefusalRate);
  });
});

describe("Safety Journey & Curriculum", () => {
  it("has exactly 6 modules and 24 scenes", () => {
    expect(SAFETY_MODULES).toHaveLength(6);
    expect(ALL_SAFETY_SCENES).toHaveLength(24);
  });

  it("every scene has valid metadata, threat level, and unique id", () => {
    const ids = ALL_SAFETY_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(24);

    ALL_SAFETY_SCENES.forEach((s) => {
      expect(s.title).toBeTruthy();
      expect(s.summary).toBeTruthy();
      expect(s.focus).toBeTruthy();
      expect(["CRITICAL", "HIGH", "MEDIUM", "DEFENSE", "GOVERNANCE"]).toContain(s.threatLevel);
    });
  });

  it("provides bidirectional navigation helpers", () => {
    const first = ALL_SAFETY_SCENES[0];
    const last = ALL_SAFETY_SCENES[23];

    const firstNav = getAdjacentSafetyScenes(first.id);
    expect(firstNav.prev).toBeUndefined();
    expect(firstNav.next?.id).toBe(ALL_SAFETY_SCENES[1].id);

    const lastNav = getAdjacentSafetyScenes(last.id);
    expect(lastNav.next).toBeUndefined();
    expect(lastNav.prev?.id).toBe(ALL_SAFETY_SCENES[22].id);
  });
});

describe("Safety Atlas Taxonomy & Notes", () => {
  it("has 8 domains and 32 topics", () => {
    expect(SAFETY_DOMAINS).toHaveLength(8);
    expect(SAFETY_TOPICS.length).toBeGreaterThanOrEqual(24);
  });

  it("every scene has a comprehensive technical note with math deep dive", () => {
    ALL_SAFETY_SCENES.forEach((s) => {
      const note = SAFETY_SCENE_NOTES[s.id];
      expect(note).toBeDefined();
      expect(note.overview.length).toBeGreaterThan(50);
      expect(note.keyConcepts.length).toBeGreaterThanOrEqual(2);
      expect(note.mathDeepDive).toBeDefined();
      expect(note.mathDeepDive?.equation).toBeTruthy();
      expect(note.realWorldEngineering.length).toBeGreaterThanOrEqual(2);
    });
  });
});
