import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Wordmark } from '@/components/auth/Wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuthService } from '@/hooks/useAuthService';
import { validateEmail, validatePassword, validatePasswordConfirm } from '@/lib/validation';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

type FieldErrors = { email?: string; password?: string; confirm?: string };

export default function RegisterScreen() {
  const router = useRouter();
  const authService = useAuthService();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirm: validatePasswordConfirm(password, confirm) ?? undefined,
    };
    setErrors(next);
    setFormError('');
    if (next.email || next.password || next.confirm) return;

    setLoading(true);
    try {
      await authService.register(email.trim(), password, confirm);
      router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10 pt-16"
        keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} className="-ml-1 mb-6 h-8 w-8 justify-center">
          <ChevronLeft size={28} />
        </Pressable>

        <Wordmark className="mb-12" />

        <Text className="mb-8 text-3xl font-bold">Create your Account</Text>

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
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              aria-invalid={!!errors.password}
              editable={!loading}
            />
            {errors.password ? (
              <Text className="text-sm text-destructive">{errors.password}</Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Input
              className="h-14 rounded-xl"
              placeholder="Confirm Password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={confirm}
              onChangeText={setConfirm}
              aria-invalid={!!errors.confirm}
              editable={!loading}
            />
            {errors.confirm ? (
              <Text className="text-sm text-destructive">{errors.confirm}</Text>
            ) : null}
          </View>

          {formError ? (
            <Text className="text-center text-sm text-destructive">{formError}</Text>
          ) : null}

          <Button className="mt-2 h-14 rounded-xl" onPress={onSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold">Sign up</Text>
            )}
          </Button>
        </View>

        <Text className="my-8 text-center text-muted-foreground">- Or sign up with -</Text>
        <GoogleSignInButton />

        <View className="mt-auto pt-12">
          <Text className="text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Text className="text-sm text-blue-600">Terms</Text> and have read and acknowledged the{' '}
            <Text className="text-sm text-blue-600">Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
