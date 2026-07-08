import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Alert } from 'react-native';
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
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Icon } from '../../../components/ui/icon';
import { Camera, Trash, Info } from 'lucide-react-native';
import { getFileTypeLabel } from '@/lib/fileUpload';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const notebookService = useNotebookService();

  const [notebook, setNotebook] = useState<Notebook>();
  const [notebookFiles, setNotebookFiles] = useState<NotebookFile[]>([]);
  
  // ── Rename Dialog State ────────────────────────────────────────────────
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

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

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      const updated = await notebookService.update(id, { title: newName });
      setNotebook(updated);
    } catch (err) {
      console.error('Failed to rename notebook', err);
      Alert.alert('Error', 'Failed to rename notebook');
    } finally {
      setIsRenameDialogOpen(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Notebook', 'Are you sure you want to delete this notebook?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await notebookService.delete(id);
            router.replace('/(app)/notebooks');
          } catch (err) {
            console.error('Failed to delete notebook', err);
            Alert.alert('Error', 'Failed to delete notebook');
          }
        },
      },
    ]);
  };

  const handleArchive = async () => {
    try {
      await notebookService.archive(id);
      setNotebook((prev) => (prev ? { ...prev, is_archived: true } : prev));
    } catch (err) {
      console.error('Failed to archive notebook', err);
      Alert.alert('Error', 'Failed to archive notebook');
    }
  };

  const handlePinToggle = async () => {
    if (!notebook) return;
    try {
      const updated = await notebookService.update(id, { pinned: !notebook.pinned });
      setNotebook(updated);
    } catch (err) {
      console.error('Failed to toggle pin', err);
      Alert.alert('Error', 'Failed to update notebook');
    }
  };

  const isArchived = notebook?.is_archived;
  return (
    <Screen>
      <View className="w-full flex-1">
        <View className="w-full flex-1">
          <Header
            title={notebook?.title ?? 'Untitled'}
            isPinned={notebook?.pinned}
            isArchived={isArchived}
            onRename={() => {
              setNewName(notebook?.title ?? '');
              setIsRenameDialogOpen(true);
            }}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onPinToggle={handlePinToggle}
          />

          <ArchiveBanner isArchived={isArchived} />

          <View className="flex w-full flex-row items-center justify-between px-5 pt-4">
            <Text variant="h3">LECTURE FILES</Text>
            {!isArchived && (
              <Button variant="outline" size="icon">
                <Icon as={Trash} />
              </Button>
            )}
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
          {!isArchived && (
            <View className="flex-row gap-4 py-2">
              <Button variant="outline" size="icon">
                <Icon as={Camera} />
              </Button>
              <Button variant="default" onPress={pickFile}>
                <Text>+ Add Files</Text>
              </Button>
            </View>
          )}
          <BottomNav />
        </View>
      </View>

      {/* Rename Dialog */}
      <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Notebook</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={newName}
            onChangeText={setNewName}
            placeholder="Notebook Title"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setIsRenameDialogOpen(false)}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleRename}>
              <Text>Save</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
