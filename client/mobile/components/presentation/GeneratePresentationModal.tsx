import { Modal, View, ScrollView, ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { useThemeColors } from '@/hooks/useThemeColors';
import { hsl, ink } from '@/lib/design';
import { cn } from '@/lib/utils';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { QuizTopicChip } from '@/components/quiz/QuizTopicChip';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerDropdown } from '@/components/ui/picker-dropdown';
import {
  type NotebookTopic,
  type TextLength,
  SLIDE_COUNT_OPTIONS,
  TEXT_LENGTH_OPTIONS,
  COLLAPSED_MAX_PRESENTATION,
} from '@freshr/shared';

export interface PresentationGenerateOptions {
  topics: NotebookTopic[];
  customTopic: string;
  numSlides: number;
  textLength: TextLength;
}

interface GeneratePresentationModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (options: PresentationGenerateOptions) => Promise<void>;
  isGenerating: boolean;
  notebookId: string;
}

export function GeneratePresentationModal({
  visible,
  onClose,
  onGenerate,
  isGenerating,
  notebookId,
}: GeneratePresentationModalProps) {
  const colors = useThemeColors();
  const notebookService = useNotebookService();
  const insets = useSafeAreaInsets();

  // Topics
  const [topics, setTopics] = useState<NotebookTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<NotebookTopic[]>([]);
  const [topicsExpanded, setTopicsExpanded] = useState(false);

  // Form fields
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [numSlides, setNumSlides] = useState(10);
  const [textLength, setTextLength] = useState<TextLength>('BALANCED');

  // Load topics when modal opens
  useEffect(() => {
    if (visible && notebookId && topics.length === 0) {
      loadTopics();
    }
  }, [visible, notebookId]);

  const loadTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const data = await notebookService.listTopics(notebookId);
      setTopics(data);
    } catch (err) {
      console.error('Failed to load topics', err);
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const toggleTopic = (topic: NotebookTopic) => {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev.filter((t) => t.id !== topic.id)
        : [...prev, topic]
    );
  };

  const selectedIds = new Set(selectedTopics.map((t) => t.id));
  const previewTopics = topics.slice(0, COLLAPSED_MAX_PRESENTATION);
  const hiddenCount = topics.length - COLLAPSED_MAX_PRESENTATION;

  // A notebook needs at least one file for topics to exist — no topics means
  // there's nothing to build a presentation from, so generation (and the custom
  // topic box) is blocked.
  const hasTopics = topics.length > 0;
  const canGenerate = hasTopics && !isGenerating && !isLoadingTopics;

  const handleGenerate = () => {
    onGenerate({
      topics: selectedTopics,
      customTopic: customTopic.trim(),
      numSlides,
      textLength,
    });
  };

  const closeAllDropdowns = () => setOpenDropdownId(null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>

      <View
        className="bg-popover absolute bottom-0 left-0 right-0 max-h-[90%] rounded-t-[20px]"
        style={[styles.sheetLift, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ScrollView
          className="flex-grow-0"
          contentContainerClassName="p-6 pb-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-5 flex-row items-start justify-between">
            <View>
              <Text className="text-foreground mb-1 text-xl font-bold">Generate Presentation</Text>
              <Text className="text-muted-foreground max-w-[260px] text-[13px] leading-[18px]">
                Select topics or describe what you want the presentation to cover.
              </Text>
            </View>
            <Pressable onPress={onClose} disabled={isGenerating} className="mt-0.5 p-1">
              <Icon as={X} size={20} className="text-foreground" />
            </Pressable>
          </View>

          {/* Topics section */}
          <View className="mb-1">
            {isLoadingTopics ? (
              <View className="flex-row items-center gap-2 p-4">
                <ActivityIndicator size="small" color={colors.mutedForeground} />
                <Text className="text-muted-foreground text-[13px]">Loading topics...</Text>
              </View>
            ) : topics.length === 0 ? (
              <Text className="text-muted-foreground p-4 text-[13px] leading-5">
                No topics found. Upload files to your notebook first.
              </Text>
            ) : (
              <View className="border-border rounded-lg border p-3.5">
                <View className="flex-row flex-wrap gap-2">
                  {(topicsExpanded ? topics : previewTopics).map((topic) => (
                    <QuizTopicChip
                      key={topic.id}
                      label={topic.name}
                      selected={selectedIds.has(topic.id)}
                      onToggle={() => toggleTopic(topic)}
                    />
                  ))}
                </View>

                <View className="mt-3 flex-row items-center justify-between">
                  {selectedTopics.length > 0 ? (
                    <Text className="text-muted-foreground flex-1 text-xs">
                      {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected
                    </Text>
                  ) : (
                    <Text className="text-muted-foreground flex-1 text-xs">
                      No topics selected — presentation will cover all topics
                    </Text>
                  )}

                  {!topicsExpanded && hiddenCount > 0 && (
                    <Pressable onPress={() => setTopicsExpanded(true)}>
                      <Text className="text-muted-foreground text-xs font-semibold">
                        +{hiddenCount} More
                      </Text>
                    </Pressable>
                  )}
                  {topicsExpanded && topics.length > COLLAPSED_MAX_PRESENTATION && (
                    <Pressable onPress={() => setTopicsExpanded(false)}>
                      <Text className="text-muted-foreground text-xs font-semibold">Collapse</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="bg-border my-4 h-px" />

          {/* Custom topic section */}
          <View className="mb-1">
            <Text className="text-foreground mb-2.5 text-sm leading-5">
              Or describe your own topic
            </Text>
            <TextInput
              className={cn(
                'border-input bg-field text-foreground min-h-[90px] rounded-lg border p-3.5 text-sm leading-5',
                !hasTopics && 'border-border bg-muted'
              )}
              placeholder={
                hasTopics
                  ? 'e.g. Compare the causes and effects of WWI and WWII...'
                  : 'Upload files to your notebook to enable this'
              }
              placeholderTextColor={colors.mutedForeground}
              value={customTopic}
              onChangeText={setCustomTopic}
              multiline
              numberOfLines={3}
              editable={!isGenerating && hasTopics}
              textAlignVertical="top"
            />
          </View>

          {/* Divider */}
          <View className="bg-border my-4 h-px" />

          {/* Settings row: Slides + Length */}
          <View className="flex-row">
            <PickerDropdown
              label="Number of Slides"
              value={numSlides}
              options={SLIDE_COUNT_OPTIONS}
              onChange={setNumSlides}
              disabled={isGenerating}
              isOpen={openDropdownId === 'numSlides'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'numSlides' ? null : 'numSlides')}
              onClose={closeAllDropdowns}
            />
            <View style={{ width: 16 }} />
            <PickerDropdown
              label="Text Length"
              value={textLength}
              options={TEXT_LENGTH_OPTIONS}
              onChange={(v) => setTextLength(v)}
              disabled={isGenerating}
              isOpen={openDropdownId === 'textLength'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'textLength' ? null : 'textLength')}
              onClose={closeAllDropdowns}
            />
          </View>
        </ScrollView>

        {/* Generate Button */}
        <View className="px-6 pb-2 pt-3">
          <Pressable
            className={cn(
              'bg-primary items-center justify-center rounded-lg py-4',
              !canGenerate && 'opacity-50'
            )}
            onPress={handleGenerate}
            disabled={!canGenerate}>
            {isGenerating ? (
              <ButtonSpinner />
            ) : (
              <Text className="text-primary-foreground text-base font-bold">
                Generate Presentation
              </Text>
            )}
          </Pressable>
          {!hasTopics && !isLoadingTopics && (
            <Text className="text-muted-foreground mt-2 text-center text-xs">
              Add at least one file to your notebook to generate a presentation.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Shadow only — everything else is a utility class, so the sheet follows the
// theme. A sheet rising from the bottom casts upward, and shadows are cast in
// ink in both themes.
const styles = StyleSheet.create({
  sheetLift: {
    shadowColor: hsl(ink),
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
});
