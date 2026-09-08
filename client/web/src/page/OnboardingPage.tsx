import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import {
  COMMUNITY_OFF,
  type CommunityStatus,
  type OnboardingStatus,
} from "@freshr/shared";
import FreshrLogo from "../components/logo/FreshrLogo";
import LoadErrorScreen from "../components/ui/LoadErrorScreen";
import StepDots from "../components/ui/StepDots";
import WelcomeStep from "../components/onboarding/WelcomeStep";
import ProfileStep, {
  type ProfileValues,
} from "../components/onboarding/ProfileStep";
import CommunityStep from "../components/onboarding/CommunityStep";
import { getGoogleProfile, clearGoogleProfile } from "../storage";

/**
 * Three steps: welcome → profile form → WhatsApp community.
 *
 * The profile saves at the end of step 2, not step 3. That ordering is the whole
 * safety property: once the form is saved the user is onboarded server-side, so
 * the community ask can never block, fail, or trap anyone. Closing the tab on
 * step 3 is a complete onboarding.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const accountService = useAccountService();

  // Captured once: `getGoogleProfile()` reads sessionStorage on every render and
  // goes null after clearGoogleProfile(), which would blank the step-3 greeting.
  const [googleProfile] = useState(() => getGoogleProfile());

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<OnboardingStatus | "loading">("loading");
  const [retrying, setRetrying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [community, setCommunity] = useState<CommunityStatus>(COMMUNITY_OFF);
  // Step 3 greets by name, which is only guaranteed after step 2.
  const [firstName, setFirstName] = useState(googleProfile?.first_name ?? "");

  // Held so step 2's submit can await a request that started at mount rather
  // than firing one and making the user watch it.
  const communityPromise = useRef<Promise<CommunityStatus> | null>(null);

  /** Retry handler for the error screen — an event handler, not an effect. */
  async function checkStatus() {
    setRetrying(true);
    const next = await accountService.getOnboardingStatus();
    setStatus(next);
    setRetrying(false);
  }

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    let cancelled = false;

    // Both settle in callbacks rather than synchronously in the effect body, so
    // neither triggers a cascading render on mount.
    accountService.getOnboardingStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    // No .catch: getCommunity never rejects, it resolves to COMMUNITY_OFF. That
    // is what makes "the community step can never block onboarding" structural.
    communityPromise.current = accountService.getCommunity().then((c) => {
      if (!cancelled) setCommunity(c);
      return c;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (status === "loading") return null;
  if (status === "error") {
    return <LoadErrorScreen onRetry={checkStatus} retrying={retrying} />;
  }
  if (status === "complete") return <Navigate to="/dashboard" replace />;

  function finish() {
    clearGoogleProfile();
    navigate("/dashboard");
  }

  async function handleProfileSubmit(values: ProfileValues) {
    setSaveError("");
    setSaving(true);
    setFirstName(values.firstName);

    // The try wraps ONLY the save. Widening it would report a post-save bug as
    // "failed to save your profile" on a profile that did save.
    try {
      await accountService.updateAccount({
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
        university: values.university,
        year_of_study: values.yearOfStudy,
        profile_picture_url: googleProfile?.profile_picture_url,
        onboarding_completed: true,
      });
    } catch {
      setSaveError("Failed to save your profile. Please try again.");
      setSaving(false);
      return; // stay on step 2
    }

    // Past this line the user IS onboarded server-side. Nothing below may keep
    // them here or surface an error.
    const live = (await communityPromise.current) ?? COMMUNITY_OFF;
    setSaving(false);
    if (live.enabled) setStep(3);
    else finish();
  }

  function handleJoin() {
    // Must be the first statement in the gesture: after an await, transient user
    // activation is gone and Safari/Firefox block the popup. The URL is already
    // in hand from the mount-time prefetch, so nothing needs awaiting.
    window.open(community.invite_url, "_blank", "noopener,noreferrer");
    // Best-effort. The consent record must never gate the exit, and an SPA route
    // change doesn't unload the document, so this isn't cancelled.
    void accountService.joinCommunity().catch(() => {});
    finish();
  }

  // Grows to 3 only once the prefetch says the community is live — better a dot
  // fading in than telling someone "step 2 of 3" and finishing at 2.
  const totalSteps = community.enabled ? 3 : 2;

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="bg-card ring-foreground/5 w-full max-w-120 rounded-3xl p-8 shadow-lg ring-1 sm:p-10">
        <div className="mb-6">
          <FreshrLogo />
        </div>

        {step === 1 && (
          <WelcomeStep
            firstName={googleProfile?.first_name}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ProfileStep
            initialFirstName={googleProfile?.first_name ?? ""}
            initialLastName={googleProfile?.last_name ?? ""}
            saving={saving}
            error={saveError}
            onSubmit={handleProfileSubmit}
          />
        )}

        {step === 3 && (
          <CommunityStep
            community={community}
            firstName={firstName}
            onJoin={handleJoin}
            onSkip={finish}
          />
        )}

        <StepDots total={totalSteps} current={step} className="mt-8" />
      </div>
    </div>
  );
}
