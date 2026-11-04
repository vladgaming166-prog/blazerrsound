# SoundBlazerr

Premium Windows soundboard built with Electron, Node.js, and a React frontend.

SoundBlazerr stores your library on this PC, plays multiple clips at once, binds **global** keyboard shortcuts, and routes audio through a virtual microphone **only when a real virtual cable is selected**. It will not pretend Discord (or any other app) is receiving soundboard audio if VB-CABLE / Voicemeeter is missing or unselected.

## Features

- Custom sound cards (MP3, WAV, OGG, FLAC, M4A, AAC, WebM, Opus, AIFF)
- Play / stop, overlapping playback, per-sound volume, rename, delete
- Categories, search, duration, currently-playing indicator
- Global shortcuts (including while minimized), conflict detection, enable/disable
- Microphone + output device selection, input/output volume, mic monitoring
- Virtual cable routing (VB-CABLE, Voicemeeter, and similar) with honest status
- First-run setup wizard
- Email/password auth, Google OAuth via Supabase when configured, local/demo mode otherwise
- Settings: startup, tray, theme, import/export, reset
- Custom frameless Windows UI, system tray, auto-launch

## Project layout

```
SoundBlazerr/
├── BUILD.bat              One-click Windows build
├── package.json
├── README.md
├── electron/              Main process, preload, local store
├── src/                   React UI
├── assets/                Icon + test tone
├── public/
└── dist/                  Created by BUILD.bat
    ├── SoundBlazerr-Setup.exe
    └── SoundBlazerr.exe
```

## Build on Windows (recommended)

1. Install [Node.js LTS](https://nodejs.org/) (includes npm).
2. Double-click `BUILD.bat`.

The script checks Node/npm, installs dependencies, builds the UI, and packages with Electron Builder. Output:

- `dist/SoundBlazerr-Setup.exe` — NSIS installer  
- `dist/SoundBlazerr.exe` — portable app  

If something fails, the script prints the error and waits so the window does not close.

### Manual commands

```bat
npm install
npm run build
npx electron-builder --win --x64
```

Development:

```bat
npm install
npm run dev
```

## Virtual microphone (VB-CABLE)

Windows apps cannot inject audio into an arbitrary physical microphone. To send the soundboard into Discord, Zoom, or a game:

1. Install [VB-CABLE](https://vb-audio.com/Cable/) or Voicemeeter.
2. In SoundBlazerr → **Audio Setup**, select **CABLE Input** as the virtual device and enable routing.
3. In Discord (or the other app), set the microphone to **CABLE Output**.
4. Optionally keep “Also hear sounds locally” on so you still hear the board on headphones.

If no virtual device is present, SoundBlazerr plays to speakers/headphones only and says so in the sidebar.

## Authentication

Local/demo mode works with no cloud account (register, login, or Continue in local mode). Passwords are stored as scrypt hashes in the Windows user data folder.

Google login is a **real** Supabase OAuth integration. It is disabled until you provide credentials:

1. Create a [Supabase](https://supabase.com/) project.
2. Enable Authentication → Providers → Google (Client ID + Secret from Google Cloud).
3. Add `soundblazerr://auth/callback` to the redirect allow list.
4. Paste the project URL and anon key in **Settings → Account** (or `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

Until that is done, the Google button explains exactly what is missing instead of faking a session.

## Data location

Config, local users, and copied audio files live under the Electron userData directory, typically:

`%APPDATA%\SoundBlazerr\`

Settings → About → Open data folder.

## Security architecture

- `contextIsolation: true`
- `nodeIntegration: false`
- Preload exposes a narrow IPC API only
- Custom `sbmedia://` protocol for local sound files
- Global shortcuts unregistered on quit

## License

MIT
