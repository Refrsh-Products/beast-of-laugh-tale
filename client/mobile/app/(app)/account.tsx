import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAuthService } from '@/hooks/useAuthService';
import { useAccountService } from '@/hooks/useAccountService';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, View, ScrollView, Image } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import {
  COMMUNITY_OFF,
  type AccountUsage,
  type CommunityStatus,
  type StoredAccount,
} from '@freshr/shared';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, LifeBuoy, Users } from 'lucide-react-native';
import { formatBytes } from '@/components/notebook/usageCard';

export default function AccountScreen() {
  const router = useRouter();
  const authService = useAuthService();
  const accountService = useAccountService();
  const { user } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [usage, setUsage] = useState<AccountUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [community, setCommunity] = useState<CommunityStatus>(COMMUNITY_OFF);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // getCommunity never rejects — it resolves to COMMUNITY_OFF — so it's
      // safe inside the same Promise.all.
      const [acc, usg, comm] = await Promise.all([
        accountService.getAccount(),
        accountService.getAccountUsage(),
        accountService.getCommunity(),
      ]);
      setAccount(acc?.account ?? null);
      setUsage(usg);
      setCommunity(comm);
    } catch (err) {
      console.error('Failed to load account data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenCommunity = async () => {
    // Best-effort consent record; opening the invite must never depend on it.
    try {
      const next = await accountService.joinCommunity();
      setCommunity(next);
    } catch (err) {
      console.warn('Could not record the community opt-in', err);
    }
    // Linking, not expo-web-browser: only the system handler resolves
    // chat.whatsapp.com as a universal link into the WhatsApp app.
    Linking.openURL(community.invite_url).catch((err) =>
      console.warn('Could not open the WhatsApp invite', err)
    );
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await authService.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  function formatMemberSince(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  /** A specific event, so it needs the day too — unlike "member since". */
  function formatOptInDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  return (
    <Screen className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-4 gap-6">
        {/** Header of profile page */}
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <Icon as={ChevronLeft} size={30} />
          </Button>
          <Text className="text-3xl font-bold">Profile</Text>
        </View>

        <View className="items-center">
          <Image
            source={{
              uri: account?.profile_picture_url || 'https://github.com/shadcn.png',
            }}
            style={{ width: 96, height: 96 }}
            className="rounded-full border-2 border-background bg-muted"
          />
        </View>

        {/** Account Details card */}
        {account && (
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <Text>
                <Text className="font-semibold">Name:</Text> {account.first_name}{' '}
                {account.last_name}
              </Text>
              <Text>
                <Text className="font-semibold">Email:</Text> {user?.email}
              </Text>
              <Text>
                <Text className="font-semibold">Member Since:</Text>{' '}
                {user?.created_at ? formatMemberSince(user.created_at) : '—'}
              </Text>
            </CardContent>
          </Card>
        )}

        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Usage</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-4">
                <Text className="font-semibold text-primary">Current Plan</Text>
                <Text className="font-bold capitalize text-primary">
                  {usage.plan.toLowerCase()}
                </Text>
              </View>

              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Notebooks</Text>
                  <Text>
                    {usage.notebooks.used} / {usage.notebooks.limit}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Daily Quizzes</Text>
                  <Text>
                    {usage.daily_quizzes.used} / {usage.daily_quizzes.limit}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Presentation</Text>
                  <Text>
                    {usage.presentations.used} / {usage.presentations.limit}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Audio Transcriptions</Text>
                  <Text>{usage.features?.audio_notes ? 'Enabled' : 'Disabled'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Storage</Text>
                  <Text>
                    {formatBytes(Number(usage.storage.used_bytes))} /{' '}
                    {formatBytes(Number(usage.storage.limit_bytes))}
                  </Text>
                </View>

                {/* Upgrade Plan Button */}
                <Button
                  variant="outline"
                  className="mt-2 h-11 rounded-xl border-primary/40"
                  onPress={() => setShowUpgradeSheet(true)}>
                  <Text className="text-sm font-semibold text-primary">Upgrade Plan</Text>
                </Button>

                {/* Upgrade Plan Bottom Sheet */}
                <UpgradeSheet
                  visible={showUpgradeSheet}
                  onClose={() => setShowUpgradeSheet(false)}
                />
              </View>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp community — an invite link, never a membership record: we
            can't verify they joined, so the copy never claims they did. */}
        {community.enabled && (
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Icon as={Users} size={18} className="text-muted-foreground" />
                <CardTitle>WhatsApp community</CardTitle>
              </View>
            </CardHeader>
            <CardContent className="gap-4">
              <Text className="text-muted-foreground">
                {community.opted_in_at
                  ? `You opened the invite on ${formatOptInDate(community.opted_in_at)}. Not in the group? Open it again.`
                  : community.message}
              </Text>
              <Button
                variant="outline"
                className="h-11 flex-row items-center justify-center gap-2 rounded-xl"
                onPress={onOpenCommunity}>
                <Text className="text-sm font-semibold">
                  {community.opted_in_at ? 'Open the invite again' : 'Join on WhatsApp'}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Support */}
        <Button
          variant="outline"
          className="h-14 flex-row items-center justify-center gap-2 rounded-xl"
          onPress={() => router.push('/support')}>
          <Icon as={LifeBuoy} size={18} className="text-foreground" />
          <Text className="text-base font-semibold">Contact Support</Text>
        </Button>

        <Button
          variant="destructive"
          className="mt-4 h-14 rounded-xl"
          onPress={onLogout}
          disabled={loggingOut}>
          {loggingOut ? (
            <ButtonSpinner variant="destructive" />
          ) : (
            <Text className="text-destructive-foreground text-base font-semibold">Log out</Text>
          )}
        </Button>
      </ScrollView>
    </Screen>
  );
}
