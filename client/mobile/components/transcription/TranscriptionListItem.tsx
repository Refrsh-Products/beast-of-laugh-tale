import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AudioTranscriptSummary } from '@freshr/shared';

interface TranscriptionListItemProps {
  transcript: AudioTranscriptSummary;
  onPress: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TranscriptionListItem({
  transcript,
  onPress,
  onDelete,
  isDeleting,
}: TranscriptionListItemProps) {
  const isProcessing =
    transcript.transcription_status === 'pending' ||
    transcript.transcription_status === 'processing';
  const isFailed = transcript.transcription_status === 'failed';
  const isReady = transcript.transcription_status === 'ready';
  const notesProcessing = transcript.notes_status === 'processing';

  function getStatusLabel(): string {
    if (isFailed) return 'Transcription failed';
    if (isProcessing) return 'Transcribing…';
    if (notesProcessing) return 'Generating notes…';
    if (transcript.has_notes) return 'Notes generated';
    return 'Transcript ready';
  }

  return (
    <Card className={isFailed ? 'border-destructive' : ''}>
      <CardHeader>
        <CardTitle className={isFailed ? 'text-destructive' : ''}>
          {transcript.title || 'Untitled Recording'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Text className={isFailed ? 'text-destructive' : 'text-muted-foreground'}>
          {getStatusLabel()}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">
          {formatDate(transcript.created_at)}
        </Text>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="destructive"
          size="sm"
          onPress={onDelete}
          disabled={isDeleting}
        >
          <Text>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onPress={onPress}
          disabled={isProcessing || isFailed}
        >
          <Text>
            {isProcessing
              ? 'Transcribing…'
              : isFailed
                ? 'Failed'
                : 'View Details'}
          </Text>
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
