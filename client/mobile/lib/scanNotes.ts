import { mobileSessionStore } from '@/lib/session';
import type { ScanPhotoValidationResult } from '@freshr/shared';

/**
 * Max photos per scan batch, by plan. This is a UX-only cap for immediate
 * feedback — the server independently enforces the authoritative limit
 * (`max_photos_per_scan`) and rejects over-limit batches.
 */
export const SCAN_PHOTO_LIMIT_FREE = 2;
export const SCAN_PHOTO_LIMIT_PAID = 5;

export function getScanPhotoLimit(): number {
  return mobileSessionStore.getAccount()?.tier_plan === 'PAID'
    ? SCAN_PHOTO_LIMIT_PAID
    : SCAN_PHOTO_LIMIT_FREE;
}

export function isPaidUser(): boolean {
  return mobileSessionStore.getAccount()?.tier_plan === 'PAID';
}

/** A photo captured in the current scan session. */
export interface ScanPhoto {
  /** Local-only id (not the server id). */
  id: string;
  /** file:// uri returned by CameraView.takePictureAsync. */
  uri: string;
  /** 'rejected' once the server flags this photo in a 422 response. */
  status: 'ok' | 'rejected';
  /** Server verdict, populated only when status === 'rejected'. */
  rejection?: ScanPhotoValidationResult;
}

export function makeScanPhotoId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
