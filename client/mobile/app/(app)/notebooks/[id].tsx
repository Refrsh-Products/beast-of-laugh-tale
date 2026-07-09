import { useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Notebook, NotebookFile } from '@freshr/shared';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '@/components/notebook/header';
import { FileCard } from '@/components/notebook/fileCard';
import { BottomNav } from '@/components/notebook/bottomNav';
import { FileUploadPreview } from '@/components/notebook/fileUploadPreview';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Icon } from '../../../components/ui/icon';
import { Camera, Trash, Trash2, X } from 'lucide-react-native';
import { getFileTypeLabel } from '@/lib/fileUpload';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notebookService = useNotebookService();

  const [notebook, setNotebook] = useState<Notebook>();
  const [notebookFiles, setNotebookFiles] = useState<NotebookFile[]>([]);

  // ── Selection / delete state ───────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Track open swipe rows so only one is open at a time (mirrors notebook list).
  const openRowRef = useRef<string | null>(null);
  const swipeableRefs = useRef<Map<string, any>>(new Map());

  const closeCurrentRow = useCallback((excludeId?: string) => {
    if (openRowRef.current && openRowRef.current !== excludeId) {
      swipeableRefs.current.get(openRowRef.current)?.close();
      openRowRef.current = null;
    }
  }, []);

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

  // ── Selection helpers ──────────────────────────────────────────────────
  const enterSelection = useCallback(
    (fileId: string) => {
      closeCurrentRow();
      setSelectionMode(true);
      setSelectedIds(new Set([fileId]));
    },
    [closeCurrentRow]
  );

  const toggleSelect = useCallback((fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // ── Delete handlers ────────────────────────────────────────────────────
  const handleDeleteFile = useCallback(
    (file: NotebookFile) => {
      Alert.alert('Delete File', `Are you sure you want to delete "${file.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notebookService.deleteFile(id, file.id);
              await loadNotebookFiles(id);
            } catch (error) {
              console.error('Failed to delete file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]);
    },
    [id, notebookService, loadNotebookFiles]
  );

  const handleBatchDelete = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    Alert.alert(
      'Delete Files',
      `Are you sure you want to delete ${ids.length} file${ids.length === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const results = await Promise.allSettled(
              ids.map((fileId) => notebookService.deleteFile(id, fileId))
            );
            const failed = results.filter((r) => r.status === 'rejected').length;
            exitSelection();
            await loadNotebookFiles(id);
            if (failed > 0) {
              console.error(`Failed to delete ${failed} file(s)`);
              Alert.alert('Error', `Failed to delete ${failed} file${failed === 1 ? '' : 's'}`);
            }
          },
        },
      ]
    );
  }, [selectedIds, id, notebookService, loadNotebookFiles, exitSelection]);

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

  const isArchived = notebook?.is_archived;
  return (
    <Screen>
      <View className="w-full flex-1">
        <View className="w-full flex-1">
          <Header
            title={notebook?.title ?? 'Untitled'}
            actualId={id}
            onNotebookUpdate={() => loadNotebookDetails(id)}
          />

          <ArchiveBanner isArchived={isArchived} />

          <View className="flex w-full flex-row items-center justify-between px-5 pt-4">
            <Text variant={selectionMode ? 'h4' : 'h3'}>
              {selectionMode ? `${selectedIds.size} selected` : 'LECTURE FILES'}
            </Text>
            {!isArchived &&
              (selectionMode ? (
                <View className="flex-row items-center gap-2">
                  <Button variant="ghost" size="sm" onPress={exitSelection}>
                    <Icon as={X} size={18} />
                    <Text>Cancel</Text>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={selectedIds.size === 0}
                    onPress={handleBatchDelete}>
                    <Icon as={Trash2} className="text-destructive" />
                  </Button>
                </View>
              ) : (
                notebookFiles.length > 0 && (
                  <Button variant="outline" size="icon" onPress={() => setSelectionMode(true)}>
                    <Icon as={Trash2} />
                  </Button>
                )
              ))}
          </View>

          {/* Notebook Files List */}
          <ScrollView
            className="w-full"
            contentContainerClassName="gap-3 pt-4 px-4 pb-10"
            onScrollBeginDrag={() => closeCurrentRow()}>
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
              notebookFiles.map((notebookFile) => {
                const card = (
                  <FileCard
                    fileName={notebookFile.name}
                    fileSize={notebookFile.file_size}
                    fileType={notebookFile.file_type}
                    selectable={selectionMode}
                    selected={selectedIds.has(notebookFile.id)}
                    onPress={selectionMode ? () => toggleSelect(notebookFile.id) : undefined}
                    onLongPress={isArchived ? undefined : () => enterSelection(notebookFile.id)}
                  />
                );

                // In selection mode (or when archived) swipe-to-delete is disabled.
                if (selectionMode || isArchived) {
                  return <View key={notebookFile.id}>{card}</View>;
                }

                return (
                  <Swipeable
                    key={notebookFile.id}
                    ref={(ref) => {
                      if (ref) {
                        swipeableRefs.current.set(notebookFile.id, ref);
                      } else {
                        swipeableRefs.current.delete(notebookFile.id);
                      }
                    }}
                    onSwipeableWillOpen={() => {
                      closeCurrentRow(notebookFile.id);
                      openRowRef.current = notebookFile.id;
                    }}
                    renderRightActions={() => (
                      <View className="flex-row pr-5">
                        <Pressable
                          className="ml-3 w-20 items-center justify-center rounded-xl bg-destructive"
                          onPress={() => {
                            closeCurrentRow();
                            handleDeleteFile(notebookFile);
                          }}>
                          <Icon as={Trash2} color="white" size={22} />
                          <Text className="mt-1 text-xs font-medium text-white">Delete</Text>
                        </Pressable>
                      </View>
                    )}>
                    {card}
                  </Swipeable>
                );
              })
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
