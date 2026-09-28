"use client";

import Link from "next/link";
import React, { useState } from "react";
import { INFRA_DOMAINS, INFRA_TOPICS } from "@/content/infra/atlas";

const DOMAIN_COLORS: Record<string, string> = {
  "silicon-node": "#FF9E7A",
  "fabric-interconnect": "var(--cyan)",
  "storage-io": "var(--teal)",
  "orchestration": "var(--gold)",
  "reliability": "var(--rose)",
  "thermal-power": "var(--iris)",
  "finops": "var(--lime)",
  "telemetry": "#FF9E7A",
};

export default function InfraAtlasBrowser() {
  const [domain, setDomain] = useState("silicon-node");
  const [openId, setOpenId] = useState<string | null>("t-nvlink-topology");
  const topics = INFRA_TOPICS.filter((t) => t.domain === domain);

  return (
    <div>
      <div className="atlasTabs" role="tablist" aria-label="Infrastructure domains">
        {INFRA_DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={domain === d.id}
            className={"atlasTab" + (domain === d.id ? " on" : "")}
            style={domain === d.id ? { borderColor: DOMAIN_COLORS[d.id], color: DOMAIN_COLORS[d.id] } : undefined}
            onClick={() => {
              setDomain(d.id);
              const firstTopic = INFRA_TOPICS.find((t) => t.domain === d.id);
              setOpenId(firstTopic ? firstTopic.id : null);
            }}
          >
            <b style={{ opacity: 0.7 }}>{d.num}</b>&nbsp;{d.name}
          </button>
        ))}
      </div>

      <p className="sec-sub" style={{ marginTop: "var(--s4)" }}>
        {INFRA_DOMAINS.find((d) => d.id === domain)?.blurb}
      </p>

      <div className="atlasList">
        {topics.map((t) => {
          const open = openId === t.id;
          const color = DOMAIN_COLORS[t.domain] || "#FF9E7A";
          return (
            <article
              key={t.id}
              className={"topicCard" + (open ? " open" : "")}
              style={{
                borderLeftColor: color,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: open ? "var(--bg3)" : "var(--bg2)",
              }}
              onClick={() => setOpenId((curr) => (curr === t.id ? null : t.id))}
            >
              <header
                style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flex: 1 }}>
                  <span className="kicker" style={{ color }}>{t.kind === "scene" ? "◈ SCENE" : "▸ ENTRY"}</span>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>{t.title}</h3>
                </div>
                <span style={{ color: "var(--ink3)", fontSize: 13, fontFamily: "var(--font-m)" }}>
                  {open ? "▲ COLLAPSE" : "▼ EXPAND"}
                </span>
              </header>

              <p style={{ margin: "8px 0 0", color: "var(--ink2)", fontSize: 14 }}>{t.summary}</p>

              {open && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hair2)" }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {t.points.map((pt) => (
                      <li key={pt} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.5 }}>
                        <i style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0, marginTop: 7 }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  {t.kind === "scene" && t.scene && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        className="btn btnPrimary btnSm"
                        href={`/infra/scenes/${t.scene}/`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        OPEN SCENE EXHIBIT →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
