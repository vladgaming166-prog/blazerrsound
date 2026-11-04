const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

const DEFAULT_CATEGORIES = [
  { id: "general", name: "General", color: "#39FF72" },
  { id: "music", name: "Music", color: "#5EEAD4" },
  { id: "memes", name: "Memes", color: "#A3E635" },
  { id: "alerts", name: "Alerts", color: "#86EFAC" }
];

function defaultConfig() {
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
    supabase: {
      url: "",
      anonKey: ""
    },
    appearance: {
      cardGlow: true,
      showDurations: true,
      showShortcuts: true
    },
    categories: DEFAULT_CATEGORIES,
    sounds: [],
    recentSoundIds: []
  };
}

function getPaths() {
  const root = app.getPath("userData");
  return {
    root,
    config: path.join(root, "config.json"),
    sounds: path.join(root, "sounds"),
    users: path.join(root, "local-users.json"),
    session: path.join(root, "session.json")
  };
}

function ensureDirs() {
  const p = getPaths();
  fs.mkdirSync(p.sounds, { recursive: true });
  return p;
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

function loadConfig() {
  const p = ensureDirs();
  const stored = readJson(p.config, {});
  const base = defaultConfig();
  return {
    ...base,
    ...stored,
    audio: { ...base.audio, ...(stored.audio || {}) },
    supabase: { ...base.supabase, ...(stored.supabase || {}) },
    appearance: { ...base.appearance, ...(stored.appearance || {}) },
    categories: Array.isArray(stored.categories) && stored.categories.length ? stored.categories : base.categories,
    sounds: Array.isArray(stored.sounds) ? stored.sounds : [],
    recentSoundIds: Array.isArray(stored.recentSoundIds) ? stored.recentSoundIds : []
  };
}

function saveConfig(next) {
  const p = ensureDirs();
  writeJson(p.config, next);
  return next;
}

function patchConfig(partial) {
  const current = loadConfig();
  const next = {
    ...current,
    ...partial,
    audio: { ...current.audio, ...(partial.audio || {}) },
    supabase: { ...current.supabase, ...(partial.supabase || {}) },
    appearance: { ...current.appearance, ...(partial.appearance || {}) }
  };
  if (partial.categories) next.categories = partial.categories;
  if (partial.sounds) next.sounds = partial.sounds;
  if (partial.recentSoundIds) next.recentSoundIds = partial.recentSoundIds;
  return saveConfig(next);
}

function resetConfig() {
  const p = ensureDirs();
  if (fs.existsSync(p.sounds)) {
    for (const file of fs.readdirSync(p.sounds)) {
      fs.rmSync(path.join(p.sounds, file), { force: true });
    }
  }
  const next = defaultConfig();
  writeJson(p.config, next);
  return next;
}

module.exports = {
  defaultConfig,
  DEFAULT_CATEGORIES,
  getPaths,
  ensureDirs,
  readJson,
  writeJson,
  loadConfig,
  saveConfig,
  patchConfig,
  resetConfig
};
