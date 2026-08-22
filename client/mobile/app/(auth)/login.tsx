import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuthService } from '@/hooks/useAuthService';
import { validateEmail, validatePassword } from '@/lib/validation';
import { NeedsVerificationError } from '@freshr/shared';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const authService = useAuthService();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr ?? undefined, password: passwordErr ?? undefined });
    setFormError('');
    if (emailErr || passwordErr) return;

    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      // Don't navigate here: the root guard routes to /onboarding or /notebooks
      // once onboarding status resolves. Keep the spinner up until it does so we
      // never flash the tabs and then bounce an un-onboarded user back.
    } catch (err: any) {
      setLoading(false);
      if (err instanceof NeedsVerificationError || err?.needsVerification) {
        router.push({ pathname: '/verify-email', params: { email: email.trim() } });
        return;
      }
      const message =
        err?.response?.data?.error ??
        err?.response?.data?.detail ??
        'Incorrect email or password. Please try again.';
      setFormError(String(message));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior="padding">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10"
        keyboardShouldPersistTaps="handled">
        <AuthHeader />

        <Text className="mb-8 text-3xl font-bold">Log in with your Account</Text>

        <View className="gap-5">
          <View className="gap-1.5">
            <Input
              className="h-14 rounded-xl"
              placeholder="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              aria-invalid={!!errors.email}
              editable={!loading}
            />
            {errors.email ? <Text className="text-sm text-destructive">{errors.email}</Text> : null}
          </View>

          <View className="gap-1.5">
            <Input
              className="h-14 rounded-xl"
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              aria-invalid={!!errors.password}
              editable={!loading}
            />
            {errors.password ? (
              <Text className="text-sm text-destructive">{errors.password}</Text>
            ) : null}
          </View>

          <Link href="/forgot-password" asChild>
            <Text className="self-end text-sm text-muted-foreground">Forgot password?</Text>
          </Link>

          {formError ? (
            <Text className="text-center text-sm text-destructive">{formError}</Text>
          ) : null}

          <Button className="mt-2 h-14 rounded-xl" onPress={onSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold">Sign in</Text>
            )}
          </Button>
        </View>

        <Text className="my-8 text-center text-muted-foreground">- Or sign in with -</Text>
        <GoogleSignInButton />

        <View className="mt-auto flex-row justify-center pt-12">
          <Text className="text-muted-foreground">Don&apos;t Have an Account? </Text>
          <Link href="/register" asChild>
            <Text className="font-semibold text-blue-600">Sign up</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
