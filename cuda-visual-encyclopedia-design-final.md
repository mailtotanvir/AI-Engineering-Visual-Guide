# CUDA Visual Encyclopedia — MVP1 Design & Product Specification

## Product thesis

Build an interactive CUDA encyclopedia that feels like **entering the GPU**, not opening a programming textbook.

The learner should think:

> “Whoa. I can actually see what the GPU is doing.”

before they think:

> “I am taking a CUDA course.”

The experience is deliberately closer to a **scientific visualization, interactive museum, premium product demo, and game-like exploration** than conventional documentation.

---

# 1. Product identity

## Working name

**CUDA Visual Encyclopedia**

## Core promise

> **CUDA, but you can see it run.**

## Design north star

> **Don't explain what can be demonstrated.  
> Don't demonstrate what can be manipulated.  
> Don't ask learners to memorize what they can discover.**


## Non-negotiable product gate

Before building navigation, documentation pages, a dashboard, a lesson catalogue, authentication, analytics, or a broad CUDA curriculum, build the opening interactive scene.

> **Do not begin by building navigation, documentation pages, or a generic dashboard. Build the opening CUDA scene first. If the opening 60 seconds do not make someone stop and say “holy shit, that's beautiful,” the implementation is not ready to expand.**

This is not marketing language. It is an MVP acceptance criterion. The first minute must establish the product's visual language, motion language, spatial model, and emotional promise. A technically correct but visually ordinary implementation is considered a failure even if the underlying CUDA explanations are accurate.

### First-minute test

A new visitor should be able to land on the experience with no account, no tutorial popup, and almost no reading. Within roughly 60 seconds they should discover a GPU, watch work enter it, see the hierarchy unfold from kernel to grid to block to warp to thread, and understand that the visualization is alive and manipulable.

The desired reaction is: 

**“I want to explore this.”**

not merely:

**“I understand the definition.”**

## Publishing context

The project is intended to be published as a standalone GitHub Pages experience under:

**https://mailtotanvir.github.io/**

It should have its own visual identity and feel like a self-contained product, even if it lives alongside other projects under the same GitHub Pages presence. Do not let the implementation inherit the visual language of a generic project documentation site.

The repository should be treated as a product artifact, with the design specification preserved in `docs/design.md`, a concise project-oriented `README.md`, and the deployed site optimized as the primary experience.

## Emotional target

The primary emotional sequence should be:

```text
Curiosity
   ↓
Wonder
   ↓
Exploration
   ↓
Recognition
   ↓
Understanding
   ↓
Mastery
```

The product must avoid feeling like:

```text
chapter → paragraph → paragraph → code → quiz
```

Instead it should feel like:

```text
see → touch → run → observe → ask why → peel back → understand → experiment
```

---

# 2. MVP scope

Do **not** attempt to build an entire CUDA encyclopedia in MVP1.

Build one exceptional vertical slice:

## “How does a CUDA kernel run?”

Target experience: approximately 20–30 minutes for a first-time learner.

The learner follows one computation from a CPU launch all the way into GPU execution.

### MVP1 concept journey

1. Why a GPU?
2. The GPU
3. Your first kernel
4. Threads
5. Blocks
6. Grids
7. Thread indexing
8. Warps
9. Memory
10. Performance intuition
11. Debugging a broken kernel
12. Final challenge

The entire journey is one continuous visual story rather than twelve disconnected pages.

---

# 3. Product metaphor

The site should feel like a **GPU museum / observatory / interactive atlas**.

Imagine:

- Apple product visualization
- Google Cloud Skills learning flow
- Figma-style interactive canvas
- NVIDIA-style technical visualization
- museum exhibit pacing
- game-like discovery

But do not imitate the visual branding of any of those products.

The resulting product should have its own identity.

---

# 4. UX principle: the canvas is the lesson

The page should not be predominantly text.

Target visual ratio:

- **60–75% visual / interactive area**
- **15–25% concise explanation**
- **10–15% controls / navigation**

Text exists to explain what the learner just experienced.

It should rarely be the first thing the learner sees.

## Default lesson composition

