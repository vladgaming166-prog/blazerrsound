import { Button, Field, Toggle } from "../components/ui";
import { prettyDevice } from "../lib/format";
import { audioEngine } from "../lib/audio-engine";
import { useApp, useRouting } from "../store/AppState";

export function AudioSetup() {
  const { config, save, devices, refreshDevices, toast } = useApp();
  const routing = useRouting();
  const inputs = devices.filter((d) => d.kind === "audioinput");
  const outputs = devices.filter((d) => d.kind === "audiooutput");

  async function test() {
    const url = await window.soundblazerr.getTestToneUrl();
    await audioEngine.playUrl("setup-test", "Output test", url, 0.85);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Audio Setup</h1>
          <p>Device selection, monitoring, and virtual microphone routing — reported honestly.</p>
        </div>
        <Button onClick={() => void refreshDevices()}>Refresh devices</Button>
      </div>
      <div className={`notice ${routing.state === "configured" ? "" : routing.state === "missing" ? "bad" : "warn"}`} style={{ marginBottom: 16 }}>
        <span className={`dot ${routing.state === "configured" ? "ok" : routing.state === "missing" ? "bad" : "warn"}`} />
        {routing.message}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="glass" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Microphone</h3>
          <Field label="Input device">
            <select value={config.audio.inputDeviceId} onChange={(e) => void save({ audio: { ...config.audio, inputDeviceId: e.target.value } })}>
              <option value="">System default</option>
              {inputs.map((d) => <option key={d.deviceId} value={d.deviceId}>{prettyDevice(d.label, "Microphone")}</option>)}
            </select>
          </Field>
          <Field label={`Input volume ${Math.round(config.audio.inputVolume * 100)}%`}>
            <input className="vol" type="range" min={0} max={1} step={0.01} value={config.audio.inputVolume} onChange={(e) => void save({ audio: { ...config.audio, inputVolume: Number(e.target.value) } })} />
          </Field>
          <Toggle
            label="Microphone monitoring"
            on={config.audio.monitorMic}
            onChange={(v) => void save({ audio: { ...config.audio, monitorMic: v } })}
          />
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Monitoring plays your mic into the selected output so you can hear yourself. It does not inject the mic into Discord.</p>
        </section>
        <section className="glass" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Output</h3>
          <Field label="Listen on">
            <select value={config.audio.outputDeviceId} onChange={(e) => void save({ audio: { ...config.audio, outputDeviceId: e.target.value } })}>
              <option value="">System default</option>
              {outputs.map((d) => <option key={d.deviceId} value={d.deviceId}>{prettyDevice(d.label, "Speakers")}</option>)}
            </select>
          </Field>
          <Field label={`Output volume ${Math.round(config.audio.outputVolume * 100)}%`}>
            <input className="vol" type="range" min={0} max={1} step={0.01} value={config.audio.outputVolume} onChange={(e) => void save({ audio: { ...config.audio, outputVolume: Number(e.target.value) } })} />
          </Field>
          <Button variant="primary" onClick={() => void test()}>Play test tone</Button>
        </section>
        <section className="glass" style={{ padding: 18, gridColumn: "1 / -1" }}>
          <h3 style={{ marginTop: 0 }}>Virtual microphone routing</h3>
          <Toggle
            label="Route soundboard through a virtual cable"
            on={config.audio.routeToVirtual}
            onChange={(v) => {
              if (v && !config.audio.virtualDeviceId && routing.virtualOutputs[0]) {
                void save({ audio: { ...config.audio, routeToVirtual: true, virtualDeviceId: routing.virtualOutputs[0].deviceId } });
              } else {
                void save({ audio: { ...config.audio, routeToVirtual: v } });
              }
            }}
          />
          <Field label="Virtual device (CABLE Input / Voicemeeter input)">
            <select
              value={config.audio.virtualDeviceId}
              onChange={(e) => void save({ audio: { ...config.audio, virtualDeviceId: e.target.value, routeToVirtual: Boolean(e.target.value) } })}
            >
              <option value="">Not selected — audio will not enter other apps as a mic</option>
              {outputs.map((d) => <option key={d.deviceId} value={d.deviceId}>{prettyDevice(d.label)}</option>)}
            </select>
          </Field>
          <Toggle label="Also hear sounds locally" on={config.listenLocally} onChange={(v) => void save({ listenLocally: v })} />
          <Field label={`Local listen volume ${Math.round(config.listenLocalVolume * 100)}%`}>
            <input className="vol" type="range" min={0} max={1} step={0.01} value={config.listenLocalVolume} onChange={(e) => void save({ listenLocalVolume: Number(e.target.value) })} />
          </Field>
          <div className="row">
            <Button onClick={() => void window.soundblazerr.openExternal("https://vb-audio.com/Cable/")}>VB-CABLE website</Button>
            <Button onClick={() => toast("After installing a cable, click Refresh devices, select CABLE Input, then set Discord’s mic to CABLE Output.")}>How to finish setup</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
