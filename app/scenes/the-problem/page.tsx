import SceneShell from "@/components/journey/SceneShell";
import ProblemRace from "@/components/scenes/ProblemRace";

export const metadata = { title: "Why a GPU? — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="the-problem">
        <ProblemRace />
      </SceneShell>
    </main>
  );
}
