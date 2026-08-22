import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { hsl, ink } from '@/lib/design';
import { cn } from '@/lib/utils';

interface QuizNavigatorGridProps {
  visible: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  onNavigate: (index: number) => void;
}

/** The legend swatches, so they can't drift from the cell styles below. */
const LEGEND = [
  { label: 'Answered', className: 'bg-primary' },
  { label: 'Current', className: 'bg-field border-primary border' },
  { label: 'Flagged', className: 'bg-field border-warning border-2' },
];

export function QuizNavigatorGrid({
  visible,
  onClose,
  totalQuestions,
  currentIndex,
  userAnswers,
  flaggedQuestions,
  onNavigate,
}: QuizNavigatorGridProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>

      <View
        className="bg-popover absolute bottom-0 left-0 right-0 max-h-[60%] rounded-t-[20px] px-6 pb-8 pt-5"
        style={styles.sheetLift}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Questions</Text>
          <Pressable onPress={onClose}>
            <Text className="text-muted-foreground text-sm font-semibold">Done</Text>
          </Pressable>
        </View>

        {/* Legend */}
        <View className="mb-4 flex-row gap-4">
          {LEGEND.map((item) => (
            <View key={item.label} className="flex-row items-center gap-1.5">
              <View className={cn('size-3 rounded-[3px]', item.className)} />
              <Text className="text-muted-foreground text-[11px]">{item.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerClassName="flex-row flex-wrap gap-2 pb-2">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = userAnswers[i] !== null;
            const isFlagged = flaggedQuestions.includes(i);

            return (
              <Pressable
                key={i}
                className={cn(
                  'size-[42px] items-center justify-center rounded-md border',
                  isAnswered ? 'bg-primary border-primary' : 'bg-field border-border',
                  // Current and flagged are outline states, so they layer over
                  // whichever fill the cell already has. Flagged wins — it's the
                  // one you went out of your way to mark.
                  isCurrent && 'border-primary border-2',
                  isFlagged && 'border-warning border-2'
                )}
                onPress={() => {
                  onNavigate(i);
                  onClose();
                }}>
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    isAnswered ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Shadow only — React Native needs the offset/radius as real style values, and
// a sheet rising from the bottom casts upward. Shadows are cast in ink in both
// themes, so this is a ramp constant rather than a semantic token.
const styles = StyleSheet.create({
  sheetLift: {
    shadowColor: hsl(ink),
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
});
