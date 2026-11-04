import { useEffect, useState } from "react";
import { Button, Field, Modal, Toggle } from "../components/ui";
import { useApp } from "../store/AppState";
import type { ThemeId } from "../lib/types";

const SECTIONS = ["General", "Audio", "Microphone", "Keyboard", "Appearance", "Account", "About"] as const;

export function Settings() {
  const { config, save, setPage, toast, user } = useApp();
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("General");
  const [confirmReset, setConfirmReset] = useState(false);
  const [version, setVersion] = useState("1.0.0");

  useEffect(() => {
    void window.soundblazerr.getVersion().then(setVersion);
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Everything is stored locally in this Windows profile.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="side-links">
          {SECTIONS.map((s) => (
            <button key={s} className={`nav-btn ${section === s ? "active" : ""}`} onClick={() => setSection(s)}>{s}</button>
          ))}
        </nav>
        <section className="glass" style={{ padding: 20 }}>
          {section === "General" && (
            <>
              <Toggle label="Launch on Windows startup" on={config.launchOnStartup} onChange={(v) => void save({ launchOnStartup: v })} />
              <Toggle label="Minimize to system tray" on={config.minimizeToTray} onChange={(v) => void save({ minimizeToTray: v })} />
              <Toggle label="Start minimized" on={config.startMinimized} onChange={(v) => void save({ startMinimized: v })} />
              <div className="row" style={{ marginTop: 16 }}>
                <Button onClick={async () => { const r = await window.soundblazerr.exportBoard(); if (!r.canceled) toast("Backup exported."); }}>Export board</Button>
                <Button onClick={async () => { const r = await window.soundblazerr.importBoard(); if (!r.canceled) toast(`Imported ${r.imported || 0} sounds.`); }}>Import board</Button>
                <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset configuration</Button>
              </div>
            </>
          )}
          {section === "Audio" && (
            <>
              <p>Output, virtual routing, and listen-through live on the Audio Setup page so device status stays in one place.</p>
              <Button variant="primary" onClick={() => setPage("audio")}>Open Audio Setup</Button>
              <Field label={`Master output ${Math.round(config.audio.outputVolume * 100)}%`}>
                <input className="vol" type="range" min={0} max={1} step={0.01} value={config.audio.outputVolume} onChange={(e) => void save({ audio: { ...config.audio, outputVolume: Number(e.target.value) } })} />
              </Field>
            </>
          )}
          {section === "Microphone" && (
            <>
              <Toggle label="Monitor microphone" on={config.audio.monitorMic} onChange={(v) => void save({ audio: { ...config.audio, monitorMic: v } })} />
              <Field label={`Input volume ${Math.round(config.audio.inputVolume * 100)}%`}>
                <input className="vol" type="range" min={0} max={1} step={0.01} value={config.audio.inputVolume} onChange={(e) => void save({ audio: { ...config.audio, inputVolume: Number(e.target.value) } })} />
              </Field>
              <Button onClick={() => setPage("audio")}>Choose devices</Button>
            </>
          )}
          {section === "Keyboard" && (
            <>
              <p>Shortcuts are global via Electron’s globalShortcut API. Disable a mapping on the Keybinds page without deleting it.</p>
              <Button variant="primary" onClick={() => setPage("keybinds")}>Edit keybinds</Button>
            </>
          )}
          {section === "Appearance" && (
            <>
              <Field label="Theme">
                <select value={config.theme} onChange={(e) => void save({ theme: e.target.value as ThemeId })}>
                  <option value="midnight">Midnight</option>
                  <option value="charcoal">Charcoal</option>
                  <option value="contrast">High contrast</option>
                  <option value="day">Day</option>
                </select>
              </Field>
              <Toggle label="Compact sound cards" on={config.compactCards} onChange={(v) => void save({ compactCards: v })} />
              <Toggle label="Reduce motion" on={config.reduceMotion} onChange={(v) => void save({ reduceMotion: v })} />
              <Toggle label="Card glow while playing" on={config.appearance.cardGlow} onChange={(v) => void save({ appearance: { ...config.appearance, cardGlow: v } })} />
              <Toggle label="Show durations" on={config.appearance.showDurations} onChange={(v) => void save({ appearance: { ...config.appearance, showDurations: v } })} />
              <Toggle label="Show shortcuts on cards" on={config.appearance.showShortcuts} onChange={(v) => void save({ appearance: { ...config.appearance, showShortcuts: v } })} />
            </>
          )}
          {section === "Account" && (
            <>
              <p>Signed in as {user?.email || user?.name || "local session"} ({user?.provider || "local"}).</p>
              <Field label="Supabase URL">
                <input value={config.supabase.url} onChange={(e) => void save({ supabase: { ...config.supabase, url: e.target.value } })} placeholder="https://xxxx.supabase.co" />
              </Field>
              <Field label="Supabase anon key">
                <input value={config.supabase.anonKey} onChange={(e) => void save({ supabase: { ...config.supabase, anonKey: e.target.value } })} />
              </Field>
              <p className="notice">Google login uses the real Supabase OAuth flow. It will not succeed until the Google provider and redirect URL soundblazerr://auth/callback are configured in your project.</p>
              <Button onClick={() => setPage("profile")}>Open profile</Button>
            </>
          )}
          {section === "About" && (
            <>
              <h2 style={{ marginTop: 0 }}>SoundBlazerr {version}</h2>
              <p>Premium Windows soundboard. Sounds, shortcuts, and settings stay on this computer. Virtual routing requires a real cable such as VB-CABLE.</p>
              <div className="row">
                <Button onClick={() => void window.soundblazerr.openUserData()}>Open data folder</Button>
                <Button onClick={() => void window.soundblazerr.openExternal("https://vb-audio.com/Cable/")}>VB-CABLE</Button>
              </div>
            </>
          )}
        </section>
      </div>
      {confirmReset ? (
        <Modal
          title="Reset SoundBlazerr?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                const next = await window.soundblazerr.resetConfig();
                await save(next);
                setConfirmReset(false);
                toast("Configuration reset.");
              }}>Reset everything</Button>
            </>
          }
        >
          <p>This deletes saved sounds, categories, shortcuts, and audio preferences on this PC. Your Windows user account is not removed.</p>
        </Modal>
      ) : null}
    </div>
  );
}
