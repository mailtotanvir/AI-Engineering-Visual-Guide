import SceneShell from "@/components/journey/SceneShell";
import ThreadIndexing from "@/components/scenes/ThreadIndexing";

export const metadata = { title: "Thread Indexing — CUDA Visual Encyclopedia" };

export default function Page() {
  return (
    <main>
      <SceneShell id="thread-indexing">
        <ThreadIndexing />
      </SceneShell>
    </main>
  );
}
