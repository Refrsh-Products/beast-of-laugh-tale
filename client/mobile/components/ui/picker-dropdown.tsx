import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronDown } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';


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
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.label}>{label}</Text>
      <Pressable
        style={[pickerStyles.trigger, disabled && pickerStyles.triggerDisabled]}
        onPress={() => !disabled && onToggle()}
        disabled={disabled}>
        <Text style={[pickerStyles.triggerText, disabled && pickerStyles.triggerTextDisabled]}>
          {displayText}
        </Text>
        <Icon as={ChevronDown} size={16} className="text-muted-foreground" />
      </Pressable>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown on outside tap */}
          <Pressable
            style={pickerStyles.backdrop}
            onPress={onClose}
          />
          <View style={pickerStyles.optionsList}>
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={String(option.value)}
                  style={[
                    pickerStyles.option,
                    isSelected && pickerStyles.optionSelected,
                    idx < options.length - 1 && pickerStyles.optionBorder,
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    onClose();
                  }}>
                  <Text
                    style={[
                      pickerStyles.optionText,
                      isSelected && pickerStyles.optionTextSelected,
                    ]}>
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

const pickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  triggerDisabled: {
    backgroundColor: '#F4F4F5',
    borderColor: '#E4E4E7',
  },
  triggerText: {
    fontSize: 14,
    color: '#18181B',
  },
  triggerTextDisabled: {
    color: '#A1A1AA',
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
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    zIndex: 10,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionSelected: {
    backgroundColor: '#F4F4F5',
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  optionText: {
    fontSize: 14,
    color: '#18181B',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
});

export { PickerDropdown }