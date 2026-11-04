import { useState } from "react";
import { Button, Field, PasswordInput } from "../components/ui";
import { initials } from "../lib/format";
import { supabaseConfigured } from "../lib/supabase";
import { useApp } from "../store/AppState";

export function Profile() {
  const { user, config, signOut, toast } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const cloud = supabaseConfigured(config);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p>{cloud ? "Cloud session via Supabase." : "Local session stored only on this device."}</p>
        </div>
      </div>
      <section className="glass" style={{ padding: 22, maxWidth: 560 }}>
        <div className="row" style={{ marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent)", color: "#06210f", display: "grid", placeItems: "center", fontWeight: 800 }}>
            {initials(user?.name || "SB")}
          </div>
          <div>
            <strong>{user?.name}</strong>
            <div style={{ color: "var(--muted)" }}>{user?.email}</div>
            <div className="chip" style={{ marginTop: 6 }}>{user?.provider || "local"}</div>
          </div>
        </div>
        {user?.provider !== "google" && user?.provider !== "supabase" ? (
          <>
            <Field label="Display name">
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="New password">
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            </Field>
            <Button
              variant="primary"
              onClick={async () => {
                const result = await window.soundblazerr.updateProfile({ name, password: password || undefined });
                if (result.error) toast(result.error, "err");
                else toast("Profile updated on this device.");
              }}
            >
              Save profile
            </Button>
          </>
        ) : (
          <p className="notice">This account is managed by Supabase / Google. Name and password changes happen in that provider.</p>
        )}
        <div className="row" style={{ marginTop: 18 }}>
          <Button variant="danger" onClick={() => void signOut()}>Sign out</Button>
        </div>
      </section>
    </div>
  );
}
