"use client";
import React, { useEffect, useRef } from "react";
import { useMotion } from "@/components/shell/MotionProvider";
import { buildMiniLaunch } from "@/lib/scenes/miniLaunch";

const DUR = 5200;

export default function MiniViz() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const scene = buildMiniLaunch(svg);
    let ph = 0.72, last: number | null = null, stopped = false;

    if (reducedRef.current) {
      scene.render(0.72);
      return () => { stopped = true; scene.destroy(); };
    }

    let raf = requestAnimationFrame(function tick(ts: number) {
      if (stopped) return;
      if (last === null) last = ts;
      const dt = ts - last;
      last = ts;
      const hidden = typeof document !== "undefined" && document.hidden;
      if (!hidden) {
        ph = (ph + dt / DUR) % 1;
        scene.render(ph);
      }
      raf = requestAnimationFrame(tick);
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      scene.destroy();
    };
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 420 260" role="img" aria-label="Live miniature kernel launch looping" />
  );
}
