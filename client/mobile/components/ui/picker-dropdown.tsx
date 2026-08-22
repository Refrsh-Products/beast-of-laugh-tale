import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronDown } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface PickerDropdownProps<T> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function PickerDropdown<T>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder,
  isOpen,
  onToggle,
  onClose,
}: PickerDropdownProps<T>) {
  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? 'Select';

  return (
    <View className="flex-1" style={pickerStyles.container}>
      <Text className="text-foreground mb-1.5 text-xs font-semibold">{label}</Text>
      <Pressable
        className={cn(
          'border-input bg-field flex-row items-center justify-between rounded-md border px-3 py-2.5',
          disabled && 'border-border bg-muted'
        )}
        onPress={() => !disabled && onToggle()}
        disabled={disabled}>
        <Text className={cn('text-foreground text-sm', disabled && 'text-muted-foreground')}>
          {displayText}
        </Text>
        <Icon as={ChevronDown} size={16} className="text-muted-foreground" />
      </Pressable>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown on outside tap */}
          <Pressable style={pickerStyles.backdrop} onPress={onClose} />
          <View
            className="border-input bg-popover mt-1 overflow-hidden rounded-md border"
            style={pickerStyles.optionsList}>
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={String(option.value)}
                  className={cn(
                    'px-3 py-2.5',
                    isSelected && 'bg-accent',
                    idx < options.length - 1 && 'border-border border-b-hairline'
                  )}
                  onPress={() => {
                    onChange(option.value);
                    onClose();
                  }}>
                  <Text
                    className={cn(
                      'text-popover-foreground text-sm',
                      isSelected && 'text-accent-foreground font-semibold'
                    )}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// Stacking and the full-bleed backdrop only: everything visual is a utility
// class above, so the dropdown follows the theme like the rest of the app.
const pickerStyles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: -1,
  },
  optionsList: {
    zIndex: 10,
  },
});

export { PickerDropdown };
