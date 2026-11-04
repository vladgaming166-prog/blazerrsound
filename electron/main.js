const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  protocol,
  net,
  session
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const {
  getPaths,
  ensureDirs,
  loadConfig,
  patchConfig,
  resetConfig,
  readJson,
  writeJson
} = require("./store");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "sbmedia",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true
    }
  }
]);

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

const PROTOCOL = "soundblazerr";
const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".webm", ".opus", ".aiff", ".aif"];
const VIRTUAL_HINTS = [
  "vb-audio",
  "cable",
  "voicemeeter",
  "virtual cable",
  "virtual audio",
  "blackhole",
  "loopback",
  "soundflower"
];

let mainWindow = null;
let tray = null;
let quitting = false;

function isDev() {
  return Boolean(process.env.ELECTRON_START_URL) || !app.isPackaged;
}

function iconPath() {
  const ico = path.join(__dirname, "..", "assets", "icon.ico");
  const png = path.join(__dirname, "..", "assets", "icon.png");
  if (fs.existsSync(ico)) return ico;
  return png;
}

function testTonePath() {
  const packed = path.join(process.resourcesPath || "", "test-tone.wav");
  if (app.isPackaged && fs.existsSync(packed)) return packed;
  return path.join(__dirname, "..", "assets", "test-tone.wav");
}

function createWindow() {
  const config = loadConfig();
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#090B0A",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  mainWindow.webContents.setBackgroundThrottling(false);

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    if (config.startMinimized && config.minimizeToTray) {
      createTray();
      return;
    }
    mainWindow.show();
  });

  mainWindow.on("maximize", () => mainWindow?.webContents.send("window:maximized", true));
  mainWindow.on("unmaximize", () => mainWindow?.webContents.send("window:maximized", false));

  mainWindow.on("close", (event) => {
    const cfg = loadConfig();
    if (!quitting && cfg.minimizeToTray && process.platform === "win32") {
      event.preventDefault();
      mainWindow.hide();
      createTray();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  if (tray) return;
  const image = nativeImage.createFromPath(iconPath());
  tray = new Tray(image.resize({ width: 16, height: 16 }));
  tray.setToolTip("SoundBlazerr");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show SoundBlazerr",
        click: () => {
          if (!mainWindow) createWindow();
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          quitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("double-click", () => {
    if (!mainWindow) createWindow();
    mainWindow.show();
    mainWindow.focus();
  });
}

function soundFilePath(id) {
  const config = loadConfig();
  const sound = config.sounds.find((s) => s.id === id);
  if (!sound) return null;
  return path.join(getPaths().sounds, sound.fileName);
}

function registerMediaProtocol() {
  protocol.handle("sbmedia", async (request) => {
    try {
      const url = new URL(request.url);
      const kind = url.hostname;
      if (kind === "test") {
        return net.fetch(pathToFileURL(testTonePath()).href);
      }
      const id = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const file = soundFilePath(id);
      if (!file || !fs.existsSync(file)) {
        return new Response("Not found", { status: 404 });
      }
      return net.fetch(pathToFileURL(file).href);
    } catch (error) {
      return new Response(String(error), { status: 500 });
    }
  });
}

function acceleratorFromBinding(shortcut) {
  if (!shortcut) return null;
  return String(shortcut)
    .replace(/\s+/g, "")
    .replace(/CTRL/gi, "CommandOrControl")
    .replace(/CONTROL/gi, "CommandOrControl")
    .replace(/CMD/gi, "CommandOrControl")
    .replace(/WIN/gi, "Super")
    .replace(/OPTION/gi, "Alt");
}

function registerAllShortcuts() {
  globalShortcut.unregisterAll();
  const config = loadConfig();
  const used = new Set();
  for (const sound of config.sounds) {
    if (!sound.shortcut || sound.shortcutEnabled === false) continue;
    const accel = acceleratorFromBinding(sound.shortcut);
    if (!accel || used.has(accel.toLowerCase())) continue;
    used.add(accel.toLowerCase());
    try {
      const ok = globalShortcut.register(accel, () => {
        mainWindow?.webContents.send("shortcuts:trigger", { soundId: sound.id, accelerator: accel });
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
          // Keep playing while hidden; do not force-show.
        }
      });
      if (!ok) {
        console.warn("Failed to register shortcut", accel);
      }
    } catch (error) {
      console.warn("Shortcut error", accel, error);
    }
  }
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

function verifyPassword(password, record) {
  const hash = crypto.scryptSync(password, Buffer.from(record.salt, "hex"), 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(record.hash, "hex"));
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    provider: user.provider || "local"
  };
}

function saveSession(user) {
  writeJson(getPaths().session, { userId: user.id, issuedAt: Date.now() });
}

function loadLocalUsers() {
  return readJson(getPaths().users, { users: [] });
}

function copySoundFile(sourcePath) {
  ensureDirs();
  const id = crypto.randomUUID();
  const ext = path.extname(sourcePath).toLowerCase() || ".wav";
  const fileName = `${id}${ext}`;
  const dest = path.join(getPaths().sounds, fileName);
  fs.copyFileSync(sourcePath, dest);
  const stats = fs.statSync(dest);
  const sound = {
    id,
    name: path.basename(sourcePath, path.extname(sourcePath)),
    fileName,
    originalName: path.basename(sourcePath),
    duration: 0,
    volume: 0.85,
    categoryId: "general",
    shortcut: "",
    shortcutEnabled: true,
    color: "#39FF72",
    createdAt: Date.now(),
    lastPlayedAt: 0,
    bytes: stats.size
  };
  const config = loadConfig();
  config.sounds.push(sound);
  patchConfig({ sounds: config.sounds });
  return sound;
}

function applyAutoLaunch(enabled, startMinimized) {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    openAsHidden: Boolean(startMinimized),
    path: process.execPath,
    args: startMinimized ? ["--hidden"] : []
  });
}

