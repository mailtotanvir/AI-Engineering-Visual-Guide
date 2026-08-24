export const PAIRS = 16;

export interface RaceState {
  cpuDone: number;
  cpuCursor: number | null;
  gpuFlash: number;
  gpuDone: boolean;
  crossoverStep: number;
}

export function computeRaceState(tIn: number): RaceState {
  const t = Math.min(1, Math.max(0, tIn));
  const cpuSpan = seg(t, 0.06, 0.96);
  const cpuDone = Math.min(PAIRS, Math.floor(cpuSpan * PAIRS));
  const stepT = 0.06 + (cpuDone / PAIRS) * (0.9);
  const cursorActive = t >= 0.06 && t < 0.97 && cpuDone < PAIRS;
  const gpuFlash = seg(t, 0.5, 0.62) * (1 - seg(t, 0.62, 0.78));
  const gpuDone = t >= 0.62;
  const crossoverStep = Math.min(PAIRS, Math.floor(seg(0.62, 0.06, 0.96) * PAIRS));
  void stepT;
  return {
    cpuDone,
    cpuCursor: cursorActive ? Math.min(PAIRS - 1, cpuDone) : null,
    gpuFlash,
    gpuDone,
    crossoverStep,
  };
}

function seg(v: number, a: number, b: number) {
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}
