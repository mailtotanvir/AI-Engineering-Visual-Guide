const NS = "http://www.w3.org/2000/svg";

type TagMap = {
  path: SVGPathElement;
  circle: SVGCircleElement;
  rect: SVGRectElement;
  g: SVGGElement;
  text: SVGTextElement;
};

function el<K extends keyof TagMap>(n: K, attrs: Record<string, string | number>, parent: Element): TagMap[K] {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent.appendChild(e);
  return e as TagMap[K];
}
function txt(e: SVGTextElement, s: string): SVGTextElement { e.textContent = s; return e; }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bell = (u: number) => Math.sin(Math.PI * clamp(u, 0, 1));
const outBack = (u: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const quad = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * ax + 2 * v * u * cx + u * u * bx, v * v * ay + 2 * v * u * cy + u * u * by];
};

const SLOTS: [number, number][] = [[294, 123], [366, 123], [294, 165], [366, 165]];
const HOMES: [number, number][] = [[170, 70], [170, 114], [170, 158], [170, 202]];

export interface MiniLaunch {
  render(t: number): void;
  setLabels(v: boolean): void;
  destroy(): void;
}

export function buildMiniLaunch(svg: SVGSVGElement): MiniLaunch {
  const root = el("g", {}, svg);
  el("rect", { x: 16, y: 118, width: 56, height: 34, rx: 8, class: "cpuBox" }, root);
  txt(el("text", { x: 44, y: 139, "text-anchor": "middle", class: "lblMono" }, root), "CPU");
  const bus = el("path", { d: "M 72 135 C 130 80, 190 66, 250 106", style: "fill:none;stroke:rgba(159,182,187,.25);stroke-dasharray:3 6" }, root);
  const tail = el("circle", { r: 3, class: "packet", opacity: 0 }, root);
  const pkt = el("circle", { r: 5, class: "packet", opacity: 0 }, root);
  el("rect", { x: 246, y: 60, width: 158, height: 136, rx: 12, class: "chassis" }, root);
  txt(el("text", { x: 256, y: 82, class: "lblMono" }, root), "GPU · LIVE");
  [[262, 94], [334, 94]].forEach(([tx, ty]) => {
    el("rect", { x: tx, y: ty, width: 64, height: 90, rx: 10, class: "tile" }, root);
    el("rect", { x: tx + 6, y: 106, width: 52, height: 34, rx: 6, class: "slotR" }, root);
    el("rect", { x: tx + 6, y: 148, width: 52, height: 34, rx: 6, class: "slotR" }, root);
  });
  const blocks = HOMES.map((h, i) => {
    const g = el("g", { opacity: 0 }, root);
    el("rect", { x: -26, y: -16, width: 52, height: 32, rx: 6, class: "bRect" }, g);
    const lbl = txt(el("text", { x: 0, y: -24, "text-anchor": "middle", class: "lblMono", opacity: 0 }, g), `B${i}`);
    const dots = [];
    for (let d = 0; d < 8; d++) {
      const dx = -16.5 + (d % 4) * 11, dy = -5 + Math.floor(d / 4) * 10;
      dots.push({
        halo: el("circle", { cx: dx, cy: dy, r: 6.5, class: "dHalo", opacity: 0 }, g),
        dot: el("circle", { cx: dx, cy: dy, r: 3.2, class: "bDot", "fill-opacity": 0.3 }, g),
      });
    }
    void lbl;
    return { g: g as SVGGElement, dots, home: h, lbl };
  });
  const cells: SVGRectElement[] = [];
  const cellLbls: SVGTextElement[] = [];
  for (let c = 0; c < 10; c++) {
    cells.push(el("rect", { x: 262 + c * 16, y: 214, width: 13, height: 22, rx: 3, class: "memCell", "fill-opacity": 0.06, "stroke-opacity": 0.18 }, root));
    cellLbls.push(txt(el("text", { x: 268.5 + c * 16, y: 250, "text-anchor": "middle", class: "lblMono", opacity: 0 }, root), String(c)));
  }

  function render(p: number) {
    const pp = seg(p, 0.02, 0.1);
    if (pp > 0 && pp < 1) {
      const L = bus.getTotalLength();
      const p1 = bus.getPointAtLength(pp * L);
      pkt.setAttribute("cx", String(p1.x)); pkt.setAttribute("cy", String(p1.y));
      pkt.setAttribute("r", String(4 + 3 * pp)); pkt.setAttribute("opacity", String(bell(pp)));
      tail.setAttribute("cx", String(bus.getPointAtLength(Math.max(0, pp - 0.05) * L).x));
      tail.setAttribute("cy", String(bus.getPointAtLength(Math.max(0, pp - 0.05) * L).y));
      tail.setAttribute("r", "3"); tail.setAttribute("opacity", String(bell(pp) * 0.4));
    } else { pkt.setAttribute("opacity", "0"); tail.setAttribute("opacity", "0"); }
    blocks.forEach((B, i) => {
      const sp = seg(p, 0.07 + i * 0.04, 0.11 + i * 0.04);
      if (sp <= 0) { B.g.setAttribute("opacity", "0"); return; }
      const t = SLOTS[i];
      const cx = (B.home[0] + t[0]) / 2, cy = Math.min(B.home[1], t[1]) - 36;
      const fu = seg(p, 0.26 + i * 0.05, 0.33 + i * 0.05);
      let px: number, py: number, scale: number;
      if (fu <= 0) { px = B.home[0]; py = B.home[1]; scale = 0.7 * outBack(sp); }
      else if (fu < 1) { const [qx, qy] = quad(B.home[0], B.home[1], cx, cy, t[0], t[1], fu); px = qx; py = qy; scale = lerp(0.7, 0.62, fu); }
      else { px = t[0]; py = t[1]; scale = 0.62; }
      B.g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${scale.toFixed(3)})`);
      B.g.setAttribute("opacity", String(Math.min(1, sp * 1.5).toFixed(3)));
      B.lbl.setAttribute("opacity", svg.classList.contains("showLabels") ? "1" : "0");
      for (let j = 0; j < 8; j++) {
        const lt = Math.max(0.33 + i * 0.05, 0.5) + j * 0.012;
        const dt = p - lt;
        const pair = B.dots[j];
        pair.dot.setAttribute("fill-opacity", String(dt < -0.004 ? 0.3 : lerp(0.3, 0.95, clamp(dt / 0.02, 0, 1))));
        pair.halo.setAttribute("opacity", String(dt >= 0 && dt < 0.05 ? bell(dt / 0.05) * 0.5 : 0));
      }
    });
    cells.forEach((cell, c) => {
      const f = seg(p, 0.62 + c * 0.02, 0.65 + c * 0.02);
      cell.setAttribute("fill-opacity", String(f * 0.8));
      cell.setAttribute("stroke-opacity", String(f * 0.5));
    });
    root.setAttribute("opacity", String((1 - bell(seg(p, 0.94, 1)) * 0.92).toFixed(3)));
  }

  return {
    render,
    setLabels(v: boolean) {
      svg.classList.toggle("showLabels", v);
      blocks.forEach((B, i) => B.lbl.setAttribute("opacity", v ? "1" : "0"));
      cellLbls.forEach((l) => l.setAttribute("opacity", v ? "1" : "0"));
    },
    destroy() { svg.replaceChildren(); },
  };
}
