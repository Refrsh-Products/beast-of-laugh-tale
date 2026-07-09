import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, View } from 'react-native';
import {
  ChevronLeft,
  EllipsisVerticalIcon,
  Edit2,
  Pin,
  Archive,
  Trash2,
  PinOff,
} from 'lucide-react-native';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Separator } from '../ui/separator';
import { Icon } from '../ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useNotebookService } from '@/hooks/useNotebookService';
import { Notebook } from '@freshr/shared';

interface HeaderProps {
  title: string;
  actualId: string;
  onNotebookUpdate?: () => void;
}

function Header({ title, actualId, onNotebookUpdate }: HeaderProps) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const notebookService = useNotebookService();

  const [notebook, setNotebook] = useState<Notebook>();

  useEffect(() => {
    if (actualId) {
      notebookService
        .getNotebook(actualId)
        .then((nb) => {
          if (nb) setNotebook(nb);
        })
        .catch((err) => console.error('Failed to load notebook in Header', err));
    }
  }, [actualId, notebookService]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      const updated = await notebookService.update(actualId, { title: newName });
      setNotebook(updated);
      onNotebookUpdate?.();
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
            await notebookService.delete(actualId);
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
      await notebookService.archive(actualId);
      setNotebook((prev) => (prev ? { ...prev, is_archived: true } : prev));
      onNotebookUpdate?.();
    } catch (err) {
      console.error('Failed to archive notebook', err);
      Alert.alert('Error', 'Failed to archive notebook');
    }
  };

  const handlePinToggle = async () => {
    if (!notebook) return;
    try {
      const updated = await notebookService.update(actualId, { pinned: !notebook.pinned });
      setNotebook(updated);
      onNotebookUpdate?.();
    } catch (err) {
      console.error('Failed to toggle pin', err);
      Alert.alert('Error', 'Failed to update notebook');
    }
  };

  const isArchived = notebook?.is_archived;
  const isPinned = notebook?.pinned;
  return (
    <View className="w-full px-5">
      <View className="w-full flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onPress={() => router.dismissTo('/notebooks')}>
          <Icon as={ChevronLeft} size={30} />
        </Button>

        <Text variant="h3" className="mx-2 flex-1 text-center" numberOfLines={1}>
          {notebook?.title ?? title}
        </Text>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <EllipsisVerticalIcon size={20} className="text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem
              onPress={() => {
                setNewName(notebook?.title || title);
                setIsRenameDialogOpen(true);
              }}
              disabled={isArchived}>
              <Icon as={Edit2} size={16} className="mr-2 text-foreground" />
              <Text>Rename</Text>
            </DropdownMenuItem>

            <DropdownMenuItem onPress={handlePinToggle}>
              <Icon as={isPinned ? PinOff : Pin} size={16} className="mr-2 text-foreground" />
              <Text>{isPinned ? 'Unpin' : 'Pin'}</Text>
            </DropdownMenuItem>

            {!isArchived && (
              <DropdownMenuItem onPress={handleArchive}>
                <Icon as={Archive} size={16} className="mr-2 text-foreground" />
                <Text>Archive</Text>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onPress={handleDelete} variant="destructive">
              <Icon as={Trash2} size={16} className="mr-2 text-destructive" />
              <Text className="text-destructive">Delete</Text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>

      <Separator
        style={{
          marginTop: 10,
          backgroundColor: '#E4E4E7',
          height: 1,
        }}
      />

      {/* Rename Dialog */}
      <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Notebook</AlertDialogTitle>
          </AlertDialogHeader>
          <Input value={newName} onChangeText={setNewName} placeholder="Notebook Title" autoFocus />
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
    </View>
  );
}

export { Header };
