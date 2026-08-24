import SceneShell from "@/components/journey/SceneShell";
import DebugIt from "@/components/scenes/DebugIt";

export const metadata = { title: "Debug It — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="debug">
        <DebugIt />
      </SceneShell>
    </main>
  );
}
