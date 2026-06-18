import { Link } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotebookListScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Notebooks</Text>
      <Text className="text-muted-foreground">Placeholder list</Text>
      <Link href="/notebooks/1" asChild>
        <Button>
          <Text>Open sample notebook</Text>
        </Button>
      </Link>
    </View>
  );
}
