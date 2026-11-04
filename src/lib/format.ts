export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function formatShortcut(value: string): string {
  if (!value) return "None";
  return value
    .replace(/CommandOrControl/gi, "Ctrl")
    .replace(/Control/gi, "Ctrl")
    .replace(/\+/g, " + ");
}

export function prettyDevice(label: string, fallback = "System default"): string {
  const clean = (label || "").replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*/i, "").trim();
  return clean || fallback;
}

export function initials(name: string): string {
  const parts = (name || "SB").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "S").join("");
}

export function bytesLabel(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const VIRTUAL_PATTERNS = [
  /vb-?audio/i,
  /vb-?cable/i,
  /cable input/i,
  /cable output/i,
  /voicemeeter/i,
  /virtual cable/i,
  /virtual audio/i,
  /blackhole/i,
  /loopback/i,
  /soundflower/i,
  /oculus virtual/i
];

export function isVirtualDevice(label: string): boolean {
  return VIRTUAL_PATTERNS.some((re) => re.test(label || ""));
}

export function isVirtualOutput(label: string): boolean {
  if (!isVirtualDevice(label)) return false;
  if (/cable output/i.test(label)) return false;
  return true;
}

export function isVirtualInput(label: string): boolean {
  if (!isVirtualDevice(label)) return false;
  if (/cable input/i.test(label)) return false;
  return true;
}

export function routingState(
  devices: { label: string; kind: string; deviceId: string }[],
  audio: { virtualDeviceId: string; outputDeviceId: string; routeToVirtual: boolean }
): { state: import("./types").RoutingState; message: string; virtualOutputs: typeof devices } {
  const outputs = devices.filter((d) => d.kind === "audiooutput");
  const virtualOutputs = outputs.filter((d) => isVirtualOutput(d.label) || isVirtualDevice(d.label));
  const selected = outputs.find((d) => d.deviceId === audio.virtualDeviceId || d.deviceId === audio.outputDeviceId);
  const selectedIsVirtual = Boolean(selected && isVirtualDevice(selected.label));

  if (audio.routeToVirtual && audio.virtualDeviceId) {
    const stillThere = outputs.some((d) => d.deviceId === audio.virtualDeviceId);
    if (!stillThere) {
      return {
        state: "missing",
        message: "The virtual cable you selected is no longer available. Soundboard audio is not going through a microphone.",
        virtualOutputs
      };
    }
    if (audio.routeToVirtual && selectedIsVirtual) {
      return {
        state: "configured",
        message: `Soundboard output is routed to “${prettyDevice(selected!.label)}”. In Discord or your game, set the microphone to the matching virtual output (for VB-CABLE, use CABLE Output).`,
        virtualOutputs
      };
    }
  }

  if (virtualOutputs.length) {
    return {
      state: "available",
      message: "A virtual audio device was detected, but SoundBlazerr is not routing through it yet. Select it as the soundboard output to send audio into other apps.",
      virtualOutputs
    };
  }

  return {
    state: "none",
    message:
      "No virtual microphone cable was found. Playback currently goes to your selected speakers/headphones only — it is not entering Discord, Zoom, or games as a microphone. Install VB-CABLE or Voicemeeter, then select CABLE Input as the soundboard output.",
    virtualOutputs
  };
}
