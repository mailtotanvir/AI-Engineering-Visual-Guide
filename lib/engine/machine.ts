import { Vec } from "./easing";

export const VIEW = { w: 1200, h: 620 };
export const SM_COUNT = 6;
export const SLOTS_PER_SM = 2;
export const BLOCK_COUNT = 12;
export const THREADS_SHOWN = 8;
export const MEM_COUNT = 24;

export function tileXY(s: number): Vec {
  return { x: 600 + (s % 3) * 152, y: 160 + Math.floor(s / 3) * 165 };
}
export function slotCenter(s: number, q: number): Vec {
  const t = tileXY(s);
  return { x: t.x + 71, y: t.y + 56 + q * 54 };
}
export function homePos(i: number): Vec {
  return { x: 388 + Math.floor(i / 4) * 70, y: 211 + (i % 4) * 53 };
}
export function targetPos(i: number): Vec {
  return slotCenter(i % SM_COUNT, Math.floor(i / SM_COUNT));
}
export function ctrlPos(i: number): Vec {
  const h = homePos(i), t = targetPos(i);
  return { x: (h.x + t.x) / 2, y: Math.min(h.y, t.y) - 70 };
}
export function memCellX(c: number): number {
  return 330 + c * 30;
}

export const BUS_D = "M 200 112 C 260 60, 430 40, 640 106";
export const CPU_RECT = { x: 48, y: 88, w: 152, h: 64, rx: 12 };
