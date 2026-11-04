import { useMemo, useState } from "react";
import { SoundCard } from "../components/SoundCard";
import { Button, Modal, Field } from "../components/ui";
import { eventToAccelerator, shortcutConflict } from "../lib/shortcut-capture";
import { formatShortcut } from "../lib/format";
import { useApp } from "../store/AppState";
import type { SoundItem } from "../lib/types";

export function Soundboard() {
  const { config, query, setQuery, addSounds, importDropped, playing, stopAll, updateSound, toast } = useApp();
  const [category, setCategory] = useState("all");
  const [rename, setRename] = useState<SoundItem | null>(null);
  const [bind, setBind] = useState<SoundItem | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [drag, setDrag] = useState(false);

  const sounds = useMemo(() => {
    return config.sounds.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || s.name.toLowerCase().includes(q) || (s.shortcut || "").toLowerCase().includes(q);
      const matchC = category === "all" || s.categoryId === category;
      return matchQ && matchC;
    });
  }, [config.sounds, query, category]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); void importDropped(e.dataTransfer.files); }}
    >
      <div className="page-head">
        <div>
          <h1>Soundboard</h1>
          <p>{playing.length ? `${playing.length} playing` : "Idle"} · {config.sounds.length} loaded</p>
        </div>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="search" placeholder="Search sounds" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="primary" onClick={() => void addSounds()}>Add sounds</Button>
          {playing.length ? <Button onClick={stopAll}>Stop all</Button> : null}
        </div>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className={`btn ${category === "all" ? "primary" : ""}`} onClick={() => setCategory("all")}>All</button>
        {config.categories.map((c) => (
          <button key={c.id} className={`btn ${category === c.id ? "primary" : ""}`} onClick={() => setCategory(c.id)}>{c.name}</button>
        ))}
      </div>
      {drag ? <div className="drop active">Drop audio files to import</div> : null}
      {sounds.length === 0 ? (
        <div className="drop">
          No sounds yet. Add MP3, WAV, OGG, FLAC, M4A and more — or drop files here.
        </div>
      ) : (
        <div className="grid sound-grid">
          {sounds.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              onRename={(s) => { setRename(s); setDraftName(s.name); }}
              onShortcut={(s) => { setBind(s); setDraftKey(s.shortcut); }}
            />
          ))}
        </div>
      )}
      {rename ? (
        <Modal
          title="Rename sound"
          onClose={() => setRename(null)}
          footer={
            <>
              <Button onClick={() => setRename(null)}>Cancel</Button>
              <Button variant="primary" onClick={async () => { await updateSound(rename.id, { name: draftName.trim() || rename.name }); setRename(null); }}>Save</Button>
            </>
          }
        >
          <Field label="Name"><input value={draftName} onChange={(e) => setDraftName(e.target.value)} /></Field>
        </Modal>
      ) : null}
      {bind ? (
        <Modal
          title={`Shortcut · ${bind.name}`}
          onClose={() => setBind(null)}
          footer={
            <>
              <Button onClick={async () => { await updateSound(bind.id, { shortcut: "" }); setBind(null); }}>Remove</Button>
              <Button variant="primary" onClick={async () => {
                if (draftKey) {
                  const clash = shortcutConflict(config.sounds, bind.id, draftKey);
                  if (clash) return toast(`Already used by ${clash.name}`, "err");
                }
                const err = await updateSound(bind.id, { shortcut: draftKey });
                if (err) toast(err, "err");
                else setBind(null);
              }}>Save</Button>
            </>
          }
        >
          <p>Press a combination. Global shortcuts work while the app is minimized.</p>
          <input
            readOnly
            value={formatShortcut(draftKey)}
            onKeyDown={(e) => {
              e.preventDefault();
              const acc = eventToAccelerator(e.nativeEvent);
              if (acc) setDraftKey(acc);
            }}
            placeholder="Press keys"
          />
        </Modal>
      ) : null}
    </div>
  );
}
