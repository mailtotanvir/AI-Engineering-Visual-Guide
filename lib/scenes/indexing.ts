export const IDX_BLOCKS = 4;
export const IDX_BLOCK_SIZE = 8;
export const IDX_CELLS = IDX_BLOCKS * IDX_BLOCK_SIZE;

export function globalIndex(b: number, t: number, blockSize = IDX_BLOCK_SIZE): number {
  return b * blockSize + t;
}

export function clampBlock(b: number): number {
  return Math.min(IDX_BLOCKS - 1, Math.max(0, b));
}

export function clampThread(t: number): number {
  return Math.min(IDX_BLOCK_SIZE - 1, Math.max(0, t));
}
