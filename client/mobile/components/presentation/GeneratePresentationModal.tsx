import { Modal, View, ScrollView, ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
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
        style={[
          styles.modalContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Generate Presentation</Text>
              <Text style={styles.subtitle}>
                Select topics or describe what you want the presentation to cover.
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
                      No topics selected — presentation will cover all topics
                    </Text>
                  )}

                  {!topicsExpanded && hiddenCount > 0 && (
                    <Pressable onPress={() => setTopicsExpanded(true)}>
                      <Text style={styles.moreButton}>+{hiddenCount} More</Text>
                    </Pressable>
                  )}
                  {topicsExpanded && topics.length > COLLAPSED_MAX_PRESENTATION && (
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

          {/* Custom topic section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Or describe your own topic
            </Text>
            <TextInput
              style={styles.promptInput}
              placeholder="e.g. Compare the causes and effects of WWI and WWII..."
              placeholderTextColor="#A1A1AA"
              value={customTopic}
              onChangeText={setCustomTopic}
              multiline
              numberOfLines={3}
              editable={!isGenerating}
              textAlignVertical="top"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Settings row: Slides + Length */}
          <View style={styles.settingsRow}>
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
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Presentation</Text>
            )}
          </Pressable>
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
});
