// Thin wrapper around the Umami Cloud script (injected in main.tsx for PROD only).
// In dev the global is undefined, so these calls become no-ops.

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
      identify: (id: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}

export function identify(id: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.umami?.identify(id, data);
}
