import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "./types";

export function supabaseConfigured(config?: Pick<AppConfig, "supabase"> | null): boolean {
  const url = (config?.supabase?.url || import.meta.env.VITE_SUPABASE_URL || "").trim();
  const key = (config?.supabase?.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  return /^https?:\/\//.test(url) && key.length > 20;
}

export function getSupabase(config?: Pick<AppConfig, "supabase"> | null): SupabaseClient | null {
  const url = (config?.supabase?.url || import.meta.env.VITE_SUPABASE_URL || "").trim();
  const key = (config?.supabase?.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseConfigured({ supabase: { url, anonKey: key } })) return null;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce"
    }
  });
}

export function googleSetupMessage(): string {
  return "Google sign-in needs a real OAuth setup. Create a Supabase project, enable the Google provider, add your Client ID and Secret, then paste the project URL and anon key in Settings → Account. Also add soundblazerr://auth/callback to the redirect allow list. Until then, use email/password or local mode — SoundBlazerr will not fake a Google login.";
}
