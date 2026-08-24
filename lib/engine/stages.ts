export type StageId = "cpu" | "launch" | "grid" | "sched" | "exec" | "store" | "done";

export interface Stage {
  k: StageId;
  label: string;
  a: number;
  b: number;
}

export const STAGES: Stage[] = [
  { k: "cpu", label: "CPU PREPARES", a: 0, b: 0.12 },
  { k: "launch", label: "KERNEL LAUNCH", a: 0.12, b: 0.18 },
  { k: "grid", label: "GRID CREATED", a: 0.18, b: 0.32 },
  { k: "sched", label: "BLOCKS SCHEDULED", a: 0.32, b: 0.54 },
  { k: "exec", label: "WARPS EXECUTE", a: 0.54, b: 0.76 },
  { k: "store", label: "MEMORY STORE", a: 0.76, b: 0.92 },
  { k: "done", label: "COMPLETE", a: 0.92, b: 1.001 },
];

export function stageOf(t: number): Stage {
  for (let i = STAGES.length - 1; i >= 0; i--) if (t >= STAGES[i].a) return STAGES[i];
  return STAGES[0];
}
