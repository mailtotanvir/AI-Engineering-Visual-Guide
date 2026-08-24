"use client";
import React, { useEffect, useRef, useState } from "react";

const NS = "http://www.w3.org/2000/svg";
const BOOT_MS = 6200;

type TagMap = {
  path: SVGPathElement; circle: SVGCircleElement; rect: SVGRectElement;
  g: SVGGElement; text: SVGTextElement;
};
function el<K extends keyof TagMap>(n: K, attrs: Record<string, string | number>, parent: Element): TagMap[K] {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent.appendChild(e);
  return e as TagMap[K];
}
function txt(e: SVGElement, s: string) { e.textContent = s; }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bell = (u: number) => Math.sin(Math.PI * clamp(u, 0, 1));
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const outBack = (u: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const quad = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * ax + 2 * v * u * cx + u * u * bx, v * v * ay + 2 * v * u * cy + u * u * by];
};
const tileXY = (s: number) => ({ x: 600 + (s % 3) * 152, y: 160 + Math.floor(s / 3) * 165 });
const targetPos = (i: number) => { const t = tileXY(i % 6); return { x: t.x + 71, y: t.y + 56 + Math.floor(i / 6) * 54 }; };
const homePos = (i: number) => ({ x: 388 + Math.floor(i / 4) * 70, y: 211 + (i % 4) * 53 });

