import Link from "next/link";
import InfraAtlasBrowser from "@/components/infra/InfraAtlasBrowser";
import { INFRA_DOMAINS, INFRA_TOPICS } from "@/content/infra/atlas";

export const metadata = { title: "Infrastructure Atlas — Visual Encyclopedia" };

export default function InfraAtlasPage() {
  const sceneCount = INFRA_TOPICS.filter((t) => t.kind === "scene").length;
  const conceptCount = INFRA_TOPICS.filter((t) => t.kind === "concept").length;

  return (
    <main>
      <section className="hero heroSec" aria-label="Infrastructure Atlas">
        <div className="heroGridBg" aria-hidden="true" />
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/infra/">INFRASTRUCTURE</Link> <i>/</i> <b>ATLAS</b>
          </nav>
          <div className="sec-head" style={{ marginTop: "var(--s3)", marginBottom: "var(--s4)" }}>
            <div>
              <p className="kicker">
                <b>WORLD 06 ATLAS</b> · {INFRA_DOMAINS.length} DOMAINS · {sceneCount} SCENES · {conceptCount} CONCEPTS
              </p>
              <h1 className="heroTitle">
                The Infrastructure Reference — <em>every cluster engineering concept</em>.
              </h1>
              <p className="lede">
                An exhaustive taxonomy spanning silicon node layouts, lossless fabric topologies, direct-to-chip cooling,
                distributed checkpoint storage, gang schedulers, and FinOps unit economics.
              </p>
            </div>
          </div>

          <InfraAtlasBrowser />
        </div>
      </section>
    </main>
  );
}
