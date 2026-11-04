import type { ReactNode } from "react";
import { Layout } from "./components/Layout";
import { TitleBar } from "./components/TitleBar";
import { Auth } from "./pages/Auth";
import { Wizard } from "./pages/Wizard";
import { Dashboard } from "./pages/Dashboard";
import { Soundboard } from "./pages/Soundboard";
import { MySounds } from "./pages/MySounds";
import { Keybinds } from "./pages/Keybinds";
import { AudioSetup } from "./pages/AudioSetup";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { useApp } from "./store/AppState";

export default function App() {
  const { ready, user, config, page } = useApp();

  const wrap = (body: ReactNode) => (
    <div className="app-root">
      <TitleBar />
      {body}
    </div>
  );

  if (!ready) {
    return wrap(
      <div className="wizard-screen">
        <div className="wizard glass" style={{ textAlign: "center" }}>
          <img src="./icon.png" width={64} height={64} alt="" style={{ borderRadius: 16 }} />
          <h2>SoundBlazerr</h2>
          <p>Loading your local board…</p>
        </div>
      </div>
    );
  }

  if (!user) return wrap(<Auth />);
  if (!config.setupComplete) return wrap(<Wizard />);

  const pages = {
    dashboard: <Dashboard />,
    soundboard: <Soundboard />,
    sounds: <MySounds />,
    keybinds: <Keybinds />,
    audio: <AudioSetup />,
    settings: <Settings />,
    profile: <Profile />
  } as const;

  return wrap(<Layout>{pages[page]}</Layout>);
}
