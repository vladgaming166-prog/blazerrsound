import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const s = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconDashboard = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
);
export const IconBoard = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="8" width="5" height="12" rx="1.5"/><rect x="17" y="6" width="4" height="14" rx="1.5"/></svg>
);
export const IconSounds = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></svg>
);
export const IconKeys = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M8 14h8"/></svg>
);
export const IconMic = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
);
export const IconSettings = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
);
export const IconUser = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 19c1.6-3 4-4.5 7-4.5S17.4 16 19 19"/></svg>
);
export const IconPlay = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>
);
export const IconStop = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/></svg>
);
export const IconClose = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
);
export const IconMin = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
);
export const IconMax = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
);
export const IconPlus = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
);
export const IconSearch = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/></svg>
);
export const IconBolt = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 10-14h-7l2-6z" fill="currentColor" stroke="none"/></svg>
);
export const IconGoogle = (p: P) => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...p}><path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.3 0 8.8-3.7 8.8-9 0-.6 0-1-.1-1.5H12z"/></svg>
);
export const IconEye = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...s} {...p} viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M9.9 5.1A11 11 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-4.2 4.8M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.7"/></svg>
);
