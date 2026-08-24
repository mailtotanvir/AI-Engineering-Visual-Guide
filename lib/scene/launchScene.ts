import { computeState, DEFAULT_LAUNCH } from "@/lib/engine/simulation";
import { LaunchConfig } from "@/lib/engine/types";
import {
  BUS_D, CPU_RECT, MEM_COUNT, SM_COUNT,
  ctrlPos, homePos, memCellX, targetPos, tileXY,
} from "@/lib/engine/machine";
import { bell, clamp, lerp, seg, Vec } from "@/lib/engine/easing";

const NSVG = "http://www.w3.org/2000/svg";

type TagMap = {
  path: SVGPathElement;
  circle: SVGCircleElement;
  rect: SVGRectElement;
  g: SVGGElement;
  text: SVGTextElement;
  title: SVGTitleElement;
};

function el<K extends keyof TagMap>(name: K, attrs: Record<string, string | number>, parent: Element): TagMap[K] {
  const e = document.createElementNS(NSVG, name);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent.appendChild(e);
  return e as TagMap[K];
}
function txt(e: SVGElement, s: string): SVGElement { e.textContent = s; return e; }

export interface Selection { key: string; code: string }

export interface LaunchSceneOpts {
  onSelect?: (sel: Selection | null) => void;
  onSeekRequest?: (t: number) => void;
}

interface BlockRefs {
  g: SVGGElement;
  rect: SVGRectElement;
  dots: { halo: SVGCircleElement; dot: SVGCircleElement }[];
  arrive: number;
}

export class LaunchScene {
  private svg: SVGSVGElement;
  private bus!: SVGPathElement;
  private pkt!: SVGCircleElement;
  private tail!: SVGCircleElement;
  private cpuG!: SVGGElement;
  private cpuBox!: SVGRectElement;
  private cpuPulse!: SVGRectElement;
  private gCore!: SVGGElement;
  private chassis!: SVGRectElement;
  private zoneG!: SVGGElement;
  private memG!: SVGGElement;
  private memFrame!: SVGRectElement;
  private tiles: { tile: SVGRectElement; g: SVGGElement }[] = [];
  private memCells: SVGRectElement[] = [];
  private blocks: BlockRefs[] = [];
  private ctrl: Vec[] = [];
  private selKey: string | null = null;
  private selNode: Element | null = null;
  private cfg: LaunchConfig = DEFAULT_LAUNCH;

  setConfig(cfg: LaunchConfig) {
    this.cfg = cfg;
  }
  private onClick = (e: Event) => this.handleClick(e);
  private destroyed = false;

  constructor(svg: SVGSVGElement, private opts: LaunchSceneOpts = {}) {
    this.svg = svg;
    this.build();
    svg.addEventListener("click", this.onClick);
  }

  destroy() {
    this.destroyed = true;
    this.svg.removeEventListener("click", this.onClick);
    this.svg.replaceChildren();
  }

