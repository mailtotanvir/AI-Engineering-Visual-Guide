import { LaunchConfig } from "./types";
export type { LaunchConfig };

export const GRID_MIN = 1;
export const GRID_MAX = 512;
export const BLOCK_MIN = 32;
export const BLOCK_MAX = 1024;
export const BLOCK_STEP = 32;

export function clampLaunch(cfg: { grid: number; block: number }): LaunchConfig {
  let g = Math.round(cfg.grid);
  let b = Math.round(cfg.block);
  if (!Number.isFinite(g)) g = 4;
  if (!Number.isFinite(b)) b = BLOCK_MIN;
  g = Math.min(GRID_MAX, Math.max(GRID_MIN, g));
  b = Math.min(BLOCK_MAX, Math.max(BLOCK_MIN, Math.round(b / BLOCK_STEP) * BLOCK_STEP));
  if (b < BLOCK_MIN) b = BLOCK_MIN;
  return { blocks: g, threadsPerBlock: b };
}

export function parseLaunchSource(src: string): LaunchConfig | null {
  const m = src.match(/<<<\s*(\d+)\s*,\s*(\d+)\s*>>>/);
  if (!m) return null;
  const g = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (!Number.isFinite(g) || !Number.isFinite(b)) return null;
  return clampLaunch({ grid: g, block: b });
}

export function formatLaunch(cfg: LaunchConfig): string {
  return `<<<${cfg.blocks}, ${cfg.threadsPerBlock}>>>`;
}

export function launchSummary(cfg: LaunchConfig): string {
  const threads = cfg.blocks * cfg.threadsPerBlock;
  const warps = Math.ceil(threads / 32);
  return `${formatLaunch(cfg)} · ${threads.toLocaleString("en-US")} threads · ${warps.toLocaleString("en-US")} warps`;
}
