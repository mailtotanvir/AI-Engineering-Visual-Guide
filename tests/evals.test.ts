import { describe, expect, it } from "vitest";
import {
  adverseRegressionRate, bleuScore, bootstrapCI, brevityPenalty, canaryHits,
  chanceAgreement, ciHalfWidth, cohensKappa, contaminationUplift, coverageConcentration,
  difficultyIndex, driftScore, eloDelta, eloExpected, eloUpdate, exactMatchNorm,
  gateBreach, holmRejected, itemDiscrimination, leakageRisk, lengthBiasRate,
  lengthControlledWinRate, mcnemarChi2, ngramOverlapRatio, orderAveragedWinRate,
  passAtK, percentAgreement, positionalBias, regressionDelta, requiredSampleSize,
  rotatedCeiling, rougeNRecall, scorecardComposite, selfPreferenceRate, tokenF1,
  twinAxisScore, accuracy, errorRate,
} from "@/lib/evals/engine";
import { EVAL_JOURNEY, EVAL_MODULES, evalModuleJourney, evalNeighbors } from "@/content/evals/journey";
import { SCENE_NOTES } from "@/content/evals/notes";
import { EVAL_DOMAINS, EVAL_TOPICS } from "@/content/evals/atlas";
import { WORLDS } from "@/content/worlds";

describe("foundations math", () => {
  it("accuracy and error rate are complementary", () => {
    expect(accuracy(140, 200)).toBeCloseTo(0.7, 6);
    expect(errorRate(140, 200)).toBeCloseTo(0.3, 6);
    expect(accuracy(0, 0)).toBe(0);
  });

  it("twin-axis reporting exposes the capability/alignment gap", () => {
    const hidden = twinAxisScore(0.95, 0.65);
    expect(hidden.mean).toBeCloseTo(0.8, 6);
    expect(hidden.gap).toBeCloseTo(0.3, 6);
    expect(twinAxisScore(0.8, 0.8).gap).toBeCloseTo(0, 6);
  });

  it("leakage risk decays with rotation", () => {
    expect(leakageRisk(1, 3, 0.3)).toBeCloseTo(0.343, 4);
    expect(leakageRisk(1, 0, 0.3)).toBeCloseTo(1, 4);
  });
});

describe("benchmark design math", () => {
  it("difficulty and discrimination", () => {
    expect(difficultyIndex(70, 100)).toBeCloseTo(0.7, 6);
    expect(itemDiscrimination(0.9, 0.2)).toBeCloseTo(0.7, 6);
    expect(itemDiscrimination(0.5, 0.5)).toBe(0);
  });

  it("coverage concentration grows as items pile into one leaf", () => {
    expect(coverageConcentration([1, 1, 1, 1])).toBeCloseTo(0.25, 6);
    expect(coverageConcentration([7, 1, 1, 1])).toBeCloseTo(0.52, 6);
    expect(coverageConcentration([10, 0, 0, 0])).toBeCloseTo(1, 6);
  });
});

describe("contamination & integrity math", () => {
  it("n-gram overlap is the shared n-gram fraction", () => {
    expect(ngramOverlapRatio("a b c d", "x a b c y", 2)).toBeCloseTo(2 / 3, 6);
    expect(ngramOverlapRatio("m n o", "x y z", 2)).toBe(0);
  });

  it("contamination uplift is the seen-unseen gap", () => {
    expect(contaminationUplift(0.712, 0.63)).toBeCloseTo(0.082, 6);
  });

  it("canary hits are exact string recoveries", () => {
    expect(canaryHits(["CANARY-7f3a", "CANARY-9b1c"], "code CANARY-7f3a here")).toBe(1);
    expect(canaryHits(["CANARY-7f3a"], "nothing here")).toBe(0);
  });

  it("rotation blends prior and fresh accuracy", () => {
    expect(rotatedCeiling(0.8, 0.25, 0.6)).toBeCloseTo(0.75, 6);
  });
});