  private build() {
    const svg = this.svg;
    this.bus = el("path", { class: "busPath", d: BUS_D }, svg);
    this.tail = el("circle", { r: 4, class: "packet" }, svg);
    this.pkt = el("circle", { r: 6, class: "packet" }, svg);

    this.cpuG = el("g", { class: "dimGroup clickable", "data-code": "cl-2", "data-inspect": "cpu" }, svg);
    const t1 = el("title", {}, this.cpuG);
  t1.textContent = "CPU host — prepares data and launches the kernel";
    this.cpuPulse = el("rect", { x: CPU_RECT.x, y: CPU_RECT.y, width: CPU_RECT.w, height: CPU_RECT.h, rx: CPU_RECT.rx, class: "cpuBox", style: "stroke:var(--teal);fill:rgba(70,227,200,.06)", opacity: 0 }, this.cpuG);
    this.cpuBox = el("rect", { x: CPU_RECT.x, y: CPU_RECT.y, width: CPU_RECT.w, height: CPU_RECT.h, rx: CPU_RECT.rx, class: "cpuBox" }, this.cpuG);
    txt(el("text", { x: 124, y: 116, "text-anchor": "middle", class: "lblStrong" }, this.cpuG), "CPU · HOST");
    txt(el("text", { x: 124, y: 136, "text-anchor": "middle", class: "lblMono" }, this.cpuG), "vector_add()");

    this.gCore = el("g", { class: "dimGroup" }, svg);
    this.chassis = el("rect", { x: 330, y: 110, width: 730, height: 400, rx: 18, class: "chassis" }, this.gCore);
    txt(el("text", { x: 350, y: 141, class: "lblStrong" }, this.gCore), "GPU · DEVICE");
    txt(el("text", { x: 1038, y: 141, "text-anchor": "end", class: "lblMono" }, this.gCore), `${SM_COUNT} SMs × 2 SLOTS`);
    for (let s = 0; s < SM_COUNT; s++) {
      const p = tileXY(s);
      const g = el("g", { class: "clickable", "data-code": "cl-9", "data-inspect": `sm:${s}` }, this.gCore);
      const ti = el("title", {}, g); ti.textContent = `SM ${s} — schedules warps onto execution lanes`;
      const tile = el("rect", { x: p.x, y: p.y, width: 142, height: 150, rx: 12, class: "tile" }, g);
      txt(el("text", { x: p.x + 12, y: p.y + 22, class: "lblStrong" }, g), `SM${s}`);
      for (let q = 0; q < 2; q++) el("rect", { x: p.x + 12, y: p.y + 34 + q * 54, width: 118, height: 44, rx: 8, class: "slotR" }, g);
      this.tiles.push({ tile, g });
    }

    this.zoneG = el("g", { class: "dimGroup clickable", "data-code": "cl-4" }, svg);
    const tz = el("title", {}, this.zoneG); tz.textContent = "Grid — every block launched by one <<<4,256>>> call";
    el("rect", { x: 350, y: 175, width: 225, height: 250, rx: 10, class: "zoneRect" }, this.zoneG);
    txt(el("text", { x: 350, y: 167, class: "lblMono" }, this.zoneG), "GRID · 12 BLOCKS");

    this.memG = el("g", { class: "dimGroup clickable", "data-code": "cl-13", "data-inspect": "mem" }, svg);
    const tm = el("title", {}, this.memG); tm.textContent = "Global memory — results stream back here";
    txt(el("text", { x: 330, y: 550, class: "lblMono" }, this.memG), "GLOBAL MEMORY · DEVICE DRAM");
    for (let c = 0; c < MEM_COUNT; c++) {
      this.memCells.push(el("rect", { x: memCellX(c), y: 560, width: 28, height: 30, rx: 3, class: "memCell", "fill-opacity": 0.06, "stroke-opacity": 0.18 }, this.memG));
    }
    this.memFrame = el("rect", { x: 326, y: 544, width: 726, height: 52, rx: 10, class: "memFrame" }, this.memG);

    for (let i = 0; i < 12; i++) {
      const g = el("g", { opacity: 0, "data-code": "cl-9", "data-inspect": `blk:${i}` }, svg);
      const rect = el("rect", { x: -26, y: -16, width: 52, height: 32, rx: 6, class: "bRect" }, g);
      const dots = [];
      for (let d = 0; d < 8; d++) {
        const dx = -16.5 + (d % 4) * 11, dy = -5 + Math.floor(d / 4) * 10;
        const halo = el("circle", { cx: dx, cy: dy, r: 6.5, class: "dHalo", opacity: 0 }, g);
        const dot = el("circle", { cx: dx, cy: dy, r: 3.2, class: "bDot", "fill-opacity": 0.3 }, g);
        dots.push({ halo, dot });
      }
      this.blocks.push({ g: g as SVGGElement, rect, dots, arrive: 0 });
    }
    for (let i = 0; i < 12; i++) {
      const h = homePos(i), tp = targetPos(i);
      this.ctrl.push({ x: (h.x + tp.x) / 2, y: Math.min(h.y, tp.y) - 70 });
      this.blocks[i].arrive = 0.34 + i * 0.011 + 0.055;
    }
  }

