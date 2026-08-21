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

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <Text style={styles.sheetTitle}>{title}</Text>
        <Text style={styles.sheetBody}>{body}</Text>

        <Button variant="secondary" className="h-13 mt-6 rounded-full" onPress={onClose}>
          <Text className="text-base font-bold">Got it</Text>
        </Button>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  sheetBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
