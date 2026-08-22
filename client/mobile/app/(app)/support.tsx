import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { ChevronLeft, Clock, LucideIcon, Mail, MapPin, Phone } from 'lucide-react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';
import { useAccountService } from '@/hooks/useAccountService';
import {
  BUSINESS_ADDRESS_LINES,
  BUSINESS_HOURS,
  BUSINESS_PHONE,
  SUPPORT_EMAIL,
  sendSupportEmail,
} from '@/lib/supportEmail';

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const accountService = useAccountService();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Prefill name from the account profile; a failure just leaves the field blank.
  useEffect(() => {
    let cancelled = false;
    accountService
      .getAccount()
      .then((res) => {
        const acc = res?.account;
        if (!cancelled && acc) {
          setFullName([acc.first_name, acc.last_name].filter(Boolean).join(' '));
        }
      })
      .catch((err) => console.warn('Failed to prefill support form', err));
    return () => {
      cancelled = true;
    };
  }, [accountService]);

  const canSubmit =
    fullName.trim() !== '' && email.trim() !== '' && mobile.trim() !== '' && message.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit || isSending) return;
    setIsSending(true);
    try {
      await sendSupportEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        message: message.trim(),
      });
      setMessage('');
      Alert.alert('Message sent', 'Thanks for reaching out — our team will get back to you soon.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Failed to send support message', err);
      Alert.alert('Error', err?.message || 'Could not send your message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerClassName="p-4 gap-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center gap-2">
            <Button variant="ghost" size="icon" onPress={() => router.back()}>
              <Icon as={ChevronLeft} size={30} />
            </Button>
            <Text className="text-3xl font-bold">Support</Text>
          </View>

          <Text className="px-1 text-sm leading-5 text-muted-foreground">
            Send us a message and our team will get back to you.
          </Text>

          {/* Contact info */}
          <View className="gap-2">
            <ContactCard icon={Mail} label="EMAIL" value={SUPPORT_EMAIL} />
            <ContactCard icon={Phone} label="PHONE" value={BUSINESS_PHONE} />
            <ContactCard icon={Clock} label="BUSINESS HOURS" value={BUSINESS_HOURS} />
            <ContactCard icon={MapPin} label="ADDRESS" value={BUSINESS_ADDRESS_LINES.join('\n')} />
          </View>

          {/* Message form */}
          <View className="gap-4">
            <Text className="px-1 text-base font-semibold">Send us a message</Text>

            <View className="gap-2">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                FULL NAME
              </Text>
              <Input placeholder="Jane Doe" value={fullName} onChangeText={setFullName} />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                EMAIL
              </Text>
              <Input
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                MOBILE NUMBER
              </Text>
              <Input
                placeholder="+880 1XXX-XXXXXX"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold tracking-wider text-muted-foreground">
                MESSAGE
              </Text>
              <Input
                placeholder="How can we help?"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                className="min-h-32 py-3"
              />
            </View>

            <Button size="lg" onPress={handleSubmit} disabled={!canSubmit || isSending}>
              {isSending ? (
                <ButtonSpinner size="small" />
              ) : (
                <Text>Send Message</Text>
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Full-width contact row: icon on the left, label over value. */
function ContactCard({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="size-9 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} size={16} className="text-muted-foreground" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</Text>
        <Text className="text-sm font-semibold leading-5">{value}</Text>
      </View>
    </View>
  );
}
