import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CircleAlert, RotateCcw, Trash2 } from 'lucide-react-native';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Status = 'idle' | 'deleting' | 'error';

interface DeleteQuizDialogProps {
  /** Whether the dialog is shown. */
  visible: boolean;
  /** How many quizzes are about to be deleted (drives copy: singular vs. plural). */
  count: number;
  /**
   * Performs the deletion. Resolves when everything was deleted, and rejects
   * (throw an Error) when one or more deletions failed. The thrown message is
   * shown to the user, so make it human-readable. On retry this is called again
   * — callers should narrow the pending set to only the items that still failed.
   */
  onConfirm: () => Promise<void>;
  /** Called after every quiz was deleted successfully. */
  onSuccess: () => void;
  /** Called when the user dismisses the dialog without a completed delete (cancel / backdrop). */
  onClose: () => void;
}

/**
 * Confirmation modal for deleting one or more past quizzes. Owns the full
 * async lifecycle (confirm → deleting → success | error) so the calling screen
 * only has to supply the delete action and react to close.
 */
export function DeleteQuizDialog({
  visible,
  count,
  onConfirm,
  onSuccess,
  onClose,
}: DeleteQuizDialogProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset internal state whenever the dialog is (re)opened so a previous error
  // doesn't linger the next time the user opens it.
  useEffect(() => {
    if (visible) {
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [visible]);

  const isBusy = status === 'deleting';
  const noun = count === 1 ? 'quiz' : 'quizzes';

  const handleConfirm = async () => {
    setStatus('deleting');
    setErrorMessage(null);
    try {
      await onConfirm();
      // Success — let the parent clear selection + refresh + close.
      onSuccess();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        typeof err?.message === 'string' && err.message.trim().length > 0
          ? err.message
          : `We couldn't delete the ${noun}.`
      );
    }
  };

  // Prevent dismissing (backdrop / escape) mid-delete.
  const handleOpenChange = (next: boolean) => {
    if (!next && !isBusy) onClose();
  };

  return (
    <AlertDialog open={visible} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {status === 'error' ? 'Delete failed' : `Delete ${count} ${noun}?`}
          </AlertDialogTitle>
          {status !== 'error' && (
            <AlertDialogDescription>
              This permanently removes {count === 1 ? 'this quiz' : `these ${count} quizzes`},
              including {count === 1 ? 'its' : 'their'} questions and results. This can't be undone.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* Error state: reason + what-to-do hint. */}
        {status === 'error' && (
          <View className="gap-2 rounded-lg bg-destructive/10 p-3">
            <View className="flex-row items-center gap-2">
              <Icon as={CircleAlert} className="text-destructive" size={16} />
              <Text className="flex-1 text-sm font-medium text-destructive">{errorMessage}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              Check your internet connection and try again. If the problem continues, close this and
              reopen the quiz list.
            </Text>
          </View>
        )}

        <AlertDialogFooter>
          <Button variant="outline" disabled={isBusy} onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button variant="destructive" disabled={isBusy} onPress={handleConfirm}>
            {isBusy ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text>Deleting…</Text>
              </>
            ) : status === 'error' ? (
              <>
                <Icon as={RotateCcw} size={16} className="text-white" />
                <Text>Try again</Text>
              </>
            ) : (
              <>
                <Icon as={Trash2} size={16} className="text-white" />
                <Text>Delete</Text>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
