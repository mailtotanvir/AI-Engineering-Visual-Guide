import { describe, expect, it } from "vitest";
import { WORLDS } from "@/content/worlds";

describe("worlds registry", () => {
  it("keeps the bar at seven disciplines", () => {
    expect(WORLDS).toHaveLength(7);
  });
  it("has unique ids and exactly four live worlds", () => {
    const ids = WORLDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const live = WORLDS.filter((w) => w.status === "live");
    expect(live.map((w) => w.id)).toEqual(["cuda", "training-scale", "post-training", "inference"]);
    live.forEach((w) => expect(w.href).toMatch(/^\//));
  });
  it("planned worlds expose no dead links", () => {
    WORLDS.filter((w) => w.status === "planned").forEach((w) => {
      expect(w.href).toBeUndefined();
    });
  });
  it("absorbed sub-topics no longer exist as separate worlds", () => {
    const ids = WORLDS.map((w) => w.id);
    for (const gone of ["pre-training", "parallel-training", "distillation"]) {
      expect(ids).not.toContain(gone);
    }
  });
  it("covers the required disciplines", () => {
    const ids = WORLDS.map((w) => w.id);
    for (const required of [
      "cuda", "training-scale", "post-training", "inference",
      "evals", "infrastructure", "safety-alignment",
    ]) {
      expect(ids).toContain(required);
    }
  });
  it("every world carries an accent color and tagline", () => {
    WORLDS.forEach((w) => {
      expect(w.accent).toBeTruthy();
      expect(w.tagline.length).toBeGreaterThan(3);
      expect(w.thesis.length).toBeGreaterThan(12);
      expect(w.flow).toHaveLength(4);
      expect(new Set(w.flow).size).toBe(w.flow.length);
    });
  });
});
