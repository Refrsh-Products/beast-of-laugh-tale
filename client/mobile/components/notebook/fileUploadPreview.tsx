import { Image, Modal, View } from 'react-native';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { FileText, FileImage, FileType, X, CircleAlert, Upload } from 'lucide-react-native';
import { getFileTypeLabel } from '@/lib/fileUpload';
import { BlurView } from 'expo-blur';
import { formatBytes } from './usageCard';

// ── Props ────────────────────────────────────────────────────────────────────
interface FileUploadPreviewProps {
  visible: boolean;
  /** The document-picker asset to preview (null when modal is closed). */
  asset: DocumentPickerAsset | null;
  /** Client-side validation error, if any. */
  validationError: string | null;
  /** Whether the upload is currently in flight (disables buttons). */
  isUploading?: boolean;
  /** Called when the user taps "Upload". */
  onConfirm: () => void;
  /** Called when the user taps "Cancel" or the close button. */
  onCancel: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the appropriate Lucide icon component for the file's MIME type. */
function getFileIcon(mime: string | undefined) {
  if (mime?.startsWith('image/')) return FileImage;
  if (mime === 'application/pdf') return FileText;
  return FileType;
}

/** Returns true if the asset is a previewable image. */
function isImageAsset(asset: DocumentPickerAsset): boolean {
  const mime = asset.mimeType ?? '';
  return mime.startsWith('image/');
}

// ── Component ────────────────────────────────────────────────────────────────

function FileUploadPreview({
  visible,
  asset,
  validationError,
  isUploading = false,
  onConfirm,
  onCancel,
}: FileUploadPreviewProps) {
  if (!asset) return null;

  const FileIcon = getFileIcon(asset.mimeType ?? undefined);
  const typeLabel = getFileTypeLabel(asset.mimeType ?? undefined, asset.name);
  const sizeLabel = formatBytes(asset.size ?? 0);
  const isValid = !validationError;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <BlurView
        intensity={10}
        tint="dark"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <View className="flex-1 justify-center p-4">
        {/* Bottom sheet */}
        <View className="rounded-lg bg-background px-6 pb-10 pt-6">
          {/* Header row */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text variant="h4">Upload File</Text>
            <Button variant="ghost" size="icon" onPress={onCancel} disabled={isUploading}>
              <Icon as={X} size={20} />
            </Button>
          </View>

          {/* Image thumbnail (if applicable) */}
          {isImageAsset(asset) && (
            <View className="mb-4 items-center">
              <View className="overflow-hidden rounded-xl border border-border">
                <Image
                  source={{ uri: asset.uri }}
                  style={{ width: 200, height: 200 }}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* File icon (for non-image files) */}
          {!isImageAsset(asset) && (
            <View className="mb-4 items-center justify-center self-center rounded-2xl bg-muted p-6">
              <Icon as={FileIcon} size={48} className="text-muted-foreground" />
            </View>
          )}

          {/* File details */}
          <View className="mb-4 gap-3 rounded-xl bg-muted p-4">
            {/* Name */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Name</Text>
              <Text className="max-w-[60%] text-right text-sm font-medium" numberOfLines={1}>
                {asset.name}
              </Text>
            </View>

            {/* Type */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Type</Text>
              <View className="rounded-full bg-background px-3 py-0.5">
                <Text className="text-xs font-medium">{typeLabel}</Text>
              </View>
            </View>

            {/* Size */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Size</Text>
              <Text className="text-sm font-medium">{sizeLabel}</Text>
            </View>
          </View>

          {/* Validation error */}
          {validationError && (
            <View className="mb-4 flex-row items-start gap-2 rounded-xl bg-destructive/10 p-4">
              <Icon as={CircleAlert} className="mt-0.5 text-destructive" size={16} />
              <Text className="flex-1 text-sm text-destructive">{validationError}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={onCancel} disabled={isUploading}>
              <Text>Cancel</Text>
            </Button>
            <Button className="flex-1" onPress={onConfirm} disabled={!isValid || isUploading}>
              <Icon as={Upload} size={14} />
              <Text>{isUploading ? 'Uploading…' : 'Upload'}</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export { FileUploadPreview };
