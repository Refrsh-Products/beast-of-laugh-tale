import { useRef, useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Check, X } from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { isPaidUser, type ScanPhoto } from '@/lib/scanNotes';

interface CameraCaptureProps {
  photos: ScanPhoto[];
  limit: number;
  onCapture: (uri: string) => void;
  onDone: () => void;
  onClose: () => void;
}

export function CameraCapture({ photos, limit, onCapture, onDone, onClose }: CameraCaptureProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const atLimit = photos.length >= limit;

  const takePhoto = async () => {
    if (atLimit || isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (picture?.uri) onCapture(picture.uri);
    } catch (err) {
      console.error('[CameraCapture] Failed to take picture', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ── Permission states ────────────────────────────────────────────────────
  if (!permission) {
    // Still loading permission status.
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-black px-8"
        style={{ paddingTop: insets.top }}>
        <Icon as={Camera} size={48} className="text-white" />
        <Text variant="large" className="text-center text-white">
          Camera access needed
        </Text>
        <Text variant="default" className="text-center text-white/70">
          FRESHR uses the camera to scan your notes into your notebook.
        </Text>
        <View className="mt-2 w-full gap-3">
          {permission.canAskAgain ? (
            <Button onPress={requestPermission}>
              <Text>Allow Camera</Text>
            </Button>
          ) : (
            <Button onPress={() => Linking.openSettings()}>
              <Text>Open Settings</Text>
            </Button>
          )}
          <Button variant="outline" onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    );
  }

  // ── Live camera ──────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      {/* Top bar: close + counter */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-5"
        style={{ top: insets.top + 8 }}>
        <Pressable
          className="size-10 items-center justify-center rounded-full bg-black/50 active:opacity-70"
          onPress={onClose}>
          <Icon as={X} size={22} className="text-white" />
        </Pressable>
        <View className="rounded-full bg-black/50 px-3 py-1.5">
          <Text className="text-sm font-semibold text-white">
            {photos.length} / {limit}
          </Text>
        </View>
      </View>

      {/* At-limit hint */}
      {atLimit && (
        <View
          className="absolute left-5 right-5 rounded-xl bg-black/70 p-3"
          style={{ top: insets.top + 56 }}>
          <Text className="text-center text-sm text-white">
            {isPaidUser()
              ? `You've reached the ${limit}-photo limit for one scan.`
              : `${limit}-photo limit reached. Upgrade to Premium to scan up to 10 pages.`}
          </Text>
        </View>
      )}

      {/* Bottom bar: thumbnail strip + shutter + done */}
      <View className="absolute left-0 right-0 gap-4 px-5" style={{ bottom: insets.bottom + 16 }}>
        {photos.length > 0 && (
          <View className="flex-row gap-2">
            {photos.map((photo) => (
              <Pressable key={photo.id} onPress={onDone}>
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 48, height: 48, borderRadius: 8 }}
                />
              </Pressable>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between">
          {/* Spacer to balance the Done button */}
          <View className="w-20" />

          {/* Shutter */}
          <Pressable
            onPress={takePhoto}
            disabled={atLimit || isCapturing}
            className={`size-20 items-center justify-center rounded-full border-4 border-white ${
              atLimit ? 'opacity-40' : 'active:opacity-70'
            }`}>
            <View className="size-16 rounded-full bg-white" />
          </Pressable>

          {/* Done → review */}
          <View className="w-20 items-end">
            {photos.length > 0 && (
              <Pressable
                onPress={onDone}
                className="flex-row items-center gap-1 rounded-full bg-primary px-4 py-2.5 active:opacity-70">
                <Icon as={Check} size={16} className="text-primary-foreground" />
                <Text className="text-sm font-semibold text-primary-foreground">Done</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
