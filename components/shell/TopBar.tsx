"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import WorldsBar from "./WorldsBar";

function Seg<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { v: T; text: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span className="fieldLabel">{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TopBar() {
  const { reduced, setReduced, density, setDensity } = useMotion();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
        btnRef.current?.setAttribute("aria-expanded", "false");
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <header className="top">
      <div className="wrap topIn">
        <Link className="wordmark" href="/" aria-label="AI Engineering Visual Encyclopedia home">
          <span className="wmDie" aria-hidden="true"><i /><i /><i /><i /></span>
          AI&nbsp;ENG<span className="wmSub">Visual&nbsp;Encyclopedia</span>
        </Link>
        <WorldsBar />
        <button
          ref={btnRef}
          className="iconBtn"
          style={{ marginLeft: 12 }}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">⚙</span> Settings
        </button>
      </div>
      <div ref={popRef} className={"pop" + (open ? " open" : "")} role="dialog" aria-label="Display settings">
        <p className="popTitle">SETTINGS</p>
        <Seg
          label="Motion"
          value={reduced ? "reduced" : "full"}
          options={[{ v: "full", text: "Full" }, { v: "reduced", text: "Reduced" }]}
          onChange={(v) => setReduced(v === "reduced")}
        />
        <Seg
          label="Visual density"
          value={density}
          options={[{ v: "detailed", text: "Detailed" }, { v: "simplified", text: "Simplified" }]}
          onChange={setDensity}
        />
        <div className="field">
          <span className="fieldLabel">Sound</span>
          <div className="seg" role="radiogroup" aria-label="Sound">
            <button type="button" role="radio" aria-checked>Off</button>
            <button type="button" role="radio" aria-checked={false} disabled title="Ships in Phase 8">On</button>
          </div>
          <p className="hint">Sound ships in Phase 8 — off by default, never required.</p>
        </div>
      </div>
    </header>
  );
}
