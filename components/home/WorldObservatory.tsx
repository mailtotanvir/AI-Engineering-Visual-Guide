"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMotion } from "@/components/shell/MotionProvider";
import { WORLDS, type World } from "@/content/worlds";

const POSITION: Record<string, string> = {
  cuda: "northWest",
  inference: "northEast",
  "training-scale": "west",
  "post-training": "east",
  evals: "southWest",
  infrastructure: "southEast",
  "safety-alignment": "farSouth",
};

export function SystemGlyph({ world, reduced }: { world: World; reduced: boolean }) {
  const items = world.flow;
  return (
    <svg className="worldGlyph" viewBox="0 0 520 220" role="img" aria-label={`${world.name}: ${items.join(" to ")}`}>
      <defs>
        <linearGradient id={`beam-${world.id}`} x1="0" x2="1">
          <stop stopColor={world.accent} stopOpacity="0" />
          <stop offset=".5" stopColor={world.accent} />
          <stop offset="1" stopColor={world.accent} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${world.id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path className="worldPath worldPathGhost" d="M55 110 H465" />
      <path className="worldPath worldPathLive" style={{ stroke: `url(#beam-${world.id})` }} d="M55 110 H465" />
      {items.map((label, index) => {
        const x = 62 + index * 132;
        return (
          <g className="worldStage" style={{ "--stage": index } as React.CSSProperties} key={label}>
            <circle className="worldHalo" cx={x} cy="110" r="25" style={{ stroke: world.accent }} />
            <circle className="worldCore" cx={x} cy="110" r={index === items.length - 1 ? 8 : 6} style={{ fill: world.accent, filter: `url(#glow-${world.id})` }} />
            {world.id === "cuda" && index < 2 && Array.from({ length: 4 }).map((_, dot) => (
              <circle key={dot} cx={x - 9 + dot * 6} cy="110" r="2" fill={world.accent} />
            ))}
            {world.id === "inference" && index === 2 && Array.from({ length: 3 }).map((_, block) => (
              <rect key={block} x={x - 13 + block * 10} y="105" width="7" height="10" rx="2" fill={world.accent} opacity={.35 + block * .25} />
            ))}
            {world.id === "training-scale" && index === 2 && Array.from({ length: 3 }).map((_, grad) => (
              <circle key={grad} cx={x - 11 + grad * 11} cy="110" r="3" fill={world.accent} opacity={.4 + grad * .25} />
            ))}
            <text x={x} y="158" textAnchor="middle">{label}</text>
          </g>
        );
      })}
      {!reduced && <circle className="worldPacket" r="5" fill={world.accent} style={{ filter: `url(#glow-${world.id})` }}>
        <animateMotion dur={world.status === "live" ? "3.4s" : "5s"} repeatCount="indefinite" path="M55 110 H465" />
      </circle>}
    </svg>
  );
}

export default function WorldObservatory() {
  const [activeId, setActiveId] = useState("cuda");
  const { reduced } = useMotion();
  const active = WORLDS.find((world) => world.id === activeId) ?? WORLDS[0];

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const live = WORLDS.filter((world) => world.status === "live");
        const index = live.findIndex((world) => world.id === current);
        return live[(index + 1) % live.length]?.id ?? live[0].id;
      });
    }, 8500);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <div className="observatory" style={{ "--active-world": active.accent } as React.CSSProperties}>
      <div className="observatoryField" aria-label="AI engineering worlds">
        <div className="orbit orbitOne" aria-hidden="true" />
        <div className="orbit orbitTwo" aria-hidden="true" />
        <div className="observatoryCore" aria-hidden="true">
          <span>AI</span>
          <small>ENGINEERING</small>
        </div>
        {WORLDS.map((world, index) => {
          const selected = world.id === active.id;
          const common = {
            className: `worldNode ${POSITION[world.id]} ${world.status} ${selected ? "active" : ""}`,
            style: { "--world-color": world.accent, "--node-index": index } as React.CSSProperties,
            onMouseEnter: () => setActiveId(world.id),
            onFocus: () => setActiveId(world.id),
            "aria-label": `${world.name}, ${world.status}`,
          };
          const contents = <><i aria-hidden="true" /><strong>{world.shortName}</strong><span>{world.status === "live" ? "LIVE WORLD" : "DISTANT SIGNAL"}</span></>;
          return world.href ? <Link key={world.id} href={world.href} {...common}>{contents}</Link> :
            <button key={world.id} type="button" {...common} onClick={() => setActiveId(world.id)}>{contents}</button>;
        })}
      </div>

      <article className="worldReadout">
        <div className="readoutHead">
          <span className="readoutStatus"><i />{active.status === "live" ? "LIVE SYSTEM" : "PLANNED WORLD"}</span>
          <span>{String(WORLDS.indexOf(active) + 1).padStart(2, "0")} / {String(WORLDS.length).padStart(2, "0")}</span>
        </div>
        <SystemGlyph key={active.id} world={active} reduced={reduced} />
        <div className="readoutCopy">
          <div>
            <p className="kicker">{active.tagline}</p>
            <h3>{active.name}</h3>
          </div>
          <p>{active.thesis}</p>
          {active.href ? <Link className="observatoryEnter" href={active.href}>ENTER WORLD <span aria-hidden="true">↗</span></Link> : <span className="observatoryPlanned">SIGNAL DETECTED · IN FORMATION</span>}
        </div>
      </article>
      <p className="observatoryHint">HOVER OR FOCUS A SIGNAL · SELECT TO ENTER</p>
    </div>
  );
}
