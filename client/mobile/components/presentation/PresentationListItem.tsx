import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PresentationSession } from '@freshr/shared';

interface PresentationListItemProps {
  presentation: PresentationSession;
  onPress: () => void;
}

export function PresentationListItem({ presentation, onPress }: PresentationListItemProps) {
  const isLoading = presentation.status === 'QUEUED' || presentation.status === 'GENERATING';
  const isFailed = presentation.status === 'FAILED';

  return (
    <Card className={isFailed ? 'border-destructive' : ''}>
      <CardHeader>
        <CardTitle className={isFailed ? 'text-destructive' : ''}>
          {presentation.topic || 'Presentation'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Text className={isFailed ? 'text-destructive' : 'text-muted-foreground'}>
          {isLoading
            ? 'Generating...'
            : isFailed
              ? (presentation.error_message || 'Generation failed')
              : `${presentation.slide_count} slides · ${presentation.text_length.toLowerCase()}`}
        </Text>
        {!isLoading && presentation.generated_at && (
          <Text className="text-muted-foreground">{timeAgo(presentation.generated_at)}</Text>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant={isFailed ? 'destructive' : 'secondary'} 
          className="w-full" 
          onPress={onPress} 
          disabled={isLoading || isFailed}
        >
          <Text>{isLoading ? 'Generating...' : isFailed ? 'Failed' : 'View'}</Text>
        </Button>
      </CardFooter>
    </Card>
  );
}

function timeAgo(isoDate: string): string {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}