  private handleClick(e: Event) {
    const target = e.target as Element;
    const insp = target.closest("[data-inspect]");
    const codeEl = target.closest("[data-code]");
    if (insp && !this.destroyed) {
      const key = insp.getAttribute("data-inspect") || "";
      if (this.selKey === key) this.clearSel();
      else {
        this.clearSel();
        this.selKey = key;
        this.selNode = key === "cpu" ? this.cpuBox : key === "mem" ? this.memFrame : key.startsWith("sm:") ? this.tiles[+key.slice(3)].tile : this.blocks[+key.slice(4)].rect;
        this.selNode.classList.add("sel");
      }
    } else this.clearSel();
    const sel = this.selKey ? { key: this.selKey, code: codeEl ? codeEl.getAttribute("data-code") || "" : "" } : null;
    this.opts.onSelect?.(sel);
    if (codeEl && !this.destroyed) {
      const map: Record<string, number> = { "cl-2": 0, "cl-4": 0.18, "cl-9": 0.56, "cl-13": 0.76 };
      const code = codeEl.getAttribute("data-code") || "";
      if (map[code] !== undefined) this.opts.onSeekRequest?.(map[code]);
    }
  }

  private clearSel() {
    if (this.selNode) this.selNode.classList.remove("sel");
    this.selNode = null;
    this.selKey = null;
  }

  highlight(codeId: string | null) {
    void codeId;
  }

  render(t: number) {
    if (this.destroyed) return;
    const s = computeState(t, this.cfg);

    for (let hi = this.cfg.blocks; hi < this.blocks.length; hi++) {
      this.blocks[hi].g.setAttribute("opacity", "0");
      for (const pair of this.blocks[hi].dots) {
        pair.dot.setAttribute("fill-opacity", "0.3");
        pair.halo.setAttribute("opacity", "0");
      }
    }

    this.cpuG.setAttribute("opacity", String(s.spotlight.cpu));
    this.gCore.setAttribute("opacity", String(s.spotlight.core));
    this.zoneG.setAttribute("opacity", String(s.spotlight.staging));
    this.memG.setAttribute("opacity", String(s.spotlight.memory));

    this.cpuPulse.setAttribute("opacity", String(s.cpuPulse));

    if (s.packetU > 0 && s.packetU < 1) {
      const L = this.bus.getTotalLength();
      const p1 = this.bus.getPointAtLength(s.packetU * L);
      const p0 = this.bus.getPointAtLength(Math.max(0, s.packetU - 0.06) * L);
      this.pkt.setAttribute("cx", String(p1.x)); this.pkt.setAttribute("cy", String(p1.y));
      this.pkt.setAttribute("r", String(4 + 4 * s.packetU));
      this.pkt.setAttribute("opacity", String(s.packetOpacity));
      this.tail.setAttribute("cx", String(p0.x)); this.tail.setAttribute("cy", String(p0.y));
      this.tail.setAttribute("r", "2.5"); this.tail.setAttribute("opacity", String(s.packetOpacity * 0.4));
    } else {
      this.pkt.setAttribute("opacity", "0"); this.tail.setAttribute("opacity", "0");
    }

    const F = s.stage.k === "store" ? 0.72 : s.stage.k === "done" ? 0.85 : 1;
    for (const b of s.blocks) {
      const R = this.blocks[b.i];
      R.g.setAttribute("transform", `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) scale(${b.scale.toFixed(3)})`);
      R.g.setAttribute("opacity", String(b.opacity * F));
      for (let j = 0; j < b.heat.length; j++) {
        const h = b.heat[j];
        const pair = R.dots[j];
        pair.dot.setAttribute("fill-opacity", String(lerp(0.3, 0.95, h)));
        const dt = h > 0 ? h : -1;
        pair.halo.setAttribute("opacity", String(dt >= 0 && dt < 2.5 ? Math.sin(Math.PI * clamp(dt / 2.5, 0, 1)) * 0.5 : 0));
      }
    }
    for (let si = 0; si < this.tiles.length; si++) {
      let active = false;
      [si, si + 6].forEach((bi) => {
        const b = s.blocks[bi];
        if (b && b.seated && t > 0 && t < 0.82 && bi < this.cfg.blocks) active = true;
      });
      this.tiles[si].tile.classList.toggle("active", active);
    }
    for (let c = 0; c < MEM_COUNT; c++) {
      const f = s.memFill[c];
      const flash = Math.max(0, 1 - (t - (0.76 + c * 0.0048)) / 0.06);
      this.memCells[c].setAttribute("fill-opacity", String(f * 0.8));
      this.memCells[c].setAttribute("stroke-opacity", String(f * 0.5 + flash * 0.5));
    }
    this.chassis.style.strokeOpacity = t > 0.92 ? String(0.6 + 0.4 * bell(seg(t, 0.92, 1))) : "1";
  }
}
