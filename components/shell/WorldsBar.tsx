import Link from "next/link";
import { WORLDS } from "@/content/worlds";

export default function WorldsBar() {
  return (
    <nav className="worldsBar" aria-label="Encyclopedia worlds">
      {WORLDS.map((w) =>
        w.status === "live" && w.href ? (
          <Link key={w.id} href={w.href} className="worldTile live"
            style={{ ["--w-accent" as string]: w.accent }}>
            <span className="wtName">{w.shortName}</span>
            <span className="wtTag">{w.tagline}</span>
          </Link>
        ) : (
          <span key={w.id} className="worldTile planned"
            style={{ ["--w-accent" as string]: w.accent }}
            title={`${w.name} — coming in a future MVP`}>
            <span className="wtName">{w.shortName}</span>
            <span className="wtTag">PLANNED</span>
          </span>
        )
      )}
    </nav>
  );
}
