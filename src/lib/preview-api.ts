import type { AppConfig, AuthUser, SoundItem } from "./types";

const KEY = "soundblazerr-preview-config";

function defaults(): AppConfig {
  return {
    setupComplete: false,
    theme: "midnight",
    reduceMotion: false,
    compactCards: false,
    launchOnStartup: false,
    minimizeToTray: true,
    startMinimized: false,
    listenLocally: true,
    listenLocalVolume: 0.7,
    audio: {
      inputDeviceId: "",
      outputDeviceId: "",
      virtualDeviceId: "",
      inputVolume: 0.85,
      outputVolume: 0.9,
      monitorMic: false,
      routeToVirtual: false
    },
    supabase: { url: "", anonKey: "" },
    appearance: { cardGlow: true, showDurations: true, showShortcuts: true },
    categories: [
      { id: "general", name: "General", color: "#39FF72" },
      { id: "music", name: "Music", color: "#5EEAD4" },
      { id: "memes", name: "Memes", color: "#A3E635" },
      { id: "alerts", name: "Alerts", color: "#86EFAC" }
    ],
    sounds: [],
    recentSoundIds: []
  };
}

export function installPreviewApi() {
  if (typeof window === "undefined" || window.soundblazerr) return;
  let config = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) config = { ...defaults(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const blobs = new Map<string, string>();
  let user: AuthUser | null = JSON.parse(localStorage.getItem("sb-user") || "null");
  const shortcutHandlers: Array<(p: { soundId: string; accelerator: string }) => void> = [];

  const persist = () => localStorage.setItem(KEY, JSON.stringify(config));

  window.soundblazerr = {
    getConfig: async () => config,
    saveConfig: async (partial) => {
      config = {
        ...config,
        ...partial,
        audio: { ...config.audio, ...(partial.audio || {}) },
        supabase: { ...config.supabase, ...(partial.supabase || {}) },
        appearance: { ...config.appearance, ...(partial.appearance || {}) }
      };
      persist();
      return config;
    },
    resetConfig: async () => {
      config = defaults();
      persist();
      return config;
    },
    exportBoard: async () => ({ canceled: true }),
    importBoard: async () => ({ canceled: true }),
    addSounds: async () => [],
    importSoundPaths: async () => [],
    writeSoundBuffer: async (payload) => {
      const id = crypto.randomUUID();
      const blob = new Blob([payload.bytes], { type: payload.mime || "audio/mpeg" });
      blobs.set(id, URL.createObjectURL(blob));
      const sound: SoundItem = {
        id,
        name: payload.name.replace(/\.[^.]+$/, ""),
        fileName: payload.name,
        duration: 0,
        volume: 0.85,
        categoryId: "general",
        shortcut: "",
        shortcutEnabled: true,
        color: "#39FF72",
        createdAt: Date.now(),
        lastPlayedAt: 0,
        bytes: payload.bytes.byteLength
      };
      config.sounds.push(sound);
      persist();
      return sound;
    },
    deleteSound: async (id) => {
      config.sounds = config.sounds.filter((s) => s.id !== id);
      persist();
      return config;
    },
    updateSound: async (id, patch) => {
      if (patch.shortcut) {
        const clash = config.sounds.find((s) => s.id !== id && s.shortcut && s.shortcut.toLowerCase() === String(patch.shortcut).toLowerCase());
        if (clash) return { error: `Shortcut already used by “${clash.name}”.`, config };
      }
      config.sounds = config.sounds.map((s) => (s.id === id ? { ...s, ...patch } : s));
      persist();
      return { config };
    },
    getSoundUrl: async (id) => blobs.get(id) || "",
    getTestToneUrl: async () => "./test-tone.wav",
    minimize: async () => undefined,
    maximize: async () => false,
    close: async () => "close",
    isMaximized: async () => false,
    onMaximized: () => () => undefined,
    getVersion: async () => "1.0.0-preview",
    openExternal: async (url) => {
      window.open(url, "_blank");
      return true;
    },
    setAutoLaunch: async () => config,
    getAutoLaunch: async () => ({}),
    openUserData: async () => "",
    showSoundInFolder: async () => undefined,
    setShortcuts: async () => ({ config }),
    onShortcut: (handler) => {
      shortcutHandlers.push(handler);
      return () => undefined;
    },
    register: async ({ email, password, name }) => {
      if (password.length < 8) return { error: "Password must be at least 8 characters." };
      user = { id: "local", email, name: name || email.split("@")[0], provider: "local" };
      localStorage.setItem("sb-user", JSON.stringify(user));
      return { user, mode: "local" };
    },
    login: async ({ email, password }) => {
      if (password.length < 8) return { error: "Password must be at least 8 characters." };
      user = { id: "local", email, name: email.split("@")[0], provider: "local" };
      localStorage.setItem("sb-user", JSON.stringify(user));
      return { user, mode: "local" };
    },
    continueLocal: async () => {
      user = { id: "guest", email: "local@soundblazerr", name: "Local Player", provider: "guest" };
      localStorage.setItem("sb-user", JSON.stringify(user));
      return { user, mode: "local" };
    },
    logout: async () => {
      user = null;
      localStorage.removeItem("sb-user");
      return { ok: true };
    },
    session: async () => ({ user, mode: "local" }),
    forgotPassword: async ({ password }) => {
      if (password.length < 8) return { error: "New password must be at least 8 characters." };
      return { ok: true, message: "Password updated in preview mode." };
    },
    updateProfile: async () => ({ user: user || undefined }),
    startGoogleOAuth: async () => ({
      error: "Google sign-in needs a real OAuth setup. Preview mode cannot complete Google login."
    }),
    onAuthCallback: () => () => undefined,
    platform: "linux"
  };
}
