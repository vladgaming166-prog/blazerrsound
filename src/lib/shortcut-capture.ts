const KEY_MAP: Record<string, string> = {
  Control: "CommandOrControl",
  Meta: "CommandOrControl",
  Alt: "Alt",
  Shift: "Shift",
  " ": "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Escape: "Esc"
};

export function eventToAccelerator(e: KeyboardEvent): string | null {
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const mapped = KEY_MAP[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key);
  if (!mapped) return null;
  parts.push(mapped);
  return parts.join("+");
}

export function shortcutConflict(sounds: { id: string; name: string; shortcut?: string }[], soundId: string, shortcut: string) {
  const key = shortcut.toLowerCase();
  return sounds.find((s) => s.id !== soundId && s.shortcut && s.shortcut.toLowerCase() === key) || null;
}
