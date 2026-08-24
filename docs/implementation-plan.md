# CUDA Visual Encyclopedia — Implementation Plan

> Source of truth: [`docs/design.md`](./design.md) (MVP1 Design & Product Specification).
> This document turns that spec into a build order. It is an engineering plan, not new product scope.

---

## 0. Status & ground rules

| Item | Decision |
| --- | --- |
| Product | CUDA Visual Encyclopedia — “CUDA, but you can see it run.” |
| MVP slice | One vertical journey: **“How does a CUDA kernel run?”** (12 scenes, ~20–30 min) |
| Non-negotiable gate | The opening scene must be exceptional **before** any navigation/docs/dashboard work |
| Deployment | Static export on GitHub Pages (`mailtotanvir.github.io`), no backend required |
| Priority order when trade-offs arise | 1 Beauty · 2 Visual mental model · 3 Interaction · 4 Technical fidelity · 5 Breadth |

Design preview of the visual language lives at [`preview/index.html`](../preview/index.html) —
open it directly in a browser (zero dependencies). It demonstrates: color/type tokens,
the kernel-launch exhibit with scrubbing timeline, code↔visual sync, thread-indexing
interaction, peel-the-abstraction stack, and core UI components.

---

## 1. Tech stack (locked for MVP)

```text
Next.js (App Router, static export)   → pages + routing + GitHub Pages output
TypeScript                            → everything
React                                 → UI shell only (canvas is imperative)
SVG (hierarchies, ≤ ~1k nodes)        → crisp objects, DOM events, CSS transitions
Canvas2D (dense fields / big counts)  → million-thread abstractions, memory sweeps
Motion (framer-motion)                → layout/zoom transitions in React land
Zustand                               → single app store; simulation stays outside it
Monaco (@monaco-editor/react)         → compact code panel, line highlighting
Web Worker (opt-in)                   → simulator ticks if profiling demands it
Vitest + Playwright + axe             → unit, smoke, accessibility gates
```

Rules inherited from the spec:

- Simulation logic never imports React. Renderer never computes CUDA semantics.
- No rendering of literal millions of objects — aggregate/abstract (spec §31).
- Desktop-first 1440×900, graceful to 1024×768; mobile = read/explore mode later.

---

## 2. Architecture

```text
content/*.yaml ──► lesson loader ──► <LessonShell>
                                        │
                    ┌───────────────────┼─────────────────────┐
                    ▼                   ▼                     ▼
             engine/simulation    components/controls   components/visualization
             (pure TS event gen)  (RUN/RESET/scrub…)    (GPUView, SMView, …)
                    │                                         ▲
                    └──► SimEvent[] stream ───────────────────┘
                             (renderer consumes events → visual state)
```

Core contracts (established in Phase 3, reused forever):

```ts
type SimEventType =
  | 'KERNEL_LAUNCH' | 'GRID_CREATED' | 'BLOCK_CREATED' | 'BLOCK_SCHEDULED'
  | 'WARP_FORMED' | 'THREAD_EXECUTE' | 'MEMORY_LOAD' | 'MEMORY_STORE'
  | 'BARRIER' | 'KERNEL_COMPLETE';

interface SimEvent { t: number; type: SimEventType; payload?: Record<string, unknown>; }
interface SceneObject {
  id: string; type: 'gpu'|'sm'|'block'|'warp'|'thread'|'memory'|…;
  position: Vec; state: string; children?: SceneObject[];
  highlighted?: boolean; selected?: boolean; metadata?: Record<string, unknown>;
}
```

The timeline is a pure function `t ∈ [0,1] → derived visual state`, so **scrub,
step, replay and reduced-motion all come for free** from the same model.

---

## 3. Repository layout

```text
cuda-visual-encyclopedia/
├── docs/
│   ├── design.md               ← spec (canonical)
│   └── implementation-plan.md  ← this file
├── preview/
│   └── index.html              ← standalone design-language prototype (no build)
├── app/                        ← Next.js shell (Phase 1+)
│   ├── page.tsx                ← landing: hero + live miniature GPU viz
│   ├── explore/                ← CUDA map (Phase 8+)
│   └── scenes/[id]/            ← the 12-scene journey
├── components/{shell,editor,controls,timeline,visualization}/
├── engine/{simulation,events,models,state}/
├── content/cuda/**             ← declarative lesson YAML per spec §22
├── examples/vector-add/
├── styles/tokens.css           ← design tokens (mirrors preview/index.html)
└── tests/
```