```text
┌────────────────────────────────────────────────────┐
│ CUDA / EXECUTION                                   │
│                                                    │
│          THE MAIN VISUAL CANVAS                   │
│                                                    │
│      [GPU / threads / blocks / memory]             │
│                                                    │
│                 ▶ RUN      ⟳ RESET                │
│                                                    │
├────────────────────────────────────────────────────┤
│ What happened?                                     │
│ One or two concise sentences.                      │
│                                                    │
│ [SHOW ME] [TRY IT] [WHY?] [GO DEEPER]             │
└────────────────────────────────────────────────────┘
```

The learner should be able to understand the main idea even when the explanatory text is collapsed.

---

# 5. Visual language

## Overall mood

The experience should feel:

- premium
- technical
- calm
- spatial
- precise
- cinematic
- slightly futuristic
- restrained rather than flashy

Avoid:

- generic “AI neon” aesthetics
- excessive gradients
- random glowing particles
- decorative 3D objects with no semantic meaning
- dashboard clutter
- walls of cards
- noisy gamer UI

## Visual hierarchy

Use depth intentionally:

```text
Background layer
   ↓
System / hardware layer
   ↓
Primary active object
   ↓
Execution animation
   ↓
Interaction controls
   ↓
Explanation
```

The learner should always know what is active.

---

# 6. Signature visual idea: peel the GPU

This is one of the core product interactions.

Start with a simple abstraction:

```text
CUDA PROGRAM
```

User chooses:

**PEEL BACK THE ABSTRACTION**

Then successive layers reveal:

```text
CUDA program
      ↓
Kernel
      ↓
Grid
      ↓
Block
      ↓
Warp
      ↓
Thread
      ↓
SM
      ↓
Execution resources
      ↓
Memory system
```

The animation should preserve spatial relationships while zooming in.

The user should feel like they are physically entering the machine.

This interaction is a signature feature, not an optional animation.

---

# 7. Signature visual idea: execution timeline

Provide a persistent timeline for major simulations.

```text
CPU ───── Kernel Launch ───── Schedule ───── Execute ───── Store
                         ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○
```

A scrubber lets the learner move backward and forward through execution.

At each timeline point, the system highlights the active objects.

Examples:

```text
0%    CPU prepares work
15%   kernel launch
30%   grid created
45%   blocks scheduled
60%   warps execute
75%   memory operations
90%   result produced
100%  completion
```

Do not imply that these are real timing percentages. They are conceptual animation stages.

---

# 8. Signature visual idea: spatial zoom

The hierarchy must remain visually consistent.

A thread should look like the same thread whether seen:

- in the grid overview
- inside a block
- inside a warp
- during execution

The learner should be able to zoom:

```text
GPU
 ↓ zoom
SM
 ↓ zoom
Block
 ↓ zoom
Warp
 ↓ zoom
Threads
 ↓ zoom
One thread
```

Spatial continuity is critical for forming a mental model.

---

# 9. Core interaction vocabulary

Keep the interaction vocabulary small and consistent.

Primary actions:

- **RUN**
- **RESET**
- **SHOW ME**
- **TRY IT**
- **WHY?**
- **INSPECT**
- **COMPARE**
- **PEEL BACK**
- **GO DEEPER**

Do not invent a new interaction pattern for every lesson.

Consistency makes the experience feel like a world rather than a collection of demos.

---

# 10. Information architecture

The home page should not be a chapter index.

It should be a **CUDA map**.

```text
                         CUDA
                          │
             ┌────────────┴────────────┐
             │                         │
        PROGRAMMING                 HARDWARE
             │                         │
       ┌─────┼──────┐          ┌───────┼──────┐
       │     │      │          │       │      │
    Kernel Thread Memory      SM      Warp   Cache
       │     │      │
       └─────┼──────┘
             │
         EXECUTION
             │
       ┌─────┼──────┐
      Sync  Async  Streams
             │
         PERFORMANCE
             │
      ┌──────┼────────┐
 Occupancy  Memory   Divergence
```

The map should visually communicate prerequisites and relationships.

The user explores the map rather than navigating a table of contents.

---

# 11. Concept model

Every concept in the encyclopedia should be a reusable content object.

A concept has:

```yaml
id:
title:
short_definition:
intuition:
visualization:
interaction:
simulation:
why_it_matters:
common_misconception:
code_example:
challenge:
related_concepts:
hardware_layer:
programmer_layer:
performance_layer:
```

