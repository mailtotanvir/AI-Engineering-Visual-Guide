export interface Vec { x: number; y: number }

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const bell = (u: number) => Math.sin(Math.PI * clamp(u, 0, 1));

export function quadPoint(a: Vec, c: Vec, b: Vec, u: number): Vec {
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    y: v * v * a.y + 2 * v * u * c.y + u * u * b.y,
  };
}

export function outBack(u: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
}

export function outCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}
