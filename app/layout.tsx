import type { Metadata } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/shell/MotionProvider";
import TopBar from "@/components/shell/TopBar";

export const metadata: Metadata = {
  title: "AI Engineering Visual Encyclopedia",
  description: "See the machine think. Explore the living systems behind CUDA, inference, and AI engineering.",
  openGraph: {
    title: "AI Engineering Visual Encyclopedia",
    description: "See the machine think — an interactive visual atlas of AI engineering.",
    type: "website",
  },
};

export const viewport = { themeColor: "#04070A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2304070A'/%3E%3Crect x='6' y='6' width='9' height='9' rx='2' fill='%23A48FFF'/%3E%3Crect x='17' y='6' width='9' height='9' rx='2' fill='%235CC8FF'/%3E%3Crect x='6' y='17' width='9' height='9' rx='2' fill='%2346E3C8'/%3E%3Ccircle cx='21.5' cy='21.5' r='4.5' fill='%23FFC46B'/%3E%3C/svg%3E"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var r=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;var b=sessionStorage&&sessionStorage.getItem('cve-booted');if(!r&&!b)document.documentElement.classList.add('wantBoot');}catch(e){}",
          }}
        />
      </head>
      <body>
        <MotionProvider>
          <TopBar />
          {children}
          <footer className="site">
            <div className="wrap footIn">
              <span>
                AI ENGINEERING VISUAL ENCYCLOPEDIA · worlds: CUDA · INFERENCE · more coming
              </span>
              <span className="kicker">SEE THE MACHINE THINK</span>
            </div>
          </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
