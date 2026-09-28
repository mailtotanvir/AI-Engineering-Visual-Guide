"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { WORLDS, type World } from "@/content/worlds";
import { useMotion } from "./MotionProvider";

function SettingsModal({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}) {
  const { reduced, setReduced, density, setDensity } = useMotion();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        !popRef.current?.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("click", handleOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose, anchorRef]);

  return (
    <div
      ref={popRef}
      className={"pop" + (open ? " open" : "")}
      role="dialog"
      aria-label="Display settings"
      style={{ position: "fixed", top: 64, right: 24, zIndex: 90 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s3)" }}>
        <p className="popTitle" style={{ margin: 0 }}>DISPLAY SETTINGS</p>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", fontSize: 16 }}
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <div className="field">
        <span className="fieldLabel">Motion</span>
        <div className="seg" role="radiogroup" aria-label="Motion preference">
          <button
            type="button"
            role="radio"
            aria-checked={!reduced}
            onClick={() => setReduced(false)}
          >
            Full
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={reduced}
            onClick={() => setReduced(true)}
          >
            Reduced
          </button>
        </div>
      </div>

      <div className="field">
        <span className="fieldLabel">Visual density</span>
        <div className="seg" role="radiogroup" aria-label="Visual density">
          <button
            type="button"
            role="radio"
            aria-checked={density === "detailed"}
            onClick={() => setDensity("detailed")}
          >
            Detailed
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={density === "simplified"}
            onClick={() => setDensity("simplified")}
          >
            Simplified
          </button>
        </div>
      </div>

      <div className="field">
        <span className="fieldLabel">Sound FX</span>
        <div className="seg" role="radiogroup" aria-label="Sound FX">
          <button type="button" role="radio" aria-checked>Off</button>
          <button type="button" role="radio" aria-checked={false} disabled title="Ships in Phase 8">On</button>
        </div>
        <p className="hint">Audio synthesized waveforms — off by default.</p>
      </div>
    </div>
  );
}

function isWorldActive(world: World, pathname: string): boolean {
  if (!world.href) return false;
  if (world.id === "cuda" && (pathname.startsWith("/cuda") || pathname.startsWith("/scenes") || pathname.startsWith("/atlas") || pathname.startsWith("/descent") || pathname.startsWith("/launch"))) {
    return true;
  }
  return pathname.startsWith(world.href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const activeWorld = WORLDS.find((w) => isWorldActive(w, pathname));

  return (
    <div className="appLayout">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebarBackdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={"appSidebar" + (mobileMenuOpen ? " mobileOpen" : "")} aria-label="Main Navigation">
        <div className="sidebarHeader">
          <Link className="wordmark" href="/" aria-label="AI Engineering Visual Encyclopedia home">
            <span className="wmDie" aria-hidden="true"><i /><i /><i /><i /></span>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", color: "var(--ink)" }}>AI ENG</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-m)", letterSpacing: "0.18em", color: "var(--ink3)", textTransform: "uppercase" }}>VISUAL ENCYCLOPEDIA</span>
            </div>
          </Link>
          <button
            className="sidebarCloseBtn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div className="sidebarNavSection">
          <div className="sidebarKicker">
            <span>DISCIPLINES</span>
            <span className="sidebarKickerCount">7 WORLDS</span>
          </div>

          <nav className="sidebarNavList" aria-label="Encyclopedia worlds">
            {WORLDS.map((w, idx) => {
              const active = isWorldActive(w, pathname);
              const numStr = String(idx + 1).padStart(2, "0");

              if (w.status === "live" && w.href) {
                return (
                  <Link
                    key={w.id}
                    href={w.href}
                    className={"sidebarWorldItem live" + (active ? " active" : "")}
                    style={{ ["--w-accent" as string]: w.accent }}
                  >
                    <div className="sidebarWorldItemLeft">
                      <span className="sidebarWorldNum">{numStr}</span>
                      <span className="sidebarWorldIndicator" />
                    </div>
                    <div className="sidebarWorldInfo">
                      <div className="sidebarWorldNameRow">
                        <span className="sidebarWorldName">{w.name}</span>
                        <span className="sidebarStatusBadge live">LIVE</span>
                      </div>
                      <span className="sidebarWorldTag">{w.tagline}</span>
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={w.id}
                  className="sidebarWorldItem planned"
                  style={{ ["--w-accent" as string]: w.accent }}
                  title={`${w.name} — planned discipline`}
                >
                  <div className="sidebarWorldItemLeft">
                    <span className="sidebarWorldNum">{numStr}</span>
                    <span className="sidebarWorldIndicator" />
                  </div>
                  <div className="sidebarWorldInfo">
                    <div className="sidebarWorldNameRow">
                      <span className="sidebarWorldName">{w.name}</span>
                      <span className="sidebarStatusBadge planned">PLANNED</span>
                    </div>
                    <span className="sidebarWorldTag">{w.tagline}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="sidebarFooter">
          <Link
            href="/"
            className={"sidebarFootLink" + (pathname === "/" ? " active" : "")}
          >
            <span className="sidebarFootIcon">◈</span>
            <span>WORLD OBSERVATORY</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="appContentArea">
        {/* Sleek Top Header Bar */}
        <header className="appTopBar">
          <div className="appTopBarIn">
            <button
              className="mobileMenuToggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburgerLine" />
              <span className="hamburgerLine" />
              <span className="hamburgerLine" />
            </button>

            <div className="topBarTitle">
              {activeWorld ? (
                <div className="topBarWorldChip" style={{ borderColor: activeWorld.accent }}>
                  <i style={{ background: activeWorld.accent }} />
                  <span>{activeWorld.name.toUpperCase()}</span>
                </div>
              ) : (
                <span className="topBarHomeLabel">OBSERVATORY</span>
              )}
            </div>

            <div className="topBarActions">
              <button
                ref={settingsBtnRef}
                className="iconBtn"
                aria-haspopup="dialog"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <span aria-hidden="true">⚙</span> Settings
              </button>
            </div>
          </div>

          <SettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            anchorRef={settingsBtnRef}
          />
        </header>

        {/* Page Content */}
        <div className="appMainWrapper">
          {children}
        </div>

        {/* Footer */}
        <footer className="site">
          <div className="wrap footIn">
            <span>
              AI ENGINEERING VISUAL ENCYCLOPEDIA · 7 DISCIPLINES ACROSS SCALE
            </span>
            <span className="kicker">SEE THE MACHINE THINK</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
