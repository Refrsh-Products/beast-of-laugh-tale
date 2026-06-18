import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function ChatScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-2xl font-bold">Quiz</Text>
      <Text className="text-muted-foreground">Placeholder — RAG chat comes later.</Text>
    </View>
  );
}