describe("automatic scoring math", () => {
  it("normalized exact match ignores case, punctuation, whitespace", () => {
    expect(exactMatchNorm("The Eiffel Tower.", "eiffel tower")).toBe(1);
    expect(exactMatchNorm("paris", "lyon")).toBe(0);
  });

  it("token F1 gives partial credit for near matches", () => {
    expect(tokenF1("the quick brown fox", "the quick fox")).toBeCloseTo(6 / 7, 5);
    expect(tokenF1("alpha", "alpha")).toBe(1);
    expect(tokenF1("alpha", "beta")).toBe(0);
  });

  it("ROUGE-N recall counts covered reference n-grams", () => {
    expect(rougeNRecall("the cat sat on the mat", "the cat sat", 2)).toBeCloseTo(0.4, 6);
  });

  it("brevity penalty only fires for short candidates", () => {
    expect(brevityPenalty(10, 10)).toBe(1);
    expect(brevityPenalty(12, 10)).toBe(1);
    expect(brevityPenalty(8, 10)).toBeCloseTo(Math.exp(-0.25), 6);
  });

  it("BLEU is a geometric mean of precisions times the brevity penalty", () => {
    expect(bleuScore([0.8, 0.6, 0.4, 0.2], 10, 10)).toBeCloseTo(0.4427, 3);
    expect(bleuScore([0.8, 0, 0.4, 0.2], 10, 10)).toBe(0);
  });

  it("pass@k saturates as k grows", () => {
    expect(passAtK(10, 5, 1)).toBeCloseTo(0.5, 6);
    expect(passAtK(4, 4, 2)).toBe(1);
    expect(passAtK(10, 5, 5)).toBeGreaterThan(0.99);
  });
});

describe("judge math", () => {
  it("positional bias measures deviation from an even split", () => {
    expect(positionalBias(68, 100)).toBeCloseTo(0.18, 6);
    expect(positionalBias(50, 100)).toBe(0);
  });

  it("length and self-preference rates are excess win rates", () => {
    expect(lengthBiasRate(62, 100)).toBeCloseTo(0.12, 6);
    expect(lengthBiasRate(45, 100)).toBe(0);
    expect(selfPreferenceRate(45, 100)).toBe(0);
    expect(selfPreferenceRate(70, 100)).toBeCloseTo(0.2, 6);
  });

  it("order averaging cancels position bias", () => {
    expect(orderAveragedWinRate(68, 44, 100)).toBeCloseTo(0.56, 6);
  });

  it("length-controlled win rate regresses out verbosity", () => {
    expect(lengthControlledWinRate(0.6, 0.5)).toBeCloseTo(0.56, 6);
    expect(lengthControlledWinRate(0.02, 10)).toBeCloseTo(0, 6);
  });
});

describe("human & arena math", () => {
  it("percent agreement and chance agreement", () => {
    expect(percentAgreement(80, 100)).toBeCloseTo(0.8, 6);
    expect(chanceAgreement(0.5, 0.5)).toBeCloseTo(0.5, 6);
  });

  it("Cohen's kappa subtracts chance", () => {
    expect(cohensKappa(0.8, 0.5)).toBeCloseTo(0.6, 6);
    expect(cohensKappa(1, 0)).toBe(1);
    expect(cohensKappa(0.5, 1)).toBe(0);
  });

  it("Elo expected score and update", () => {
    expect(eloExpected(1600, 1500)).toBeCloseTo(0.64, 3);
    expect(eloExpected(1500, 1500)).toBeCloseTo(0.5, 6);
    expect(eloUpdate(1600, 1500, 1, 32)).toBeCloseTo(1611.52, 2);
  });

  it("win rate to Elo delta is symmetric", () => {
    expect(eloDelta(0.5)).toBe(0);
    expect(eloDelta(0.64)).toBeCloseTo(-eloDelta(0.36), 5);
  });
});

describe("statistical rigor math", () => {
  it("CI half-width shrinks with sqrt(n)", () => {
    expect(ciHalfWidth(500, 0.7)).toBeCloseTo(0.0402, 3);
    expect(ciHalfWidth(2000, 0.7)).toBeCloseTo(ciHalfWidth(500, 0.7) / 2, 4);
  });

  it("required sample size inverts the half-width formula", () => {
    expect(requiredSampleSize(0.04, 0.5)).toBe(601);
    expect(requiredSampleSize(0, 0.5)).toBe(0);
  });

  it("McNemar analyses discordant pairs", () => {
    expect(mcnemarChi2(30, 10)).toBeCloseTo(9.025, 4);
    expect(mcnemarChi2(0, 0)).toBe(0);
  });

  it("bootstrap is deterministic and brackets the mean", () => {
    const a = bootstrapCI([0.6, 0.7, 0.8, 0.9], 500, 7);
    const b = bootstrapCI([0.6, 0.7, 0.8, 0.9], 500, 7);
    expect(a).toEqual(b);
    expect(a.mean).toBeCloseTo(0.75, 6);
    expect(a.lo).toBeLessThanOrEqual(a.mean);
    expect(a.hi).toBeGreaterThanOrEqual(a.mean);
  });

  it("Holm-Bonferroni rejects step-down until the first failure", () => {
    expect(holmRejected([0.001, 0.01, 0.04, 0.2], 0.05)).toBe(2);
    expect(holmRejected([0.2, 0.3], 0.05)).toBe(0);
  });
});

