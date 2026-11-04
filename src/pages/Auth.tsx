import { useEffect, useState } from "react";
import { Button, Field, PasswordInput } from "../components/ui";
import { IconGoogle } from "../components/icons";
import { getSupabase, googleSetupMessage, supabaseConfigured } from "../lib/supabase";
import { useApp } from "../store/AppState";

export function Auth() {
  const { config, save, setUser, toast } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgot, setForgot] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const cloud = supabaseConfigured(config);

  useEffect(() => {
    const off = window.soundblazerr.onAuthCallback(async ({ url }) => {
      const client = getSupabase(config);
      if (!client) return;
      try {
        const normalized = url.replace(/^soundblazerr:/, "https://auth.soundblazerr.local");
        const parsed = new URL(normalized);
        const code = parsed.searchParams.get("code");
        const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
        if (code) {
          const { error: ex } = await client.auth.exchangeCodeForSession(code);
          if (ex) throw ex;
        } else if (hash.get("access_token")) {
          const { error: se } = await client.auth.setSession({
            access_token: hash.get("access_token") || "",
            refresh_token: hash.get("refresh_token") || ""
          });
          if (se) throw se;
        } else {
          throw new Error("Google did not return a session. Check the redirect URL in Supabase.");
        }
        const { data } = await client.auth.getUser();
        const s = data.user;
        if (s) {
          setUser({
            id: s.id,
            email: s.email || "",
            name: (s.user_metadata?.name as string) || s.email?.split("@")[0] || "Account",
            provider: "google"
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
      }
    });
    return off;
  }, [config, setUser]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const client = getSupabase(config);
      if (client) {
        if (mode === "register") {
          const { data, error: err } = await client.auth.signUp({ email, password, options: { data: { name } } });
          if (err) throw err;
          if (data.user && !data.session) {
            setInfo("Check your inbox to confirm the account, then sign in. If email confirmation is disabled in Supabase, you can sign in immediately.");
            setMode("login");
            return;
          }
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || email,
              name: name || email.split("@")[0],
              provider: "supabase"
            });
          }
        } else {
          const { data, error: err } = await client.auth.signInWithPassword({ email, password });
          if (err) throw err;
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || email,
              name: (data.user.user_metadata?.name as string) || email.split("@")[0],
              provider: "supabase"
            });
          }
        }
        return;
      }
      const fn = mode === "register" ? window.soundblazerr.register : window.soundblazerr.login;
      const result = await fn({ email, password, name });
      if (result.error) setError(result.error);
      else if (result.user) setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    if (!cloud) {
      setError(googleSetupMessage());
      return;
    }
    setBusy(true);
    try {
      const client = getSupabase(config)!;
      const { data, error: err } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { skipBrowserRedirect: true, redirectTo: "soundblazerr://auth/callback" }
      });
      if (err) throw err;
      if (!data.url) throw new Error(googleSetupMessage());
      const opened = await window.soundblazerr.startGoogleOAuth({ url: data.url });
      if (opened.error) setError(opened.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : googleSetupMessage());
    } finally {
      setBusy(false);
    }
  }

  async function resetLocal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const client = getSupabase(config);
    setBusy(true);
    try {
      if (client) {
        const { error: err } = await client.auth.resetPasswordForEmail(email);
        if (err) throw err;
        setInfo("If that email exists in Supabase, a reset message was sent.");
        setForgot(false);
        return;
      }
      const result = await window.soundblazerr.forgotPassword({ email, password: newPassword });
      if (result.error) setError(result.error);
      else {
        setInfo(result.message || "Password updated on this device.");
        setForgot(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <img src="./icon.png" width={72} height={72} alt="" style={{ borderRadius: 18, marginBottom: 24 }} />
        <h1>
          Sound<span>Blazerr</span>
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 420, fontSize: 16, lineHeight: 1.5 }}>
          A premium Windows soundboard with real device routing, global keybinds, and honest microphone status.
        </p>
      </div>
      <div className="auth-panel">
        <form className="auth-card glass" onSubmit={forgot ? resetLocal : submit}>
          <div className="tabs">
            <button type="button" className={!forgot && mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setForgot(false); }}>
              Login
            </button>
            <button type="button" className={!forgot && mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setForgot(false); }}>
              Register
            </button>
          </div>
          {forgot ? (
            <>
              <h2 style={{ marginTop: 0 }}>Forgot password</h2>
              <p className="notice" style={{ marginBottom: 14 }}>
                {cloud
                  ? "Supabase will email a reset link if the account exists."
                  : "Local mode cannot send email. Enter this device account email and a new password to update it here only."}
              </p>
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              {!cloud ? (
                <Field label="New password">
                  <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
                </Field>
              ) : null}
            </>
          ) : (
            <>
              {mode === "register" ? (
                <Field label="Name">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
              ) : null}
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" autoComplete="email" />
              </Field>
              <Field label="Password">
                <PasswordInput value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </Field>
            </>
          )}
          {error ? <p className="notice bad">{error}</p> : null}
          {info ? <p className="notice">{info}</p> : null}
          <div className="row" style={{ marginTop: 16 }}>
            <Button variant="primary" type="submit" disabled={busy} style={{ flex: 1, justifyContent: "center" }}>
              {busy ? "Please wait…" : forgot ? "Reset password" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </div>
          {!forgot ? (
            <button type="button" className="btn ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setForgot(true)}>
              Forgot password
            </button>
          ) : (
            <button type="button" className="btn ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setForgot(false)}>
              Back to login
            </button>
          )}
          <button type="button" className="btn" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={google} disabled={busy}>
            <IconGoogle /> Continue with Google
          </button>
          {!cloud ? <p className="notice warn" style={{ marginTop: 10 }}>{googleSetupMessage()}</p> : null}
          <Button
            type="button"
            variant="ghost"
            style={{ width: "100%", marginTop: 8 }}
            onClick={async () => {
              const result = await window.soundblazerr.continueLocal();
              if (result.user) {
                setUser(result.user);
                toast("Local mode is fully usable without cloud accounts.");
              }
            }}
          >
            Continue in local / demo mode
          </Button>
          {!cloud ? (
            <details style={{ marginTop: 12, color: "var(--muted)", fontSize: 12 }}>
              <summary>Paste Supabase credentials</summary>
              <Field label="Project URL">
                <input
                  value={config.supabase.url}
                  onChange={(e) => void save({ supabase: { ...config.supabase, url: e.target.value } })}
                  placeholder="https://xxxx.supabase.co"
                />
              </Field>
              <Field label="Anon key">
                <input
                  value={config.supabase.anonKey}
                  onChange={(e) => void save({ supabase: { ...config.supabase, anonKey: e.target.value } })}
                  placeholder="eyJ..."
                />
              </Field>
            </details>
          ) : null}
        </form>
      </div>
    </div>
  );
}
