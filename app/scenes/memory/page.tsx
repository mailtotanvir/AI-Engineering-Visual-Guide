import SceneShell from "@/components/journey/SceneShell";
import Memory from "@/components/scenes/Memory";

export const metadata = { title: "Memory Geography — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="memory">
        <Memory />
      </SceneShell>
    </main>
  );
}
