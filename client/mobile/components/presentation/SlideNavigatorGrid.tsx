import { Modal, View, Pressable, FlatList, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { SlideThumbnail } from './SlideThumbnail';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import type { PresentationSlide } from '@freshr/shared';
import { hsl, ink } from '@/lib/design';

interface SlideNavigatorGridProps {
  visible: boolean;
  onClose: () => void;
  slides: PresentationSlide[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function SlideNavigatorGrid({
  visible,
  onClose,
  slides,
  currentIndex,
  onNavigate,
}: SlideNavigatorGridProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (index: number) => {
    onNavigate(index);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>

      <View
        className="bg-popover absolute bottom-0 left-0 right-0 max-h-[80%] rounded-t-[20px]"
        style={[styles.sheetLift, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Header */}
        <View className="border-border flex-row items-center justify-between border-b-hairline p-5">
          <Text className="text-foreground text-lg font-bold">Slides</Text>
          <Pressable onPress={onClose} className="p-1">
            <Icon as={X} size={20} className="text-foreground" />
          </Pressable>
        </View>

        {/* Grid */}
        <FlatList
          data={slides}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-3"
          columnWrapperClassName="gap-2"
          renderItem={({ item, index }) => (
            <View className="max-w-[33.33%] flex-1">
              <SlideThumbnail
                slide={item}
                index={index}
                selected={index === currentIndex}
                onPress={() => handleSelect(index)}
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// Shadow only — a sheet rising from the bottom casts upward, and shadows are
// cast in ink in both themes.
const styles = StyleSheet.create({
  sheetLift: {
    shadowColor: hsl(ink),
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
});
