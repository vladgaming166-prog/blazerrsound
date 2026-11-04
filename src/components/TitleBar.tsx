import { IconClose, IconMax, IconMin } from "./icons";
import { useApp } from "../store/AppState";

export function TitleBar() {
  const { playing } = useApp();
  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        Sound<b>Blazerr</b>
        {playing.length ? <span className="chip">{playing.length} live</span> : null}
      </div>
      <div className="win-controls">
        <button className="win-btn" onClick={() => void window.soundblazerr.minimize()} aria-label="Minimize">
          <IconMin />
        </button>
        <button className="win-btn" onClick={() => void window.soundblazerr.maximize()} aria-label="Maximize">
          <IconMax />
        </button>
        <button className="win-btn close" onClick={() => void window.soundblazerr.close()} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </header>
  );
}