This should allow the content system to scale beyond CUDA later.

---

# 12. Progressive disclosure model

Each concept has four layers.

## Layer 1 — Intuition

One sentence and a visual.

Example:

> A thread is one execution instance of your kernel.

## Layer 2 — Programmer

Introduce the relevant CUDA abstraction/API.

Example:

```cpp
threadIdx.x
```

## Layer 3 — Hardware

Show what happens below the programming abstraction.

Example:

```text
thread
  ↓
warp
  ↓
SM
```

## Layer 4 — Performance

Explain why the concept matters for real workloads.

This prevents beginners from being overwhelmed while still allowing deep exploration.

---

# 13. MVP1 lesson designs

## Scene 01 — The problem

Narrative:

> You need to add one million numbers.

Show:

```text
A[0] + B[0]
A[1] + B[1]
A[2] + B[2]
...
A[999999] + B[999999]
```

Animate a serial CPU path.

Then reveal parallel GPU execution.

Desired response:

> “Oh. The GPU can attack many of these simultaneously.”

No lengthy GPU-vs-CPU lecture.

---

## Scene 02 — Meet the GPU

Show an elegant abstract GPU with multiple SMs.

The user hovers or clicks an SM.

The selected SM expands.

The user can move from:

```text
GPU → SM → warp → thread
```

Each transition should animate rather than change pages abruptly.

---

## Scene 03 — Your first kernel

Show a tiny kernel.

```cpp
__global__
void add(float* a, float* b, float* c) {
    // ...
}
```

The learner presses RUN.

The code editor highlights the active function while the GPU canvas animates execution.

Critical requirement:

**Code and visualization must stay synchronized.**

---

## Scene 04 — Threads

Start with one thread.

Then morph:

```text
1 → 8 → 32 → 128 → 1024
```

The learner changes thread count with a slider.

The visual workload changes immediately.

The explanation updates from the current state.

---

## Scene 05 — Blocks

Introduce:

```text
threadsPerBlock
```

The learner controls the block size.

The visualization shows groups of threads being created.

Then show that blocks become scheduling units.

---

## Scene 06 — Grid

Let the learner vary:

```text
blocks
threadsPerBlock
```

Display:

```text
TOTAL THREADS
blocks × threadsPerBlock
```

The output should update live.

---

## Scene 07 — Thread indexing

This is a core MVP interaction.

Display an array of elements.

Allow the learner to select a block and thread.

Visually trace:

```text
blockIdx.x
      ×
blockDim.x
      +
threadIdx.x
      =
array index
```

The selected array cell lights up.

Moving any selector changes the result.

The equation should never be shown without the animation that proves it.

---

## Scene 08 — Warp

Collapse 32 threads into a warp.

Show them executing together.

Then create a branch:

```cpp
if (threadIdx.x % 2 == 0) {
    ...
} else {
    ...
}
```

Animate the two paths sequentially to create a visual intuition for divergence.

Avoid presenting exact performance claims in the first explanation.

The objective is conceptual understanding.

---

## Scene 09 — Memory

Introduce memory as a spatial hierarchy.

```text
Thread
  ↓
Registers
  ↓
Shared Memory
  ↓
Global Memory
```

Represent relative proximity and conceptual trade-offs rather than misleading fixed timing numbers.

Show a memory access animation.

Then introduce the idea of coalesced versus scattered access.

---

## Scene 10 — Performance intuition

Present two visual executions.

The learner predicts which should be faster.

Only after the prediction, reveal why.

Potential concepts:

- memory access pattern
- divergence
- occupancy intuition
- register pressure

Keep the first exposure qualitative.

---

## Scene 11 — Debug it

Present a broken kernel.

The learner runs it.

The visualization demonstrates the failure.

Examples:

- wrong index
- out-of-bounds access
- synchronization mistake

The learner identifies the cause using the visualization.

This is important: the visualization should be useful for debugging, not just teaching.

---

## Scene 12 — Final challenge

Remove guidance.

Give the learner a task:

> Write a vector-add kernel that correctly maps work across the available threads.

Provide:

- problem statement
- editor
- Run
- Reset
- execution visualization
- test result

