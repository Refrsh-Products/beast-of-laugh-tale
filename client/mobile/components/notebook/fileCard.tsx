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
import { Icon } from '../ui/icon';
import { CircleAlert, CircleCheck, RotateCcw } from 'lucide-react-native';
import { formatBytes } from './usageCard';

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

  return (
    <View className="w-full px-4">
      <Card className={`w-full ${isError ? 'border-destructive' : ''}`}>
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
    </View>
  );
}

export { FileCard };
