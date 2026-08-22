import { Wordmark } from '@/components/auth/Wordmark';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAccountService } from '@/hooks/useAccountService';
import { clearGoogleProfile, getGoogleProfile } from '@/lib/googleProfile';
import type { StoredAccount } from '@freshr/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  View,
} from 'react-native';

/**
 * Hard-gate onboarding form (mirrors the web OnboardingPage). A logged-in user
 * whose profile is incomplete is routed here by the root guard and can't reach
 * the app tabs until they submit. On success we mark `onboarding_completed` and
 * refresh the auth context, which lets the guard move them to the notebooks tab.
 *
 * The screen also handles the "error" status (a transient /accounts/me/ failure)
 * with a retry, and renders nothing while the status is still loading — the
 * guard only sends real users here, so there's no logged-out branch to handle.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const accountService = useAccountService();
  const { onboarding, refreshOnboarding } = useAuth();

  const googleProfile = getGoogleProfile();
  const [firstName, setFirstName] = useState(googleProfile?.first_name ?? '');
  const [lastName, setLastName] = useState(googleProfile?.last_name ?? '');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // The guard sends 'incomplete' and 'error' users here; while it re-checks
  // ('loading'/'unknown') render nothing rather than flashing the form.
  if (onboarding === 'loading' || onboarding === 'unknown' || onboarding === 'complete') {
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

  const missing = {
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    phone: !phone.trim(),
    address1: !address1.trim(),
    city: !city.trim(),
    postalCode: !postalCode.trim(),
  };

  const onSubmit = async () => {
    setFormError('');
    if (Object.values(missing).some(Boolean)) {
      setShowErrors(true);
      setFormError('Please fill in all required fields.');
      return;
    }
    setShowErrors(false);
    setSubmitting(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      address1: address1.trim(),
      address2: address2.trim() || '',
      city: city.trim(),
      postal_code: postalCode.trim(),
      profile_picture_url: googleProfile?.profile_picture_url,
      onboarding_completed: true,
    };

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
      clearGoogleProfile();
      // Re-check status so the guard sees 'complete' and routes to the tabs;
      // replace explicitly so it's immediate rather than waiting on the guard.
      await refreshOnboarding();
      router.replace('/notebooks');
    } catch {
      setFormError('Failed to save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior="padding">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10 pt-24"
        keyboardShouldPersistTaps="handled">
        <Wordmark className="mb-12" />

        <Text className="mb-2 text-3xl font-bold">One last step</Text>
        <Text className="mb-8 text-base text-muted-foreground">
          Tell us a bit about yourself to complete your profile.
        </Text>

        {formError ? (
          <Text className="mb-5 text-sm text-destructive">{formError}</Text>
        ) : null}

        <View className="gap-5">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">FIRST NAME *</Text>
              <Input
                className="h-14 rounded-xl"
                placeholder="Jane"
                value={firstName}
                onChangeText={setFirstName}
                aria-invalid={showErrors && missing.firstName}
                editable={!submitting}
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">LAST NAME *</Text>
              <Input
                className="h-14 rounded-xl"
                placeholder="Smith"
                value={lastName}
                onChangeText={setLastName}
                aria-invalid={showErrors && missing.lastName}
                editable={!submitting}
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">PHONE NUMBER *</Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^\d+\-\s().]/g, ''))}
              aria-invalid={showErrors && missing.phone}
              editable={!submitting}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">ADDRESS LINE 1 *</Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="123 Main St"
              value={address1}
              onChangeText={setAddress1}
              aria-invalid={showErrors && missing.address1}
              editable={!submitting}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              ADDRESS LINE 2 (OPTIONAL)
            </Text>
            <Input
              className="h-14 rounded-xl"
              placeholder="Apt 4B"
              value={address2}
              onChangeText={setAddress2}
              editable={!submitting}
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">CITY *</Text>
              <Input
                className="h-14 rounded-xl"
                placeholder="New York"
                value={city}
                onChangeText={setCity}
                aria-invalid={showErrors && missing.city}
                editable={!submitting}
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">POSTAL CODE *</Text>
              <Input
                className="h-14 rounded-xl"
                placeholder="1234"
                keyboardType="number-pad"
                value={postalCode}
                onChangeText={(t) => setPostalCode(t.replace(/\D/g, '').slice(0, 4))}
                aria-invalid={showErrors && missing.postalCode}
                editable={!submitting}
              />
            </View>
          </View>

          <Button className="mt-2 h-14 rounded-xl" onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ButtonSpinner />
            ) : (
              <Text className="text-base font-semibold">Go to notebooks →</Text>
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