---

## 4. Phases

Each phase ends with a **demoable artifact** and explicit **exit criteria**.
“Beautiful” is an acceptance criterion everywhere, not a Phase 8 nicety.

### Phase 1 — Visual shell (“a beautiful empty world”)

Build:

- [ ] Next.js + TS scaffold, static-export config for GitHub Pages
- [ ] `styles/tokens.css`: palette (deep-space surfaces, teal/cyan/iris/gold/rose accents), type scale (Space Grotesk display + IBM Plex Mono technical), spacing, radii, focus rings
- [ ] App shell: top bar (wordmark, global nav placeholders, settings popover: Motion Full/Reduced · Density Detailed/Simplified · Sound Off default)
- [ ] Main `<ExhibitCanvas>` viewport component + control dock (RUN · RESET · step · speed)
- [ ] Animation primitives: easing set, duration scale, `<ReducedMotion>` provider honoring OS setting
- [ ] Landing hero: “CUDA — See the GPU think.” + `[ENTER THE GPU]` + subtle ambient background

Exit criteria:

- Empty canvas already looks premium at 1440×900; tokens are the only source of styling values
- All controls keyboard-reachable with visible focus; motion toggle works end-to-end
- Lighthouse a11y ≥ 95 on the empty shell

### Phase 2 — GPU exploration (peel the hierarchy)

Build:

- [ ] `SceneObject` model + SVG renderer for GPU → GPC/SM tiles → block slots → warps → threads
- [ ] Zoom transitions preserving object identity (same block glyph morphs across levels)
- [ ] Hover/inspect: any object exposes id/state chip; click SM expands it in place
- [ ] “PEEL BACK THE ABSTRACTION” stepper: Program → Kernel → Grid → Block → Warp → Thread → SM → Memory

Exit criteria:

- GPU→SM→Block→Warp→Thread zoom chain animates without page change or object identity jumps
- Every level answers “what am I looking at?” in ≤ 12 words of caption

### Phase 3 — Execution engine

Build:

- [ ] Conceptual simulator: `KernelLaunch{grid,block}` → deterministic `SimEvent[]`
- [ ] Timeline store: play/pause/step/reset/scrub over normalized t
- [ ] Stage map (CPU prepares → launch → grid created → blocks scheduled → warps execute → memory ops → result → complete) rendered as labeled segments, explicitly *not* real timings
- [ ] First full animation pass of Exhibit 01: launch pulse travels CPU→GPU; grid materializes; blocks fly to SMs; warp lanes light in lockstep; stores fill memory strip

Exit criteria:

- Scrubbing backwards reproduces identical states (pure function of t)
- 60 fps at default scene on a mid laptop; no per-frame React re-renders (rAF + direct SVG attribute writes)

### Phase 4 — Code synchronization

Build:

- [ ] Compact Monaco pane (collapsible; never dominates)
- [ ] `code→visual` map: executing line highlights while matching phase plays
- [ ] `visual→code` map: selecting a thread/block highlights its indexing line
- [ ] Editable knobs that mutate the sim: grid dim, block dim, guard clause

Exit criteria:

- Both directions demonstrably live in one scene (spec §14)
- Editor ≤ 40% width at 1440×900, collapsible to give canvas full bleed

### Phase 5 — First three lessons complete

Build:

- [ ] Scene 02 “Meet the GPU”, Scene 04 “Threads” (slider 1→1024 with aggregation past 256 dots), Scene 07 “Thread indexing” (Wow 3: thread→index→memory path trace)
- [ ] Declarative lesson YAML schema + loader (spec §22 concept model)
- [ ] Local breadcrumb `CUDA / Execution / Threads`; spatial nav hooks (click SM ⇒ SM concept)

Exit criteria:

- A stranger can run scenes 02→04→07 back-to-back without instructions
- Indexing equation is never shown without its animation

### Phase 6 — Warps, memory, performance intuition

Build:

- [ ] Warp formation (32 collapse into one lane group) + divergence split/reconverge animation
- [ ] Memory pyramid as spatial proximity (registers/shared/global) + coalesced vs scattered access replay pair
- [ ] Prediction-first performance duel UI (learner predicts, then reveal)

Exit criteria:

- Divergence shows sequential paths then reconvergence; no fake cycle numbers presented as truth
- Coalescing comparison is scrubbable side-by-side

### Phase 7 — Debug + final challenge