function registerIpc() {
  ipcMain.handle("config:get", () => loadConfig());
  ipcMain.handle("config:save", (_e, partial) => {
    const next = patchConfig(partial || {});
    if (Object.prototype.hasOwnProperty.call(partial || {}, "launchOnStartup") || Object.prototype.hasOwnProperty.call(partial || {}, "startMinimized")) {
      applyAutoLaunch(next.launchOnStartup, next.startMinimized);
    }
    if (partial?.sounds) registerAllShortcuts();
    return next;
  });
  ipcMain.handle("config:reset", () => {
    const next = resetConfig();
    registerAllShortcuts();
    return next;
  });

  ipcMain.handle("config:export", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose a folder for the SoundBlazerr backup",
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const dest = result.filePaths[0];
    const config = loadConfig();
    const soundsDir = path.join(dest, "sounds");
    fs.mkdirSync(soundsDir, { recursive: true });
    for (const sound of config.sounds) {
      const src = path.join(getPaths().sounds, sound.fileName);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(soundsDir, sound.fileName));
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), config };
    fs.writeFileSync(path.join(dest, "soundblazerr-backup.json"), JSON.stringify(payload, null, 2));
    return { canceled: false, path: dest };
  });

  ipcMain.handle("config:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import SoundBlazerr backup",
      properties: ["openFile"],
      filters: [{ name: "SoundBlazerr backup", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const file = result.filePaths[0];
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const incoming = parsed.config || parsed;
    const sourceSounds = path.join(path.dirname(file), "sounds");
    ensureDirs();
    const sounds = [];
    for (const sound of incoming.sounds || []) {
      const src = path.join(sourceSounds, sound.fileName);
      if (!fs.existsSync(src)) continue;
      const ext = path.extname(sound.fileName) || ".wav";
      const id = crypto.randomUUID();
      const fileName = `${id}${ext}`;
      fs.copyFileSync(src, path.join(getPaths().sounds, fileName));
      sounds.push({ ...sound, id, fileName });
    }
    const next = patchConfig({
      ...incoming,
      sounds,
      categories: incoming.categories && incoming.categories.length ? incoming.categories : undefined
    });
    registerAllShortcuts();
    return { canceled: false, config: next, imported: sounds.length };
  });

  ipcMain.handle("sounds:add", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Add sounds",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Audio", extensions: AUDIO_EXT.map((e) => e.slice(1)) },
        { name: "All files", extensions: ["*"] }
      ]
    });
    if (result.canceled) return [];
    return result.filePaths.filter((p) => AUDIO_EXT.includes(path.extname(p).toLowerCase()) || true).map(copySoundFile);
  });

  ipcMain.handle("sounds:importPaths", (_e, filePaths) => {
    const imported = [];
    for (const filePath of filePaths || []) {
      if (!filePath || !fs.existsSync(filePath)) continue;
      imported.push(copySoundFile(filePath));
    }
    return imported;
  });

  ipcMain.handle("sounds:writeBuffer", (_e, payload) => {
    ensureDirs();
    const { name, bytes, mime } = payload || {};
    const id = crypto.randomUUID();
    const extFromName = path.extname(name || "").toLowerCase();
    const ext = AUDIO_EXT.includes(extFromName) ? extFromName : mime === "audio/wav" ? ".wav" : ".mp3";
    const fileName = `${id}${ext}`;
    const dest = path.join(getPaths().sounds, fileName);
    const buffer = Buffer.isBuffer(bytes)
      ? bytes
      : Buffer.from(bytes?.data || bytes || []);
    fs.writeFileSync(dest, buffer);
    const sound = {
      id,
      name: path.basename(name || "Sound", path.extname(name || "")),
      fileName,
      originalName: name || fileName,
      duration: 0,
      volume: 0.85,
      categoryId: "general",
      shortcut: "",
      shortcutEnabled: true,
      color: "#39FF72",
      createdAt: Date.now(),
      lastPlayedAt: 0,
      bytes: buffer.length
    };
    const config = loadConfig();
    config.sounds.push(sound);
    patchConfig({ sounds: config.sounds });
    return sound;
  });

  ipcMain.handle("sounds:delete", (_e, id) => {
    const config = loadConfig();
    const sound = config.sounds.find((s) => s.id === id);
    if (sound) {
      const file = path.join(getPaths().sounds, sound.fileName);
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    }
    const sounds = config.sounds.filter((s) => s.id !== id);
    const next = patchConfig({
      sounds,
      recentSoundIds: (config.recentSoundIds || []).filter((x) => x !== id)
    });
    registerAllShortcuts();
    return next;
  });

  ipcMain.handle("sounds:update", (_e, id, patch) => {
    const config = loadConfig();
    const sounds = config.sounds.map((s) => (s.id === id ? { ...s, ...patch } : s));
    if (patch?.shortcut) {
      const accel = String(patch.shortcut).toLowerCase();
      const conflict = sounds.find((s) => s.id !== id && s.shortcut && String(s.shortcut).toLowerCase() === accel);
      if (conflict) {
        return { error: `Shortcut already used by “${conflict.name}”.`, config };
      }
    }
    const next = patchConfig({ sounds });
    registerAllShortcuts();
    return { config: next };
  });

  ipcMain.handle("sounds:getUrl", (_e, id) => `sbmedia://sound/${id}`);
  ipcMain.handle("sounds:testTone", () => "sbmedia://test/tone");

  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle("window:close", () => {
    const cfg = loadConfig();
    if (cfg.minimizeToTray) {
      mainWindow?.hide();
      createTray();
      return "tray";
    }
    quitting = true;
    mainWindow?.close();
    return "close";
  });
  ipcMain.handle("window:isMaximized", () => Boolean(mainWindow?.isMaximized()));

  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:openExternal", (_e, url) => {
    if (typeof url !== "string") return false;
    if (!/^https?:/i.test(url)) return false;
    return shell.openExternal(url);
  });
  ipcMain.handle("app:setAutoLaunch", (_e, enabled) => {
    const next = patchConfig({ launchOnStartup: Boolean(enabled) });
    applyAutoLaunch(next.launchOnStartup, next.startMinimized);
    return next;
  });
  ipcMain.handle("app:getAutoLaunch", () => app.getLoginItemSettings());
  ipcMain.handle("app:openUserData", () => shell.openPath(getPaths().root));
  ipcMain.handle("app:showSound", (_e, id) => {
    const file = soundFilePath(id);
    if (file && fs.existsSync(file)) shell.showItemInFolder(file);
  });

  ipcMain.handle("shortcuts:setAll", (_e, bindings) => {
    const config = loadConfig();
    const byId = new Map((bindings || []).map((b) => [b.soundId, b]));
    const seen = new Map();
    for (const sound of config.sounds) {
      const b = byId.get(sound.id);
      if (!b) continue;
      if (b.shortcut) {
        const key = String(b.shortcut).toLowerCase();
        if (seen.has(key)) {
          return { error: `Shortcut ${b.shortcut} is assigned more than once.` };
        }
        seen.set(key, sound.id);
      }
      sound.shortcut = b.shortcut || "";
      sound.shortcutEnabled = b.enabled !== false;
    }
    const next = patchConfig({ sounds: config.sounds });
    registerAllShortcuts();
    return { config: next };
  });

  ipcMain.handle("auth:register", (_e, payload) => {
    const email = String(payload?.email || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    const name = String(payload?.name || email.split("@")[0] || "Blazer");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
    if (password.length < 8) return { error: "Password must be at least 8 characters." };
    const db = loadLocalUsers();
    if (db.users.some((u) => u.email === email)) return { error: "An account with that email already exists on this device." };
    const { salt, hash } = hashPassword(password);
    const user = { id: crypto.randomUUID(), email, name, salt, hash, createdAt: Date.now(), provider: "local" };
    db.users.push(user);
    writeJson(getPaths().users, db);
    saveSession(user);
    return { user: publicUser(user), mode: "local" };
  });

  ipcMain.handle("auth:login", (_e, payload) => {
    const email = String(payload?.email || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    const db = loadLocalUsers();
    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user)) return { error: "Incorrect email or password." };
    saveSession(user);
    return { user: publicUser(user), mode: "local" };
  });

  ipcMain.handle("auth:guest", () => {
    const user = {
      id: "guest",
      email: "local@soundblazerr",
      name: "Local Player",
      createdAt: Date.now(),
      provider: "guest"
    };
    saveSession(user);
    return { user: publicUser(user), mode: "local" };
  });

  ipcMain.handle("auth:logout", () => {
    const p = getPaths();
    if (fs.existsSync(p.session)) fs.rmSync(p.session, { force: true });
    return { ok: true };
  });

  ipcMain.handle("auth:session", () => {
    const sessionFile = readJson(getPaths().session, null);
    if (!sessionFile?.userId) return { user: null };
    if (sessionFile.userId === "guest") {
      return {
        user: { id: "guest", email: "local@soundblazerr", name: "Local Player", provider: "guest" },
        mode: "local"
      };
    }
    const db = loadLocalUsers();
    const user = db.users.find((u) => u.id === sessionFile.userId);
    return { user: publicUser(user), mode: "local" };
  });

  ipcMain.handle("auth:forgot", (_e, payload) => {
    const email = String(payload?.email || "").trim().toLowerCase();
    const password = String(payload?.password || "");
    const db = loadLocalUsers();
    const user = db.users.find((u) => u.email === email);
    if (!user) return { error: "No local account uses that email on this device." };
    if (password.length < 8) return { error: "New password must be at least 8 characters." };
    const { salt, hash } = hashPassword(password);
    user.salt = salt;
    user.hash = hash;
    writeJson(getPaths().users, db);
    return {
      ok: true,
      message: "Password updated on this device. Local mode does not send email — this only changes the account stored on this PC."
    };
  });

  ipcMain.handle("auth:updateProfile", (_e, payload) => {
    const sessionFile = readJson(getPaths().session, null);
    const db = loadLocalUsers();
    const user = db.users.find((u) => u.id === sessionFile?.userId);
    if (!user) return { error: "Not signed in." };
    if (payload?.name) user.name = String(payload.name).slice(0, 48);
    if (payload?.password) {
      if (String(payload.password).length < 8) return { error: "Password must be at least 8 characters." };
      const { salt, hash } = hashPassword(payload.password);
      user.salt = salt;
      user.hash = hash;
    }
    writeJson(getPaths().users, db);
    return { user: publicUser(user) };
  });

  ipcMain.handle("auth:googleStart", async (_e, payload) => {
    const url = payload?.url;
    if (!url || !/^https?:/i.test(url)) {
      return {
        error:
          "Google sign-in is not configured. Add a Supabase URL and anon key, enable the Google provider, and allow the redirect soundblazerr://auth/callback."
      };
    }
    const authWin = new BrowserWindow({
      width: 480,
      height: 720,
      parent: mainWindow || undefined,
      modal: true,
      backgroundColor: "#090B0A",
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    const finish = (callbackUrl) => {
      if (!authWin.isDestroyed()) authWin.close();
      mainWindow?.webContents.send("auth:callback", { url: callbackUrl });
    };
    const watch = (targetUrl) => {
      if (!targetUrl) return false;
      if (targetUrl.startsWith(`${PROTOCOL}://`) || /access_token=|code=/.test(targetUrl)) {
        finish(targetUrl);
        return true;
      }
      return false;
    };
    authWin.webContents.on("will-redirect", (event, targetUrl) => {
      if (watch(targetUrl)) event.preventDefault();
    });
    authWin.webContents.on("will-navigate", (event, targetUrl) => {
      if (watch(targetUrl)) event.preventDefault();
    });
    authWin.loadURL(url);
    return { opened: true };
  });
}

function handleProtocolUrl(url) {
  if (!url || !String(url).startsWith(`${PROTOCOL}://`)) return;
  mainWindow?.webContents.send("auth:callback", { url });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.soundblazerr.app");
  }
  app.setAsDefaultProtocolClient(PROTOCOL);

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(["media", "mediaKeySystem", "audioCapture", "fullscreen"].includes(permission) || permission === "microphone");
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return ["media", "audioCapture", "microphone", "fullscreen"].includes(permission);
  });

  registerMediaProtocol();
  registerIpc();
  createWindow();
  registerAllShortcuts();

  const config = loadConfig();
  applyAutoLaunch(config.launchOnStartup, config.startMinimized);
  if (config.minimizeToTray) createTray();

  if (process.argv.includes("--hidden") && mainWindow) {
    mainWindow.hide();
  }
});

app.on("second-instance", (_event, argv) => {
  const proto = argv.find((a) => String(a).startsWith(`${PROTOCOL}://`));
  if (proto) handleProtocolUrl(proto);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (!loadConfig().minimizeToTray) app.quit();
  }
});

app.on("before-quit", () => {
  quitting = true;
  globalShortcut.unregisterAll();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

process.on("uncaughtException", (error) => {
  console.error("SoundBlazerr main error", error);
});

void VIRTUAL_HINTS;
