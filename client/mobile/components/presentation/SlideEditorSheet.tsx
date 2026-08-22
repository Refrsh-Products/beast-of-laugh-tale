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
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontWeights } from '@/lib/design';
import { cn } from '@/lib/utils';
import { SLIDE_PALETTE } from './slidePalette';

// Field shapes reused across every slide-kind editor below.
const FIELD_GROUP = 'gap-2';
const FIELD_LABEL = 'text-muted-foreground text-[11px] font-bold tracking-widest';
const TEXT_INPUT = 'border-input bg-field text-foreground rounded-md border p-3 text-sm';
const BODY_INPUT = `${TEXT_INPUT} min-h-[100px] leading-[22px]`;
const AI_MESSAGE = 'max-w-[85%] rounded-md p-2.5';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Plus, Trash2, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PresentationSlide, SlideImage } from '@freshr/shared';


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
  const colors = useThemeColors();
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
      <View className={FIELD_GROUP}>
        <Text className={FIELD_LABEL}>TITLE</Text>
        <TextInput
          className="border-primary text-foreground border-b-2 py-1 pb-2 text-[22px] font-extrabold"
          value={localTitle}
          onChangeText={setLocalTitle}
          placeholder="Slide title..."
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
    );
  }

  function renderBulletsField(hint?: string) {
    return (
      <View className={FIELD_GROUP}>
        <Text className={FIELD_LABEL}>BULLETS{hint ? ` · ${hint}` : ''}</Text>
        {localBullets.map((bullet, i) => (
          <View key={i} className="flex-row items-center gap-2.5">
            <Text style={styles.bulletDot}>•</Text>
            <TextInput
              className="border-border text-foreground flex-1 border-b-hairline py-2 text-sm"
              value={bullet}
              onChangeText={(text) => setBullet(i, text)}
              placeholder="Bullet point..."
              placeholderTextColor={colors.mutedForeground}
            />
            {localBullets.length > 1 && (
              <Pressable onPress={() => removeBullet(i)} className="p-1.5">
                <Icon as={Trash2} size={14} className="text-destructive" />
              </Pressable>
            )}
          </View>
        ))}
        <Pressable onPress={addBullet} className="flex-row items-center gap-1.5 self-start py-2">
          <Icon as={Plus} size={14} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-[13px] font-medium">Add bullet</Text>
        </Pressable>
      </View>
    );
  }

  function renderBodyTextField() {
    return (
      <View className={FIELD_GROUP}>
        <Text className={FIELD_LABEL}>BODY TEXT</Text>
        <TextInput
          className={BODY_INPUT}
          value={localBodyText}
          onChangeText={setLocalBodyText}
          placeholder="Write your paragraph here..."
          placeholderTextColor={colors.mutedForeground}
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
        <View className={FIELD_GROUP}>
          <Text className={FIELD_LABEL}>QUOTE</Text>
          <TextInput
            className={BODY_INPUT}
            value={localQuote}
            onChangeText={setLocalQuote}
            placeholder="Quote text..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        <View className={FIELD_GROUP}>
          <Text className={FIELD_LABEL}>SOURCE</Text>
          <TextInput
            className={TEXT_INPUT}
            value={localQuoteSource}
            onChangeText={setLocalQuoteSource}
            placeholder="— Source / attribution"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </>
    );
  }

  function renderImageField(index: number, label = 'IMAGE URL') {
    return (
      <View className={FIELD_GROUP}>
        <Text className={FIELD_LABEL}>{label}</Text>
        <TextInput
          className={TEXT_INPUT}
          value={localImages[index]?.url ?? ''}
          onChangeText={(text) => setImage(index, text)}
          placeholder="https://..."
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
    );
  }

  function renderCaptionField() {
    return (
      <View className={FIELD_GROUP}>
        <Text className={FIELD_LABEL}>CAPTION</Text>
        <TextInput
          className={TEXT_INPUT}
          value={localCaption}
          onChangeText={setLocalCaption}
          placeholder="Caption..."
          placeholderTextColor={colors.mutedForeground}
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
        className="bg-background flex-1"
        style={{ paddingTop: insets.top }}
        behavior="padding"
      >
        {/* Header */}
        <View className="border-border flex-row items-center justify-between border-b px-5 py-3">
          <View style={{ flex: 1 }}>
            <Text className="text-foreground text-sm font-bold tracking-wide">
              SLIDE {slide.order_index + 1} OF {totalSlides}
            </Text>
            <Text className="text-muted-foreground mt-0.5 text-[11px] tracking-wide">
              {slide.layout.toUpperCase()}
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <Pressable onPress={handleSave} className="bg-primary rounded-md px-4 py-2">
              <Text className="text-primary-foreground text-sm font-semibold">Done</Text>
            </Pressable>
            <Pressable onPress={onDiscard} className="p-1">
              <Icon as={X} size={18} className="text-muted-foreground" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable form */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 p-5 pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderFields()}

          {/* AI messages */}
          {aiMessages.length > 0 && (
            <View className="border-border gap-2 border-t pt-3">
              <Text className={FIELD_LABEL}>AI CHAT</Text>
              {aiMessages.map((msg, i) => (
                <View
                  key={i}
                  className={cn(
                    AI_MESSAGE,
                    msg.role === 'user' ? 'bg-primary self-end' : 'bg-muted self-start'
                  )}>
                  <Text
                    className={cn(
                      'text-[13px] leading-[18px]',
                      msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {isRefining && (
                <View className={cn(AI_MESSAGE, 'bg-muted self-start')}>
                  <Text className="text-foreground text-[13px] leading-[18px]">Thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* AI chat input — fixed at bottom */}
        <View
          className="border-border bg-card flex-row gap-2.5 border-t px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <TextInput
            className="border-input bg-field text-foreground flex-1 rounded-md border px-3 py-2.5 text-sm"
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask AI to edit this slide..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isRefining}
            onSubmitEditing={handleSendChat}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSendChat}
            disabled={isRefining || !chatInput.trim()}
            className={cn(
              'bg-primary size-[42px] items-center justify-center rounded-md',
              (isRefining || !chatInput.trim()) && 'opacity-40'
            )}
          >
            {isRefining ? (
              <ButtonSpinner size="small" />
            ) : (
              <Icon as={Send} size={16} className="text-primary-foreground" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// The bullet marker is the deck's own accent — it previews how the slide will
// actually render — so it comes from the slide palette, not a theme token.
const styles = StyleSheet.create({
  bulletDot: {
    color: SLIDE_PALETTE.green,
    fontFamily: fontWeights.bold.family,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
});
