import { Stack } from 'expo-router';

export default function NotebooksLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Notebooks' }} />
      <Stack.Screen name="[id]" options={{ title: 'Notebook' }} />
      <Stack.Screen name="chat" options={{ title: 'Chat' }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
      <Stack.Screen name="presentation" options={{ title: 'Presentation' }} />
    </Stack>
  );
}
