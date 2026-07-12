import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Check, MessagesSquare, Plus, Trash2, X } from 'lucide-react-native';
import type { ChatSession } from '@freshr/shared';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';

type SessionHistorySheetProps = {
  visible: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
  onRename: (sessionId: string, title: string) => void;
};

const SHEET_HEIGHT = 460;
// Drag further than this (or flick faster) and the sheet dismisses.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.7;

/** Slide-up sheet listing a notebook's chat sessions — tap to switch, long-press to
 *  rename, trash to delete. Dismiss by tapping the backdrop or swiping down. */
export function SessionHistorySheet({
  visible,
  onClose,
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}: SessionHistorySheetProps) {
  // Keep the Modal mounted while the close animation runs.
  const [rendered, setRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Inline rename state.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      setEditingId(null);
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    }
  }, [visible, slideAnim]);

  // Swipe-down-to-dismiss, attached only to the grabber header so the list still
  // scrolls. Claims the gesture only on a downward drag, so taps pass through.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  if (!rendered) return null;

  const startEditing = (s: ChatSession) => {
    setEditingId(s.id);
    setEditingText(sessionLabel(s));
  };

  const commitEditing = () => {
    if (editingId) {
      const trimmed = editingText.trim();
      if (trimmed) onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents="box-none">
        <View className="flex-1 overflow-hidden rounded-t-3xl border-t border-border bg-background">
          {/* Grabber: drag handle + header (swipe target) */}
          <View {...panResponder.panHandlers} className="px-5 pb-1 pt-3">
            <View className="mb-4 h-1 w-9 self-center rounded-full bg-muted-foreground/40" />
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold">Chat history</Text>
              <Button
                variant="outline"
                size="sm"
                className="flex-row items-center gap-1.5"
                onPress={() => {
                  onClose();
                  onNewChat();
                }}>
                <Icon as={Plus} size={16} />
                <Text className="text-sm font-semibold">New chat</Text>
              </Button>
            </View>
          </View>

          {sessions.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2 pb-10">
              <Icon as={MessagesSquare} size={28} className="text-muted-foreground" />
              <Text className="text-muted-foreground">No previous chats.</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-5 pb-8"
              keyboardShouldPersistTaps="handled">
              {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const isEditing = s.id === editingId;

                if (isEditing) {
                  return (
                    <View
                      key={s.id}
                      className="mb-2 flex-row items-center gap-2 rounded-xl border border-primary bg-card p-2">
                      <Input
                        value={editingText}
                        onChangeText={setEditingText}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={commitEditing}
                        className="h-9 flex-1"
                        placeholder="Chat name"
                      />
                      <Pressable hitSlop={6} onPress={commitEditing} className="p-1 active:opacity-60">
                        <Icon as={Check} size={20} className="text-primary" />
                      </Pressable>
                      <Pressable
                        hitSlop={6}
                        onPress={() => setEditingId(null)}
                        className="p-1 active:opacity-60">
                        <Icon as={X} size={20} className="text-muted-foreground" />
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      if (!isActive) onSelect(s.id);
                      onClose();
                    }}
                    onLongPress={() => startEditing(s)}
                    delayLongPress={300}
                    className={`mb-2 flex-row items-center gap-3 rounded-xl border p-3 active:opacity-70 ${
                      isActive ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}>
                    <Icon
                      as={isActive ? Check : MessagesSquare}
                      size={18}
                      className={isActive ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                        {sessionLabel(s)}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatRelativeTime(s.updated_at || s.created_at)}
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => onDelete(s.id)}
                      className="p-1 active:opacity-60">
                      <Icon as={Trash2} size={18} className="text-muted-foreground" />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

/** New sessions are seeded with the first message; fall back for untitled ones. */
function sessionLabel(s: ChatSession): string {
  const t = s.title?.trim();
  if (t && t.toLowerCase() !== 'new chat') return t;
  return 'New Chat';
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    height: SHEET_HEIGHT,
  },
});
