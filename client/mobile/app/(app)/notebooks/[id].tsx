import { useLocalSearchParams } from 'expo-router';
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
import { FileUploadPreview } from '@/components/notebook/fileUploadPreview';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Icon } from '../../../components/ui/icon';
import { Camera, Trash } from 'lucide-react-native';
import { getFileTypeLabel } from '@/lib/fileUpload';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notebookService = useNotebookService();

  const [notebook, setNotebook] = useState<Notebook>();
  const [notebookFiles, setNotebookFiles] = useState<NotebookFile[]>([]);

  // ── File upload hook ───────────────────────────────────────────────────
  const {
    pickFile,
    selectedAsset,
    validationError,
    confirmUpload,
    cancelSelection,
    isConfirming,
    uploadingFiles,
    retryUpload,
  } = useFileUpload(id);

  // ── Data loading ───────────────────────────────────────────────────────
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
    [notebookService]
  );

  useEffect(() => {
    loadNotebookDetails(id);
    loadNotebookFiles(id);
  }, [id]);

  // Refresh the file list whenever an upload completes successfully.
  useEffect(() => {
    const entries = Array.from(uploadingFiles.values());
    const hasSuccess = entries.some((e) => e.status === 'success');
    if (hasSuccess) {
      loadNotebookFiles(id);
    }
  }, [uploadingFiles, id]);

  // ── Derived data ──────────────────────────────────────────────────────
  const uploadEntries = Array.from(uploadingFiles.values());

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
            {/* In-progress / recently uploaded files (at the top) */}
            {uploadEntries.map((entry) => (
              <FileCard
                key={entry.tempId}
                fileName={entry.fileName}
                fileSize={entry.fileSize}
                fileType={getFileTypeLabel(entry.fileType, entry.fileName)}
                uploadProgress={entry.progress}
                uploadStatus={entry.status}
                uploadError={entry.error ?? undefined}
                onRetry={() => retryUpload(entry.tempId)}
              />
            ))}

            {/* Existing server files */}
            {notebookFiles.length === 0 && uploadEntries.length === 0 ? (
              <View className="items-center gap-1 py-16">
                <Text className="text-center text-muted-foreground">No files uploaded yet.</Text>
              </View>
            ) : (
              notebookFiles.map((notebookFile) => (
                <FileCard
                  key={notebookFile.id}
                  fileName={notebookFile.name}
                  fileSize={notebookFile.file_size}
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
            <Button variant="default" onPress={pickFile}>
              <Text>+ Add Files</Text>
            </Button>
          </View>
          <BottomNav />
        </View>
      </View>

      {/* File upload preview / confirmation modal */}
      <FileUploadPreview
        visible={!!selectedAsset}
        asset={selectedAsset}
        validationError={validationError}
        isUploading={isConfirming}
        onConfirm={confirmUpload}
        onCancel={cancelSelection}
      />
    </Screen>
  );
}
