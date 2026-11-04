import { IconPlay, IconStop } from "./icons";
import { formatDuration, formatShortcut } from "../lib/format";
import type { SoundItem } from "../lib/types";
import { useApp } from "../store/AppState";

export function SoundCard({
  sound,
  onRename,
  onShortcut
}: {
  sound: SoundItem;
  onRename?: (sound: SoundItem) => void;
  onShortcut?: (sound: SoundItem) => void;
}) {
  const { config, playing, playSound, deleteSound, updateSound } = useApp();
  const active = playing.some((p) => p.id === sound.id);
  const cat = config.categories.find((c) => c.id === sound.categoryId);

  return (
    <article className={`sound-card glass ${active ? "playing" : ""} ${config.compactCards ? "compact" : ""}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="eq" aria-hidden>
          <i /><i /><i /><i />
        </div>
        {config.appearance.showShortcuts && sound.shortcut ? <span className="kbd">{formatShortcut(sound.shortcut)}</span> : <span />}
      </div>
      <div className="sound-name">{sound.name}</div>
      <div className="sound-meta">
        <span className="chip" style={{ borderColor: cat?.color || "var(--line)" }}>{cat?.name || "General"}</span>
        {config.appearance.showDurations ? <span>{formatDuration(sound.duration)}</span> : null}
      </div>
      <input
        className="vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={sound.volume}
        onChange={(e) => void updateSound(sound.id, { volume: Number(e.target.value) })}
        aria-label="Volume"
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={() => void playSound(sound)}>
          {active ? <IconStop /> : <IconPlay />} {active ? "Stop" : "Play"}
        </button>
        <button className="btn ghost" onClick={() => onRename?.(sound)}>Rename</button>
        <button className="btn ghost" onClick={() => onShortcut?.(sound)}>Key</button>
        <button className="btn danger" onClick={() => void deleteSound(sound.id)}>Delete</button>
      </div>
    </article>
  );
}
