import { describe, expect, it } from "vitest";
import {
  bradleyTerry, ciHalfWidth, dpoLoss, dataScaleRatio, eloDelta, gae2, grpoSavedMemoryGB,
  jailbreakRate, loraParamsM, passAtK, ppoObjective, preferenceLoss, probRatio,
  qloraMemoryGB, quantRetained, fullFtMemoryGB, refusalFrontier, retention,
  rewardAccuracy, sftLossTokens, groupAdvantage, verifyReward, testTimeAccuracy,
  toolCallSuccess, contaminationUplift, mmTokenShare, serveMemoryGB, distillKlLoss,
} from "@/lib/posttrain/engine";
import { POST_JOURNEY, postModuleJourney, postNeighbors, POST_MODULES } from "@/content/posttrain/journey";
import { SCENE_NOTES } from "@/content/posttrain/notes";
import { POST_DOMAINS, POST_TOPICS } from "@/content/posttrain/atlas";
import { WORLDS } from "@/content/worlds";

describe("SFT & LoRA math", () => {
  it("data scale disparity is 15,000,000:1 for 15T pre-train / 1M post-train tokens", () => {
    expect(dataScaleRatio(15000, 1)).toBe(15_000_000);
  });

  it("prompt masking scores only completion tokens", () => {
    expect(sftLossTokens(384, 128, true)).toBe(128);
    expect(sftLossTokens(384, 128, false)).toBe(512);
  });

  it("LoRA trainable params scale linearly in rank", () => {
    const cfg = { rank: 16, targetFrac: 0.5 };
    const r16 = loraParamsM(7, cfg);
    const r32 = loraParamsM(7, { rank: 32, targetFrac: 0.5 });
    expect(r32).toBeCloseTo(r16 * 2, 5);
    expect(r16).toBeCloseTo(54.6875, 3); // 3.5e9 targeted × (4·16·4096/4096²)
    expect(r16).toBeLessThan(7 * 1e3 * 0.01); // under 1% of 7B
  });

  it("QLoRA needs ~20x less memory than a full fine-tune", () => {
    const ql = qloraMemoryGB(7, { rank: 16, targetFrac: 0.5 });
    const full = fullFtMemoryGB(7);
    expect(full).toBeCloseTo(112, 5);
    expect(ql).toBeLessThan(full / 10);
    expect(ql).toBeGreaterThan(7 * 0.55); // at least the 4-bit base
  });

  it("replay share bounds retention", () => {
    expect(retention(0.1, 0.3)).toBeCloseTo(0.93, 5);
    expect(retention(0.1, 0)).toBeCloseTo(0.9, 5);
    expect(retention(0.4, 0.25)).toBeCloseTo(0.7, 5);
  });
});

describe("preference & PPO math", () => {
  it("Bradley-Terry is a sigmoid of the reward gap", () => {
    expect(bradleyTerry(0, 0)).toBeCloseTo(0.5, 5);
    expect(bradleyTerry(2.2, 0)).toBeCloseTo(1 / (1 + Math.exp(-2.2)), 5);
    // margin 2.2 -> loss ≈ 0.105; margin 0 -> log 2
    expect(preferenceLoss(2.2, 0)).toBeCloseTo(-Math.log(1 / (1 + Math.exp(-2.2))), 5);
    expect(preferenceLoss(0, 0)).toBeCloseTo(Math.log(2), 5);
  });

  it("reward accuracy counts positive margins", () => {
    expect(rewardAccuracy([1, -1, 2, 0])).toBe(0.5);
    expect(rewardAccuracy([])).toBe(0);
  });

  it("PPO clips the probability ratio to the trust region", () => {
    expect(probRatio(0, 0)).toBe(1);
    // ratio 1.5 clipped to 1.2
    expect(ppoObjective(1.5, 1)).toBeCloseTo(1.2, 5);
    expect(ppoObjective(0.5, 1)).toBeCloseTo(0.5, 5); // min picks the unclipped low side
    expect(ppoObjective(1.0, 1)).toBeCloseTo(1.0, 5);
  });

  it("GAE(λ) blends two TD residuals", () => {
    // delta0 = 1 + 0.99*2 - 1 = 1.98; delta1 = 2 + 0.99*3 - 2 = 2.97
    expect(gae2(1, 2, 1, 2, 3)).toBeCloseTo(1.98 + 0.99 * 0.95 * 2.97, 5);
  });

  it("DPO loss separates implicit rewards", () => {
    expect(dpoLoss(2, 0, 0, 0, 0.1)).toBeLessThan(dpoLoss(0.5, 0, 0, 0, 0.1));
    expect(dpoLoss(0, 0, 0, 0, 0.1)).toBeCloseTo(Math.log(2), 5);
  });

  it("GRPO saves the whole critic model from the memory bill", () => {
    expect(grpoSavedMemoryGB(7)).toBeCloseTo(112, 5);
  });

  it("group advantage is a z-score within the sampled group", () => {
    const advs = [1, 0, 1, 0].map((_, i) =>
      groupAdvantage([1, 0, 1, 0], i, 1)); // eps=1 keeps math finite
    expect(advs[0]).toBeGreaterThan(0);
    expect(advs[1]).toBeLessThan(0);
  });

  it("verifier rewards: correct beats format-only beats wrong", () => {
    expect(verifyReward(true, true)).toBe(1);
    expect(verifyReward(false, true)).toBeCloseTo(0.1, 5);
    expect(verifyReward(false, false)).toBe(0);
  });
});

