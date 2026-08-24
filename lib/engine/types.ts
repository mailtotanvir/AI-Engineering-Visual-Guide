import { Stage } from "./stages";

export type { StageId } from "./stages";

export type LaunchConfig = { blocks: number; threadsPerBlock: number };

export type SimEventType =
  | "KERNEL_LAUNCH"
  | "GRID_CREATED"
  | "BLOCK_SCHEDULED"
  | "WARP_FORMED"
  | "THREAD_EXECUTE"
  | "MEMORY_STORE"
  | "KERNEL_COMPLETE";

export interface SimEvent {
  t: number;
  type: SimEventType;
  label?: string;
}

export interface Spotlight {
  cpu: number;
  core: number;
  staging: number;
  memory: number;
}

export interface BlockState {
  i: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  seated: boolean;
  heat: number[];
}

export interface MachineState {
  t: number;
  stage: Stage;
  packetU: number;
  packetOpacity: number;
  cpuPulse: number;
  gridZone: number;
  spotlight: Spotlight;
  blocks: BlockState[];
  memFill: number[];
  complete: boolean;
}
