import { useState } from "react";
import { Button, Modal, Toggle } from "../components/ui";
import { eventToAccelerator, shortcutConflict } from "../lib/shortcut-capture";
import { formatShortcut } from "../lib/format";
import { useApp } from "../store/AppState";
import type { SoundItem } from "../lib/types";

export function Keybinds() {
  const { config, updateSound, toast } = useApp();
  const [bind, setBind] = useState<SoundItem | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Keybinds</h1>
          <p>Global shortcuts stay registered while SoundBlazerr is minimized. Conflicting keys are blocked.</p>
        </div>
      </div>
      <table className="table glass" style={{ display: "table", width: "100%" }}>
        <thead>
          <tr><th>Sound</th><th>Shortcut</th><th>Enabled</th><th></th></tr>
        </thead>
        <tbody>
          {config.sounds.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.shortcut ? <span className="kbd">{formatShortcut(s.shortcut)}</span> : <span className="chip">Unassigned</span>}</td>
              <td>
                <Toggle
                  on={s.shortcutEnabled !== false}
                  onChange={(v) => void updateSound(s.id, { shortcutEnabled: v })}
                />
              </td>
              <td className="row">
                <Button onClick={() => { setBind(s); setDraft(s.shortcut); }}>Edit</Button>
                {s.shortcut ? <Button variant="danger" onClick={() => void updateSound(s.id, { shortcut: "" })}>Clear</Button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {config.sounds.length === 0 ? <div className="empty">Add sounds before assigning keys.</div> : null}
      {bind ? (
        <Modal
          title="Assign shortcut"
          onClose={() => setBind(null)}
          footer={
            <Button variant="primary" onClick={async () => {
              if (draft) {
                const clash = shortcutConflict(config.sounds, bind.id, draft);
                if (clash) return toast(`Already used by ${clash.name}`, "err");
              }
              const err = await updateSound(bind.id, { shortcut: draft, shortcutEnabled: true });
              if (err) toast(err, "err");
              else { toast("Shortcut saved."); setBind(null); }
            }}>Save mapping</Button>
          }
        >
          <p>Click the field and press the combination, for example Ctrl + Shift + 1.</p>
          <input
            readOnly
            value={formatShortcut(draft)}
            onKeyDown={(e) => {
              e.preventDefault();
              const acc = eventToAccelerator(e.nativeEvent);
              if (acc) setDraft(acc);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
