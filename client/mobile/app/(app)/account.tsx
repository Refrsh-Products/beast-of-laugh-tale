import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAuthService } from '@/hooks/useAuthService';
import { useAccountService } from '@/hooks/useAccountService';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, ScrollView } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StoredAccount, AccountUseage } from '@freshr/shared';

export default function AccountScreen() {
  const router = useRouter();
  const authService = useAuthService();
  const accountService = useAccountService();
  const { user } = useAuth();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [usage, setUsage] = useState<AccountUseage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [acc, usg] = await Promise.all([
        accountService.getAccount(),
        accountService.getAccountUsage()
      ]);
      setAccount(acc);
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

  return (
    <Screen className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold">Profile</Text>
          <Text className="text-muted-foreground">{user?.email}</Text>
        </View>

        {account && (
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <Text><Text className="font-semibold">Name:</Text> {account.first_name} {account.last_name}</Text>
              <Text><Text className="font-semibold">Phone:</Text> {account.phone || 'N/A'}</Text>
            </CardContent>
          </Card>
        )}

        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Usage</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
                <Text className="font-semibold text-primary">Current Plan</Text>
                <Text className="font-bold text-primary capitalize">{usage.plan.toLowerCase()}</Text>
              </View>

              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Notebooks</Text>
                  <Text>{usage.notebooks.used} / {usage.notebooks.limit}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Daily Quizzes</Text>
                  <Text>{usage.daily_quizzes.used} / {usage.daily_quizzes.limit}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Audio Transcriptions</Text>
                  <Text>{usage.features?.audio_notes ? 'Enabled' : 'Disabled'}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        <Button
          variant="destructive"
          className="h-14 rounded-xl mt-4"
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
