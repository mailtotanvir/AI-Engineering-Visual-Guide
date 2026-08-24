export const CHALLENGE_GRID = 8;
export const CHALLENGE_BLOCK = 32;
export const CHALLENGE_CELLS = 64;

const CORRECT_RE =
  /int\s+i\s*=\s*blockIdx\.x\s*\*\s*blockDim\.x\s*\+\s*threadIdx\.x\s*;/i;

export interface ChallengeCheck {
  ok: boolean;
  hasLaunch: boolean;
  reason: string;
}

export function extractIndexLine(src: string): string | null {
  const m = src.match(/int\s+i\s*=[^;\n]*;/i);
  return m ? m[0] : null;
}

export function checkChallenge(src: string): ChallengeCheck {
  const launch = /<<<\s*(\d+)\s*,\s*(\d+)\s*>>>/.exec(src);
  if (!launch) return { ok: false, hasLaunch: false, reason: "No launch found — keep the add<<<grid, block>>>(…) line." };
  const idxLine = extractIndexLine(src);
  if (!idxLine) return { ok: false, hasLaunch: true, reason: "Declare the index first: int i = …;" };
  if (!/blockidx/i.test(idxLine))
    return { ok: false, hasLaunch: true, reason: "blockIdx.x is missing — which block is this thread in?" };
  if (!/threadidx/i.test(idxLine))
    return { ok: false, hasLaunch: true, reason: "threadIdx.x is missing — which lane inside the block?" };
  if (!/\*/.test(idxLine))
    return { ok: false, hasLaunch: true, reason: "Blocks are rows of blockDim.x threads. Multiply before adding." };
  if (!CORRECT_RE.test(idxLine.replace(/\s+/g, " ")))
    return { ok: false, hasLaunch: true, reason: "Close. The canonical form is blockIdx.x * blockDim.x + threadIdx.x" };
  return { ok: true, hasLaunch: true, reason: `All ${CHALLENGE_GRID * CHALLENGE_BLOCK} elements written exactly once.` };
}

export const CHALLENGE_TEMPLATE = [
  "__global__ void add(float* a, float* b, float* c, int n) {",
  "    // TODO: give this thread its own element",
  "    int i = 0; // ← fix me",
  "",
  "    if (i < n) c[i] = a[i] + b[i];",
  "}",
  "",
  "int main() {",
  "    // 8 blocks × 32 threads = 256 elements to cover",
  "    add<<<8, 32>>>(d_a, d_b, d_c, N);",
  "}",
].join("\n");
