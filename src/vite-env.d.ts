/// <reference types="vite/client" />

interface SoundBlazerrAPI {
  getConfig: () => Promise<import("./lib/types").AppConfig>;
  saveConfig: (partial: Partial<import("./lib/types").AppConfig>) => Promise<import("./lib/types").AppConfig>;
  resetConfig: () => Promise<import("./lib/types").AppConfig>;
  exportBoard: () => Promise<{ canceled: boolean; path?: string }>;
  importBoard: () => Promise<{ canceled: boolean; config?: import("./lib/types").AppConfig; imported?: number }>;
  addSounds: () => Promise<import("./lib/types").SoundItem[]>;
  importSoundPaths: (filePaths: string[]) => Promise<import("./lib/types").SoundItem[]>;
  writeSoundBuffer: (payload: { name: string; bytes: ArrayBuffer; mime?: string }) => Promise<import("./lib/types").SoundItem>;
  deleteSound: (id: string) => Promise<import("./lib/types").AppConfig>;
  updateSound: (id: string, patch: Partial<import("./lib/types").SoundItem>) => Promise<{ error?: string; config?: import("./lib/types").AppConfig }>;
  getSoundUrl: (id: string) => Promise<string>;
  getTestToneUrl: () => Promise<string>;
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<string>;
  isMaximized: () => Promise<boolean>;
  onMaximized: (handler: (value: boolean) => void) => () => void;
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<import("./lib/types").AppConfig>;
  getAutoLaunch: () => Promise<unknown>;
  openUserData: () => Promise<string>;
  showSoundInFolder: (id: string) => Promise<void>;
  setShortcuts: (bindings: { soundId: string; shortcut: string; enabled: boolean }[]) => Promise<{ error?: string; config?: import("./lib/types").AppConfig }>;
  onShortcut: (handler: (payload: { soundId: string; accelerator: string }) => void) => () => void;
  register: (payload: { email: string; password: string; name?: string }) => Promise<{ error?: string; user?: import("./lib/types").AuthUser; mode?: string }>;
  login: (payload: { email: string; password: string }) => Promise<{ error?: string; user?: import("./lib/types").AuthUser; mode?: string }>;
  continueLocal: () => Promise<{ user?: import("./lib/types").AuthUser; mode?: string }>;
  logout: () => Promise<{ ok: boolean }>;
  session: () => Promise<{ user: import("./lib/types").AuthUser | null; mode?: string }>;
  forgotPassword: (payload: { email: string; password: string }) => Promise<{ error?: string; ok?: boolean; message?: string }>;
  updateProfile: (payload: { name?: string; password?: string }) => Promise<{ error?: string; user?: import("./lib/types").AuthUser }>;
  startGoogleOAuth: (payload: { url: string }) => Promise<{ error?: string; opened?: boolean }>;
  onAuthCallback: (handler: (payload: { url: string }) => void) => () => void;
  platform: string;
}

interface Window {
  soundblazerr: SoundBlazerrAPI;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
