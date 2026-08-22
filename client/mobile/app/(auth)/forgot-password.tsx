import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuthService } from '@/hooks/useAuthService';
import { validateEmail } from '@/lib/validation';
import { useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';

/**
 * Collects an email and hits the password-reset endpoint. The reset
 * itself is completed via the emailed link, so on success we just confirm the
 * email was sent. We confirm regardless of whether the address exists (the
 * backend doesn't disclose account existence).
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const authService = useAuthService();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const emailErr = validateEmail(email);
    setError(emailErr ?? undefined);
    if (emailErr) return;

    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      console.error('[ForgotPassword] reset request failed:', err);
      // Still confirm — we don't reveal whether the email is registered.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 bg-background px-6">
        <AuthHeader />
        <View className="items-center gap-4">
          <MailCheck size={56} color="#34c759" />
          <Text className="text-center text-3xl font-bold">Check your email</Text>
          <Text className="text-center text-base text-muted-foreground">
            If an account exists for{'\n'}
            <Text className="font-semibold text-foreground">{email.trim()}</Text>,{'\n'}
            we&apos;ve sent a link to reset your password.
          </Text>
        </View>
        <Button className="mt-10 h-14 rounded-xl" onPress={() => router.replace('/login')}>
          <Text className="text-base font-semibold">Back to login</Text>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-10"
        keyboardShouldPersistTaps="handled">
        <AuthHeader showBack />

        <Text className="mb-3 text-3xl font-bold">Reset your Password</Text>
        <Text className="mb-8 text-muted-foreground">
          Enter the email associated with your account and we&apos;ll send you a link to reset your
          password.
        </Text>

        <View className="gap-1.5">
          <Input
            className="h-14 rounded-xl"
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            aria-invalid={!!error}
            editable={!loading}
          />
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        </View>

        <Button className="mt-6 h-14 rounded-xl" onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold">Send reset link</Text>
          )}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
