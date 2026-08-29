export interface TrainJourneyEntry {
  id: string;
  num: string;
  kicker: string;
  title: string;
  blurb: string;
}

export const TRAIN_JOURNEY: TrainJourneyEntry[] = [
  { id: "token-diet", num: "01", kicker: "FOUNDATIONS", title: "A model is grown, not built",
    blurb: "Weights start random. Every step shows the model one batch and nudges it — billions of times." },
  { id: "one-step", num: "02", kicker: "THE LOOP", title: "Forward, backward, update",
    blurb: "One training step in three beats: predict, attribute blame, move the weights." },
  { id: "loss-curve", num: "03", kicker: "SIGNAL", title: "The loss is the only judge",
    blurb: "Millions of steps distill into one falling number — and everything that can go wrong shows up in it." },
  { id: "memory-budget", num: "04", kicker: "MEMORY", title: "The state you pay to keep",
    blurb: "Weights are the cheap part. Gradients and Adam moments quadruple the bill before a single token flows." },
  { id: "data-parallel", num: "05", kicker: "PARALLELISM I", title: "Copy everything, average the blame",
    blurb: "Data parallelism clones the model per GPU and all-reduces gradients every step." },
  { id: "ring-allreduce", num: "06", kicker: "COLLECTIVES", title: "The ring that averages the world",
    blurb: "N GPUs trade gradient chunks around a ring — each sends and receives exactly twice." },
  { id: "tensor-parallel", num: "07", kicker: "PARALLELISM II", title: "Slice the matrix itself",
    blurb: "Tensor parallelism splits every matmul across GPUs and syncs twice per layer." },
  { id: "pipeline-parallel", num: "08", kicker: "PARALLELISM III", title: "An assembly line of layers",
    blurb: "Pipeline parallelism streams micro-batches through stage slices — and pays a bubble tax." },
  { id: "checkpointing", num: "09", kicker: "MEMORY II", title: "Forget on purpose, recompute later",
    blurb: "Activation checkpointing trades a third of compute for gigabytes of activation memory." },
  { id: "moe-routing", num: "10", kicker: "PARALLELISM IV", title: "A committee of experts",
    blurb: "Mixture-of-Experts routes each token to a few specialists — capacity without paying dense compute." },
  { id: "scaling-laws", num: "11", kicker: "BUDGETING", title: "Spend tokens like money",
    blurb: "Chinchilla says the compute-optimal ratio is ~20 tokens per parameter. Plan the run before burning it." },
];

export function trainIndex(id: string): number {
  return TRAIN_JOURNEY.findIndex((j) => j.id === id);
}
export function trainNeighbors(id: string) {
  const i = trainIndex(id);
  return {
    prev: i > 0 ? TRAIN_JOURNEY[i - 1] : null,
    next: i >= 0 && i < TRAIN_JOURNEY.length - 1 ? TRAIN_JOURNEY[i + 1] : null,
  };
}
