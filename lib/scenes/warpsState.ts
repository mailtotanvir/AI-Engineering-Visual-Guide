export const WARP_LANES = 32;

export type WarpPhase = "unified" | "split" | "pathA" | "pathB" | "reconverged";

export interface WarpState {
  t: number;
  phase: WarpPhase;
  instructions: number;
  splitProgress: number;
  execProgress: number;
  laneOffsetY: number[];
  laneActive: number[];
  isEven: boolean[];
}

const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function computeWarpState(tIn: number): WarpState {
  const t = Math.min(1, Math.max(0, tIn));
  const phase: WarpPhase =
    t < 0.2 ? "unified" : t < 0.32 ? "split" : t < 0.58 ? "pathA" : t < 0.86 ? "pathB" : "reconverged";
  const sp =
    phase === "unified" ? 0
    : phase === "reconverged" ? 1 - seg(t, 0.86, 0.96)
    : seg(t, 0.2, 0.32);
  const pExec =
    phase === "pathA" ? seg(t, 0.32, 0.58)
    : phase === "pathB" ? seg(t, 0.58, 0.86)
    : phase === "reconverged" ? 1 : 0;
  const instructions =
    phase === "unified" ? Math.floor(seg(t, 0.02, 0.2) * 6)
    : Math.floor(pExec * 8) + (t >= 0.86 ? 14 : 6);

  const laneOffsetY: number[] = [];
  const laneActive: number[] = [];
  const isEven: boolean[] = [];
  for (let i = 0; i < WARP_LANES; i++) {
    const even = i % 2 === 0;
    isEven.push(even);
    const off = (even ? -46 : 46) * sp;
    laneOffsetY.push(off === 0 ? 0 : off);
    let a = 1;
    if (phase === "split") a = 0.55;
    else if (phase === "pathA") a = even ? lerp(0.35, 1, pExec) : lerp(1, 0.22, Math.min(1, pExec * 4));
    else if (phase === "pathB") a = even ? 0.45 : lerp(0.3, 1, pExec);
    else if (phase === "reconverged") a = lerp(0.5, 1, seg(t, 0.86, 0.96));
    laneActive.push(a);
  }
  return { t, phase, instructions, splitProgress: sp, execProgress: pExec, laneOffsetY, laneActive, isEven };
}