Build:

- [ ] Broken-kernel exhibits (wrong index, OOB access flash red at the violating cell, missing sync stall) — viz doubles as debugger
- [ ] Final challenge: minimal editor + Run/Reset + execution viz + pass/fail tests driven by the same simulator

Exit criteria:

- Learner’s own kernel config drives the visualization end-to-end (Wow 6)
- Failure states are diagnosable purely from what the learner sees

### Phase 8 — Polish & publish

- [ ] Micro-transitions, sound experiment (off by default), responsive pass to 1024×768
- [ ] Reduced-motion/density audit; axe clean; perf budget check
- [ ] GitHub Pages deploy (Actions workflow), OG image, README finalization
- [ ] Optional: explore-map home (spec §10) once journey exists

---

## 5. Milestone map

```text
M0  preview/index.html approved            ✅ done (CDO conditional pass → v2 addresses all 14)
M1  Phase 1–2 demo: shell + peel           ✅ built (Next.js app: /, /descent, tokens, shell, engine split)
M2  Phase 3 demo: launch exhibit w/ scrub  ◐ BUILT — gate demo at /launch awaiting human review
M3  Phase 4–5: code sync + journey        ✅ BUILT — Monaco live-config editing, journey shell,
                                               scenes: problem/meet-GPU/threads/indexing + launch/descent
M4  Phase 6: warps/memory/perf            ✅ BUILT — divergence split/reconverge, memory geography
                                               + coalescing prediction duel (scrub-safe states)
M5  Phase 7–8: challenge + polish         ✅ BUILT — debug-it broken kernel, final write-the-kernel
                                               challenge w/ tests, deploy pipeline to GitHub Pages
── Encyclopedia expansion ──────────────────────────────────────────────────────
ATLAS  cuda_encyclopedia_structure.md      ✅ BUILT — /atlas covers all 7 domains / every
                                               bullet: 24 entries, 7 new interactive exhibits
                                               (banks, occupancy, tiling, atomics, streams,
                                               graphs, nvcc pipeline), 51 tests green
```

**Build status (one-shot to M2):** `tsc` clean · `vitest` 9/9 · static export green
(4 routes, first-load JS ≤ 100 KB) · scene smoke-tested via DOM shim (selection,
code-linking, seek intents, multi-stage render).

**M2 is the spec’s non-negotiable gate**: if the launch exhibit isn’t mesmerizing,
we loop on M1/M2 craft before building anything else.

---

## 6. Quality bars (enforced every phase)

| Area | Bar |
| --- | --- |
| Performance | 60 fps default scenes; initial JS ≤ 200 KB gz (excl. Monaco chunks); no layout thrash |
| Accessibility | Keyboard-complete, visible focus, reduced-motion honored, no color-only meaning, state labels accompany animations |
| Architecture | sim/render/content separation holds; lessons declarative YAML |
| Visual ratio | 60–75% canvas / 15–25% explanation / 10–15% controls on every scene |
| Motion | Every animation communicates state; identity preserved; replay always available |

## 7. Explicitly out of scope (until after MVP)

Docs-style API reference, giant sidebars, accounts/analytics infra, badges/streaks,
hardware-exact timing models, remote CUDA execution, social features (spec §27).

## 8. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Canvas work drifts into “neon AI slop” | M0 design language locked via preview; PRs diff against tokens only |
| Monaco weight hurting load | Dynamic import, editor lazy-mounted per scene |
| Zoom transitions breaking spatial continuity | One shared `SceneObject` identity system from Phase 2; no per-scene bespoke hierarchies |
| Scope creep toward full encyclopedia | Phases gated by demo reviews; §27 list cited in review checklist |
| GitHub Pages asset paths | Static export with `basePath` configured day one |

## 9. Traceability (spec → plan)

- §36 phases → this doc §4 (same numbering, expanded)
- §38 first task → M2 gate above
- §39 definition of done → M2 exit checklist in PR template (to add in Phase 3)
- §33 settings panel → Phase 1 settings popover
- §22 declarative content → Phase 5 YAML schema
- §31 scale abstraction → Phase 5 thread slider aggregation rule

---

## 10. Chief Design Officer gate (review v1 → iteration v2)

**Verdict on M0 preview v1: 4.6/5 — CONDITIONAL PASS.**
“An exceptionally polished interactive technical explainer. We need it to become an
unforgettable visual experience.” The full review lives in
`Feedback from Chief Design officer.md`; its 14 pass conditions are now binding
acceptance criteria, folded into every phase demo.

