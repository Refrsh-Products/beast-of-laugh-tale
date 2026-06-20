import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useAuthService } from '@/hooks/useAuthService';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

export default function AccountScreen() {
  const router = useRouter();
  const authService = useAuthService();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <View className="flex-1 justify-between p-6">
      <View className="gap-2 pt-6">
        <Text className="text-2xl font-bold">Account</Text>
        {user?.email ? <Text className="text-muted-foreground">{user.email}</Text> : null}
      </View>

      <Button
        variant="destructive"
        className="h-14 rounded-xl"
        onPress={onLogout}
        disabled={loggingOut}>
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Log out</Text>
        )}
      </Button>
    </View>
  );
}
