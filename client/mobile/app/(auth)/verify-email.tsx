import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuthService } from '@/hooks/useAuthService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Shown after registration (or when login reports an unverified account). The
 * backend has emailed a verification link; the user verifies, then returns to
 * log in. "Resend" re-triggers the verification email.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const authService = useAuthService();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    setNotice('');
    try {
      await authService.requestEmailVerification(email);
      setNotice('Verification email sent. Check your inbox.');
    } catch (err: any) {
      const message =
        err?.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Could not resend the email. Please try again.';
      setNotice(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6">
      <AuthHeader />

      <View className="items-center gap-4">
        <Icon as={MailCheck} size={56} className="text-success" />
        <Text className="text-center text-3xl font-bold">Check your email</Text>
        <Text className="text-center text-base text-muted-foreground">
          We&apos;ve sent a verification link to{'\n'}
          <Text className="font-semibold text-foreground">{email ?? 'your email'}</Text>.{'\n'}
          Verify your account, then log in.
        </Text>
      </View>

      {notice ? (
        <Text className="mt-6 text-center text-sm text-muted-foreground">{notice}</Text>
      ) : null}

      <View className="mt-10 gap-3">
        <Button className="h-14 rounded-xl" onPress={() => router.replace('/login')}>
          <Text className="text-base font-semibold">Back to login</Text>
        </Button>
        <Button
          variant="outline"
          className="h-14 rounded-xl"
          onPress={onResend}
          disabled={resending || !email}>
          {resending ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-medium">Resend verification email</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
