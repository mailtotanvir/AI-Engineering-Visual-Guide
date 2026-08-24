export const DEBUG_BLOCKS = 4;
export const DEBUG_THREADS = 4;
export const DEBUG_CELLS = DEBUG_BLOCKS * DEBUG_THREADS;

export type BugKind = "offByOne" | "wrongVar";

export const BUGS: Record<BugKind, { label: string; line: string; symptom: string }> = {
  offByOne: {
    label: "OFF BY ONE",
    line: "int i = blockIdx.x * blockDim.x + threadIdx.x + 1;",
    symptom: "Element 0 never gets a write, and the last write falls off the end of the array.",
  },
  wrongVar: {
    label: "WRONG VARIABLE",
    line: "int i = threadIdx.x;",
    symptom: "Every block writes the same first cells — four threads fight over each one.",
  },
};

export const CORRECT_LINE = "int i = blockIdx.x * blockDim.x + threadIdx.x;";

const WRITE_AT = (b: number) => 0.12 + b * 0.18;

export interface DebugState {
  t: number;
  mode: BugKind | "fixed";
  covered: boolean[];
  writeCounts: number[];
  collisions: number[];
  missing: number[];
  outOfBounds: number;
  done: boolean;
}

export function computeDebugState(tIn: number, mode: BugKind | "fixed"): DebugState {
  const t = Math.min(1, Math.max(0, tIn));
  const writeCounts = new Array(DEBUG_CELLS).fill(0);
  let outOfBounds = 0;

  for (let b = 0; b < DEBUG_BLOCKS && t >= WRITE_AT(b); b++) {
    for (let j = 0; j < DEBUG_THREADS; j++) {
      if (mode === "fixed") writeCounts[b * DEBUG_THREADS + j]++;
      else if (mode === "offByOne") {
        const cell = b * DEBUG_THREADS + j + 1;
        if (cell >= DEBUG_CELLS) outOfBounds++;
        else writeCounts[cell]++;
      } else writeCounts[j]++;
    }
  }

  const covered = writeCounts.map((c) => c > 0);
  const collisions = writeCounts.map((c) => Math.max(0, c - 1));
  const missing: number[] = [];
  for (let c = 0; c < DEBUG_CELLS; c++) if (!covered[c]) missing.push(c);

  return { t, mode, covered, writeCounts, collisions, missing, outOfBounds, done: t >= 0.95 };
}
