import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, Plus, RotateCcw, ScanLine, Trash2, X } from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Progress } from '../../ui/progress';
import type { ScanPhase } from '@/hooks/useScanNotes';
import type { ScanPhoto } from '@/lib/scanNotes';

interface ScanReviewProps {
  photos: ScanPhoto[];
  limit: number;
  isSubmitting: boolean;
  phase: ScanPhase;
  uploadProgress: number;
  submitError: string | null;
  onAddMore: () => void;
  onDelete: (id: string) => void;
  onRetake: (id: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function ScanReview({
  photos,
  limit,
  isSubmitting,
  phase,
  uploadProgress,
  submitError,
  onAddMore,
  onDelete,
  onRetake,
  onSubmit,
  onClose,
}: ScanReviewProps) {
  const insets = useSafeAreaInsets();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const preview = photos.find((p) => p.id === previewId) ?? null;
  const hasRejected = photos.some((p) => p.status === 'rejected');
  const canSubmit = photos.length > 0 && !hasRejected && !isSubmitting;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Button variant="ghost" size="icon" onPress={onClose} disabled={isSubmitting}>
          <Icon as={X} size={22} />
        </Button>
        <Text variant="h4">Review scan</Text>
        <View className="w-10" />
      </View>

      {/* Validation / error banner */}
      {submitError && (
        <View className="mx-5 mb-2 flex-row items-start gap-2 rounded-xl bg-destructive/10 p-3">
          <Icon as={CircleAlert} className="mt-0.5 text-destructive" size={16} />
          <Text className="flex-1 text-sm text-destructive">{submitError}</Text>
        </View>
      )}

      {/* Thumbnail grid */}
      <ScrollView contentContainerClassName="flex-row flex-wrap gap-3 px-5 pb-4">
        {photos.map((photo, index) => {
          const rejected = photo.status === 'rejected';
          return (
            <View key={photo.id} style={{ width: '47%' }}>
              <Pressable
                onPress={() => setPreviewId(photo.id)}
                className={`overflow-hidden rounded-xl border ${
                  rejected ? 'border-2 border-destructive' : 'border-border'
                }`}>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 200 }} />
                <View className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
                  <Text className="text-xs font-medium text-white">Page {index + 1}</Text>
                </View>
                {rejected && (
                  <View className="absolute right-2 top-2 rounded-full bg-destructive p-1">
                    <Icon as={CircleAlert} size={14} className="text-white" />
                  </View>
                )}
              </Pressable>
              {rejected && photo.rejection?.reason ? (
                <Text className="mt-1 text-xs text-destructive">{photo.rejection.reason}</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Upload / validation progress */}
      {isSubmitting && (
        <View className="px-5 pb-2">
          {phase === 'validating' ? (
            <View className="flex-row items-center justify-center gap-2 py-2">
              <ActivityIndicator size="small" />
              <Text variant="muted">Checking your photos…</Text>
            </View>
          ) : (
            <>
              <Progress value={uploadProgress} className="h-1.5" />
              <Text className="mt-1 text-center text-xs text-muted-foreground">
                Uploading… {uploadProgress}%
              </Text>
            </>
          )}
        </View>
      )}

      {/* Footer actions */}
      <View className="flex-row gap-3 px-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          variant="outline"
          className="flex-1"
          onPress={onAddMore}
          disabled={isSubmitting || photos.length >= limit}>
          <Icon as={Plus} size={16} />
          <Text>Add more</Text>
        </Button>
        <Button className="flex-1" onPress={onSubmit} disabled={!canSubmit}>
          <Icon as={ScanLine} size={16} />
          <Text>
            {photos.length > 0
              ? `Scan ${photos.length} photo${photos.length === 1 ? '' : 's'}`
              : 'Scan'}
          </Text>
        </Button>
      </View>

      {/* Full-size preview */}
      <Modal
        visible={!!preview}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewId(null)}>
        <BlurView
          intensity={20}
          tint="dark"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        {preview && (
          <View className="flex-1 justify-center p-4" style={{ paddingTop: insets.top }}>
            <View className="items-end">
              <Button variant="ghost" size="icon" onPress={() => setPreviewId(null)}>
                <Icon as={X} size={24} className="text-white" />
              </Button>
            </View>
            <Image
              source={{ uri: preview.uri }}
              style={{ width: '100%', height: '70%', borderRadius: 12 }}
              resizeMode="contain"
            />
            {preview.status === 'rejected' && preview.rejection?.reason ? (
              <View className="mt-3 flex-row items-start gap-2 rounded-xl bg-destructive/20 p-3">
                <Icon as={CircleAlert} className="mt-0.5 text-destructive" size={16} />
                <Text variant="small" className="flex-1 text-white">
                  {preview.rejection.reason}
                </Text>
              </View>
            ) : null}
            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  const id = preview.id;
                  setPreviewId(null);
                  onDelete(id);
                }}>
                <Icon as={Trash2} size={16} />
                <Text>Delete</Text>
              </Button>
              <Button
                className="flex-1"
                onPress={() => {
                  const id = preview.id;
                  setPreviewId(null);
                  onRetake(id);
                }}>
                <Icon as={RotateCcw} size={16} />
                <Text>Retake</Text>
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}