### The 14 conditions → how each is met / will be enforced

| # | Condition | Status | Enforcement |
| --- | --- | --- | --- |
| 1 | Opening must be cinematic: darkness → work → GPU → launch → blocks → warps → memory → interface reveals | ✅ preview v2 | `#boot` overlay plays an 8s auto-sequence (work counter to 1,048,576 → die materializes → launch pulse → grid flight → lockstep ignition → store sweep) before chrome reveals; skippable by any key/click; reduced-motion enters assembled machine instantly |
| 2 | Visualization is the primary interface (≥80% discovery from the world) | ✅ started | Inspector-on-click for SM/block/memory/CPU in Exhibit 01 with deep links into other exhibits; spatial nav is the default path — menus only as fallback |
| 3 | Kill anything that looks like a dashboard; chrome disappears inside exhibits | ✅ preview v2 | **Explorer mode** (`⤢` per exhibit): header/hero/footer vanish, exhibit fills viewport, instrument pill exits; Esc supported |
| 4 | Strict focus hierarchy: one concept gets the spotlight per moment | ✅ preview v2 | Stage-driven spotlight dims CPU/core/staging/memory around the active stage (exec ⇒ threads bright, store ⇒ memory bright); pass test “what should I look at?” answerable in 1s |
| 5 | Every animation encodes causality — no decorative motion | ✅ preview v2 | Decorative hero beams deleted; replaced by causal live miniature launch loop. Rule recorded: any animation must answer “what does this teach?” |
| 6 | Learner controls time: run/pause/step/rewind/inspect reality | ✅ preview v2 | RUN/PAUSE/BACK(step-back)/STEP/RESET/speed + drag scrub + clickable stage segments + keyboard (Space/R/arrows). TIME = interactive dimension |
| 7 | Code ⇄ machine inseparable, both directions everywhere | ✅ extended | Exhibit 01 two-way sync retained; Exhibit 02 adds equation-term ↔ source-line ↔ diagram triangle (click blockIdx/threadIdx/blockDim terms) |
| 8 | “Peel the abstraction” becomes signature brand interaction | ✅ strengthened | Descent transitions directional (layers sink away, new layer rises), depth-darkening stage, wheel + swipe + arrows; copy frames it as levels of reality |
| 9 | World architecture, not content architecture | 📐 adopted | Vocabulary shift (world/regions/objects/layers/states/events) applied to kickers (“regions/exhibits”), nav labels, and Phase 5 content schema planning |
| 10 | Typography brutally restrained | ✅ held | One statement → ≤3 sentences → interaction. Enforced in review checklist |
| 11 | Wow must never be textually announced | ✅ fixed | All “WOW MOMENT/SIGNATURE SCENE” strings removed from user-facing surfaces; internal docs only |
| 12 | Mobile is not desktop squished; touch is part of the model | ◐ partial | Touch targets added (32 hit-circles), swipe/wheel descent, timeline touch-drag; full touch story (tap-thread→follow→zoom) lands with Phase 2 zoom system |
| 13 | Accessibility without destroying the magic | ✅ advanced | Reduced-motion = intentional composed state (machine pre-assembled), not animation-off; state chips + labels accompany every animation; no color-only encoding; keyboard-complete incl. explorer Esc |
| 14 | First MVP feels complete, not broad | 🔒 locked | Scope freeze re-affirmed: nothing added until “How does a CUDA kernel run?” is exceptional |

### Updated gate wording (applies from M2 onward)

> A person unfamiliar with CUDA opens the page, watches the first 60 seconds, and says
> **“Whoa — what am I looking at?”** Only then: *“Oh… it’s teaching me CUDA.”*
>
> Approved when: first minute cinematic · visualization dominates UI · code⇄machine visible ·
> motion communicates causality · time is controllable · concepts explored spatially ·
> abstraction peelable · focus unmistakable · text subordinate · feels like entering a machine.


── Inference world expansion ───────────────────────────────────────────────────
INF    inference engineering encyclopedia      ✅ BUILT — /inference: 8-scene journey
                                                   (decode loop, prefill/decode, metrics timeline,
                                                   KV growth, paged KV, continuous batching,
                                                   sampling playground, speculative decoding) +
                                                   7-domain atlas (17 entries). Mobile-first CSS.
                                                   15 new tests; 66 total green.
