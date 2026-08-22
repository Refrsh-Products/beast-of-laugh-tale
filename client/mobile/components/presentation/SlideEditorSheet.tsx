import { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Plus, Trash2, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PresentationSlide, SlideImage } from '@freshr/shared';

const G = '#84e487';
const B = '#18181B';

interface AiMessage {
  role: 'user' | 'ai';
  content: string;
}

interface SlideEditorSheetProps {
  visible: boolean;
  slide: PresentationSlide;
  totalSlides: number;
  onSave: (updated: PresentationSlide) => void;
  onDiscard: () => void;
  onRefineSlide?: (slideId: string, feedback: string) => Promise<PresentationSlide>;
}

export function SlideEditorSheet({
  visible,
  slide,
  totalSlides,
  onSave,
  onDiscard,
  onRefineSlide,
}: SlideEditorSheetProps) {
  const insets = useSafeAreaInsets();

  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBullets, setLocalBullets] = useState<string[]>([...slide.bullets]);
  const [localBodyText, setLocalBodyText] = useState(slide.body_text ?? '');
  const [localQuote, setLocalQuote] = useState(slide.quote ?? '');
  const [localQuoteSource, setLocalQuoteSource] = useState(slide.quote_source ?? '');
  const [localCaption, setLocalCaption] = useState(slide.caption ?? '');
  const [localImages, setLocalImages] = useState<SlideImage[]>([...slide.images]);

  // AI chat state
  const [chatInput, setChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  function buildSlide(overrides: Partial<PresentationSlide> = {}): PresentationSlide {
    return {
      ...slide,
      title: localTitle,
      bullets: localBullets,
      body_text: localBodyText || undefined,
      quote: localQuote || undefined,
      quote_source: localQuoteSource || undefined,
      caption: localCaption || undefined,
      images: localImages,
      ...overrides,
    };
  }

  function handleSave() {
    onSave(buildSlide());
  }

  function setBullet(index: number, text: string) {
    setLocalBullets((prev) => prev.map((b, i) => (i === index ? text : b)));
  }

  function addBullet() {
    setLocalBullets((prev) => [...prev, '']);
  }

  function removeBullet(index: number) {
    if (localBullets.length <= 1) return;
    setLocalBullets((prev) => prev.filter((_, i) => i !== index));
  }

  function setImage(index: number, url: string) {
    setLocalImages((prev) => {
      const next = [...prev];
      if (index >= next.length) {
        next.push({ url, query: '', attribution: '', source_page: '' });
      } else {
        next[index] = { ...next[index], url };
      }
      return next;
    });
  }

  async function handleSendChat() {
    if (!chatInput.trim() || isRefining) return;
    const content = chatInput.trim();
    setChatInput('');
    setAiMessages((prev) => [...prev, { role: 'user', content }]);

    if (!onRefineSlide) {
      setAiMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'AI slide editing is not available.' },
      ]);
      return;
    }

    setIsRefining(true);
    try {
      const updatedSlide = await onRefineSlide(slide.id, content);
      // Apply the AI-updated fields
      setLocalTitle(updatedSlide.title);
      setLocalBullets([...updatedSlide.bullets]);
      setLocalBodyText(updatedSlide.body_text ?? '');
      setLocalQuote(updatedSlide.quote ?? '');
      setLocalQuoteSource(updatedSlide.quote_source ?? '');
      setLocalCaption(updatedSlide.caption ?? '');
      setLocalImages([...updatedSlide.images]);
      setAiMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'I have successfully made your changes.' },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, failed to update the slide. Try again.' },
      ]);
    } finally {
      setIsRefining(false);
    }
  }

  // ── Render fields based on layout ──────────────────────────────────

  function renderTitleField() {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>TITLE</Text>
        <TextInput
          style={styles.titleInput}
          value={localTitle}
          onChangeText={setLocalTitle}
          placeholder="Slide title..."
          placeholderTextColor="#A1A1AA"
        />
      </View>
    );
  }

  function renderBulletsField(hint?: string) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>BULLETS{hint ? ` · ${hint}` : ''}</Text>
        {localBullets.map((bullet, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <TextInput
              style={styles.bulletInput}
              value={bullet}
              onChangeText={(text) => setBullet(i, text)}
              placeholder="Bullet point..."
              placeholderTextColor="#A1A1AA"
            />
            {localBullets.length > 1 && (
              <Pressable onPress={() => removeBullet(i)} style={styles.removeBulletButton}>
                <Icon as={Trash2} size={14} color="#DC2626" />
              </Pressable>
            )}
          </View>
        ))}
        <Pressable onPress={addBullet} style={styles.addBulletButton}>
          <Icon as={Plus} size={14} color="#71717A" />
          <Text style={styles.addBulletText}>Add bullet</Text>
        </Pressable>
      </View>
    );
  }

  function renderBodyTextField() {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>BODY TEXT</Text>
        <TextInput
          style={styles.bodyInput}
          value={localBodyText}
          onChangeText={setLocalBodyText}
          placeholder="Write your paragraph here..."
          placeholderTextColor="#A1A1AA"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
    );
  }

  function renderQuoteField() {
    return (
      <>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>QUOTE</Text>
          <TextInput
            style={styles.bodyInput}
            value={localQuote}
            onChangeText={setLocalQuote}
            placeholder="Quote text..."
            placeholderTextColor="#A1A1AA"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>SOURCE</Text>
          <TextInput
            style={styles.textInput}
            value={localQuoteSource}
            onChangeText={setLocalQuoteSource}
            placeholder="— Source / attribution"
            placeholderTextColor="#A1A1AA"
          />
        </View>
      </>
    );
  }

  function renderImageField(index: number, label = 'IMAGE URL') {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={localImages[index]?.url ?? ''}
          onChangeText={(text) => setImage(index, text)}
          placeholder="https://..."
          placeholderTextColor="#A1A1AA"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
    );
  }

  function renderCaptionField() {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>CAPTION</Text>
        <TextInput
          style={styles.textInput}
          value={localCaption}
          onChangeText={setLocalCaption}
          placeholder="Caption..."
          placeholderTextColor="#A1A1AA"
        />
      </View>
    );
  }

  function renderFields() {
    switch (slide.layout) {
      case 'bullets':
        return <>{renderTitleField()}{renderBulletsField()}</>;
      case 'title-only':
        return renderTitleField();
      case 'body-text':
        return <>{renderTitleField()}{renderBodyTextField()}</>;
      case 'two-col':
        return <>{renderTitleField()}{renderBulletsField('Left/right split at midpoint')}</>;
      case 'image-right':
      case 'image-left':
        return <>{renderTitleField()}{renderBulletsField()}{renderImageField(0)}</>;
      case 'full-image':
        return <>{renderImageField(0)}{renderCaptionField()}</>;
      case 'image-top':
        return <>{renderImageField(0)}{renderTitleField()}{renderBulletsField('Max 2 bullets shown')}</>;
      case 'quote':
        return renderQuoteField();
      case 'two-images':
        return (
          <>
            {renderTitleField()}
            {renderImageField(0, 'IMAGE 1 URL')}
            {renderImageField(1, 'IMAGE 2 URL')}
          </>
        );
      default:
        return <>{renderTitleField()}{renderBulletsField()}</>;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior="padding"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              SLIDE {slide.order_index + 1} OF {totalSlides}
            </Text>
            <Text style={styles.headerSubtitle}>
              {slide.layout.toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Done</Text>
            </Pressable>
            <Pressable onPress={onDiscard} style={styles.discardButton}>
              <Icon as={X} size={18} color="#71717A" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable form */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderFields()}

          {/* AI messages */}
          {aiMessages.length > 0 && (
            <View style={styles.aiSection}>
              <Text style={styles.fieldLabel}>AI CHAT</Text>
              {aiMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.aiMessage,
                    msg.role === 'user' ? styles.aiMessageUser : styles.aiMessageAi,
                  ]}
                >
                  <Text
                    style={[
                      styles.aiMessageText,
                      msg.role === 'user' && styles.aiMessageTextUser,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {isRefining && (
                <View style={[styles.aiMessage, styles.aiMessageAi]}>
                  <Text style={styles.aiMessageText}>Thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* AI chat input — fixed at bottom */}
        <View style={[styles.chatInputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask AI to edit this slide..."
            placeholderTextColor="#A1A1AA"
            editable={!isRefining}
            onSubmitEditing={handleSendChat}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSendChat}
            disabled={isRefining || !chatInput.trim()}
            style={[
              styles.sendButton,
              (isRefining || !chatInput.trim()) && styles.sendButtonDisabled,
            ]}
          >
            {isRefining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon as={Send} size={16} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#71717A',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  discardButton: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181B',
    borderBottomWidth: 2,
    borderBottomColor: '#18181B',
    paddingBottom: 8,
    paddingVertical: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#18181B',
    backgroundColor: '#FAFAFA',
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#18181B',
    backgroundColor: '#FAFAFA',
    minHeight: 100,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    color: '#84e487',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
  bulletInput: {
    flex: 1,
    fontSize: 14,
    color: '#18181B',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
    paddingVertical: 8,
  },
  removeBulletButton: {
    padding: 6,
  },
  addBulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  addBulletText: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
  aiSection: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
  },
  aiMessage: {
    maxWidth: '85%',
    padding: 10,
    borderRadius: 8,
  },
  aiMessageUser: {
    backgroundColor: '#18181B',
    alignSelf: 'flex-end',
  },
  aiMessageAi: {
    backgroundColor: '#F4F4F5',
    alignSelf: 'flex-start',
  },
  aiMessageText: {
    fontSize: 13,
    color: '#18181B',
    lineHeight: 18,
  },
  aiMessageTextUser: {
    color: '#FFFFFF',
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#18181B',
  },
  sendButton: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
