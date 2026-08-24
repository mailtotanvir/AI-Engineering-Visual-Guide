import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "72vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", padding: "var(--s6)" }}>
        <p className="kicker"><b>404</b> · OFF THE MAP</p>
        <h1 className="sec-title" style={{ margin: "var(--s3) 0 var(--s5)" }}>
          This memory address was never written.
        </h1>
        <Link className="btn btnPrimary" href="/">BACK TO THE MACHINE</Link>
      </div>
    </main>
  );
}