The learner should finish the experience having actually constructed the mental model rather than merely reading it.

---

# 14. Interaction design for code

Use a compact Monaco-style editor.

Do not let the code editor dominate the screen.

Recommended composition:

```text
┌─────────────────────┬───────────────────────────────┐
│ CODE                │ GPU CANVAS                   │
│                     │                               │
│  kernel(...) {      │     BLOCK  BLOCK  BLOCK       │
│    int i = ...      │      ●●●    ●●●    ●●●        │
│  }                  │                               │
│                     │                               │
│ [RUN] [RESET]       │ timeline ━━━━━━━●━━━━━━      │
└─────────────────────┴───────────────────────────────┘
```

When code executes, relevant lines highlight.

When a visual object is selected, relevant code highlights.

This should work in both directions:

```text
CODE → VISUAL
VISUAL → CODE
```

---

# 15. Animation principles

Animation must communicate state, not decorate it.

## Rule 1: every animation has a cause

Example:

```text
change block size
      ↓
number of threads changes
      ↓
number of blocks changes
```

## Rule 2: preserve object identity

The same block should remain the same block while moving.

## Rule 3: use motion to express relationships

Bad:

> glowing circles everywhere

Good:

> thread moves from block to memory location

## Rule 4: prefer transformation over page transition

A thread becoming a warp is stronger than switching to a warp page.

## Rule 5: allow replay

Every significant visualization should have:

- Run
- Pause
- Step
- Reset
- Scrub

---

# 16. Motion style

Animation should feel physically plausible but educational rather than scientifically exact.

Use:

- smooth interpolation
- restrained easing
- short transitions for UI
- slower transitions for conceptual reveals
- zoom-based hierarchy changes
- subtle parallax only where it improves spatial understanding

Avoid:

- bouncing UI
- excessive spring physics
- constant pulsing
- perpetual particle systems
- animation that slows experienced users

Provide a **reduce motion** accessibility mode.

---

# 17. Typography and text density

Large conceptual headlines.

Examples:

> **A GPU doesn't execute your program. It executes a grid of work.**

> **One thread is tiny. A million threads become a workload.**

Use short paragraphs.

Prefer:

```text
headline
1–3 sentence explanation
visual
interaction
optional deeper explanation
```

Avoid:

```text
700-word explanation
large code listing
then diagram
```

The content is not a book broken into screens.

The content is a sequence of **interactive exhibits**.

---

# 18. Accessibility

The visual-first approach must still be accessible.

Requirements:

- keyboard navigation
- visible focus state
- reduced-motion mode
- semantic labels for controls
- text descriptions of important diagrams
- high-contrast mode support
- no information encoded by color alone
- all critical actions available without mouse
- animation can always be paused

Animations should have accompanying state labels so users can understand the conceptual result without relying solely on motion.

---

# 19. Technical architecture

Recommended MVP stack:

```text
Next.js
TypeScript
React
MDX
SVG / Canvas
Framer Motion or Motion
Monaco Editor
Web Workers
```

Optional later:

```text
WebAssembly
GPU-backed sandbox
remote CUDA execution
telemetry
user accounts
progress persistence
```

Do not require a backend for the core visual encyclopedia MVP unless needed for execution or analytics.

The initial visual simulations should run locally in the browser.

---

# 20. Visualization architecture

Build a reusable visualization engine rather than one-off animations.

Core objects:

```text
GPU
GPC
SM
Block
Warp
Thread
Register
SharedMemory
GlobalMemory
Kernel
Grid
Array
MemoryAccess
TimelineEvent
```

Each object should expose:

```ts
id
type
position
state
children
metadata
highlighted
selected
```

The renderer should be able to animate transitions between states.

---

# 21. Simulation model

Use a lightweight conceptual execution engine.

Example:

```ts
interface KernelLaunch {
  grid: { x: number; y: number; z: number };
  block: { x: number; y: number; z: number };
}
```

The simulator generates events such as:

```text
KERNEL_LAUNCH
GRID_CREATED
BLOCK_CREATED
BLOCK_SCHEDULED
WARP_FORMED
THREAD_EXECUTE
MEMORY_LOAD
MEMORY_STORE
BARRIER
KERNEL_COMPLETE
```

The visual engine consumes these events.

