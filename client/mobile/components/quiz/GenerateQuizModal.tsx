import { Modal, View, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
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
        style={[
          styles.modalContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Topics</Text>
              <Text style={styles.subtitle}>
                Select the topics you want to generate the quiz based on.
              </Text>
            </View>
            <Pressable onPress={onClose} disabled={isGenerating} style={styles.closeButton}>
              <Icon as={X} size={20} className="text-foreground" />
            </Pressable>
          </View>

          {/* Topics section */}
          <View style={styles.section}>
            {isLoadingTopics ? (
              <View style={styles.topicsLoading}>
                <ActivityIndicator size="small" />
                <Text style={styles.topicsLoadingText}>Loading topics...</Text>
              </View>
            ) : topics.length === 0 ? (
              <Text style={styles.noTopicsText}>
                No topics found. Upload files to your notebook first.
              </Text>
            ) : (
              <View style={styles.topicsContainer}>
                <View style={styles.chipWrap}>
                  {(topicsExpanded ? topics : previewTopics).map((topic) => (
                    <QuizTopicChip
                      key={topic.id}
                      label={topic.name}
                      selected={selectedIds.has(topic.id)}
                      onToggle={() => toggleTopic(topic)}
                    />
                  ))}
                </View>

                <View style={styles.topicsFooter}>
                  {selectedTopics.length > 0 ? (
                    <Text style={styles.topicsHint}>
                      {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected
                    </Text>
                  ) : (
                    <Text style={styles.topicsHint}>
                      No topics selected - Quiz will cover all topics
                    </Text>
                  )}

                  {!topicsExpanded && hiddenCount > 0 && (
                    <Pressable onPress={() => setTopicsExpanded(true)}>
                      <Text style={styles.moreButton}>+{hiddenCount} More</Text>
                    </Pressable>
                  )}
                  {topicsExpanded && topics.length > COLLAPSED_MAX && (
                    <Pressable onPress={() => setTopicsExpanded(false)}>
                      <Text style={styles.moreButton}>Collapse</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Custom prompt section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Or describe what you want to be quizzed on
            </Text>
            <TextInput
              style={[styles.promptInput, !hasTopics && styles.promptInputDisabled]}
              placeholder={
                hasTopics
                  ? 'e.g. Generate a quiz on unit conversion'
                  : 'Upload files to your notebook to enable this'
              }
              placeholderTextColor="#A1A1AA"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              editable={!isGenerating && hasTopics}
              textAlignVertical="top"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Settings row 1: Questions + Difficulty */}
          <View style={styles.settingsRow}>
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
          <View style={[styles.settingsRow, { marginTop: 16 }]}>
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
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!canGenerate}>
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Quiz</Text>
            )}
          </Pressable>
          {!hasTopics && !isLoadingTopics && (
            <Text style={styles.generateHint}>
              Add at least one file to your notebook to generate a quiz.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 18,
    maxWidth: 260,
  },
  closeButton: {
    padding: 4,
    marginTop: 2,
  },
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#3F3F46',
    marginBottom: 10,
    lineHeight: 20,
  },
  topicsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  topicsLoadingText: {
    fontSize: 13,
    color: '#71717A',
  },
  noTopicsText: {
    fontSize: 13,
    color: '#71717A',
    padding: 16,
    lineHeight: 20,
  },
  topicsContainer: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  topicsHint: {
    fontSize: 12,
    color: '#A1A1AA',
    flex: 1,
  },
  moreButton: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 16,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    minHeight: 90,
    lineHeight: 20,
  },
  promptInputDisabled: {
    backgroundColor: '#F4F4F5',
    borderColor: '#E4E4E7',
  },
  settingsRow: {
    flexDirection: 'row',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  generateButton: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  generateHint: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 8,
  },
});
