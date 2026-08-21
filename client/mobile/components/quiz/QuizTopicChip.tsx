import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';

interface QuizTopicChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function QuizTopicChip({ label, selected, onToggle }: QuizTopicChipProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onToggle}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}>
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#18181B',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
