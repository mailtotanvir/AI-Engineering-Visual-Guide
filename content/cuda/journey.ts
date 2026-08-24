export interface JourneyEntry {
  id: string;
  num: string;
  kicker: string;
  title: string;
  blurb: string;
  href: string;
}

export const JOURNEY: JourneyEntry[] = [
  {
    id: "the-problem",
    num: "01",
    kicker: "THE PROBLEM",
    title: "Why a GPU?",
    blurb: "One million additions. One core grinds through them — another attacks them all at once.",
    href: "/scenes/the-problem/",
  },
  {
    id: "meet-the-gpu",
    num: "02",
    kicker: "MEET THE GPU",
    title: "Inside the machine",
    blurb: "Six engines called SMs share one die. Click one open and look inside.",
    href: "/scenes/meet-the-gpu/",
  },
  {
    id: "first-kernel",
    num: "03",
    kicker: "YOUR FIRST KERNEL",
    title: "What happens when you launch?",
    blurb: "The full machine, live. Edit the launch config, scrub time in either direction.",
    href: "/launch/",
  },
  {
    id: "threads",
    num: "04",
    kicker: "THREADS",
    title: "A thread is one copy of your code",
    blurb: "Slide from one thread to a thousand and watch the workload change shape.",
    href: "/scenes/threads/",
  },
  {
    id: "thread-indexing",
    num: "05",
    kicker: "THREAD INDEXING",
    title: "Where does this thread work?",
    blurb: "Every thread computes its own global index — the equation and the proof, together.",
    href: "/scenes/thread-indexing/",
  },
  {
    id: "warps",
    num: "06",
    kicker: "WARPS & DIVERGENCE",
    title: "One warp, two paths",
    blurb: "A branch splits 32 lanes into two masks — executed one after another, then merged.",
    href: "/scenes/warps/",
  },
  {
    id: "memory",
    num: "07",
    kicker: "MEMORY GEOGRAPHY",
    title: "Memory is a place, not a bucket",
    blurb: "Predict the winner, then watch coalesced versus strided access fight it out.",
    href: "/scenes/memory/",
  },
  {
    id: "descent",
    num: "08",
    kicker: "THE DESCENT",
    title: "Peel back the abstraction",
    blurb: "Program → kernel → grid → block → warp → thread → SM → memory.",
    href: "/descent/",
  },
  {
    id: "debug",
    num: "09",
    kicker: "DEBUG IT",
    title: "Break it, see it",
    blurb: "A broken kernel writes to the wrong places — the visualization is your debugger.",
    href: "/scenes/debug/",
  },
  {
    id: "challenge",
    num: "10",
    kicker: "FINAL CHALLENGE",
    title: "Write the kernel",
    blurb: "Map every thread to its own element. Run. Tests decide.",
    href: "/scenes/challenge/",
  },
];

export function journeyIndex(id: string): number {
  return JOURNEY.findIndex((j) => j.id === id);
}

export function journeyNeighbors(id: string): { prev: JourneyEntry | null; next: JourneyEntry | null } {
  const i = journeyIndex(id);
  return {
    prev: i > 0 ? JOURNEY[i - 1] : null,
    next: i >= 0 && i < JOURNEY.length - 1 ? JOURNEY[i + 1] : null,
  };
}
