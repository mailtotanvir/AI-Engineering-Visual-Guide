"use client";
import Link from "next/link";
import React, { useState } from "react";
import { DOMAINS, DOMAIN_COLORS, TOPICS } from "@/content/cuda/atlas";

export default function AtlasBrowser() {
  const [domain, setDomain] = useState("threads");
  const [openId, setOpenId] = useState<string | null>(null);
  const topics = TOPICS.filter((t) => t.domain === domain);

  return (
    <div>
      <div className="atlasTabs" role="tablist" aria-label="Encyclopedia domains">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={domain === d.id}
            className={"atlasTab" + (domain === d.id ? " on" : "")}
            style={domain === d.id ? { borderColor: DOMAIN_COLORS[d.id], color: DOMAIN_COLORS[d.id] } : undefined}
            onClick={() => { setDomain(d.id); setOpenId(null); }}
          >
            <b style={{ opacity: 0.7 }}>{d.num}</b>&nbsp;{d.name}
          </button>
        ))}
      </div>

      <p className="sec-sub" style={{ marginTop: "var(--s4)" }}>
        {DOMAINS.find((d) => d.id === domain)?.blurb}
      </p>

      <div className="atlasList">
        {topics.map((t) => {
          const open = openId === t.id;
          const color = DOMAIN_COLORS[t.domain];
          return (
            <article key={t.id} className={"topicCard" + (open ? " open" : "")} style={{ borderLeftColor: color }}>
              <header
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : t.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(open ? null : t.id))}
                style={{ display: "flex", alignItems: "baseline", gap: 12, cursor: "pointer" }}
              >
                <span className="kicker" style={{ color }}>{t.kind === "interactive" ? "◈ EXHIBIT" : "▸ ENTRY"}</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, flex: 1 }}>{t.title}</h3>
                {t.kind === "interactive" && (
                  <Link
                    href={`/atlas/${t.interactiveId}/`}
                    className="btn btnPrimary btnSm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    OPEN →
                  </Link>
                )}
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
                  {t.journey && (
                    <li style={{ paddingTop: 10 }}>
                      <Link className="linkArrow" href={`/scenes/${t.journey}/`}>
                        SEE IT MOVE IN THE JOURNEY →
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      <p className="hint" style={{ marginTop: "var(--s4)" }}>
        ◈ entries are hands-on exhibits. Everything else expands in place.
        The full narrative version of core topics lives in the{" "}
        <Link href="/scenes/the-problem/">journey</Link>.
      </p>
    </div>
  );
}
