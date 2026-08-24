import SceneShell from "@/components/journey/SceneShell";
import MeetGPU from "@/components/scenes/MeetGPU";

export const metadata = { title: "Meet the GPU — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="meet-the-gpu">
        <MeetGPU />
      </SceneShell>
    </main>
  );
}