describe("reasoning & test-time compute", () => {
  it("pass@k saturates to 1 when all samples are correct", () => {
    expect(passAtK(4, 4, 2)).toBe(1);
    expect(passAtK(10, 5, 1)).toBeCloseTo(0.5, 5);
  });

  it("self-consistency accuracy rises with samples, capped below 1", () => {
    const k1 = testTimeAccuracy(1, 0.4);
    const k32 = testTimeAccuracy(32, 0.4);
    expect(k32).toBeGreaterThan(k1);
    expect(k32).toBeLessThan(1);
  });

  it("agentic success composes and retry recovery helps", () => {
    expect(toolCallSuccess(1, 1)).toBe(1);
    expect(toolCallSuccess(0.9, 0.9)).toBeGreaterThan(0.81); // retry lift
    expect(toolCallSuccess(0.9, 0.9)).toBeLessThan(1);
  });
});

describe("safety & refusal calibration", () => {
  it("jailbreak success decays exponentially per red-team round", () => {
    expect(jailbreakRate(0)).toBeCloseTo(0.8, 5);
    expect(jailbreakRate(1)).toBeCloseTo(0.44, 5);
    expect(jailbreakRate(3)).toBeCloseTo(0.8 * 0.55 ** 3, 5);
  });

  it("over-refusal costs helpfulness quadratically", () => {
    const mild = refusalFrontier(0.8, 0.5);
    const harsh = refusalFrontier(0.8, 1.0);
    expect(harsh.refusals).toBeGreaterThan(mild.refusals);
    expect(harsh.helpful).toBeLessThan(mild.helpful);
  });
});

describe("evals & deployment math", () => {
  it("contamination uplift is the seen-unseen gap", () => {
    expect(contaminationUplift(0.712, 0.63)).toBeCloseTo(0.082, 5);
  });

  it("CI half-width shrinks with sqrt(n)", () => {
    const n500 = ciHalfWidth(500, 0.7);
    const n2000 = ciHalfWidth(2000, 0.7);
    expect(n500).toBeCloseTo(1.96 * Math.sqrt(0.7 * 0.3 / 500), 5);
    expect(n2000).toBeCloseTo(n500 / 2, 4);
  });

  it("Elo delta converts win rates symmetrically", () => {
    expect(eloDelta(0.5)).toBe(0);
    expect(eloDelta(0.64)).toBeCloseTo(400 * Math.log10(0.64 / 0.36), 5);
    expect(eloDelta(0.64)).toBeCloseTo(-eloDelta(0.36), 5);
  });

  it("multimodal token share respects image token cost", () => {
    expect(mmTokenShare(0, 576, 400)).toBe(0);
    expect(mmTokenShare(1, 576, 400)).toBeGreaterThan(0.5);
  });

  it("serving memory scales linearly with bits per weight", () => {
    expect(serveMemoryGB(70, 16)).toBeCloseTo(140, 5);
    expect(serveMemoryGB(70, 4)).toBeCloseTo(35, 5);
  });

  it("quantization retains most quality at 4-bit / group 128", () => {
    const r4 = quantRetained(4, 128);
    expect(r4).toBeGreaterThan(0.95);
    expect(quantRetained(2, 32)).toBeLessThan(r4);
  });

  it("distillation KL of identical distributions is zero", () => {
    expect(distillKlLoss([0.5, 0.5], [0.5, 0.5])).toBeCloseTo(0, 5);
    expect(distillKlLoss([0.9, 0.1], [0.5, 0.5])).toBeGreaterThan(0);
  });
});

describe("post-training journey integrity", () => {
  it("has exactly 24 scenes with unique ids and sequential numbers", () => {
    expect(POST_JOURNEY).toHaveLength(24);
    const ids = POST_JOURNEY.map((j) => j.id);
    expect(new Set(ids).size).toBe(24);
    expect(new Set(POST_JOURNEY.map((j) => j.num)).size).toBe(24);
  });

  it("spans 8 modules with 3 scenes each", () => {
    expect(POST_MODULES).toHaveLength(8);
    for (const m of POST_MODULES) {
      expect(postModuleJourney(m.id)).toHaveLength(3);
    }
  });

  it("neighbors link the chain end to end", () => {
    const first = postNeighbors(POST_JOURNEY[0].id);
    expect(first.prev).toBeNull();
    expect(first.next?.id).toBe(POST_JOURNEY[1].id);
    const last = postNeighbors(POST_JOURNEY[23].id);
    expect(last.next).toBeNull();
    expect(last.prev?.id).toBe(POST_JOURNEY[22].id);
  });
});

describe("notes & atlas coverage", () => {
  it("every journey scene has a technical note", () => {
    for (const j of POST_JOURNEY) {
      expect(SCENE_NOTES[j.id], `missing note for ${j.id}`).toBeTruthy();
    }
  });

  it("every scene-linked atlas topic references a real journey id", () => {
    const ids = new Set(POST_JOURNEY.map((j) => j.id));
    for (const t of POST_TOPICS) {
      if (t.kind === "scene") {
        expect(t.scene).toBeTruthy();
        expect(ids.has(t.scene!), `topic ${t.id} links to unknown scene`).toBe(true);
      }
    }
  });

  it("spans 8 domains, all non-empty", () => {
    expect(POST_DOMAINS).toHaveLength(8);
    for (const d of POST_DOMAINS) {
      expect(POST_TOPICS.filter((t) => t.domain === d.id).length).toBeGreaterThan(0);
    }
  });

  it("covers at least 30 topics with unique ids", () => {
    expect(POST_TOPICS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(POST_TOPICS.map((t) => t.id)).size).toBe(POST_TOPICS.length);
  });
});

describe("world registry", () => {
  it("post-training is live with href, scene and entry counts", () => {
    const w = WORLDS.find((x) => x.id === "post-training")!;
    expect(w.status).toBe("live");
    expect(w.href).toBe("/posttrain/");
    expect(w.scenes).toBe(24);
    expect(w.entries).toBe(32);
  });
});
