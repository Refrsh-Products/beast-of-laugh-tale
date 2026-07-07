import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Edit3, Download, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideRenderer } from './SlideRenderer';
import { SlideEditorSheet } from './SlideEditorSheet';
import { SlideNavigatorGrid } from './SlideNavigatorGrid';
import { exportAsPdf } from './exportPresentation';
import type { PresentationSession, PresentationSlide } from '@freshr/shared';

interface PresentationViewerScreenProps {
  presentation: PresentationSession;
  onClose: () => void;
  onUpdate?: (updatedSlides: PresentationSlide[]) => void;
  onRefineSlide?: (slideId: string, feedback: string) => Promise<PresentationSlide>;
}

export function PresentationViewerScreen({
  presentation,
  onClose,
  onUpdate,
  onRefineSlide,
}: PresentationViewerScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<PresentationSlide[]>(presentation.slides ?? []);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  // Lock to landscape on mount, restore on unmount
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    };
  }, []);

  // Listen for dimension changes (orientation change triggers this)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const slideWidth = dimensions.width;
  const slideHeight = dimensions.height;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToSlide = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, []);

  const goNext = () => {
    if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) goToSlide(currentIndex - 1);
  };

  // ── Edit mode ──
  function handleEditCurrent() {
    const slide = slides[currentIndex];
    if (slide) setEditingSlide({ ...slide, bullets: [...slide.bullets] });
  }

  function handleSaveEdit(updated: PresentationSlide) {
    const newSlides = slides.map((s) => (s.id === updated.id ? updated : s));
    setSlides(newSlides);
    onUpdate?.(newSlides);
    setEditingSlide(null);
  }

  function handleDiscardEdit() {
    setEditingSlide(null);
  }

  // ── Export ──
  async function handleExport() {
    setIsExporting(true);
    try {
      const exportPresentation = { ...presentation, slides };
      await exportAsPdf(exportPresentation);
    } catch (err) {
      Alert.alert('Export Failed', 'Could not generate PDF. Please try again.');
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }

  // ── Close ──
  function handleClose() {
    onClose();
  }

  const renderSlide = useCallback(
    ({ item }: { item: PresentationSlide }) => (
      <SlideRenderer slide={item} width={slideWidth} height={slideHeight} />
    ),
    [slideWidth, slideHeight]
  );

  const keyExtractor = useCallback((item: PresentationSlide) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
      />

      {/* Top bar overlay */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4, paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {presentation.topic || 'Presentation'}
        </Text>

        <View style={styles.topBarActions}>
          {/* Slide navigator */}
          <Pressable onPress={() => setShowNavigator(true)} style={styles.topBarButton}>
            <Icon as={LayoutGrid} size={18} color="#FFFFFF" />
          </Pressable>

          {/* Edit */}
          <Pressable onPress={handleEditCurrent} style={styles.topBarButton}>
            <Icon as={Edit3} size={18} color="#FFFFFF" />
          </Pressable>

          {/* Export */}
          <Pressable onPress={handleExport} disabled={isExporting} style={styles.topBarButton}>
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon as={Download} size={18} color="#FFFFFF" />
            )}
          </Pressable>

          {/* Close */}
          <Pressable onPress={handleClose} style={styles.topBarButton}>
            <Icon as={X} size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Bottom bar overlay — slide counter + navigation arrows */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 4, paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
        <Pressable
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}
        >
          <Icon as={ChevronLeft} size={20} color={currentIndex === 0 ? '#666' : '#FFFFFF'} />
        </Pressable>

        <Text style={styles.slideCounter}>
          {currentIndex + 1} / {slides.length}
        </Text>

        <Pressable
          onPress={goNext}
          disabled={currentIndex === slides.length - 1}
          style={[styles.navArrow, currentIndex === slides.length - 1 && styles.navArrowDisabled]}
        >
          <Icon as={ChevronRight} size={20} color={currentIndex === slides.length - 1 ? '#666' : '#FFFFFF'} />
        </Pressable>
      </View>

      {/* Slide navigator grid */}
      <SlideNavigatorGrid
        visible={showNavigator}
        onClose={() => setShowNavigator(false)}
        slides={slides}
        currentIndex={currentIndex}
        onNavigate={(index) => {
          goToSlide(index);
          setShowNavigator(false);
        }}
      />

      {/* Slide editor sheet */}
      {editingSlide && (
        <SlideEditorSheet
          visible={true}
          slide={editingSlide}
          totalSlides={slides.length}
          onSave={handleSaveEdit}
          onDiscard={handleDiscardEdit}
          onRefineSlide={onRefineSlide}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#84e487',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  topBarButton: {
    padding: 8,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 20,
  },
  slideCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    minWidth: 50,
    textAlign: 'center',
  },
  navArrow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
});