This separates:

```text
simulation logic
        ↓
visualization
        ↓
UI controls
```

Do not embed simulation logic directly into presentation components.

---

# 22. Content architecture

Each lesson should be declarative.

Example:

```yaml
id: cuda-thread-indexing
title: Where does this thread work?

concept:
  intuition: "Every thread needs to know which piece of data it owns."

visual:
  type: thread-indexer

controls:
  - blockIdx.x
  - blockDim.x
  - threadIdx.x

simulation:
  events:
    - create_grid
    - create_blocks
    - create_threads
    - resolve_index

code:
  language: cpp
  source: examples/vector_add.cu

challenge:
  type: prediction

related:
  - cuda-thread
  - cuda-block
  - cuda-grid
```

This is critical to making the encyclopedia scalable.

---

# 23. Navigation model

Use three navigation layers.

## Global

```text
CUDA
Explore
Concepts
Challenges
Search
```

## Local

A small persistent breadcrumb:

```text
CUDA / Execution / Blocks
```

## Spatial

The visualization itself becomes navigation.

Clicking an SM opens the SM concept.

Clicking a warp opens the warp concept.

Clicking memory opens the memory concept.

The machine becomes the navigation system.

---

# 24. Search

Search should return concepts visually.

Example query:

> warp divergence

Result card:

```text
┌────────────────────────────┐
│ WARP DIVERGENCE            │
│                            │
│ 32 threads                  │
│ ████████████               │
│ ████  ████████             │
│                            │
│ [EXPLORE]                  │
└────────────────────────────┘
```

Search results should use the same visual language as the content itself.

---

# 25. Home / landing page

The landing page should immediately communicate that this is not ordinary documentation.

Suggested opening:

```text
CUDA

See the GPU think.

[ENTER THE GPU]
```

Then a live miniature visualization.

A kernel launches.

Blocks appear.

Warps form.

Memory moves.

The visitor watches for a moment before being asked to click.

Below that:

```text
Explore

GPU          Execution          Memory          Performance
```

The site should feel alive even when the learner is doing nothing.

Do not overdo this; background motion must remain subtle and respectful of reduced-motion preferences.

---

# 26. Visual “wow” moments

MVP must deliberately contain several moments where the learner thinks:

> “That is beautiful.”

Required candidates:

### Wow 1 — GPU reveal

A high-level GPU diagram smoothly unfolds into multiple SMs.

### Wow 2 — Million-thread expansion

One computation rapidly expands into thousands of visible work items while the system maintains an intelligible hierarchy.

### Wow 3 — Thread indexing

Selecting one thread causes a visible path to travel from:

```text
thread → index → memory location
```

### Wow 4 — Warp split

A uniform warp divides into divergent paths, then reconverges.

### Wow 5 — Peel the abstraction

The learner zooms through the programming model into the machine.

### Wow 6 — Final kernel

The learner's own code drives the visualization.

The final moment should feel earned.

---

# 27. What not to build

Do not let MVP drift into:

- generic CUDA documentation
- API reference pages
- giant sidebars
- long video lectures
- points/badges/gamification overload
- leaderboard systems
- overly realistic GPU hardware simulations
- full compiler implementation
- exact hardware timing model
- full remote CUDA execution infrastructure
- social features

The objective is not completeness.

The objective is **an unforgettable mental model**.

---

# 28. Product success criteria

MVP is successful when a first-time learner can finish the experience and explain, without reading notes:

1. What a CUDA kernel is.
2. What a thread is.
3. What a block is.
4. What a grid is.
5. How a thread maps to data.
6. What a warp represents.
7. Why memory access matters.
8. Why execution can diverge.

More importantly, the learner should be able to **visualize these relationships mentally**.

---

# 29. UX success criteria

A five-minute unmoderated test should produce comments resembling:

> “I finally understand what blocks and threads actually are.”

> “I could see the code changing the GPU.”

> “The animation made the indexing formula obvious.”

> “This doesn't feel like studying.”

> “I want to keep exploring.”

The ideal reaction is:

> **“This is beautiful and mesmerizing.”**

Not merely:

> “This is a useful CUDA course.”

---

# 30. Engineering quality bar

The coding agent must treat visual quality as a product requirement, not polish for later.

