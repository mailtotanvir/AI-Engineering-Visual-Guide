"use client";
import Link from "next/link";
import React, { useState } from "react";
import { EVAL_DOMAINS, EVAL_TOPICS } from "@/content/evals/atlas";

const DOMAIN_COLORS: Record<string, string> = {
  foundations: "var(--rose)",
  design: "var(--gold)",
  integrity: "var(--teal)",
  scoring: "var(--cyan)",
  judge: "var(--iris)",
  human: "var(--lime)",
  statistics: "var(--gold)",
  operations: "var(--rose)",
};

export default function EvalAtlasBrowser() {
  const [domain, setDomain] = useState("foundations");
  const [openId, setOpenId] = useState<string | null>(null);
  const topics = EVAL_TOPICS.filter((t) => t.domain === domain);

  return (
    <div>
      <div className="atlasTabs" role="tablist" aria-label="Evaluation domains">
        {EVAL_DOMAINS.map((d) => (
          <button key={d.id} role="tab" aria-selected={domain === d.id}
            className={"atlasTab" + (domain === d.id ? " on" : "")}
            style={domain === d.id ? { borderColor: DOMAIN_COLORS[d.id], color: DOMAIN_COLORS[d.id] } : undefined}
            onClick={() => { setDomain(d.id); setOpenId(null); }}>
            <b style={{ opacity: 0.7 }}>{d.num}</b>&nbsp;{d.name}
          </button>
        ))}
      </div>

      <p className="sec-sub" style={{ marginTop: "var(--s4)" }}>
        {EVAL_DOMAINS.find((d) => d.id === domain)?.blurb}
      </p>

      <div className="atlasList">
        {topics.map((t) => {
          const open = openId === t.id;
          const color = DOMAIN_COLORS[t.domain] || "var(--rose)";
          return (
            <article key={t.id} className={"topicCard" + (open ? " open" : "")} style={{ borderLeftColor: color }}>
              <header role="button" tabIndex={0} aria-expanded={open}
                onClick={() => setOpenId(open ? null : t.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(open ? null : t.id))}
                style={{ display: "flex", alignItems: "baseline", gap: 12, cursor: "pointer" }}>
                <span className="kicker" style={{ color }}>{t.kind === "scene" ? "◈ SCENE" : "▸ ENTRY"}</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, flex: 1 }}>{t.title}</h3>
              </header>
              <p style={{ margin: "6px 0 0", color: "var(--ink2)", fontSize: 14 }}>{t.summary}</p>
              {open && (
                <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                  {t.points.map((pt) => (
                    <li key={pt} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 13.5, color: "var(--ink2)" }}>
                      <i style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0, marginTop: 7 }} />
                      {pt}
                    </li>
                  ))}
                  {t.kind === "scene" && t.scene && (
                    <li style={{ paddingTop: 10 }}>
                      <Link className="linkArrow" href={`/evals/scenes/${t.scene}/`}>
                        OPEN THE EXHIBIT →
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
