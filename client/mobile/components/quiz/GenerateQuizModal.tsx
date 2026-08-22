import { Modal, View, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { useThemeColors } from '@/hooks/useThemeColors';
import { hsl, ink } from '@/lib/design';
import { cn } from '@/lib/utils';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { QuizTopicChip } from './QuizTopicChip';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import { PickerDropdown } from '../ui/picker-dropdown'
import {
  type QuizDifficulty,
  type NotebookTopic,
  type QuizGenerateOptions,
  QUESTION_COUNT_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
  TIMER_OPTIONS,
  COLLAPSED_MAX
} from '@freshr/shared';


// ─── Main Modal ──────────────────────────────────────────────────
interface GenerateQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (options: QuizGenerateOptions) => Promise<void>;
  isGenerating: boolean;
  notebookId: string;
}

export function GenerateQuizModal({
  visible,
  onClose,
  onGenerate,
  isGenerating,
  notebookId,
}: GenerateQuizModalProps) {
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
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('EASY');
  const [quizType, setQuizType] = useState('PRACTICE');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

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
  const previewTopics = topics.slice(0, COLLAPSED_MAX);
  const hiddenCount = topics.length - COLLAPSED_MAX;

  // A notebook needs at least one file for topics to exist — no topics means
  // there's nothing to quiz on, so generation (and the prompt box) is blocked.
  const hasTopics = topics.length > 0;
  const canGenerate = hasTopics && !isGenerating && !isLoadingTopics;

  const handleGenerate = () => {
    onGenerate({
      topics: selectedTopics,
      prompt: prompt.trim() || undefined,
      questionCount,
      difficulty,
      quizType,
      timeLimit: timeLimit ?? undefined,
    });
  };

  const closeAllDropdowns = () => setOpenDropdownId(null);

  const handleModeChange = (mode: string) => {
    setQuizType(mode);
    if (mode === 'TIMED') {
      setTimeLimit(5);
    } else {
      setTimeLimit(null);
    }
    // Close all dropdowns when mode changes so timer dropdown resets
    closeAllDropdowns();
  };

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
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="mb-5 flex-row items-start justify-between">
            <View>
              <Text className="text-foreground mb-1 text-xl font-bold">Select Topics</Text>
              <Text className="text-muted-foreground max-w-[260px] text-[13px] leading-[18px]">
                Select the topics you want to generate the quiz based on.
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
                      No topics selected - Quiz will cover all topics
                    </Text>
                  )}

                  {!topicsExpanded && hiddenCount > 0 && (
                    <Pressable onPress={() => setTopicsExpanded(true)}>
                      <Text className="text-muted-foreground text-xs font-semibold">
                        +{hiddenCount} More
                      </Text>
                    </Pressable>
                  )}
                  {topicsExpanded && topics.length > COLLAPSED_MAX && (
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

          {/* Custom prompt section */}
          <View className="mb-1">
            <Text className="text-foreground mb-2.5 text-sm leading-5">
              Or describe what you want to be quizzed on
            </Text>
            <TextInput
              className={cn(
                'border-input bg-field text-foreground min-h-[90px] rounded-lg border p-3.5 text-sm leading-5',
                !hasTopics && 'border-border bg-muted'
              )}
              placeholder={
                hasTopics
                  ? 'e.g. Generate a quiz on unit conversion'
                  : 'Upload files to your notebook to enable this'
              }
              placeholderTextColor={colors.mutedForeground}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              editable={!isGenerating && hasTopics}
              textAlignVertical="top"
            />
          </View>

          {/* Divider */}
          <View className="bg-border my-4 h-px" />

          {/* Settings row 1: Questions + Difficulty */}
          <View className="flex-row">
            <PickerDropdown
              label="Number of Questions"
              value={questionCount}
              options={QUESTION_COUNT_OPTIONS}
              onChange={setQuestionCount}
              disabled={isGenerating}
              isOpen={openDropdownId === 'questionCount'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'questionCount' ? null : 'questionCount')}
              onClose={closeAllDropdowns}
            />
            <View style={{ width: 16 }} />
            <PickerDropdown
              label="Difficulty of Questions"
              value={difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(v) => setDifficulty(v)}
              disabled={isGenerating}
              isOpen={openDropdownId === 'difficulty'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'difficulty' ? null : 'difficulty')}
              onClose={closeAllDropdowns}
            />
          </View>

          {/* Settings row 2: Mode + Timer */}
          <View className="mt-4 flex-row">
            <PickerDropdown
              label="Quiz Mode"
              value={quizType}
              options={MODE_OPTIONS}
              onChange={handleModeChange}
              disabled={isGenerating}
              isOpen={openDropdownId === 'quizType'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'quizType' ? null : 'quizType')}
              onClose={closeAllDropdowns}
            />
            <View style={{ width: 16 }} />
            <PickerDropdown
              label="Timer"
              value={timeLimit}
              options={TIMER_OPTIONS}
              onChange={(v) => setTimeLimit(v)}
              disabled={isGenerating || quizType !== 'TIMED'}
              placeholder="Select"
              isOpen={openDropdownId === 'timer'}
              onToggle={() => setOpenDropdownId(openDropdownId === 'timer' ? null : 'timer')}
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
              <Text className="text-primary-foreground text-base font-bold">Generate Quiz</Text>
            )}
          </Pressable>
          {!hasTopics && !isLoadingTopics && (
            <Text className="text-muted-foreground mt-2 text-center text-xs">
              Add at least one file to your notebook to generate a quiz.
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
