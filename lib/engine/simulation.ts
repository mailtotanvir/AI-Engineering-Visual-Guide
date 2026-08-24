import { BLOCK_COUNT, MEM_COUNT, THREADS_SHOWN, ctrlPos, homePos, targetPos } from "./machine";
import { clamp, lerp, outBack, quadPoint, seg, bell } from "./easing";
import { stageOf, STAGES } from "./stages";
import { StageId } from "./types";
import { LaunchConfig, MachineState, SimEvent, Spotlight } from "./types";

export const DEFAULT_LAUNCH: LaunchConfig = { blocks: 4, threadsPerBlock: 256 };
const FLY = 0.055;

function spawnAt(i: number) { return 0.18 + i * 0.0105; }
function departAt(i: number) { return 0.34 + i * 0.011; }
function arriveAt(i: number) { return departAt(i) + FLY; }
function waveBase(i: number) { return 0.57 + Math.floor(i / 6) * 0.055; }
function lightAt(i: number, j: number) { return Math.max(arriveAt(i), waveBase(i)) + j * 0.007; }
function storeAt(c: number) { return 0.76 + c * 0.0048; }

const SPOTLIGHTS: Record<StageId, Spotlight> = {
  cpu: { cpu: 1, core: 0.42, staging: 0.32, memory: 0.18 },
  launch: { cpu: 0.95, core: 0.5, staging: 0.38, memory: 0.16 },
  grid: { cpu: 0.35, core: 0.55, staging: 1, memory: 0.22 },
  sched: { cpu: 0.2, core: 0.95, staging: 0.7, memory: 0.28 },
  exec: { cpu: 0.15, core: 1, staging: 0.3, memory: 0.25 },
  store: { cpu: 0.12, core: 0.72, staging: 0.18, memory: 1 },
  done: { cpu: 0.45, core: 0.88, staging: 0.4, memory: 0.92 },
};

export function computeState(tIn: number, cfg: LaunchConfig = DEFAULT_LAUNCH): MachineState {
  const t = clamp(tIn, 0, 1);
  const stage = stageOf(t);
  const blocks = [];
  for (let i = 0; i < cfg.blocks; i++) {
    const sp = seg(t, spawnAt(i), spawnAt(i) + 0.03);
    if (sp <= 0) {
      blocks.push({ i, x: homePos(i).x, y: homePos(i).y, scale: 1.15, opacity: 0, seated: false, heat: new Array(THREADS_SHOWN).fill(0) });
      continue;
    }
    const u = seg(t, departAt(i), arriveAt(i));
    let pos, scale;
    if (u <= 0) { pos = homePos(i); scale = 1.15 * outBack(sp); }
    else if (u < 1) { pos = quadPoint(homePos(i), ctrlPos(i), targetPos(i), u); scale = lerp(1.15, 0.85, u); }
    else { pos = targetPos(i); scale = 0.85; }
    const seated = u >= 1;
    const heat: number[] = [];
    for (let j = 0; j < THREADS_SHOWN; j++) {
      const dt = t - lightAt(i, j);
      heat.push(dt < -0.004 ? 0 : clamp(dt / 0.02, 0, 1));
    }
    blocks.push({ i, x: pos.x, y: pos.y, scale, opacity: Math.min(1, sp * 1.5), seated, heat });
  }
  const memFill: number[] = [];
  for (let c = 0; c < MEM_COUNT; c++) memFill.push(seg(t, storeAt(c), storeAt(c) + 0.02));
  const pu = seg(t, 0.1, 0.2);
  return {
    t,
    stage,
    packetU: pu,
    packetOpacity: bell(pu),
    cpuPulse: t < 0.12 ? 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 46)) : 0,
    gridZone: SPOTLIGHTS[stage.k].staging,
    spotlight: SPOTLIGHTS[stage.k],
    blocks,
    memFill,
    complete: t >= 0.92,
  };
}

export function simulateKernelLaunch(cfg: LaunchConfig = DEFAULT_LAUNCH): SimEvent[] {
  void STAGES;
  return [
    { t: 0, type: "KERNEL_LAUNCH", label: "cudaMemcpy host → device" },
    { t: departAt(0), type: "GRID_CREATED", label: `grid of ${cfg.blocks} blocks created` },
    { t: departAt(0), type: "WARP_FORMED", label: `${Math.round((cfg.blocks * cfg.threadsPerBlock) / 32)} warps formed` },
    { t: departAt(Math.min(cfg.blocks - 1, BLOCK_COUNT - 1)), type: "BLOCK_SCHEDULED", label: "blocks placed on SMs" },
    { t: waveBase(0), type: "THREAD_EXECUTE", label: "warps execute in lockstep" },
    { t: storeAt(0), type: "MEMORY_STORE", label: "results stream to global memory" },
    { t: storeAt(MEM_COUNT - 1) + 0.02, type: "KERNEL_COMPLETE", label: "kernel complete" },
  ];
}

export const _internal = { arriveAt, departAt, spawnAt, waveBase, lightAt, storeAt, FLY };
