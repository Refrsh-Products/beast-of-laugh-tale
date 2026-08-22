import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface QuizTopicChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function QuizTopicChip({ label, selected, onToggle }: QuizTopicChipProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={cn(
        'rounded-full border px-4 py-2 active:opacity-70',
        selected ? 'bg-primary border-primary' : 'bg-field border-border'
      )}>
      <Text
        className={cn(
          'text-[13px] font-medium',
          selected ? 'text-primary-foreground' : 'text-foreground'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
