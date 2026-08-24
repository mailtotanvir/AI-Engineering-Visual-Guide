<div align="center">

# AI Engineering Visual Encyclopedia

### See the machine think.

**A living, explorable model of the systems behind modern AI.**<br>
Follow work through a GPU. Follow a prompt through an inference engine. Pause time, peel away abstractions, and inspect the machinery underneath.

[**Enter the live encyclopedia →**](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/) · [Explore CUDA](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/cuda/) · [Follow a token](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/inference/)

[![Tests](https://img.shields.io/badge/tests-72%20passing-46E3C8?style=flat-square)](#quality-contract)
[![Worlds](https://img.shields.io/badge/worlds-2%20live%20%C2%B7%206%20forming-A48FFF?style=flat-square)](#the-universe)
[![Next.js](https://img.shields.io/badge/Next.js-14-5CC8FF?style=flat-square)](#run-it-locally)
[![Static export](https://img.shields.io/badge/deploy-GitHub%20Pages-FFC46B?style=flat-square)](#deployment)

</div>

---

Most AI engineering material asks you to understand a moving system through static prose.

A kernel launch becomes a paragraph. A warp becomes a diagram. Continuous batching becomes a definition. The facts may be correct, but the causal chain—the part that makes the idea click—disappears.

This project takes the opposite approach:

> If a concept changes through space or time, you should be able to watch it happen.

The AI Engineering Visual Encyclopedia is not a collection of illustrated articles. It is an instrumented universe of technical systems. Code and hardware move together. Requests acquire memory. Threads diverge and reconverge. Optimizations can be switched on and their consequences observed.

The goal is simple: make the invisible physical enough to reason about.

## Why people care

AI systems are increasingly defined by behavior that is difficult to see:

- Thousands of GPU threads execute one kernel while memory access determines whether the hardware flies or stalls.
- An inference server continuously trades latency, throughput, memory, and quality as requests arrive.
- A single abstraction—“generate a response”—hides scheduling, caching, batching, sampling, and repeated model execution.

Traditional documentation is excellent for precision and terrible at preserving motion. Videos preserve motion but surrender control. This encyclopedia combines both advantages: the explanation stays precise, while the learner controls the clock.

Run. Pause. Step. Rewind. Scrub. Inspect.

You do not merely read that two designs behave differently. You watch reality change when you switch between them.

## The universe

The product is organized as worlds, not chapters. Each world follows one physical journey through a discipline and shares a common interaction language.

```text
AI ENGINEERING
│
├── CUDA                    threads → blocks → SMs → memory
├── Inference               prompt → prefill → KV → decode
├── Training                data → batches → gradients → weights
├── Post-Training           traces → preferences → signal → behavior
├── Evaluation              input → model → judge → regression
├── AI Runtime              request → plan → tool → state
├── Infrastructure          traffic → scheduler → GPUs → storage
└── Safety                  prompt → policy → decision → monitor
```

| World | Status | The journey |
| --- | :---: | --- |
| **CUDA Engineering** | **Live** | Ten scenes from one million additions to a working kernel |
| **Inference Engineering** | **Live** | Eight scenes following one prompt through an LLM serving system |
| Training at Scale | Forming | Data, distributed compute, gradients, and weight updates |
| Post-Training & Distillation | Forming | Supervision, preferences, optimization, and behavior shaping |
| Evaluation | Forming | From model output to evidence, scores, and regression gates |
| AI Runtime | Forming | Agent loops, tool calls, observations, and state |
| Infrastructure | Forming | Scheduling, accelerators, networks, storage, cost, and reliability |
| Safety & Alignment | Forming | Policies, guardrails, monitoring, and failure surfaces |

Planned worlds are intentionally shown as distant signals. They establish the shape of the universe without pretending unfinished material is complete.

## Two worlds are alive today

### World 01 · CUDA Engineering

**How a kernel runs.**

Start with one million additions and descend through every layer of the machine:

```text
problem → GPU → kernel launch → threads → indexing
        → warps → memory → abstraction → debugging → challenge
```

Along the way you can:

- race serial CPU work against parallel GPU work;
- open an SM and inspect warp scheduling;
- edit a real `<<<blocks, threads>>>` launch configuration and watch the machine reschedule;
- trace a thread’s index from source code to its destination;
- split a warp across branches and see divergence cost;
- race coalesced and strided memory access;
- diagnose a broken kernel visually;
- write the final index mapping and let executable tests judge it.

[**Enter CUDA World →**](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/cuda/) · [Browse the CUDA Atlas](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/atlas/)

### World 02 · Inference Engineering

**Watch every token earn its place.**

An LLM never writes a sentence. It predicts one token, changes its state, and does it again. This world follows that loop through the machinery that makes serving possible:

```text
decode loop → prefill vs decode → TTFT / TPOT / goodput → KV cache
            → paged attention → continuous batching → sampling → speculation
```

The result makes an important truth tangible:

> LLM serving is a physics problem wearing a chat interface.

[**Enter Inference World →**](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/inference/) · [Browse the Inference Atlas](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/inference/atlas/)

## What makes this different

### The journey is the backbone

Each subject is told as one continuous physical story. A learner does not receive eight disconnected facts about KV cache; they follow one request until memory becomes the constraint.

### Time is an interaction primitive

Every important simulation is designed around the same controls:

| Instrument | What it gives the learner |
| --- | --- |
| **Run / Pause** | Watch the system, then freeze the exact moment that matters |
| **Step** | Advance one meaningful state transition at a time |
| **Rewind** | Revisit causality instead of replaying an entire explanation |
| **Scrub** | Treat execution time as navigable space |
| **Inspect** | Ask an object what it is, where it came from, and what it affects |

### Code and machine are one object

Selecting code highlights the hardware it controls. Selecting the machine reveals the responsible code. The implementation treats this synchronization as a core product capability, not an annotation layer.

### Motion must teach

Animation is admitted only when it communicates state, transformation, scale, causality, or execution. Reduced-motion support is built into the shared motion system, and color is never the only carrier of meaning.

### Reference remains connected to experience

The Atlas provides durable conceptual coverage, but interactive entries link back into the journey whenever a moving version exists. Reference and exploration reinforce one another instead of becoming separate products.

## Product architecture

The conceptual model is deliberately small:

```text
World
└── Journey
    └── Scene
        ├── Simulation state
        ├── Renderer
        ├── Camera / focus
        ├── Interaction
        └── Explanation

World
└── Atlas
    └── Concepts and interactive exhibits
```

The implementation protects that separation:

```text
app/                    routes for worlds, scenes, and atlases
components/
  home/                 observatory and homepage instruments
  journey/              shared scene shell and navigation
  exhibit/              timelines, code synchronization, transport controls
  inference/            inference scenes and atlas browser
  scenes/               CUDA journey scenes
  world/                shared world identity components
content/
  worlds.ts             declarative world registry and physical flows
  cuda/                  CUDA journey and atlas content
  inference/             inference journey and atlas content
lib/
  engine/                deterministic, scrub-safe simulation engine
  scene/                 imperative SVG rendering over simulation state
  scenes/                scene-specific state models
tests/                   simulation, journey, atlas, and registry contracts
```

The hot rendering path writes directly to SVG rather than forcing React to reconcile every frame. Simulation logic remains pure TypeScript. Given the same normalized time and configuration, it produces the same machine state—so scrubbing backward is correct by construction.

## Run it locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/mailtotanvir/AI-Engineering-Visual-Guide.git
cd AI-Engineering-Visual-Guide
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm test          # simulation and content contracts
npm run build     # production static export to ./out
npm run preview   # serve the exported site on port 4173
```

## Quality contract

The project currently ships with **72 automated tests** across six suites. They protect the parts that visual polish can easily obscure:

- deterministic and reversible simulation state;
- valid stage transitions and event ordering;
- journey continuity and route integrity;
- atlas coverage and interactive entry contracts;
- inference engine behavior;
- unique, complete world definitions with no dead planned-world links.

Before a change is considered complete:

```bash
npm test
npm run build
```

Both commands must pass. The production build statically generates every route.

## Design laws

Contributions should preserve the character of the encyclopedia:

1. **Show the phenomenon before explaining it.**
2. **Tell a journey, not a list of facts.**
3. **Make state and causality inspectable.**
4. **Use motion for information, never decoration alone.**
5. **Keep one visual concept dominant at a time.**
6. **Prefer reusable simulation primitives over scene-specific tricks.**
7. **Do not turn the product into a dashboard, course platform, or card-heavy documentation site.**
8. **Optimize for wonder per viewport, not content per page.**

For the complete visual and interaction specification, read [docs/design.md](./docs/design.md). The staged engineering plan lives in [docs/implementation-plan.md](./docs/implementation-plan.md).

## Adding a world

A world begins with a physical story, not a folder or a page title. Before implementation, define:

```yaml
world:
  identity: What should this discipline feel like?
  journey: What single object or event can the learner follow?
  flow: What are the four irreducible stages?
  scenes: Where does control meaningfully change hands?
  atlas: Which concepts deserve durable reference coverage?
  challenge: What can the learner manipulate or prove?
```

Then register its identity in [`content/worlds.ts`](./content/worlds.ts), build simulation state independently of rendering, and use the shared motion, navigation, and accessibility primitives.

The editorial bar is intentionally high: every new piece of knowledge should earn a visual representation before it earns a prose page.

## Deployment

The application is a static Next.js export and deploys to GitHub Pages through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

For a repository subpath:

```bash
NEXT_PUBLIC_BASE_PATH=/AI-Engineering-Visual-Guide npm run build
```

For a root domain or custom domain:

```bash
NEXT_PUBLIC_BASE_PATH= npm run build
```

The exported site is written to `out/` and requires no application server.

---

<div align="center">

**The machine was always moving. Now you can see it.**

[Launch the encyclopedia](https://mailtotanvir.github.io/AI-Engineering-Visual-Guide/)

</div>
