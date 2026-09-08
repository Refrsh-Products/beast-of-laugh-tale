import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = { value: string; label: string };

type SearchableSelectProps = {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  /** Pinned below the results and never removed by the filter — the escape
   *  hatch for someone whose entry isn't in the list. */
  pinnedOption?: SearchableSelectOption;
  placeholder?: string;
  /** Set false for a list short enough to scan — hides the filter box. */
  searchable?: boolean;
  searchPlaceholder?: string;
  sheetTitle?: string;
  emptyMessage?: string;
  sheetHeight?: number;
  disabled?: boolean;
};

const DEFAULT_SHEET_HEIGHT = 520;
// Drag further than this (or flick faster) and the sheet dismisses.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.7;

/**
 * A select that opens in a bottom sheet, optionally with a filter box.
 *
 * Deliberately not an extension of PickerDropdown, which renders its options as
 * an absolutely-positioned sibling with no scroll container. That's fine inside
 * a modal, but in a scrolling form the panel clips against the ScrollView —
 * which bites hardest on the last field, exactly where the user has scrolled to
 * reach the submit button.
 */
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  pinnedOption,
  placeholder = 'Select',
  searchable = true,
  searchPlaceholder = 'Search…',
  sheetTitle,
  emptyMessage = 'No matches.',
  sheetHeight = DEFAULT_SHEET_HEIGHT,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  // Keep the Modal mounted while the close animation runs.
  const [rendered, setRendered] = useState(false);
  const [query, setQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    if (open) {
      setRendered(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      setQuery('');
      Animated.timing(slideAnim, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    }
  }, [open, slideAnim, sheetHeight]);

  // Swipe-down-to-dismiss, attached only to the grabber header so the list
  // still scrolls. Claims the gesture only on a downward drag.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          setOpen(false);
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  ).current;

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    (value && value === pinnedOption?.value ? pinnedOption.label : '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const commit = (option: SearchableSelectOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const renderRow = (option: SearchableSelectOption, pinned = false) => {
    const isSelected = option.value === value;
    return (
      <Pressable
        className={cn(
          'flex-row items-center justify-between gap-3 px-5 py-3.5',
          isSelected && 'bg-accent'
        )}
        onPress={() => commit(option)}>
        <Text
          className={cn(
            'flex-1 text-base',
            pinned ? 'text-muted-foreground' : 'text-foreground',
            isSelected && 'text-accent-foreground font-semibold'
          )}>
          {option.label}
        </Text>
        {isSelected && <Icon as={Check} size={18} className="text-accent-foreground" />}
      </Pressable>
    );
  };

  return (
    <View className="gap-1.5">
      <Text className="text-muted-foreground text-xs font-semibold">{label}</Text>

      <Pressable
        className={cn(
          'border-input bg-field h-14 flex-row items-center justify-between rounded-xl border px-3',
          disabled && 'border-border bg-muted'
        )}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}>
        <Text
          className={cn(
            'flex-1 text-base',
            selectedLabel ? 'text-foreground' : 'text-muted-foreground'
          )}
          numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <Icon as={ChevronDown} size={18} className="text-muted-foreground" />
      </Pressable>

      {rendered && (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[styles.sheet, { height: sheetHeight, transform: [{ translateY: slideAnim }] }]}
            pointerEvents="box-none">
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="border-border bg-background flex-1 overflow-hidden rounded-t-3xl border-t">
                {/* Grabber: drag handle + header (swipe target) */}
                <View {...panResponder.panHandlers} className="px-5 pb-1 pt-3">
                  <View className="bg-muted-foreground/40 mb-4 h-1 w-9 self-center rounded-full" />
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-lg font-bold">{sheetTitle ?? label}</Text>
                    <Pressable hitSlop={12} onPress={() => setOpen(false)}>
                      <Icon as={X} size={20} className="text-muted-foreground" />
                    </Pressable>
                  </View>
                </View>

                {searchable && (
                  <View className="px-5 pb-3">
                    <Input
                      className="h-12 rounded-xl"
                      placeholder={searchPlaceholder}
                      value={query}
                      onChangeText={setQuery}
                      autoFocus
                      autoCorrect={false}
                      autoCapitalize="words"
                      returnKeyType="search"
                    />
                  </View>
                )}

                <FlatList
                  data={filtered}
                  keyExtractor={(o) => o.value}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => renderRow(item)}
                  ListEmptyComponent={
                    <Text className="text-muted-foreground px-5 py-4 text-center text-base">
                      {emptyMessage}
                    </Text>
                  }
                />

                {pinnedOption && (
                  <View className="border-border border-t-hairline">
                    {renderRow(pinnedOption, true)}
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// Stacking and the dimmed backdrop only — everything visual is a utility class
// above, so the sheet follows the theme like the rest of the app.
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
  },
});
