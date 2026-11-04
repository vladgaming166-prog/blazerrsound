import { useState } from "react";
import { Button, Field, Modal } from "../components/ui";
import { bytesLabel, formatDuration } from "../lib/format";
import { useApp } from "../store/AppState";

export function MySounds() {
  const { config, save, addSounds, deleteSound, updateSound, toast } = useApp();
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);

  async function addCategory() {
    const name = catName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    await save({ categories: [...config.categories, { id, name, color: "#39FF72" }] });
    setCatName("");
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Sounds</h1>
          <p>Organize the local library. Files live in this PC’s SoundBlazerr data folder.</p>
        </div>
        <Button variant="primary" onClick={() => void addSounds()}>Upload sounds</Button>
      </div>
      <section className="glass" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Categories</h3>
        <div className="row">
          <input placeholder="New category" value={catName} onChange={(e) => setCatName(e.target.value)} style={{ maxWidth: 240 }} />
          <Button onClick={addCategory}>Add category</Button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {config.categories.map((c) => (
            <span key={c.id} className="chip">
              {c.name}
              <button className="btn ghost" style={{ padding: "0 6px" }} onClick={() => { setEditingCat(c.id); setCatName(c.name); }}>Edit</button>
              {c.id !== "general" ? (
                <button className="btn danger" style={{ padding: "0 6px" }} onClick={async () => {
                  const sounds = config.sounds.map((s) => s.categoryId === c.id ? { ...s, categoryId: "general" } : s);
                  await save({ categories: config.categories.filter((x) => x.id !== c.id), sounds });
                }}>×</button>
              ) : null}
            </span>
          ))}
        </div>
      </section>
      <table className="table glass" style={{ padding: 8, display: "table" }}>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Duration</th><th>Size</th><th></th></tr>
        </thead>
        <tbody>
          {config.sounds.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <select value={s.categoryId} onChange={(e) => void updateSound(s.id, { categoryId: e.target.value })}>
                  {config.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td>{formatDuration(s.duration)}</td>
              <td>{bytesLabel(s.bytes)}</td>
              <td className="row">
                <Button onClick={() => void window.soundblazerr.showSoundInFolder(s.id)}>Show file</Button>
                <Button variant="danger" onClick={() => void deleteSound(s.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {config.sounds.length === 0 ? <div className="empty">Your library is empty.</div> : null}
      {editingCat ? (
        <Modal
          title="Rename category"
          onClose={() => setEditingCat(null)}
          footer={
            <Button variant="primary" onClick={async () => {
              await save({ categories: config.categories.map((c) => c.id === editingCat ? { ...c, name: catName || c.name } : c) });
              setEditingCat(null);
              setCatName("");
              toast("Category updated.");
            }}>Save</Button>
          }
        >
          <Field label="Name"><input value={catName} onChange={(e) => setCatName(e.target.value)} /></Field>
        </Modal>
      ) : null}
    </div>
  );
}
