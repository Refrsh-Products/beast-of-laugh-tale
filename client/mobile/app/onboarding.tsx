import { Wordmark } from '@/components/auth/Wordmark';
import { CommunityStep } from '@/components/onboarding/community-step';
import { ProfileStep, type ProfileValues } from '@/components/onboarding/profile-step';
import { WelcomeStep } from '@/components/onboarding/welcome-step';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { StepDots } from '@/components/ui/step-dots';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAccountService } from '@/hooks/useAccountService';
import { clearGoogleProfile, getGoogleProfile } from '@/lib/googleProfile';
import { COMMUNITY_OFF, type CommunityStatus, type StoredAccount } from '@freshr/shared';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  ScrollView,
  View,
} from 'react-native';

/**
 * Hard-gate onboarding, in three steps: welcome → profile form → WhatsApp
 * community. Mirrors the web OnboardingPage.
 *
 * The profile saves at the end of step 2, not step 3. That ordering is the whole
 * safety property: once the form is saved the user is onboarded server-side, so
 * the community ask can never block, fail, or trap anyone. Force-quitting on
 * step 3 is a complete onboarding — the account screen carries the invite from
 * then on.
 *
 * The screen also handles the "error" status (a transient /accounts/me/ failure)
 * with a retry, and renders nothing while the status is still loading — the
 * guard only sends real users here, so there's no logged-out branch to handle.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const accountService = useAccountService();
  const { onboarding, refreshOnboarding, markOnboardingComplete } = useAuth();

  // Captured once: getGoogleProfile() re-reads storage on every render and goes
  // null after clearGoogleProfile(), which would blank the step-3 greeting.
  const [googleProfile] = useState(() => getGoogleProfile());

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [formError, setFormError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [community, setCommunity] = useState<CommunityStatus>(COMMUNITY_OFF);
  // Step 3 greets by name, which is only guaranteed after step 2.
  const [firstName, setFirstName] = useState(googleProfile?.first_name ?? '');

  // Held so step 2's submit can await a request that started at mount rather
  // than firing one and making the user watch it.
  const communityPromise = useRef<Promise<CommunityStatus> | null>(null);

  // Hooks must stay above the status guards below.
  useEffect(() => {
    // No .catch: getCommunity never rejects, it resolves to COMMUNITY_OFF. That
    // is what makes "the community step can never block onboarding" structural.
    communityPromise.current = accountService.getCommunity().then((c) => {
      setCommunity(c);
      return c;
    });
  }, [accountService]);

  // Onboarding is a hard gate, so swallow Android's hardware back. The iOS
  // swipe is disabled via the Stack.Screen option below.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // The guard sends 'incomplete' and 'error' users here; while it re-checks
  // ('loading'/'unknown') render nothing rather than flashing the form.
  if (onboarding === 'loading' || onboarding === 'unknown') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (onboarding === 'error') {
    const onRetry = async () => {
      setRetrying(true);
      try {
        await refreshOnboarding();
      } finally {
        setRetrying(false);
      }
    };
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
        <Text className="text-center text-xl font-bold">Something went wrong</Text>
        <Text className="text-center text-base text-muted-foreground">
          We couldn&apos;t load your account. Check your connection and try again.
        </Text>
        <Button className="h-14 w-full rounded-xl" onPress={onRetry} disabled={retrying}>
          {retrying ? <ButtonSpinner /> : <Text className="font-semibold">Try again</Text>}
        </Button>
      </View>
    );
  }

  // 'complete' only reaches here once we've asserted it ourselves on the way out
  // of step 3; the guard is already replacing to /notebooks, so render nothing.
  if (onboarding === 'complete' && step !== 3) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const finish = () => {
    clearGoogleProfile();
    // Assert completion locally instead of refreshing: we already know the PATCH
    // returned 200, and refreshOnboarding can resolve to 'error' on a blip and
    // strand a fully onboarded user on the retry screen above.
    markOnboardingComplete();
    router.replace('/notebooks');
  };

  const onProfileSubmit = async (values: ProfileValues) => {
    setFormError('');
    setSaving(true);
    setFirstName(values.firstName);

    const payload = {
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      university: values.university,
      year_of_study: values.yearOfStudy,
      profile_picture_url: googleProfile?.profile_picture_url,
      onboarding_completed: true,
    };

    // This try wraps ONLY the save. Widening it would report a post-save bug as
    // "failed to save your profile" on a profile that did save.
    try {
      try {
        // Normal path: a stub Account row already exists (created at email
        // verification / Google sign-in), so we PATCH it.
        await accountService.updateAccount(payload);
      } catch (err: any) {
        // Safety net for an orphaned account with no row yet (e.g. a user
        // activated outside the verify flow). PATCH /accounts/me/ 404s, so
        // create the row instead — POST /accounts/ forces onboarding_completed
        // server-side. Then refresh the cache, since saveAccount only stored the
        // partial payload we sent.
        if (err?.response?.status === 404) {
          await accountService.saveAccount(payload as unknown as StoredAccount);
          await accountService.getAccount();
        } else {
          throw err;
        }
      }
    } catch {
      setFormError('Failed to save your profile. Please try again.');
      setSaving(false);
      return; // stay on step 2
    }

    // Past this line the user IS onboarded server-side. Nothing below may keep
    // them here or surface an error.
    const live = (await communityPromise.current) ?? COMMUNITY_OFF;
    setSaving(false);
    if (live.enabled) setStep(3);
    else finish();
  };

  const onJoin = async () => {
    setJoining(true);
    // Best-effort: the consent record must never gate the exit.
    try {
      await accountService.joinCommunity();
    } catch {
      // Ignored on purpose — see above.
    }
    setJoining(false);
    // Leave onboarding while still foregrounded, THEN hand off, so returning
    // from WhatsApp lands on /notebooks rather than back here.
    finish();
    // Linking, not expo-web-browser: only the system handler resolves
    // chat.whatsapp.com as a universal link into the WhatsApp app. An in-app
    // browser tab would render WhatsApp's web fallback page inside our app.
    // (Web fires this before its await to keep the popup unblocked; on native
    // there is no popup blocker, so ordering is free to favour navigation.)
    Linking.openURL(community.invite_url).catch((err) =>
      console.warn('Could not open the WhatsApp invite', err)
    );
  };

  // Grows to 3 only once the prefetch says the community is live — better a dot
  // appearing late than telling someone "step 2 of 3" and finishing at 2.
  const totalSteps = community.enabled ? 3 : 2;

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
        <ScrollView
          contentContainerClassName="flex-grow px-6 pb-10 pt-24"
          keyboardShouldPersistTaps="handled">
          <Wordmark className="mb-12" />

          {step === 1 && (
            <WelcomeStep
              firstName={googleProfile?.first_name}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <ProfileStep
              initialFirstName={googleProfile?.first_name ?? ''}
              initialLastName={googleProfile?.last_name ?? ''}
              saving={saving}
              error={formError}
              onSubmit={onProfileSubmit}
            />
          )}

          {step === 3 && (
            <CommunityStep
              community={community}
              firstName={firstName}
              joining={joining}
              onJoin={onJoin}
              onSkip={finish}
            />
          )}

          <StepDots total={totalSteps} current={step} className="mt-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