export default function BootVeil() {
  const [gone, setGone] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("cve-booted")) {
      document.body.classList.add("booted");
      setGone(true);
      return;
    }
    setGone(false);
    document.body.classList.remove("booted");
  }, []);

  useEffect(() => {
    if (gone || !svgRef.current) return;
    let booted = false;
    let bs: number | null = null;
    let timer = 0 as unknown as ReturnType<typeof setTimeout>;

    const svg = svgRef.current;
    const streaks = [
      el("path", { class: "streak", d: "M -60 200 C 160 210, 330 250, 500 300", style: "stroke:var(--teal)" }, svg),
      el("path", { class: "streak", d: "M -60 300 L 500 300", style: "stroke:var(--cyan)" }, svg),
      el("path", { class: "streak", d: "M -60 400 C 160 390, 330 350, 500 300", style: "stroke:var(--iris)" }, svg),
    ];
    const count = el("text", { x: 64, y: 86, class: "lblStrong", "font-size": 26, opacity: 0 }, svg);
    const cap = el("text", { x: 64, y: 110, class: "lblMono", opacity: 0 }, svg);
    txt(cap, "PENDING WORK ITEMS");
    const cpuG = el("g", { opacity: 0 }, svg);
    el("rect", { x: 48, y: 88, width: 152, height: 64, rx: 12, class: "cpuBox" }, cpuG);
    txt(el("text", { x: 124, y: 116, "text-anchor": "middle", class: "lblStrong" }, cpuG), "CPU · HOST");
    const bus = el("path", { d: "M 200 112 C 260 60, 430 40, 640 106", style: "fill:none;stroke:rgba(159,182,187,.35);stroke-dasharray:3 6" }, svg);
    const tail = el("circle", { r: 4, class: "packet", opacity: 0 }, svg);
    const pkt = el("circle", { r: 6, class: "packet", opacity: 0 }, svg);
    const flash = el("circle", { cx: 640, cy: 106, r: 10, fill: "none", style: "stroke:var(--gold)", opacity: 0 }, svg);
    const core = el("g", { opacity: 0 }, svg);
    const chassis = el("rect", { x: 330, y: 110, width: 730, height: 400, rx: 18, class: "chassis" }, core);
    txt(el("text", { x: 350, y: 141, class: "lblStrong" }, core), "GPU · DEVICE");
    const tiles: SVGGElement[] = [];
    for (let s = 0; s < 6; s++) {
      const p = tileXY(s);
      const tg = el("g", { opacity: 0 }, core);
      el("rect", { x: p.x, y: p.y, width: 142, height: 150, rx: 12, class: "tile" }, tg);
      txt(el("text", { x: p.x + 12, y: p.y + 22, class: "lblStrong" }, tg), `SM${s}`);
      for (let q = 0; q < 2; q++) el("rect", { x: p.x + 12, y: p.y + 34 + q * 54, width: 118, height: 44, rx: 8, class: "slotR" }, tg);
      tiles.push(tg);
    }
    const zone = el("g", { opacity: 0 }, svg);
    el("rect", { x: 350, y: 175, width: 225, height: 250, rx: 10, class: "zoneRect" }, zone);
    txt(el("text", { x: 350, y: 167, class: "lblMono" }, zone), "GRID · 12 BLOCKS");
    const blocks: { g: SVGGElement; dots: { halo: SVGCircleElement; dot: SVGCircleElement }[] }[] = [];
    for (let i = 0; i < 12; i++) {
      const g = el("g", { opacity: 0 }, svg);
      el("rect", { x: -26, y: -16, width: 52, height: 32, rx: 6, class: "bRect" }, g);
      const dots = [];
      for (let d = 0; d < 8; d++) {
        const dx = -16.5 + (d % 4) * 11, dy = -5 + Math.floor(d / 4) * 10;
        dots.push({
          halo: el("circle", { cx: dx, cy: dy, r: 6.5, class: "dHalo", opacity: 0 }, g),
          dot: el("circle", { cx: dx, cy: dy, r: 3.2, class: "bDot", "fill-opacity": 0.3 }, g),
        });
      }
      blocks.push({ g: g as SVGGElement, dots });
    }
    const memWrap = el("g", { opacity: 0 }, svg);
    txt(el("text", { x: 330, y: 550, class: "lblMono" }, memWrap), "GLOBAL MEMORY · DEVICE DRAM");
    const cells: SVGRectElement[] = [];
    for (let c = 0; c < 24; c++) cells.push(el("rect", { x: 330 + c * 30, y: 560, width: 28, height: 30, rx: 3, class: "memCell", "fill-opacity": 0.06, "stroke-opacity": 0.18 }, memWrap));
    const title = el("text", { x: 48, y: 602, class: "lblStrong", "font-size": 13, opacity: 0, "letter-spacing": "0.42em" }, svg);
    txt(title, "AI ENGINEERING · VISUAL ENCYCLOPEDIA");

    const finish = () => {
      if (booted) return;
      booted = true;
      clearTimeout(timer);
      sessionStorage.setItem("cve-booted", "1");
      document.body.classList.add("booted");
      const veil = document.getElementById("bootVeil");
      if (veil) {
        veil.classList.add("done");
        setTimeout(() => setGone(true), 750);
      } else setGone(true);
    };
    timer = setTimeout(finish, BOOT_MS + 1800);
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });

    function render(u: number) {
      const sw = seg(u, 0.05, 0.16);
      streaks.forEach((p) => {
        p.setAttribute("stroke-dashoffset", String((1 - sw) * 420));
        p.setAttribute("opacity", String(sw <= 0 ? 0 : sw >= 1 ? 0.22 * (1 - seg(u, 0.16, 0.22)) : bell(sw) * 0.8));
      });
      const cp = outCubic(seg(u, 0.05, 0.18));
      txt(count, Math.round(cp * 1048576).toLocaleString("en-US") + " ELEMENTS");
      count.setAttribute("opacity", String(cp > 0 ? Math.min(1, cp * 3) : 0));
      cap.setAttribute("opacity", String(seg(u, 0.09, 0.15)));
      const g = seg(u, 0.15, 0.3);
      core.setAttribute("opacity", String(g));
      core.setAttribute("transform", `translate(695 310) scale(${(0.97 + 0.03 * g).toFixed(4)}) translate(-695 -310)`);
      tiles.forEach((tg, i) => tg.setAttribute("opacity", String(seg(u, 0.19 + i * 0.012, 0.23 + i * 0.012))));
      cpuG.setAttribute("opacity", String(seg(u, 0.27, 0.33)));
      const l = seg(u, 0.31, 0.39);
      if (l > 0 && l < 1) {
        const L = bus.getTotalLength();
        const p1 = bus.getPointAtLength(l * L);
        const p0 = bus.getPointAtLength(Math.max(0, l - 0.06) * L);
        pkt.setAttribute("cx", String(p1.x)); pkt.setAttribute("cy", String(p1.y));
        pkt.setAttribute("r", String(5 + 4 * l)); pkt.setAttribute("opacity", String(bell(l)));
        tail.setAttribute("cx", String(p0.x)); tail.setAttribute("cy", String(p0.y));
        tail.setAttribute("r", "3"); tail.setAttribute("opacity", String(bell(l) * 0.4));
      } else { pkt.setAttribute("opacity", "0"); tail.setAttribute("opacity", "0"); }
      const fr = seg(u, 0.37, 0.45);
      flash.setAttribute("r", String(10 + fr * 24));
      flash.setAttribute("opacity", String(fr < 1 ? (1 - fr) * 0.85 : 0));
      zone.setAttribute("opacity", String(seg(u, 0.36, 0.42) * (1 - seg(u, 0.5, 0.58))));
      const F = u > 0.62 ? 0.85 : 1;
      blocks.forEach((B, i) => {
        const sp = seg(u, 0.38 + i * 0.008, 0.415 + i * 0.008);
        if (sp <= 0) { B.g.setAttribute("opacity", "0"); return; }
        const h = homePos(i), t = targetPos(i);
        const cx = (h.x + t.x) / 2, cy = Math.min(h.y, t.y) - 70;
        const fu = seg(u, 0.46 + i * 0.008, 0.46 + i * 0.008 + 0.06);
        let px: number, py: number, scale: number;
        if (fu <= 0) { px = h.x; py = h.y; scale = 1.15 * outBack(sp); }
        else if (fu < 1) { const [qx, qy] = quad(h.x, h.y, cx, cy, t.x, t.y, fu); px = qx; py = qy; scale = lerp(1.15, 0.85, fu); }
        else { px = t.x; py = t.y; scale = 0.85; }
        B.g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${scale.toFixed(3)})`);
        B.g.setAttribute("opacity", String((Math.min(1, sp * 1.5) * F).toFixed(3)));
        const arrive = 0.46 + i * 0.008 + 0.06;
        for (let j = 0; j < 8; j++) {
          const lt = Math.max(arrive, 0.57 + Math.floor(i / 6) * 0.055) + j * 0.006;
          const dt = u - lt;
          const pair = B.dots[j];
          pair.dot.setAttribute("fill-opacity", String(dt < -0.004 ? 0.3 : lerp(0.3, 0.95, clamp(dt / 0.02, 0, 1))));
          pair.halo.setAttribute("opacity", String(dt >= 0 && dt < 0.05 ? bell(dt / 0.05) * 0.5 : 0));
        }
      });
      memWrap.setAttribute("opacity", String(seg(u, 0.63, 0.68)));
      cells.forEach((cell, c) => {
        const f = seg(u, 0.66 + c * 0.007, 0.69 + c * 0.007);
        cell.setAttribute("fill-opacity", String(f * 0.8));
        cell.setAttribute("stroke-opacity", String(f * 0.5));
      });
      chassis.style.strokeOpacity = u > 0.84 ? String(0.6 + 0.4 * bell(seg(u, 0.84, 0.92))) : "1";
      title.setAttribute("opacity", String(seg(u, 0.87, 0.95)));
      const hint = document.getElementById("bootHint");
      hint?.classList.toggle("show", u > 0.9);
      if (u >= 0.995) finish();
    }

    let raf = requestAnimationFrame(function tick(ts: number) {
      if (booted) return;
      if (bs === null) bs = ts;
      const u = Math.min(1, (ts - bs) / BOOT_MS);
      render(u);
      if (!booted) raf = requestAnimationFrame(tick);
    });
    void raf;
    const veil = document.getElementById("bootVeil");
    veil?.addEventListener("pointerdown", finish);

    return () => {
      booted = true;
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      veil?.removeEventListener("pointerdown", finish);
    };
  }, [gone]);

  if (gone) return null;
  return (
    <div id="bootVeil" aria-hidden="true">
      <svg id="bootSvg" ref={svgRef} viewBox="0 0 1200 620" />
      <p id="bootHint">CLICK OR PRESS ANY KEY TO ENTER THE MACHINE</p>
    </div>
  );
}