Every implementation should satisfy:

### Interaction

- interactions feel immediate
- no unnecessary navigation reloads
- controls have clear state
- animations can be replayed

### Visual

- consistent spacing system
- consistent object identity
- restrained motion
- strong hierarchy
- no visual clutter
- responsive layout

### Architecture

- simulation independent from rendering
- content independent from UI components
- visualizations reusable
- lesson definitions declarative
- accessibility built in

### Performance

- animation stays smooth on a normal laptop
- no unnecessary canvas redraws
- simulation can run in a Web Worker if needed
- large thread counts use abstraction rather than rendering one million DOM nodes

---

# 31. Important implementation principle: visually simulate scale

Do **not** attempt to render a literal million DOM elements.

Represent large workloads through abstraction.

For example:

```text
1,000,000 logical threads
        ↓
visual representation
        ↓
256–1,024 representative objects
        ↓
aggregate state
```

The learner needs to understand the scale and relationships, not watch one million DOM objects consume the browser.

The same principle applies to blocks, warps and memory accesses.

---

# 32. Responsive behavior

Desktop is the primary target.

Tablet should remain usable.

Mobile can provide an exploration/read mode, but MVP should not compromise the desktop interactive canvas to force complete mobile parity.

Desktop target:

```text
1440 × 900
```

Design gracefully down to:

```text
1024 × 768
```

At smaller sizes, collapse secondary panels rather than shrinking the main visualization into unusability.

---

# 33. Accessibility and performance toggle

Provide a small settings panel:

```text
Motion
○ Full
○ Reduced

Visual density
○ Detailed
○ Simplified

Sound
○ On
○ Off
```

Sound is optional and should be extremely subtle.

No sound should be necessary to understand the lesson.

---

# 34. Analytics for learning, not addiction

Measure:

- concepts opened
- time in visualization
- interactions completed
- simulations replayed
- challenges attempted
- challenge success
- where users abandon
- which concepts get revisited

Do not optimize around:

- session length
- clicks
- badges
- daily active user streaks

The objective is learning quality.

---

# 35. Suggested repository structure

```text
cuda-visual-encyclopedia/
├── app/
│   ├── page.tsx
│   ├── explore/
│   └── concepts/
│
├── components/
│   ├── shell/
│   ├── editor/
│   ├── controls/
│   ├── timeline/
│   └── visualization/
│       ├── GPUView.tsx
│       ├── SMView.tsx
│       ├── BlockView.tsx
│       ├── WarpView.tsx
│       ├── ThreadView.tsx
│       ├── MemoryView.tsx
│       └── ExecutionTimeline.tsx
│
├── engine/
│   ├── simulation/
│   ├── events/
│   ├── models/
│   └── state/
│
├── content/
│   ├── cuda/
│   │   ├── gpu/
│   │   ├── threads/
│   │   ├── blocks/
│   │   ├── grids/
│   │   ├── warps/
│   │   └── memory/
│
├── examples/
│   └── vector-add/
│
├── styles/
└── tests/
```

---

# 36. Implementation phases

## Phase 1 — Visual shell

Build:

- typography
- spacing system
- dark/light surface strategy
- main canvas
- navigation
- animation primitives
- accessibility controls

Deliverable:

A beautiful empty “CUDA world” that already feels premium.

## Phase 2 — GPU exploration

Build:

- GPU
- SM
- block
- warp
- thread
- zoom transitions

Deliverable:

User can enter and peel through the GPU hierarchy.

## Phase 3 — Execution engine

Build:

- kernel launch model
- grid/block/thread model
- event timeline
- step/replay/reset

Deliverable:

A conceptual kernel can visibly execute.

## Phase 4 — Code synchronization

Build:

- Monaco
- code highlighting
- visual-to-code linking
- code-to-visual linking

Deliverable:

Changing code changes the visualization.

## Phase 5 — First three lessons

Build:

- GPU
- threads/blocks
- indexing

Deliverable:

First complete learning loop.

## Phase 6 — Warps/memory/performance

Build:

- warp simulation
- divergence visualization
- memory visualization
- coalescing intuition

## Phase 7 — challenge

Build:

- broken kernel
- debugging experience
- final challenge

## Phase 8 — polish

Only now add:

