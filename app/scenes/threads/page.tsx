import SceneShell from "@/components/journey/SceneShell";
import Threads from "@/components/scenes/Threads";

export const metadata = { title: "Threads — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="threads">
        <Threads />
      </SceneShell>
    </main>
  );
}
