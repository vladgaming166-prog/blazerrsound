import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppConfig, AuthUser, MediaDev, PageId, PlayingSound, SoundItem } from "../lib/types";
import { audioEngine } from "../lib/audio-engine";
import { getSupabase, supabaseConfigured } from "../lib/supabase";
import { routingState } from "../lib/format";

type Toast = { id: number; text: string; kind?: "ok" | "err" };

interface AppCtx {
  ready: boolean;
  config: AppConfig;
  user: AuthUser | null;
  page: PageId;
  setPage: (p: PageId) => void;
  devices: MediaDev[];
  playing: PlayingSound[];
  toasts: Toast[];
  toast: (text: string, kind?: "ok" | "err") => void;
  query: string;
  setQuery: (q: string) => void;
  refreshDevices: () => Promise<MediaDev[]>;
  save: (partial: Partial<AppConfig>) => Promise<void>;
  playSound: (sound: SoundItem) => Promise<void>;
  stopSound: (id: string) => Promise<void>;
  stopAll: () => void;
  addSounds: () => Promise<void>;
  importDropped: (files: FileList | File[]) => Promise<void>;
  deleteSound: (id: string) => Promise<void>;
  updateSound: (id: string, patch: Partial<SoundItem>) => Promise<string | null>;
  setUser: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

const emptyConfig: AppConfig = {
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
  categories: [],
  sounds: [],
  recentSoundIds: []
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<PageId>("dashboard");
  const [devices, setDevices] = useState<MediaDev[]>([]);
  const [playing, setPlaying] = useState<PlayingSound[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [query, setQuery] = useState("");

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const applyEngine = useCallback((cfg: AppConfig) => {
    audioEngine.outputDeviceId = cfg.audio.outputDeviceId;
    audioEngine.virtualDeviceId = cfg.audio.virtualDeviceId;
    audioEngine.routeToVirtual = cfg.audio.routeToVirtual;
    audioEngine.listenLocally = cfg.listenLocally;
    audioEngine.masterVolume = cfg.audio.outputVolume;
    audioEngine.listenVolume = cfg.listenLocalVolume;
    audioEngine.setMicVolume(cfg.audio.inputVolume);
    void audioEngine.refreshOutputRouting();
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mapped = list
        .filter((d) => d.kind === "audioinput" || d.kind === "audiooutput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || (d.kind === "audioinput" ? "Microphone" : "Speakers"),
          kind: d.kind,
          groupId: d.groupId
        }));
      setDevices(mapped);
      return mapped;
    } catch {
      return [];
    }
  }, []);

  const hydrateUrls = useCallback(async (sounds: SoundItem[]) => {
    await Promise.all(
      sounds.map(async (s) => {
        const url = await window.soundblazerr.getSoundUrl(s.id);
        audioEngine.setUrl(s.id, url);
      })
    );
  }, []);

  const save = useCallback(
    async (partial: Partial<AppConfig>) => {
      const next = await window.soundblazerr.saveConfig(partial);
      setConfig(next);
      applyEngine(next);
      document.documentElement.dataset.theme = next.theme;
      document.documentElement.dataset.reduce = next.reduceMotion ? "true" : "false";
    },
    [applyEngine]
  );

  const playSound = useCallback(
    async (sound: SoundItem) => {
      try {
        if (audioEngine.isPlaying(sound.id)) {
          await audioEngine.stop(sound.id);
          return;
        }
        await audioEngine.play(sound);
        const recent = [sound.id, ...config.recentSoundIds.filter((id) => id !== sound.id)].slice(0, 8);
        const sounds = config.sounds.map((s) => (s.id === sound.id ? { ...s, lastPlayedAt: Date.now() } : s));
        await save({ recentSoundIds: recent, sounds });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Could not play this sound.", "err");
      }
    },
    [config.recentSoundIds, config.sounds, save, toast]
  );

  const measureDuration = useCallback(async (sound: SoundItem) => {
    const url = await window.soundblazerr.getSoundUrl(sound.id);
    audioEngine.setUrl(sound.id, url);
    await new Promise<void>((resolve) => {
      const a = new Audio(url);
      a.addEventListener("loadedmetadata", () => {
        void window.soundblazerr.updateSound(sound.id, { duration: a.duration || 0 });
        resolve();
      });
      a.addEventListener("error", () => resolve());
    });
  }, []);

  const addSounds = useCallback(async () => {
    const added = await window.soundblazerr.addSounds();
    if (!added.length) return;
    await Promise.all(added.map(measureDuration));
    const next = await window.soundblazerr.getConfig();
    setConfig(next);
    await hydrateUrls(next.sounds);
    toast(`${added.length} sound${added.length === 1 ? "" : "s"} added.`);
  }, [hydrateUrls, measureDuration, toast]);

  const importDropped = useCallback(
    async (files: FileList | File[]) => {
      const list = [...files];
      const paths = list.map((f) => (f as File & { path?: string }).path).filter(Boolean) as string[];
      let added: SoundItem[] = [];
      if (paths.length) added = await window.soundblazerr.importSoundPaths(paths);
      else {
        for (const file of list) {
          const buf = await file.arrayBuffer();
          added.push(await window.soundblazerr.writeSoundBuffer({ name: file.name, bytes: buf, mime: file.type }));
        }
      }
      await Promise.all(added.map(measureDuration));
      const next = await window.soundblazerr.getConfig();
      setConfig(next);
      await hydrateUrls(next.sounds);
      if (added.length) toast(`${added.length} sound${added.length === 1 ? "" : "s"} imported.`);
    },
    [hydrateUrls, measureDuration, toast]
  );

  const deleteSound = useCallback(
    async (id: string) => {
      await audioEngine.stop(id);
      const next = await window.soundblazerr.deleteSound(id);
      setConfig(next);
      toast("Sound removed.");
    },
    [toast]
  );

  const updateSound = useCallback(async (id: string, patch: Partial<SoundItem>) => {
    const result = await window.soundblazerr.updateSound(id, patch);
    if (result.error) return result.error;
    if (result.config) {
      setConfig(result.config);
      if (typeof patch.volume === "number") audioEngine.setClipVolume(id, patch.volume);
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabase(config);
    await client?.auth.signOut();
    await window.soundblazerr.logout();
    setUser(null);
  }, [config]);

  useEffect(() => {
    const unsub = audioEngine.onChange(() => setPlaying(audioEngine.playing()));
    return unsub;
  }, []);

  useEffect(() => {
    const off = window.soundblazerr.onShortcut(({ soundId }) => {
      const sound = config.sounds.find((s) => s.id === soundId);
      if (sound && sound.shortcutEnabled !== false) void playSound(sound);
    });
    return off;
  }, [config.sounds, playSound]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const cfg = await window.soundblazerr.getConfig();
      if (!alive) return;
      setConfig(cfg);
      applyEngine(cfg);
      document.documentElement.dataset.theme = cfg.theme;
      document.documentElement.dataset.reduce = cfg.reduceMotion ? "true" : "false";
      await hydrateUrls(cfg.sounds);
      const local = await window.soundblazerr.session();
      const client = getSupabase(cfg);
      if (client) {
        const { data } = await client.auth.getSession();
        const s = data.session?.user;
        if (s) {
          setUser({
            id: s.id,
            email: s.email || "",
            name: (s.user_metadata?.name as string) || s.email?.split("@")[0] || "Account",
            provider: s.app_metadata?.provider || "supabase"
          });
        } else if (local.user) setUser(local.user);
      } else if (local.user) setUser(local.user);
      setReady(true);
      void refreshDevices();
      if (navigator.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener("devicechange", () => void refreshDevices());
      }
    })();
    return () => {
      alive = false;
    };
  }, [applyEngine, hydrateUrls, refreshDevices]);

  useEffect(() => {
    if (!config.audio.monitorMic) {
      void audioEngine.stopMicMonitor();
      return;
    }
    void audioEngine
      .startMicMonitor(config.audio.inputDeviceId, config.audio.outputDeviceId)
      .catch((err) => toast(err instanceof Error ? err.message : "Microphone monitor failed.", "err"));
  }, [config.audio.monitorMic, config.audio.inputDeviceId, config.audio.outputDeviceId, toast]);

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      config,
      user,
      page,
      setPage,
      devices,
      playing,
      toasts,
      toast,
      query,
      setQuery,
      refreshDevices,
      save,
      playSound,
      stopSound: (id) => audioEngine.stop(id),
      stopAll: () => audioEngine.stopAll(),
      addSounds,
      importDropped,
      deleteSound,
      updateSound,
      setUser,
      signOut
    }),
    [ready, config, user, page, devices, playing, toasts, toast, query, refreshDevices, save, playSound, addSounds, importDropped, deleteSound, updateSound, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}

export function useRouting() {
  const { devices, config } = useApp();
  return routingState(devices, config.audio);
}

export { supabaseConfigured };
