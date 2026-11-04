import { Button } from "../components/ui";
import { prettyDevice } from "../lib/format";
import { useApp, useRouting } from "../store/AppState";

export function Dashboard() {
  const { user, config, playing, devices, setPage, playSound, stopAll } = useApp();
  const routing = useRouting();
  const mic = devices.find((d) => d.deviceId === config.audio.inputDeviceId && d.kind === "audioinput");
  const recent = config.recentSoundIds
    .map((id) => config.sounds.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user?.name || "Blazer"}.</h1>
          <p>Your board is local, fast, and only routes through a microphone when a virtual cable is actually selected.</p>
        </div>
        <div className="row">
          <Button variant="primary" onClick={() => setPage("soundboard")}>Open soundboard</Button>
          {playing.length ? <Button onClick={stopAll}>Stop all</Button> : null}
        </div>
      </div>
      <div className="grid stats">
        <div className="stat glass"><div className="k">Uploaded sounds</div><div className="v">{config.sounds.length}</div></div>
        <div className="stat glass"><div className="k">Currently playing</div><div className="v">{playing.length}</div></div>
        <div className="stat glass"><div className="k">Microphone</div><div className="v" style={{ fontSize: 16 }}>{prettyDevice(mic?.label || "", "System default")}</div></div>
        <div className="stat glass">
          <div className="k">Audio routing</div>
          <div className="v" style={{ fontSize: 16, textTransform: "capitalize" }}>{routing.state === "configured" ? "Virtual cable" : routing.state === "available" ? "Cable idle" : routing.state === "missing" ? "Cable missing" : "Speakers only"}</div>
        </div>
      </div>
      <p className={`notice ${routing.state === "configured" ? "" : "warn"}`} style={{ marginTop: 16 }}>{routing.message}</p>
      <div className="grid" style={{ gridTemplateColumns: "1.2fr 0.8fr", marginTop: 18 }}>
        <section className="glass" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Recently used</h3>
          {recent.length === 0 ? <div className="empty">Play a sound and it will land here.</div> : (
            <div className="playing-list">
              {recent.map((s) => s && (
                <div key={s.id} className="row" style={{ justifyContent: "space-between" }}>
                  <span>{s.name}</span>
                  <Button onClick={() => void playSound(s)}>Play</Button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="glass" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Now playing</h3>
          {playing.length === 0 ? <div className="empty">Nothing playing.</div> : playing.map((p) => (
            <div key={p.id} className="row" style={{ justifyContent: "space-between" }}><span>{p.name}</span><span className="chip">Live</span></div>
          ))}
          <div className="row" style={{ marginTop: 16 }}>
            <Button onClick={() => setPage("audio")}>Audio setup</Button>
            <Button onClick={() => setPage("keybinds")}>Keybinds</Button>
            <Button onClick={() => setPage("settings")}>Settings</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
