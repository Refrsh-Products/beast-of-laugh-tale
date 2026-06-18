import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Login</Text>
      <Text className="text-muted-foreground">Placeholder — auth comes in Epic 3.</Text>
      <Link href="/register" asChild>
        <Button variant="ghost">
          <Text>Go to Register</Text>
        </Button>
      </Link>
      <Link href="/notebooks" asChild>
        <Button>
          <Text>Enter app (skip auth)</Text>
        </Button>
      </Link>
    </View>
  );
}
