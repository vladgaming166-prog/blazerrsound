const { contextBridge, ipcRenderer } = require("electron");

function subscribe(channel, handler) {
  const wrapped = (_event, ...args) => handler(...args);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

contextBridge.exposeInMainWorld("soundblazerr", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (partial) => ipcRenderer.invoke("config:save", partial),
  resetConfig: () => ipcRenderer.invoke("config:reset"),
  exportBoard: () => ipcRenderer.invoke("config:export"),
  importBoard: () => ipcRenderer.invoke("config:import"),

  addSounds: () => ipcRenderer.invoke("sounds:add"),
  importSoundPaths: (filePaths) => ipcRenderer.invoke("sounds:importPaths", filePaths),
  writeSoundBuffer: (payload) => ipcRenderer.invoke("sounds:writeBuffer", payload),
  deleteSound: (id) => ipcRenderer.invoke("sounds:delete", id),
  updateSound: (id, patch) => ipcRenderer.invoke("sounds:update", id, patch),
  getSoundUrl: (id) => ipcRenderer.invoke("sounds:getUrl", id),
  getTestToneUrl: () => ipcRenderer.invoke("sounds:testTone"),

  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximized: (handler) => subscribe("window:maximized", handler),

  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),
  setAutoLaunch: (enabled) => ipcRenderer.invoke("app:setAutoLaunch", enabled),
  getAutoLaunch: () => ipcRenderer.invoke("app:getAutoLaunch"),
  openUserData: () => ipcRenderer.invoke("app:openUserData"),
  showSoundInFolder: (id) => ipcRenderer.invoke("app:showSound", id),

  setShortcuts: (bindings) => ipcRenderer.invoke("shortcuts:setAll", bindings),
  onShortcut: (handler) => subscribe("shortcuts:trigger", handler),

  register: (payload) => ipcRenderer.invoke("auth:register", payload),
  login: (payload) => ipcRenderer.invoke("auth:login", payload),
  continueLocal: () => ipcRenderer.invoke("auth:guest"),
  logout: () => ipcRenderer.invoke("auth:logout"),
  session: () => ipcRenderer.invoke("auth:session"),
  forgotPassword: (payload) => ipcRenderer.invoke("auth:forgot", payload),
  updateProfile: (payload) => ipcRenderer.invoke("auth:updateProfile", payload),
  startGoogleOAuth: (payload) => ipcRenderer.invoke("auth:googleStart", payload),
  onAuthCallback: (handler) => subscribe("auth:callback", handler),

  platform: process.platform
});
