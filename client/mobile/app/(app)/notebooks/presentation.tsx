import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { usePresentationService } from '@/hooks/usePresentationService';
import { useNotebookService } from '@/hooks/useNotebookService';
import type { PresentationSession, PresentationSlide } from '@freshr/shared';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { GeneratePresentationModal } from '@/components/presentation/GeneratePresentationModal';
import type { PresentationGenerateOptions } from '@/components/presentation/GeneratePresentationModal';
import { PresentationListItem } from '@/components/presentation/PresentationListItem';
import { PresentationViewerScreen } from '@/components/presentation/PresentationViewerScreen';
import { Icon } from '@/components/ui/icon';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import { getApiErrorCode, PRESENTATION_QUOTA_EXCEEDED } from '@/lib/apiError';
import { Plus, Presentation } from 'lucide-react-native';

type ViewState = 'list' | 'view';

export default function PresentationScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const presentationService = usePresentationService();

  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [presentations, setPresentations] = useState<PresentationSession[]>([]);
  const [activePresentation, setActivePresentation] = useState<PresentationSession | null>(null);
  const notebookService = useNotebookService();
  const [isArchived, setIsArchived] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');

  // Generate state
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  useEffect(() => {
    if (viewState === 'list' && notebookId) {
      loadPresentations();
    }
  }, [viewState, notebookId]);

  // Polling for generating presentations
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const hasGeneratingPresentations = presentations.some(
      (p) => p.status === 'QUEUED' || p.status === 'GENERATING'
    );

    if (viewState === 'list' && notebookId && hasGeneratingPresentations) {
      intervalId = setInterval(() => {
        loadPresentations(false);
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [viewState, notebookId, presentations]);

  const loadPresentations = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await presentationService.listPresentationsByNotebook(notebookId);
      setPresentations(data);

      const nb = await notebookService.getNotebook(notebookId);
      setIsArchived(nb?.is_archived ?? false);
      setNotebookTitle(nb?.title ?? 'Presentation');
    } catch (err) {
      console.error('Failed to load presentations', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // ─── Generate presentation ──
  const handleGenerate = async (options: PresentationGenerateOptions) => {
    if (!notebookId) return;
    setIsGenerating(true);

    const isAllTopics = options.topics.length === 0 && !options.customTopic;
    const payload = {
      notebook: notebookId,
      topic: isAllTopics ? 'All Topics' : options.topics.map((t) => t.name).join(', '),
      topic_id: isAllTopics ? undefined : options.topics[0]?.id,
      custom_prompt: options.customTopic || undefined,
      slide_count: options.numSlides,
      text_length: options.textLength,
    };

    try {
      const newPresentation = await presentationService.createPresentation(payload);
      setActivePresentation(newPresentation);
      loadPresentations(false);
      setIsGenerateModalVisible(false);
    } catch (err: any) {
      if (getApiErrorCode(err) === PRESENTATION_QUOTA_EXCEEDED) {
        setIsGenerateModalVisible(false);
        Alert.alert(
          'Presentation limit reached',
          "You've used all your presentations on the free plan. Upgrade to generate more presentations.",
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => setShowUpgradeSheet(true) },
          ]
        );
      } else {
        console.error('Failed to generate presentation', err);
        Alert.alert('Error', err?.message || 'Failed to generate presentation.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Select presentation from list ──
  const handleSelectPresentation = async (presentation: PresentationSession) => {
    if (!presentation.id) return;
    setIsLoading(true);
    try {
      const fullPresentation = await presentationService.getPresentation(presentation.id);
      setActivePresentation(fullPresentation);
      setViewState('view');
    } catch (err: any) {
      console.error('Failed to fetch presentation', err);
      Alert.alert('Error', 'Failed to load the presentation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Update slides ──
  const handleUpdateSlides = (updatedSlides: PresentationSlide[]) => {
    if (!activePresentation) return;
    // Update local state
    setActivePresentation({ ...activePresentation, slides: updatedSlides });
    // Persist each changed slide to backend
    updatedSlides.forEach(async (slide) => {
      try {
        await presentationService.updateSlide(activePresentation.id, slide.id, {
          title: slide.title,
          layout: slide.layout,
          bullets: slide.bullets,
          body_text: slide.body_text,
          quote: slide.quote,
          quote_source: slide.quote_source,
          caption: slide.caption,
          speaker_notes: slide.speaker_notes,
          images: slide.images,
        });
      } catch (err) {
        console.error('Failed to update slide', err);
      }
    });
  };

  // ─── Refine slide via AI ──
  const handleRefineSlide = async (
    slideId: string,
    feedback: string
  ): Promise<PresentationSlide> => {
    if (!activePresentation) throw new Error('No active presentation');
    return await presentationService.refineSlide(activePresentation.id, slideId, feedback);
  };

  // ─── Close viewer ──
  const handleCloseViewer = () => {
    setActivePresentation(null);
    setViewState('list');
  };

  // ─── Viewer screen ──
  if (viewState === 'view' && activePresentation) {
    return (
      <PresentationViewerScreen
        presentation={activePresentation}
        onClose={handleCloseViewer}
        onUpdate={handleUpdateSlides}
        onRefineSlide={handleRefineSlide}
        isArchived={isArchived}
      />
    );
  }

  // ─── Loading ──
  if (isLoading && viewState === 'list') {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  // ─── Presentation list (default) ──
  return (
    <Screen className="flex-1 bg-background">
      <Header title={notebookTitle} actualId={notebookId} onNotebookUpdate={loadPresentations} />
      <ArchiveBanner isArchived={isArchived} />
      <ScrollView
        contentContainerClassName={presentations.length === 0 ? 'flex-grow px-8 py-6' : 'p-4 gap-6'}
        showsVerticalScrollIndicator={false}>
        {presentations.length === 0 ? (
          /* Empty state — mirrors the chat/quiz/transcription treatment. */
          <View className="flex-1 items-center justify-center gap-5 pb-12">
            <View className="size-14 items-center justify-center rounded-full bg-muted">
              <Icon as={Presentation} size={26} className="text-muted-foreground" />
            </View>
            <View className="items-center gap-1.5 px-4">
              <Text className="text-center text-xl font-semibold">No presentations yet</Text>
              <Text className="text-center text-sm leading-5 text-muted-foreground">
                {isArchived
                  ? 'This notebook is archived. Restore it to generate presentations from your notes.'
                  : 'Generate slides from your notes — pick a topic and get a ready-to-present deck.'}
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row items-center justify-between px-2">
              <Text className="text-base font-semibold">Presentations</Text>
              {!isArchived && (
                <Button
                  onPress={() => setIsGenerateModalVisible(true)}
                  size="icon"
                  variant="ghost"
                  accessibilityLabel="New presentation">
                  <Icon as={Plus} size={20} className="text-muted-foreground" />
                </Button>
              )}
            </View>

            {presentations.map((p) => (
              <PresentationListItem
                key={p.id}
                presentation={p}
                onPress={() => handleSelectPresentation(p)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View className="w-full items-center gap-4 pb-8 pt-4">
        {!isArchived && (
          <Button onPress={() => setIsGenerateModalVisible(true)} variant="default">
            <Text>+ New Presentation</Text>
          </Button>
        )}
        <BottomNav />
      </View>

      <GeneratePresentationModal
        visible={isGenerateModalVisible}
        onClose={() => setIsGenerateModalVisible(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        notebookId={notebookId}
      />

      <UpgradeSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Upgrade your plan on the web"
        body="Paid plans unlock more presentations, notebooks, and storage. Upgrades are handled through your account on the web, outside the app."
      />
    </Screen>
  );
}
