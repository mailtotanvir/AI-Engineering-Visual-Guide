# AI Engineering Visual Encyclopedia

> **Watch the machine think.** A growing atlas of AI engineering — CUDA and LLM inference today; pre-training, post-training, evals, distillation, infrastructure and safety next.
An interactive atlas where CUDA code, hardware, execution, memory and performance become one
continuous visual story — a scientific exhibit you enter, not documentation you read.

![status](https://img.shields.io/badge/status-M2_gate_build-46E3C8) ![spec](https://img.shields.io/badge/spec-docs%2Fdesign.md-A48FFF)

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine unit tests (purity, stages, events)
npm run build      # static export to ./out
npm run preview    # serve ./out on :8080
```

GitHub Pages deploy: `NEXT_PUBLIC_BASE_PATH=/<repo-name> npm run build`.

## Two worlds

| World | Story | Reference |
| --- | --- | --- |
| **CUDA** (`/`) | 10-scene journey: launch, threads, warps, memory, debug, challenge | `/atlas/` — 7 domains · 24 entries · 7 exhibits |
| **Inference Engineering** (`/inference/`) | 8-scene journey following one prompt through serving: decode loop → prefill/decode → TTFT/TPOT → KV economy → paging → continuous batching → sampling → speculation | `/inference/atlas/` — 7 domains · 17 entries |

Both worlds share the design language, time-control instruments and mobile-first layouts.

## What is inside

| Route | Experience |
| --- | --- |
| `/` | Cinematic boot veil → hero with live miniature launch loop, journey map, principles, tokens |
| `/scenes/the-problem/` | Scene 01 — serial CPU vs parallel GPU race, same work different clocks |
| `/scenes/meet-the-gpu/` | Scene 02 — click any SM open: warp schedulers firing lanes in lockstep |
| `/launch/` | Scene 03 — **the launch exhibit**: deterministic sim, full time control, stage spotlight, inspectors, Explorer mode. Code pane is a live Monaco editor: edit `<<<blocks, threads>>>` and the machine re-schedules; timeline highlights lines both ways |
| `/scenes/threads/` | Scene 04 — slider from 1 thread to 1,024; warps appear at 32 |
| `/scenes/thread-indexing/` | Scene 05 — pick any thread; equation, source line and diagram resolve as one object |
| `/scenes/warps/` | Scene 06 — a branch splits one warp into two masks; watch the cost of divergence, then reconverge |
| `/scenes/memory/` | Scene 07 — memory as geography; predict then race coalesced vs strided access |
| `/descent/` | Scene 08 — peel PROGRAM → KERNEL → GRID → BLOCK → WARP → THREAD → SM → MEMORY |
| `/scenes/debug/` | Scene 09 — a broken kernel writes to the wrong cells; diagnose it from the visualization |
| `/scenes/challenge/` | Scene 10 — write the index mapping yourself; RUN & TEST decides |

Journey pages share breadcrumb + progress-dot navigation (arrow keys work between scenes).

## The Atlas — full encyclopedia coverage

`/atlas/` is a reference layer covering all seven domains of the CUDA surface
(`cuda_encyclopedia_structure.md`). Domain tabs filter entries; ◈ entries are hands-on exhibits:

| Domain | Entries | Interactive |
| --- | --- | --- |
| Hardware Architecture | SMs · SIMT · warp scheduling · compute capability | via journey (meet-the-gpu, warps) |
| Thread Hierarchy | grids/blocks/threads · 2D/3D indexing · divergence · sync (`__syncthreads`, shuffles) | via journey |
| Memory Management | coalescing · **shared-memory banks** ◈ · constant/texture · unified memory | banks conflict visualizer |
| Performance | **occupancy & latency hiding** ◈ · **shared-memory tiling** ◈ · fast math/intrinsics · **atomics race** ◈ | occupancy tuner, traffic duel, lost-update race |
| Asynchronous CUDA | **streams overlap** ◈ · async copies/pinned memory · **CUDA graphs** ◈ · multi-GPU UVA/P2P | gantt timelines, capture/replay savings |
| Compilation & Tooling | **nvcc pipeline** ◈ · PTX vs SASS · Nsight Systems · Nsight Compute | animated split-compilation flow |
| Library Ecosystem | cuBLAS · cuDNN · Thrust · Python bindings (CuPy/Numba) | — |

Every entry cross-links into the journey when a moving version exists.

## Publish to GitHub Pages

1. Create a repo (e.g. `cuda-visual-encyclopedia`) and push this project to `main`.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push (or use *Actions → Deploy → Run workflow*). The bundled workflow runs tests,
   builds a static export with the repo name as base path, and publishes automatically.
4. Site goes live at `https://<user>.github.io/<repo-name>/`.

Renaming the repo later is safe — the workflow derives the base path from the repo name.

**Root-domain / custom domain?** Build without a prefix instead:

```bash
NEXT_PUBLIC_BASE_PATH= npm run build
```

**Local check of the exact Pages artifact** (note the trailing path):

```bash
npm test && npm run build
NEXT_PUBLIC_BASE_PATH=/cuda-visual-encyclopedia npm run build
python3 -m http.server 4173 --directory out
# open http://localhost:4173/cuda-visual-encyclopedia/
```

## Architecture

```text
lib/engine/        pure TypeScript, zero React
  simulation.ts    computeState(t) — pure function of normalized time (scrub-safe by construction)
                   simulateKernelLaunch(cfg) — discrete SimEvent[] contract
  timeline.ts      TimelineStore — play/pause/step/back/reset/speed over rAF
  machine.ts       shared die geometry (tiles, slots, flight paths, memory cells)
components/
  exhibit/LaunchExhibit.tsx   wires store ↔ scene ↔ UI; per-frame writes bypass React
  lib/scene/launchScene.ts    imperative SVG builder consuming MachineState
content/cuda/scenes.ts       declarative content: code lines, stage→code map, legend
styles/tokens.css            single source of design values
tests/engine.test.ts         purity + contract gates
```

Separation rules enforced by tests: simulation never imports React; rendering never computes
CUDA semantics; scrubbing backwards reproduces identical states.

## Documentation

| Doc | Purpose |
| --- | --- |
| [`docs/design.md`](./docs/design.md) | Canonical product & design specification (MVP1) |
| [`docs/implementation-plan.md`](./docs/implementation-plan.md) | Phases M0→M5, architecture, CDO approval gate (14 conditions) |

## Milestones

- **M0** ✅ design language locked (`preview/index.html`, CDO-reviewed)
- **M1** ✅ shell + hierarchy exploration in Next.js (this build)
- **M2** ✅ launch exhibit rebuilt in-engine (tick-wiring verified)
- **M3** ✅ Monaco code-sync (edit `<<<grid, block>>>` → simulation reconfigures) + journey shell
- **M4** ✅ warps/divergence + memory geography/coalescing duel
- **M5** ✅ debug-it + final challenge · GitHub Pages deploy pipeline wired — **MVP complete**

---

© CUDA Visual Encyclopedia · design spec preserved in [`docs/design.md`](./docs/design.md)
