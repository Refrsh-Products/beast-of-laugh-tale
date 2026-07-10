import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import { useNotebookService } from '@/hooks/useNotebookService';
import { getApiErrorCode, NOTEBOOK_QUOTA_EXCEEDED } from '@/lib/apiError';

export default function CreateNotebookModal() {
  const router = useRouter();
  const notebookService = useNotebookService();

  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const notebook = await notebookService.create(title.trim());
      // On success, go back and maybe navigate to the new notebook directly
      router.back();
      router.push({ pathname: '/notebooks/[id]', params: { id: notebook.id } });
    } catch (error: any) {
      if (getApiErrorCode(error) === NOTEBOOK_QUOTA_EXCEEDED) {
        Alert.alert(
          'Notebook limit reached',
          "You've used all your notebook slots on the free plan. Upgrade to create more notebooks and unlock more storage and daily quizzes — or archive a notebook to free up a slot.",
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => setShowUpgradeSheet(true) },
          ]
        );
      } else {
        console.error('Failed to create notebook:', error);
        Alert.alert('Error', error?.message || 'Failed to create notebook. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-5 pt-10">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold">Create Notebook</Text>
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <Text className="text-muted-foreground font-medium text-lg">✕</Text>
          </Button>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium">Notebook Title</Text>
            <Input
              placeholder="e.g. CS 101, Fall 2024"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              editable={!isSubmitting}
            />
          </View>

          <Button
            onPress={handleCreate}
            disabled={!title.trim() || isSubmitting}
            className="mt-4"
          >
            <Text>{isSubmitting ? 'Creating...' : 'Create'}</Text>
          </Button>
        </View>
      </View>

      <UpgradeSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Upgrade your plan on the web"
        body="Paid plans unlock more notebooks, storage, and daily quizzes. Upgrades are handled through your account on the web, outside the app."
      />
    </KeyboardAvoidingView>
  );
}
