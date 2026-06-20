import type { GoogleLoginResponse } from '@freshr/shared';

export type GoogleProfile = GoogleLoginResponse['profile'];

/**
 * In-memory handoff for a Google new-user's name/picture between the sign-in
 * button and the onboarding form. The web client persists this in localStorage;
 * on mobile a module-level holder is enough — it only needs to survive the
 * single navigation from login to the onboarding screen within one app session,
 * and it must not outlive the process (it carries no auth value).
 */
let pendingProfile: GoogleProfile | null = null;

export function setGoogleProfile(profile: GoogleProfile): void {
  pendingProfile = profile;
}

/** Read the pending profile without consuming it. */
export function getGoogleProfile(): GoogleProfile | null {
  return pendingProfile;
}

export function clearGoogleProfile(): void {
  pendingProfile = null;
}
