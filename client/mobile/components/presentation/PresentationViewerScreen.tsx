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
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Edit3, Download, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideRenderer } from './SlideRenderer';
import { SlideEditorSheet } from './SlideEditorSheet';
import { SlideNavigatorGrid } from './SlideNavigatorGrid';
import { fontWeights } from '@/lib/design';
import { SLIDE_PALETTE } from './slidePalette';
import { exportAsPdf } from './exportPresentation';
import type { PresentationSession, PresentationSlide } from '@freshr/shared';

interface PresentationViewerScreenProps {
  presentation: PresentationSession;
  onClose: () => void;
  onUpdate?: (updatedSlides: PresentationSlide[]) => void;
  onRefineSlide?: (slideId: string, feedback: string) => Promise<PresentationSlide>;
  isArchived?: boolean;
}

export function PresentationViewerScreen({
  presentation,
  onClose,
  onUpdate,
  onRefineSlide,
  isArchived,
}: PresentationViewerScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<PresentationSlide[]>(presentation.slides ?? []);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Auto-hide controls ──
  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setControlsVisible(false));
    }, 3000);
  }, [controlsOpacity]);

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setControlsVisible(false));
    } else {
      setControlsVisible(true);
      controlsOpacity.setValue(0);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      resetHideTimer();
    }
  }, [controlsVisible, controlsOpacity, resetHideTimer]);

  // Start auto-hide timer on mount
  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

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

  const safeInsets = { top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right };

  const renderSlide = useCallback(
    ({ item }: { item: PresentationSlide }) => (
      <SlideRenderer slide={item} width={slideWidth} height={slideHeight} safeInsets={safeInsets} />
    ),
    [slideWidth, slideHeight, safeInsets]
  );

  const keyExtractor = useCallback((item: PresentationSlide) => item.id, []);

  return (
    // Presenter mode is deliberately theme-invariant: a deck is presented
    // against black with translucent chrome over it, like a video player, so
    // the overlay reads against the SLIDE rather than against the app.
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      {/* Slides FlatList — tap to toggle controls */}
      <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls}>
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
      </Pressable>

      {/* Top bar overlay */}
      {controlsVisible && (
        <Animated.View style={[styles.topBar, { paddingTop: insets.top + 4, paddingLeft: insets.left + 12, paddingRight: insets.right + 12, opacity: controlsOpacity }]}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {presentation.topic || 'Presentation'}
          </Text>

          <View style={styles.topBarActions}>
            {/* Slide navigator */}
            <Pressable onPress={() => { setShowNavigator(true); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }} style={styles.topBarButton}>
              <Icon as={LayoutGrid} size={18} className="text-white" />
            </Pressable>

            {/* Edit */}
            {!isArchived && (
              <Pressable onPress={() => { handleEditCurrent(); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }} style={styles.topBarButton}>
                <Icon as={Edit3} size={18} className="text-white" />
              </Pressable>
            )}

            {/* Export */}
            <Pressable onPress={handleExport} disabled={isExporting} style={styles.topBarButton}>
              {isExporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon as={Download} size={18} className="text-white" />
              )}
            </Pressable>

            {/* Close */}
            <Pressable onPress={handleClose} style={styles.topBarButton}>
              <Icon as={X} size={18} className="text-white" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Bottom bar overlay — slide counter + navigation arrows */}
      {controlsVisible && (
        <Animated.View style={[styles.bottomBar, { paddingBottom: insets.bottom + 4, paddingLeft: insets.left + 12, paddingRight: insets.right + 12, opacity: controlsOpacity }]}>
          <Pressable
            onPress={() => { goPrev(); resetHideTimer(); }}
            disabled={currentIndex === 0}
            style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}
          >
            <Icon
              as={ChevronLeft}
              size={20}
              className={currentIndex === 0 ? 'text-white/40' : 'text-white'}
            />
          </Pressable>

          <Text className="min-w-[50px] text-center text-[13px] font-semibold tracking-wide text-white">
            {currentIndex + 1} / {slides.length}
          </Text>

          <Pressable
            onPress={() => { goNext(); resetHideTimer(); }}
            disabled={currentIndex === slides.length - 1}
            style={[styles.navArrow, currentIndex === slides.length - 1 && styles.navArrowDisabled]}
          >
            <Icon
              as={ChevronRight}
              size={20}
              className={currentIndex === slides.length - 1 ? 'text-white/40' : 'text-white'}
            />
          </Pressable>
        </Animated.View>
      )}

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
    fontFamily: fontWeights.bold.family,
    fontWeight: '700',
    // The deck's own accent, so it comes from the slide palette rather than a
    // theme token — the bar sits over the slide, not over the app.
    color: SLIDE_PALETTE.green,
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
  navArrow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
});
