import AtlasBrowser from "@/components/atlas/AtlasBrowser";

export const metadata = { title: "CUDA Atlas — CUDA Visual Encyclopedia" };

export default function AtlasPage() {
  return (
    <main>
      <section className="sceneSec" aria-label="CUDA encyclopedia atlas">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            CUDA <i>/</i> <b>ATLAS</b>
          </nav>
          <div className="sec-head" style={{ marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker"><b>THE ATLAS</b> · SEVEN DOMAINS · EVERY CONCEPT</p>
              <h2 className="sec-title">The whole machine, mapped.</h2>
              <p className="sec-sub">
                Reference coverage of the full CUDA surface: hardware, threads, memory,
                performance, asynchrony, tooling and libraries — exhibits where seeing beats reading.
              </p>
            </div>
          </div>
          <AtlasBrowser />
        </div>
      </section>
    </main>
  );
}
