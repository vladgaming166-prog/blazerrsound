import type { SoundItem } from "./types";

type Listener = () => void;

interface ActiveClip {
  id: string;
  name: string;
  primary: HTMLAudioElement;
  local?: HTMLAudioElement;
  startedAt: number;
}

class AudioEngine {
  private clips = new Map<string, ActiveClip>();
  private listeners = new Set<Listener>();
  private micStream: MediaStream | null = null;
  private micContext: AudioContext | null = null;
  private micGain: GainNode | null = null;
  private micAudio: HTMLAudioElement | null = null;
  private urls = new Map<string, string>();
  outputDeviceId = "";
  virtualDeviceId = "";
  routeToVirtual = false;
  listenLocally = true;
  masterVolume = 0.9;
  listenVolume = 0.7;
  inputVolume = 0.85;

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  playing() {
    return [...this.clips.values()].map((c) => ({ id: c.id, name: c.name, startedAt: c.startedAt }));
  }

  isPlaying(id: string) {
    return this.clips.has(id);
  }

  setUrl(id: string, url: string) {
    this.urls.set(id, url);
  }

  async applySink(el: HTMLAudioElement, deviceId: string) {
    const anyEl = el as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    if (!deviceId || typeof anyEl.setSinkId !== "function") return;
    try {
      await anyEl.setSinkId(deviceId);
    } catch (error) {
      console.warn("Output device unavailable", error);
    }
  }

  private targetOutputId() {
    if (this.routeToVirtual && this.virtualDeviceId) return this.virtualDeviceId;
    return this.outputDeviceId;
  }

  async play(sound: SoundItem) {
    await this.stop(sound.id);
    const url = this.urls.get(sound.id);
    if (!url) throw new Error("Sound file is missing from local storage.");

    const primary = new Audio(url);
    primary.preload = "auto";
    primary.volume = Math.max(0, Math.min(1, sound.volume * this.masterVolume));
    await this.applySink(primary, this.targetOutputId());

    let local: HTMLAudioElement | undefined;
    const target = this.targetOutputId();
    if (this.listenLocally && target && target !== this.outputDeviceId) {
      local = new Audio(url);
      local.volume = Math.max(0, Math.min(1, sound.volume * this.listenVolume));
      await this.applySink(local, this.outputDeviceId);
    } else if (this.listenLocally && this.routeToVirtual && this.virtualDeviceId) {
      local = new Audio(url);
      local.volume = Math.max(0, Math.min(1, sound.volume * this.listenVolume));
    }

    const clip: ActiveClip = { id: sound.id, name: sound.name, primary, local, startedAt: Date.now() };
    const cleanup = () => {
      this.teardown(clip);
      if (this.clips.get(sound.id) === clip) this.clips.delete(sound.id);
      this.emit();
    };
    primary.addEventListener("ended", cleanup);
    primary.addEventListener("error", cleanup);
    this.clips.set(sound.id, clip);
    this.emit();
    await Promise.all([primary.play(), local?.play() ?? Promise.resolve()]);
  }

  async playUrl(id: string, name: string, url: string, volume = 0.85) {
    this.setUrl(id, url);
    await this.play({
      id,
      name,
      fileName: "",
      duration: 0,
      volume,
      categoryId: "general",
      shortcut: "",
      shortcutEnabled: true,
      color: "#39FF72",
      createdAt: 0,
      lastPlayedAt: 0
    });
  }

  async stop(id: string) {
    const clip = this.clips.get(id);
    if (!clip) return;
    this.teardown(clip);
    this.clips.delete(id);
    this.emit();
  }

  stopAll() {
    for (const id of [...this.clips.keys()]) void this.stop(id);
  }

  setClipVolume(id: string, volume: number) {
    const clip = this.clips.get(id);
    if (!clip) return;
    clip.primary.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
    if (clip.local) clip.local.volume = Math.max(0, Math.min(1, volume * this.listenVolume));
  }

  private teardown(clip: ActiveClip) {
    try {
      clip.primary.pause();
      clip.primary.src = "";
      clip.primary.load();
    } catch {
      /* ignore */
    }
    if (clip.local) {
      try {
        clip.local.pause();
        clip.local.src = "";
        clip.local.load();
      } catch {
        /* ignore */
      }
    }
  }

  async startMicMonitor(inputDeviceId: string, outputDeviceId: string) {
    await this.stopMicMonitor();
    const constraints: MediaStreamConstraints = {
      audio: inputDeviceId
        ? { deviceId: { exact: inputDeviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    };
    this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.micContext = new AudioContext();
    const source = this.micContext.createMediaStreamSource(this.micStream);
    this.micGain = this.micContext.createGain();
    this.micGain.gain.value = this.inputVolume;
    const dest = this.micContext.createMediaStreamDestination();
    source.connect(this.micGain).connect(dest);
    this.micAudio = new Audio();
    this.micAudio.srcObject = dest.stream;
    this.micAudio.autoplay = true;
    await this.applySink(this.micAudio, outputDeviceId);
    await this.micAudio.play();
    this.emit();
  }

  setMicVolume(volume: number) {
    this.inputVolume = volume;
    if (this.micGain) this.micGain.gain.value = volume;
  }

  async stopMicMonitor() {
    if (this.micAudio) {
      this.micAudio.pause();
      this.micAudio.srcObject = null;
      this.micAudio = null;
    }
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) track.stop();
      this.micStream = null;
    }
    if (this.micContext) {
      await this.micContext.close().catch(() => undefined);
      this.micContext = null;
      this.micGain = null;
    }
    this.emit();
  }

  get monitoring() {
    return Boolean(this.micStream);
  }

  async refreshOutputRouting() {
    const target = this.targetOutputId();
    await Promise.all(
      [...this.clips.values()].map(async (clip) => {
        await this.applySink(clip.primary, target);
        if (clip.local) await this.applySink(clip.local, this.outputDeviceId);
      })
    );
  }

  dispose() {
    this.stopAll();
    void this.stopMicMonitor();
    this.listeners.clear();
  }
}

export const audioEngine = new AudioEngine();
