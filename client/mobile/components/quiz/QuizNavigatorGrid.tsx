import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';

interface QuizNavigatorGridProps {
  visible: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  userAnswers: (number | null)[];
  flaggedQuestions: number[];
  onNavigate: (index: number) => void;
}

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

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Questions</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#18181B' }]} />
            <Text style={styles.legendText}>Answered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#18181B' }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F97316' }]} />
            <Text style={styles.legendText}>Flagged</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {Array.from({ length: totalQuestions }, (_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = userAnswers[i] !== null;
            const isFlagged = flaggedQuestions.includes(i);

            let bgColor = '#FFFFFF';
            let textColor = '#18181B';
            let borderColor = '#D4D4D8';
            let borderWidth = 1;

            if (isAnswered) {
              bgColor = '#18181B';
              textColor = '#FFFFFF';
              borderColor = '#18181B';
            }
            if (isCurrent) {
              borderWidth = 2;
              borderColor = isAnswered ? '#18181B' : '#18181B';
            }
            if (isFlagged) {
              borderColor = '#F97316';
              borderWidth = 2;
            }

            return (
              <Pressable
                key={i}
                style={[
                  styles.cell,
                  {
                    backgroundColor: bgColor,
                    borderColor,
                    borderWidth,
                  },
                ]}
                onPress={() => {
                  onNavigate(i);
                  onClose();
                }}>
                <Text style={[styles.cellText, { color: textColor }]}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
    maxHeight: '60%',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#71717A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  cell: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
