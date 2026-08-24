import { StageId } from "@/lib/engine/stages";

export interface TokenSpan { text: string; cls?: string }
export interface CodeLine { id: string; parts: TokenSpan[]; seek?: number }

const kw = (t: string): TokenSpan => ({ text: t, cls: "tokKw" });
const fn = (t: string): TokenSpan => ({ text: t, cls: "tokFn" });
const num = (t: string): TokenSpan => ({ text: t, cls: "tokNum" });
const v = (t: string): TokenSpan => ({ text: t, cls: "tokVar" });

export const LAUNCH_SCENE = {
  id: "the-launch",
  kicker: "EXHIBIT 01",
  title: "What happens when you launch a kernel?",
  fileLabel: "VECTOR_ADD.CU",
  code: [
    { id: "cl-1", parts: [v("float a[N], b[N], c[N];")] },
    { id: "cl-2", parts: [fn("cudaMemcpy"), { text: "(d_a, a, bytes, H2D);" }], seek: 0 },
    { id: "cl-3", parts: [{ text: "" }] },
    { id: "cl-4", parts: [kw("__global__")], seek: 0.18 },
    { id: "cl-5", parts: [kw("void"), { text: " " }, fn("add"), { text: "(" }, kw("float"), { text: "* a, " }, kw("float"), { text: "* b," }] },
    { id: "cl-6", parts: [{ text: "         " }, kw("float"), { text: "* c, " }, kw("int"), { text: " n) {" }] },
    { id: "cl-7", parts: [{ text: "  " }, kw("int"), { text: " i = blockIdx.x*blockDim.x" }], seek: 0.36 },
    { id: "cl-8", parts: [{ text: "        + threadIdx.x;" }] },
    { id: "cl-9", parts: [{ text: "  " }, kw("if"), { text: " (i < n) c[i] = a[i] + b[i];" }], seek: 0.56 },
    { id: "cl-10", parts: [{ text: "}" }] },
    { id: "cl-11", parts: [{ text: "" }] },
    { id: "cl-12", parts: [v("add"), { text: "<<<" }, num("4"), { text: ", " }, num("256"), { text: ">>>(d_a, d_b, d_c, N);" }], seek: 0.12 },
    { id: "cl-13", parts: [fn("cudaMemcpy"), { text: "(c, d_c, bytes, D2H);" }], seek: 0.76 },
  ] as CodeLine[],
  codeForStage: {
    cpu: "cl-2", launch: "cl-12", grid: "cl-4",
    sched: "cl-7", exec: "cl-9", store: "cl-13", done: "",
  } as Partial<Record<StageId, string>>,
  legend: [
    { color: "rgba(159,182,187,.5)", label: "CPU / BUS" },
    { color: "rgba(164,143,255,.7)", label: "GRID · BLOCK" },
    { color: "var(--teal)", label: "THREAD" },
    { color: "var(--gold)", label: "SM" },
    { color: "var(--rose)", label: "MEMORY" },
  ],
};

export interface InspectInfo {
  kick: string;
  title: string;
  body: string;
  link?: string;
  linkLabel?: string;
}

export function inspectInfo(key: string, threadsPerBlock = 256): InspectInfo {
  const T = threadsPerBlock;
  if (key === "cpu") return {
    kick: "HOST", title: "CPU",
    body: "Prepares buffers, issues one launch call, then waits while the device works through the grid.",
  };
  if (key === "mem") return {
    kick: "DEVICE MEMORY", title: "GLOBAL MEMORY",
    body: "Wide but far from the cores — every store travels the slowest path. Coalesced access keeps it affordable.",
  };
  if (key.startsWith("sm:")) return {
    kick: "STREAMING MULTIPROCESSOR", title: `SM ${key.slice(3)}`,
    body: "Two warp schedulers dispatch instructions to execution lanes. Resident warps run in lockstep — every lane fires the same instruction each cycle.",
    link: "/descent/", linkLabel: "DESCEND TO THE WARP LAYER →",
  };
  const bi = Number(key.slice(4));
  return {
    kick: "BLOCK", title: `BLOCK ${bi}`,
    body: `One squad of ${T} threads launched together. It owns global elements ${bi * T} – ${(bi + 1) * T - 1}; eight of its threads are drawn here.`,
    link: "/descent/", linkLabel: "SEE THE FULL HIERARCHY →",
  };
}

export const TOKEN_SWATCHES: [string, string, string][] = [
  ["Surface 00", "#04070A", "var(--bg0)"],
  ["Surface 01", "#060C11", "var(--bg1)"],
  ["Surface 02", "#0A141B", "var(--bg2)"],
  ["Surface 03", "#10202B", "var(--bg3)"],
  ["Ink high", "#E9F4F1", "var(--ink)"],
  ["Ink mid", "#9FB6BB", "var(--ink2)"],
  ["Ink low", "#5E767C", "var(--ink3)"],
  ["Thread", "#46E3C8", "var(--teal)"],
  ["Warp", "#5CC8FF", "var(--cyan)"],
  ["Block", "#A48FFF", "var(--iris)"],
  ["SM", "#FFC46B", "var(--gold)"],
  ["Memory", "#FF7FA5", "var(--rose)"],
];