describe("regression & monitoring math", () => {
  it("regression delta and gate breach", () => {
    expect(regressionDelta(0.8, 0.76)).toBeCloseTo(-0.04, 6);
    expect(gateBreach(0.8, 0.76, 0.02)).toBe(true);
    expect(gateBreach(0.8, 0.79, 0.02)).toBe(false);
  });

  it("adverse regression rate is the flip fraction", () => {
    expect(adverseRegressionRate(40, 2000)).toBeCloseTo(0.02, 6);
  });

  it("drift score is standardized", () => {
    expect(driftScore(0.7, 0.63, 0.05)).toBeCloseTo(1.4, 6);
    expect(driftScore(0.7, 0.63, 0)).toBe(0);
  });

  it("scorecard composite is a weighted mean", () => {
    expect(scorecardComposite([0.8, 0.6], [0.5, 0.5])).toBeCloseTo(0.7, 6);
    expect(scorecardComposite([0.8, 0.6], [1, 3])).toBeCloseTo(0.65, 6);
  });
});

describe("evaluation journey integrity", () => {
  it("has exactly 24 scenes with unique ids and sequential numbers", () => {
    expect(EVAL_JOURNEY).toHaveLength(24);
    const ids = EVAL_JOURNEY.map((j) => j.id);
    expect(new Set(ids).size).toBe(24);
    expect(new Set(EVAL_JOURNEY.map((j) => j.num)).size).toBe(24);
  });

  it("spans 8 modules with 3 scenes each", () => {
    expect(EVAL_MODULES).toHaveLength(8);
    for (const m of EVAL_MODULES) {
      expect(evalModuleJourney(m.id)).toHaveLength(3);
    }
  });

  it("neighbors link the chain end to end", () => {
    const first = evalNeighbors(EVAL_JOURNEY[0].id);
    expect(first.prev).toBeNull();
    expect(first.next?.id).toBe(EVAL_JOURNEY[1].id);
    const last = evalNeighbors(EVAL_JOURNEY[23].id);
    expect(last.next).toBeNull();
    expect(last.prev?.id).toBe(EVAL_JOURNEY[22].id);
  });
});

describe("notes & atlas coverage", () => {
  it("every journey scene has a technical note", () => {
    for (const j of EVAL_JOURNEY) {
      expect(SCENE_NOTES[j.id], `missing note for ${j.id}`).toBeTruthy();
    }
  });

  it("every note belongs to a real scene", () => {
    const ids = new Set(EVAL_JOURNEY.map((j) => j.id));
    for (const id of Object.keys(SCENE_NOTES)) {
      expect(ids.has(id), `note ${id} has no scene`).toBe(true);
    }
  });

  it("every scene-linked atlas topic references a real journey id", () => {
    const ids = new Set(EVAL_JOURNEY.map((j) => j.id));
    for (const t of EVAL_TOPICS) {
      if (t.kind === "scene") {
        expect(t.scene).toBeTruthy();
        expect(ids.has(t.scene!), `topic ${t.id} links to unknown scene`).toBe(true);
      }
    }
  });

  it("spans 8 domains, all non-empty", () => {
    expect(EVAL_DOMAINS).toHaveLength(8);
    for (const d of EVAL_DOMAINS) {
      expect(EVAL_TOPICS.filter((t) => t.domain === d.id).length).toBeGreaterThan(0);
    }
  });

  it("covers at least 30 topics with unique ids", () => {
    expect(EVAL_TOPICS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(EVAL_TOPICS.map((t) => t.id)).size).toBe(EVAL_TOPICS.length);
  });
});

describe("world registry", () => {
  it("evaluation is live with href, scene and entry counts", () => {
    const w = WORLDS.find((x) => x.id === "evals")!;
    expect(w.status).toBe("live");
    expect(w.href).toBe("/evals/");
    expect(w.scenes).toBe(24);
    expect(w.entries).toBe(32);
  });
});