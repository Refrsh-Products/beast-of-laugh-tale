import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import { View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Register</Text>
      <Text className="text-muted-foreground">Placeholder — auth comes in Epic 3.</Text>
      <Link href="/login" asChild>
        <Button variant="ghost">
          <Text>Back to Login</Text>
        </Button>
      </Link>
    </View>
  );
}
