"use client";

import { useMotion } from "@/components/shell/MotionProvider";
import { SystemGlyph } from "@/components/home/WorldObservatory";
import { worldById } from "@/content/worlds";

export default function WorldHeroSignal({ worldId }: { worldId: string }) {
  const { reduced } = useMotion();
  const world = worldById(worldId);
  if (!world) return null;
  return (
    <aside className="worldHeroSignal" style={{ "--world-color": world.accent } as React.CSSProperties}>
      <div className="worldHeroSignalHead"><span><i /> LIVE MODEL</span><b>{world.flow.length} STAGES</b></div>
      <SystemGlyph world={world} reduced={reduced} />
      <p>{world.thesis}</p>
    </aside>
  );
}
