import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { hsl, ink } from '@/lib/design';

const SHEET_HEIGHT = 280;

/**
 * Spotify-style "upgrade outside the app" bottom sheet. We never link to the
 * payment page directly (store anti-steering rules) — the sheet only tells the
 * user that plan changes happen on the web.
 */
type UpgradeSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  body?: string;
};

export function UpgradeSheet({
  visible,
  onClose,
  title = 'Subscription changes happen outside the app',
  body = 'All subscription changes are handled through your account on the web, outside the app.',
}: UpgradeSheetProps) {
  // `rendered` keeps the Modal mounted while the close animation plays out.
  const [rendered, setRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    }
  }, [visible, slideAnim]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        className="bg-brand-primary-950 absolute bottom-0 left-0 right-0 rounded-t-[20px] px-6 pb-9 pt-3"
        style={[styles.sheetLift, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View className="bg-brand-paper/25 mb-5 h-1 w-9 self-center rounded-sm" />

        <Text className="text-brand-paper mb-2.5 text-center text-xl font-bold leading-7">
          {title}
        </Text>
        <Text className="text-brand-paper/60 text-center text-sm leading-5">{body}</Text>

        <Button
          className="bg-brand-secondary-300 h-13 mt-6 rounded-full"
          onPress={onClose}>
          <Text className="text-brand-primary-900 text-base font-bold">Got it</Text>
        </Button>
      </Animated.View>
    </Modal>
  );
}

// This sheet is deliberately pinned to the brand ramp rather than the theme
// tokens: it's a fixed dark panel in both light and dark mode, the way the
// landing page is on web. Timber Green at the deep end of the ramp, with the
// Sulu call to action the brandbook puts on a dark surface.
//
// Only the scrim and the lift are left here — RN needs shadow offsets and the
// full-bleed backdrop as real style values.
const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetLift: {
    shadowColor: hsl(ink),
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
});
