import { Stack } from 'expo-router';

export default function NotebooksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Notebooks' }} />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Notebook', animation: 'none', gestureEnabled: false }}
      />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="chat"
        options={{ title: 'Chat', animation: 'none', gestureEnabled: false }}
      />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
      <Stack.Screen name="presentation" options={{ title: 'Presentation' }} />
      <Stack.Screen name="transcription" options={{ title: 'Transcription' }} />
    </Stack>
  );
}
