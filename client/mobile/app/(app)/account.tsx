import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAuthService } from '@/hooks/useAuthService';
import { useAccountService } from '@/hooks/useAccountService';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/screen';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  ScrollView,
  Image,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StoredAccount, AccountUsage } from '@freshr/shared';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';
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

  const SHEET_HEIGHT = 280;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const openSheet = () => {
    setShowUpgradeSheet(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowUpgradeSheet(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [acc, usg] = await Promise.all([
        accountService.getAccount(),
        accountService.getAccountUsage(),
      ]);
      setAccount(acc?.account ?? null);
      setUsage(usg);
    } catch (err) {
      console.error('Failed to load account data', err);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Screen className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-6">
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
                  onPress={openSheet}>
                  <Text className="text-sm font-semibold text-primary">Upgrade Plan</Text>
                </Button>

                {/* Upgrade Plan Bottom Sheet */}
                <Modal
                  visible={showUpgradeSheet}
                  transparent
                  animationType="none"
                  statusBarTranslucent
                  onRequestClose={closeSheet}>
                  <TouchableWithoutFeedback onPress={closeSheet}>
                    <View style={styles.backdrop} />
                  </TouchableWithoutFeedback>

                  <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Drag handle */}
                    <View style={styles.handle} />

                    <Text style={styles.sheetTitle}>
                      Subscription changes happen outside the app
                    </Text>
                    <Text style={styles.sheetBody}>
                      All subscription changes are handled through your account on the web, outside
                      the app.
                    </Text>

                    <Button
                      variant="secondary"
                      className="h-13 mt-6 rounded-full"
                      onPress={closeSheet}>
                      <Text className="text-base font-bold">Got it</Text>
                    </Button>
                  </Animated.View>
                </Modal>
              </View>
            </CardContent>
          </Card>
        )}

        <Button
          variant="destructive"
          className="mt-4 h-14 rounded-xl"
          onPress={onLogout}
          disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Log out</Text>
          )}
        </Button>
      </ScrollView>
    </Screen>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  sheetBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
