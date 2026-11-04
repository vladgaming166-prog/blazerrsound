import type { ReactNode } from "react";
import { IconBoard, IconDashboard, IconKeys, IconMic, IconSettings, IconSounds, IconUser } from "./icons";
import { useApp, useRouting } from "../store/AppState";
import type { PageId } from "../lib/types";

const NAV: { id: PageId; label: string; icon: typeof IconDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "soundboard", label: "Soundboard", icon: IconBoard },
  { id: "sounds", label: "My Sounds", icon: IconSounds },
  { id: "keybinds", label: "Keybinds", icon: IconKeys },
  { id: "audio", label: "Audio Setup", icon: IconMic },
  { id: "settings", label: "Settings", icon: IconSettings },
  { id: "profile", label: "Profile", icon: IconUser }
];

export function Layout({ children }: { children: ReactNode }) {
  const { page, setPage, toasts } = useApp();
  const routing = useRouting();
  const routeClass = routing.state === "configured" ? "ok" : routing.state === "missing" ? "bad" : routing.state === "available" ? "warn" : "idle";
  const routeLabel =
    routing.state === "configured" ? "Routing via virtual cable" : routing.state === "available" ? "Virtual cable idle" : routing.state === "missing" ? "Cable missing" : "Speakers only";

  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <img src="./icon.png" alt="" width={38} height={38} style={{ borderRadius: 11 }} />
            <div className="brand-copy">
              <div className="brand-name">Sound<span>Blazerr</span></div>
              <div className="brand-sub">Windows soundboard</div>
            </div>
          </div>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-btn ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="sidebar-foot">
            <div className="route-pill">
              <strong><span className={`dot ${routeClass}`} />{routeLabel}</strong>
              <span style={{ color: "var(--muted)" }}>
                {routing.state === "configured" ? "Other apps hear the board only if their mic is the cable output." : "Not transmitting through a microphone."}
              </span>
            </div>
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === "err" ? "err" : "ok"}`}>{t.text}</div>
        ))}
      </div>
    </>
  );
}