- micro-animations
- transitions
- sound experiment
- responsive polish
- delight moments

But visual quality must already be good throughout the project.

---

# 37. Coding-agent instructions

The agent implementing this product should follow these rules.

## Rule A — Build the experience, not the documentation

Do not start by writing Markdown pages.

Start by building the visual engine.

## Rule B — Every screen needs a dominant visual

If the main viewport is mostly text, the implementation is failing the product brief.

## Rule C — Every concept needs an interaction

A concept without an interaction is incomplete unless the concept genuinely requires no interaction.

## Rule D — Every animation must communicate a state change

No decorative motion merely for “coolness.”

## Rule E — Preserve spatial continuity

Objects should not jump arbitrarily between screens.

## Rule F — Code and visualization must be connected

The learner should be able to map syntax to behavior.

## Rule G — Prefer simple models that teach well

Do not build a hardware-accurate simulator in MVP1.

## Rule H — Never sacrifice visual hierarchy for technical completeness

It is better to teach one concept beautifully than six concepts poorly.

---

# 38. First coding-agent task

Do not ask the agent to implement the entire encyclopedia immediately.

Give the agent this first milestone:

> Build the CUDA Visual Encyclopedia shell and one exceptional interactive scene: “What happens when I launch a CUDA kernel?”
>
> The screen should contain a GPU visualization, a small CUDA kernel, Run/Reset controls, an execution timeline, and a zoomable hierarchy from GPU → SM → Block → Warp → Thread.
>
> Animate the kernel launch through this hierarchy.
>
> The experience must feel like a premium interactive scientific exhibit rather than a web tutorial.
>
> Do not add long text. Use one short explanation beneath the visualization.
>
> The implementation must separate simulation state, visualization state, and content.
>
> Before adding more lessons, make this single scene beautiful enough that a user immediately wants to click RUN and explore.

---

# 39. Definition of done for the first scene

The first scene is done only when all of these are true:

- The landing visual is immediately understandable.
- The GPU feels spatial rather than diagrammatic.
- Clicking Run produces a clear execution sequence.
- The user can pause/reset/replay.
- The user can zoom from GPU to thread.
- The active objects remain spatially coherent.
- The code highlights during execution.
- The timeline corresponds to visible state changes.
- The scene looks polished at 1440×900.
- Motion can be reduced.
- The screen is not dominated by prose.
- A first-time viewer can figure out where to click without instructions.

Most importantly:

> **The user should want to explore the next layer before being told to do so.**

---

# 40. Long-term product direction

Once the CUDA foundation works, the same platform can become a general **Visual Engineering Encyclopedia**.

Potential future worlds:

```text
CUDA
Inference Engineering
Transformers
Distributed Systems
Compilers
Operating Systems
Networking
Databases
Kubernetes
Vector Databases
LLM Serving
GPU Inference
Agent Runtimes
```

The reusable asset is not the CUDA content.

The reusable asset is the **interactive learning engine**.

The engine should eventually let a learner:

```text
Enter a system
      ↓
See its abstractions
      ↓
Interact with them
      ↓
Run them
      ↓
Peel them apart
      ↓
Observe consequences
      ↓
Build a working mental model
```

---

# 41. Final product principle

This project should never become:

> “a nicer way to read CUDA documentation.”

It should become:

> **a place where technical systems become visible.**

For CUDA, that means turning invisible computation into a world the learner can enter.

The learner should not merely memorize:

```text
threadIdx.x
blockIdx.x
blockDim.x
warp
SM
```

They should be able to **see the relationships** among them.

That is the product.

---

# 42. One-line creative brief

> **Build a mesmerizing interactive atlas of CUDA where code, hardware, execution, memory, and performance become the same visual story.**



# Final implementation rule

When trade-offs arise, prioritize in this order:

1. **Beauty and wonder** — the experience must feel exceptional.
2. **Clarity of the visual mental model** — users should be able to see relationships and causality.
3. **Interaction and discovery** — users should manipulate the system rather than passively read it.
4. **Technical fidelity** — simulations and explanations must remain faithful to CUDA's real execution model.
5. **Breadth** — additional topics and encyclopedia coverage come last.

A smaller experience that achieves the first four is preferable to a large experience that feels like documentation.
