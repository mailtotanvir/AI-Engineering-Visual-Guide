import SceneShell from "@/components/journey/SceneShell";
import Warps from "@/components/scenes/Warps";

export const metadata = { title: "Warps & Divergence — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="warps">
        <Warps />
      </SceneShell>
    </main>
  );
}
