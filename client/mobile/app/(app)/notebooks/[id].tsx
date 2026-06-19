import { Link, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Notebook {id}</Text>
      <Link href="/notebooks/chat" asChild>
        <Button>
          <Text>Chat</Text>
        </Button>
      </Link>
      <Link href="/notebooks/quiz" asChild>
        <Button variant="secondary">
          <Text>Quiz</Text>
        </Button>
      </Link>
      <Link href="/notebooks/presentation" asChild>
        <Button>
          <Text>Presentation</Text>
        </Button>
      </Link>
      <Link href="/notebooks/transcription" asChild>
        <Button variant="secondary">
          <Text>Transcription</Text>
        </Button>
      </Link>
    </View>
  );
}
