"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface MotionCtx {
  reduced: boolean;
  setReduced: (v: boolean) => void;
  density: "detailed" | "simplified";
  setDensity: (v: "detailed" | "simplified") => void;
}

const Ctx = createContext<MotionCtx>({
  reduced: false,
  setReduced: () => {},
  density: "detailed",
  setDensity: () => {},
});

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);
  const [density, setDensity] = useState<"detailed" | "simplified">("detailed");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches && !sessionStorage.getItem("cve-motion-set")) setReduced(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduced", reduced);
    if (reduced) sessionStorage.setItem("cve-motion-set", "1");
  }, [reduced]);

  useEffect(() => {
    document.body.classList.toggle("dense", density === "simplified");
  }, [density]);

  const value = useMemo(
    () => ({ reduced, setReduced, density, setDensity }),
    [reduced, density]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMotion = () => useContext(Ctx);
