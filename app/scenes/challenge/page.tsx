import SceneShell from "@/components/journey/SceneShell";
import Challenge from "@/components/scenes/Challenge";

export const metadata = { title: "Final Challenge — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="challenge">
        <Challenge />
      </SceneShell>
    </main>
  );
}
