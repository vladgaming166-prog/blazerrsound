export type PageId =
  | "dashboard"
  | "soundboard"
  | "sounds"
  | "keybinds"
  | "audio"
  | "settings"
  | "profile";

export type ThemeId = "midnight" | "charcoal" | "contrast" | "day";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface SoundItem {
  id: string;
  name: string;
  fileName: string;
  originalName?: string;
  duration: number;
  volume: number;
  categoryId: string;
  shortcut: string;
  shortcutEnabled: boolean;
  color: string;
  createdAt: number;
  lastPlayedAt: number;
  bytes?: number;
}

export interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  virtualDeviceId: string;
  inputVolume: number;
  outputVolume: number;
  monitorMic: boolean;
  routeToVirtual: boolean;
}

export interface AppConfig {
  setupComplete: boolean;
  theme: ThemeId;
  reduceMotion: boolean;
  compactCards: boolean;
  launchOnStartup: boolean;
  minimizeToTray: boolean;
  startMinimized: boolean;
  listenLocally: boolean;
  listenLocalVolume: number;
  audio: AudioSettings;
  supabase: { url: string; anonKey: string };
  appearance: {
    cardGlow: boolean;
    showDurations: boolean;
    showShortcuts: boolean;
  };
  categories: Category[];
  sounds: SoundItem[];
  recentSoundIds: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt?: number;
  provider?: string;
}

export interface MediaDev {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export type RoutingState = "none" | "available" | "configured" | "missing";

export interface PlayingSound {
  id: string;
  name: string;
  startedAt: number;
}
