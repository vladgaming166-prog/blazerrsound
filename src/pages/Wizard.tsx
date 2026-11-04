import { useState } from "react";
import { Button, Field } from "../components/ui";
import { prettyDevice } from "../lib/format";
import { audioEngine } from "../lib/audio-engine";
import { useApp, useRouting } from "../store/AppState";

const STEPS = [
  "Welcome",
  "What it does",
  "Microphone",
  "Output",
  "Virtual mic",
  "Test sound",
  "Finish"
];

export function Wizard() {
  const { config, save, devices, refreshDevices } = useApp();
  const routing = useRouting();
  const [step, setStep] = useState(0);
  const [testing, setTesting] = useState(false);
  const inputs = devices.filter((d) => d.kind === "audioinput");
  const outputs = devices.filter((d) => d.kind === "audiooutput");

  async function requestAudio() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      /* still enumerate unnamed devices */
    }
    await refreshDevices();
  }

  async function testTone() {
    setTesting(true);
    const url = await window.soundblazerr.getTestToneUrl();
    await audioEngine.playUrl("wizard-test", "Setup test", url, 0.8);
    setTimeout(() => setTesting(false), 1300);
  }

  function skip() {
    void save({ setupComplete: true });
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="wizard-screen">
      <div className="wizard glass">
        <div className="steps">
          {STEPS.map((label, i) => (
            <i key={label} className={i < step ? "done" : i === step ? "active" : ""} title={label}>
              <em />
            </i>
          ))}
        </div>
        {step === 0 && (
          <>
            <img src="./icon.png" width={64} height={64} alt="" style={{ borderRadius: 16 }} />
            <h1 style={{ letterSpacing: "-0.04em" }}>Welcome to SoundBlazerr</h1>
            <p>A focused Windows soundboard for streamers, creators, and anyone who needs instant audio — without pretending a virtual microphone exists when it doesn’t.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h1>Built for real desks</h1>
            <p>Drop in MP3, WAV, OGG and more. Bind global shortcuts, play several clips at once, and route audio through VB-CABLE when you actually have it installed.</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              <li>Local library stored on this PC</li>
              <li>Per-sound volume, categories, and keybinds</li>
              <li>Microphone monitor and honest routing status</li>
            </ul>
          </>
        )}
        {step === 2 && (
          <>
            <h1>Choose your microphone</h1>
            <p>This is the input SoundBlazerr will monitor. It is not automatically mixed into other apps.</p>
            <Button onClick={requestAudio}>Allow microphone access</Button>
            <Field label="Microphone">
              <select
                value={config.audio.inputDeviceId}
                onChange={(e) => void save({ audio: { ...config.audio, inputDeviceId: e.target.value } })}
              >
                <option value="">System default</option>
                {inputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {prettyDevice(d.label, "Microphone")}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {step === 3 && (
          <>
            <h1>Choose playback output</h1>
            <p>This is where you hear SoundBlazerr. Use your headphones or speakers here. Virtual cables are configured on the next step.</p>
            <Field label="Output device">
              <select
                value={config.audio.outputDeviceId}
                onChange={(e) => void save({ audio: { ...config.audio, outputDeviceId: e.target.value } })}
              >
                <option value="">System default</option>
                {outputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {prettyDevice(d.label, "Speakers")}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {step === 4 && (
          <>
            <h1>Virtual microphone</h1>
            <p className={`notice ${routing.state === "none" ? "warn" : ""}`}>{routing.message}</p>
            {routing.virtualOutputs.length ? (
              <Field label="Virtual cable (soundboard output into other apps)">
                <select
                  value={config.audio.virtualDeviceId}
                  onChange={(e) =>
                    void save({
                      audio: {
                        ...config.audio,
                        virtualDeviceId: e.target.value,
                        routeToVirtual: Boolean(e.target.value)
                      }
                    })
                  }
                >
                  <option value="">Don’t route through a virtual cable</option>
                  {routing.virtualOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {prettyDevice(d.label)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Button onClick={() => void window.soundblazerr.openExternal("https://vb-audio.com/Cable/")}>
                Open VB-CABLE download
              </Button>
            )}
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              SoundBlazerr will never show “in the mic” unless a virtual device is selected. Chat apps still need their microphone set to the cable’s output (CABLE Output for VB-CABLE).
            </p>
          </>
        )}
        {step === 5 && (
          <>
            <h1>Test playback</h1>
            <p>Play a short built-in tone through your selected output. If you routed to a virtual cable, enable “hear locally” in Audio Setup to listen on headphones at the same time.</p>
            <Button variant="primary" onClick={testTone} disabled={testing}>
              {testing ? "Playing…" : "Play test tone"}
            </Button>
          </>
        )}
        {step === 6 && (
          <>
            <h1 className="check">You’re ready.</h1>
            <p>Add sounds, assign shortcuts, and keep an eye on the routing pill in the sidebar. You can rerun these choices any time from Audio Setup.</p>
          </>
        )}
        <div className="row" style={{ justifyContent: "space-between", marginTop: 28 }}>
          <Button variant="ghost" onClick={skip}>
            Skip setup
          </Button>
          <div className="row">
            {step > 0 ? <Button onClick={() => setStep((s) => s - 1)}>Back</Button> : null}
            <Button
              variant="primary"
              onClick={() => {
                if (last) void save({ setupComplete: true });
                else setStep((s) => s + 1);
              }}
            >
              {last ? "Finish" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
