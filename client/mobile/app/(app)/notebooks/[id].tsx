import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Notebook, NotebookFile } from '@freshr/shared';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/notebook/header';
import { FileCard } from '@/components/notebook/fileCard';
import { BottomNav } from '@/components/notebook/bottomNav';
import { Icon } from '../../../components/ui/icon';
import { Camera, Trash } from 'lucide-react-native';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notebookService = useNotebookService();

  const [notebook, setNotebook] = useState<Notebook>();
  const [notebookFiles, setNotebookFiles] = useState<NotebookFile[]>([]);

  const loadNotebookDetails = useCallback(
    async (id: string) => {
      try {
        const data = await notebookService.getNotebook(id);
        setNotebook(data);
      } catch (err) {
        console.error(`Failed to load notebook with id ${id}`, err);
      }
    },
    [notebookService]
  );

  const loadNotebookFiles = useCallback(
    async (id: string) => {
      try {
        const data = await notebookService.listFiles(id);
        setNotebookFiles(data);
      } catch (err) {
        console.error('Failed to load notebook files', err);
      }
    },
    [notebookFiles]
  );

  useEffect(() => {
    loadNotebookDetails(id);
    loadNotebookFiles(id);
  }, [loadNotebookDetails, loadNotebookFiles]);

  return (
    <Screen>
      <View className="w-full flex-1">
        <View className="w-full flex-1">
          <Header title={notebook?.title ?? 'Untitled'} />

          <View className="flex w-full flex-row items-center justify-between px-5 pt-4">
            <Text variant="h3">LECTURE FILES</Text>
            <Button variant="outline" size="icon">
              <Icon as={Trash} />
            </Button>
          </View>

          {/* Notebook Files List */}
          <ScrollView className="w-full" contentContainerClassName="gap-3 pt-4 pb-10">
            {notebookFiles.length === 0 ? (
              <View className="items-center gap-1 py-16">
                <Text className="text-center text-muted-foreground">No files uploaded yet.</Text>
              </View>
            ) : (
              notebookFiles.map((notebookFile) => (
                <FileCard
                  key={notebookFile.id}
                  fileName={notebookFile.name}
                  fileSize={0}
                  fileType={notebookFile.file_type}
                />
              ))
            )}
          </ScrollView>
        </View>

        <View className="w-full items-center pb-8 pt-4">
          <View className="flex-row gap-4 py-2">
            <Button variant="outline" size="icon">
              <Icon as={Camera} />
            </Button>
            <Button variant="default">
              <Text>+ Add Files</Text>
            </Button>
          </View>
          <BottomNav />
        </View>
      </View>
    </Screen>
  );
}
