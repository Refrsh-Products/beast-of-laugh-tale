import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useNotebookService } from '@/hooks/useNotebookService';

export default function CreateNotebookModal() {
  const router = useRouter();
  const notebookService = useNotebookService();
  
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const notebook = await notebookService.create(title.trim());
      // On success, go back and maybe navigate to the new notebook directly
      router.back();
      router.push({ pathname: '/notebooks/[id]', params: { id: notebook.id } });
    } catch (error: any) {
      console.error('Failed to create notebook:', error);
      Alert.alert('Error', error?.message || 'Failed to create notebook. Please try again.');
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
    </KeyboardAvoidingView>
  );
}
