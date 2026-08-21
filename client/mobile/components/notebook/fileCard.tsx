import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Icon } from '../ui/icon';
import { Check, CircleAlert, CircleCheck, RotateCcw } from 'lucide-react-native';
import { formatBytes } from './usageCard';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
export type FileUploadStatus = 'uploading' | 'success' | 'error';

interface FileCardProps {
  fileName: string;
  fileSize: number; // Expects size in bytes
  fileType: string;
  /** 0-100 upload progress. Only meaningful when uploadStatus === 'uploading'. */
  uploadProgress?: number;
  uploadStatus?: FileUploadStatus;
  /** A user-facing error message (e.g. "File too large"). */
  uploadError?: string;
  /** Called when the user taps "Retry" on a failed upload. */
  onRetry?: () => void;
  /** When true, a selection checkbox is shown on the left of the card. */
  selectable?: boolean;
  /** Whether this card is currently selected (only meaningful when selectable). */
  selected?: boolean;
  /** Tap handler — used to toggle selection while in selection mode. */
  onPress?: () => void;
  /** Long-press handler — used to enter selection mode. */
  onLongPress?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

function FileCard({
  fileName,
  fileSize,
  fileType,
  uploadProgress,
  uploadStatus,
  uploadError,
  onRetry,
  selectable,
  selected,
  onPress,
  onLongPress,
}: FileCardProps) {
  // Auto-hide the success indicator after 2 seconds.
  const successOpacity = useSharedValue(1);

  useEffect(() => {
    if (uploadStatus === 'success') {
      successOpacity.value = withDelay(2000, withTiming(0, { duration: 400 }));
    } else {
      successOpacity.value = 1;
    }
  }, [uploadStatus]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  const isError = uploadStatus === 'error';
  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';

  const interactive = !!onPress || !!onLongPress;

  return (
    <View className="w-full">
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        disabled={!interactive}
        className={cn('flex-row items-center gap-3', interactive && 'active:opacity-70')}>
        {selectable && (
          <View pointerEvents="none">
            <Checkbox
              checked={!!selected}
              onCheckedChange={() => {}}
              className="h-5 w-5 rounded-sm border-muted-foreground"
            />
          </View>
        )}
        <Card
          className={cn('flex-1', isError && 'border-destructive', selected && 'border-primary')}>
          <CardHeader>
            {/* Header row: title + status icon */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <CardTitle numberOfLines={1}>{fileName}</CardTitle>
              </View>

              {isUploading && <ActivityIndicator size="small" />}

              {isSuccess && (
                <Animated.View style={successStyle}>
                  <Icon as={CircleCheck} className="text-green-500" size={18} />
                </Animated.View>
              )}

              {isError && <Icon as={CircleAlert} className="text-destructive" size={18} />}
            </View>

            <CardDescription>
              {formatBytes(fileSize)} | {fileType}
            </CardDescription>
          </CardHeader>

          {/* Upload progress bar */}
          {isUploading && (
            <CardContent>
              <Progress value={uploadProgress ?? 0} className="h-1.5" />
              <Text className="mt-1 text-xs text-muted-foreground">
                Uploading… {Math.round(uploadProgress ?? 0)}%
              </Text>
            </CardContent>
          )}

          {/* Error state */}
          {isError && (
            <CardContent>
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                <View className="flex-row items-center gap-2 rounded-lg bg-destructive/10 p-3">
                  <Icon as={CircleAlert} className="text-destructive" size={14} />
                  <Text className="flex-1 text-xs text-destructive">
                    {uploadError ?? 'Upload failed. Please try again.'}
                  </Text>
                </View>
                {onRetry && (
                  <Button variant="outline" size="sm" className="mt-2" onPress={onRetry}>
                    <Icon as={RotateCcw} size={12} />
                    <Text>Retry</Text>
                  </Button>
                )}
              </Animated.View>
            </CardContent>
          )}
        </Card>
      </Pressable>
    </View>
  );
}

export { FileCard };
