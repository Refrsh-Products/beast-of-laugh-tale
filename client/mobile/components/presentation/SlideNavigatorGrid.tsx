import { Modal, View, Pressable, FlatList, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { SlideThumbnail } from './SlideThumbnail';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import type { PresentationSlide } from '@freshr/shared';

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
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Slides</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon as={X} size={20} className="text-foreground" />
          </Pressable>
        </View>

        {/* Grid */}
        <FlatList
          data={slides}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item, index }) => (
            <View style={styles.gridItem}>
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  closeButton: {
    padding: 4,
  },
  gridContent: {
    padding: 12,
  },
  gridRow: {
    gap: 8,
  },
  gridItem: {
    flex: 1,
    maxWidth: '33.33%',
  },
});
