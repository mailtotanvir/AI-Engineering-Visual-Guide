"use client";
import React, { useState } from "react";
import { TOKEN_SWATCHES } from "@/content/cuda/scenes";

const ROLES: Record<string, string> = {
  "Surface 00": "Page background — the deep space everything sits on.",
  "Surface 01": "Raised sections and wells.",
  "Surface 02": "Panels and exhibit frames.",
  "Surface 03": "Tiles inside the die, editor gutters, active wells.",
  "Ink high": "Headlines — the loudest voice on the page.",
  "Ink mid": "Body copy. Muted, generous leading.",
  "Ink low": "Mono microlabels, kickers, quiet metadata.",
  Thread: "Execution itself: threads igniting, RUN buttons, live fills.",
  Warp: "Lockstep groups of 32 — divergence paths, warp brackets.",
  Block: "Work squads — block glyphs, grid staging zones.",
  SM: "Hardware accents — schedulers, streaming multiprocessors.",
  Memory: "Storage everywhere — DRAM strips, store sweeps, alerts.",
};

export default function TokenLab() {
  const [sel, setSel] = useState(TOKEN_SWATCHES[7]);
  const [copied, setCopied] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      /* clipboard unavailable — selection still shows the value */
    }
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
  };

  const replay = () => {
    setPlaying(false);
    setPlayKey((k) => k + 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
    setTimeout(() => setPlaying(false), 900);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,340px) minmax(0,1fr)", gap: "var(--s5)" }}>
        <div className="swatches" role="listbox" aria-label="Color tokens">
          {TOKEN_SWATCHES.map(([name, hex, v]) => (
            <button
              key={name}
              className={"tokSw" + (sel[1] === hex ? " sel" : "")}
              onClick={() => setSel([name, hex, v])}
              onDoubleClick={() => copy(hex)}
              title={`Click to inspect · double-click to copy ${hex}`}
              aria-label={`${name} ${hex}`}
            >
              <span className="swTop" style={{ background: v }} />
              <span className="swMeta"><span>{name}</span><span style={{ color: "var(--ink3)" }}>{hex}</span></span>
            </button>
          ))}
        </div>

        <div className="specDemo" data-testid="token-detail">
          <p className="specNote">TOKEN DETAIL {copied && <span style={{ color: "var(--teal)" }}>· COPIED {copied}</span>}</p>
          <div style={{ display: "flex", gap: "var(--s4)", alignItems: "stretch" }}>
            <div style={{ width: 96, borderRadius: "var(--r-m)", background: sel[2], border: "1px solid var(--hair)" }} />
            <div style={{ flex: 1 }}>
              <p className="bigCount" style={{ fontSize: 26 }}>{sel[0]}</p>
              <p className="kicker" style={{ margin: "4px 0 10px" }}>{sel[1]}</p>
              <p style={{ margin: 0, color: "var(--ink2)", fontSize: 14 }}>{ROLES[sel[0]] ?? ""}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <span className="chip"><i style={{ background: sel[2] }} />DOT</span>
                <span className="chip" style={{ color: sel[2], borderColor: sel[2] }}>{sel[0].toUpperCase()} LABEL</span>
                <button
                  className="btn btnSm"
                  style={{ background: sel[2], color: "#04211B", cursor: "default" }}
                  tabIndex={-1}
                >
                  ACTION
                </button>
              </div>
              <button className="btn btnGhost btnSm" style={{ padding: "6px 10px", marginTop: 10 }} onClick={() => copy(sel[1])}>
                COPY HEX
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--s4)", marginTop: "var(--s5)" }}>
        <div className="specDemo">
          <p className="specNote">MOTION DURATIONS · HOVER OR REPLAY</p>
          {[["FAST", "var(--dur-fast)"], ["MED", "var(--dur-med)"], ["SLOW", "var(--dur-slow)"]].map(([label, d]) => (
            <div key={label} className={"motionRow" + (playing ? " motionPlay" : "")} style={{ "--demo-dur": d } as React.CSSProperties}>
              <span className="kicker" style={{ width: 44 }}>{label}</span>
              <span className="replayBox" />
              <code className="lblMono">{d.replace("var(", "").replace(")", "")}</code>
            </div>
          ))}
          <button className="btn btnSecondary btnSm" style={{ marginTop: 10 }} onClick={replay}>⟳ REPLAY TRANSITIONS</button>
        </div>

        <div className="specDemo">
          <p className="specNote">RADII</p>
          <div style={{ display: "flex", gap: 12 }}>
            {[["--r-s", "S"], ["--r-m", "M"], ["--r-l", "L"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 48, background: "var(--bg3)", border: "1px solid var(--hair)",
                  borderRadius: `var(${v})`,
                }} />
                <small className="lblMono">{l}</small>
              </div>
            ))}
          </div>
          <p className="hint">Every radius, duration and hue on this site resolves back to one token file.</p>
        </div>
      </div>
    </div>
  );
}
