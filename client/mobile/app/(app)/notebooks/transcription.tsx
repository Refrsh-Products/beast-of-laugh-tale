import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { TranscriptionListItem } from '@/components/transcription/TranscriptionListItem';
import { TranscriptDetailScreen } from '@/components/transcription/TranscriptDetailScreen';
import { useTranscriptionService } from '@/hooks/useTranscriptionService';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useAccountService } from '@/hooks/useAccountService';
import type { AudioTranscriptSummary, AudioTranscriptDetail } from '@freshr/shared';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import { getApiErrorCode, PAID_ONLY_FEATURE } from '@/lib/apiError';

// ─── Types ─────────────────────────────────────────────────────────

type ViewState = 'list' | 'upload' | 'transcribing' | 'detail';

// ─── Constants ─────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min
const LIST_POLL_INTERVAL_MS = 3000;

// ─── Screen ────────────────────────────────────────────────────────

export default function TranscriptionScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const transcriptionService = useTranscriptionService();
  const notebookService = useNotebookService();
  const accountService = useAccountService();

  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [transcripts, setTranscripts] = useState<AudioTranscriptSummary[]>([]);
  const [activeDetail, setActiveDetail] = useState<AudioTranscriptDetail | null>(null);
  const [notebookTitle, setNotebookTitle] = useState('');
  // Audio transcription is paid-only. Default to unlocked so a failed usage
  // fetch never blocks a paying user — the server still gates every write.
  const [audioUnlocked, setAudioUnlocked] = useState(true);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // Upload state
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Load list ──────────────────────────────────────────────────

  const loadTranscripts = useCallback(
    async (showSpinner = true) => {
      if (!notebookId) return;
      if (showSpinner) setIsLoading(true);
      try {
        const data = await transcriptionService.listAudioTranscripts(notebookId);
        setTranscripts(data);

        const nb = await notebookService.getNotebook(notebookId);
        setNotebookTitle(nb?.title ?? 'Transcription');

        const usage = await accountService.getAccountUsage();
        setAudioUnlocked(usage?.features?.audio_notes ?? true);
      } catch (err) {
        console.error('Failed to load transcripts', err);
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [notebookId, transcriptionService, accountService]
  );

  useEffect(() => {
    if (viewState === 'list' && notebookId) {
      loadTranscripts();
    }
  }, [viewState, notebookId]);

  // ─── Polling for in-progress items ──────────────────────────────

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const hasInProgress = transcripts.some(
      (t) =>
        t.transcription_status === 'pending' ||
        t.transcription_status === 'processing' ||
        t.notes_status === 'processing'
    );

    if (viewState === 'list' && notebookId && hasInProgress) {
      intervalId = setInterval(() => {
        loadTranscripts(false);
      }, LIST_POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [viewState, notebookId, transcripts, loadTranscripts]);

  // ─── Poll helper (for upload flow) ─────────────────────────────

  const pollUntilDone = useCallback(
    async (
      transcriptId: string,
      isDone: (d: AudioTranscriptDetail) => boolean
    ): Promise<AudioTranscriptDetail> => {
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (true) {
        const d = await transcriptionService.getAudioTranscript(notebookId, transcriptId);
        if (isDone(d)) return d;
        if (Date.now() > deadline) {
          throw new Error('Still processing — check back in History in a few minutes.');
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    },
    [notebookId, transcriptionService]
  );

  // ─── Upload entry point (paid-only gate) ───────────────────────

  const handleUploadPress = () => {
    if (!audioUnlocked) {
      Alert.alert(
        'Audio transcription is a paid feature',
        'Upgrade your plan to transcribe lectures and turn recordings into notes.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => setShowUpgradeSheet(true) },
        ]
      );
      return;
    }
    setViewState('upload');
  };

  // ─── Pick audio file ───────────────────────────────────────────

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAudioFile(file);
        // Auto-fill title from filename
        if (!title) {
          const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(nameWithoutExt);
        }
      }
    } catch (err) {
      console.error('Failed to pick document', err);
    }
  };

  // ─── Upload & transcribe ───────────────────────────────────────

  const handleUpload = async () => {
    if (!notebookId || !audioFile) return;
    setIsUploading(true);
    setViewState('transcribing');

    try {
      // React Native FormData expects an object with uri, name, and type
      const fileToUpload = {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.mimeType || 'audio/mpeg',
      };

      // Kick off transcription (returns 202)
      const kickoff = await transcriptionService.transcribeAudio(
        notebookId,
        fileToUpload as any,
        title || audioFile.name
      );

      // Poll until transcription is ready or failed
      const detail = await pollUntilDone(
        kickoff.transcript_id,
        (d) => d.transcription_status === 'ready' || d.transcription_status === 'failed'
      );

      if (detail.transcription_status === 'failed') {
        throw new Error(detail.transcription_error || 'Transcription failed.');
      }

      // Success — navigate to detail view
      setActiveDetail(detail);
      setAudioFile(null);
      setTitle('');
      setViewState('detail');
    } catch (err: any) {
      // Fallback in case the usage flag was stale and the server rejected us.
      if (getApiErrorCode(err) === PAID_ONLY_FEATURE) {
        setAudioUnlocked(false);
        setViewState('list');
        setShowUpgradeSheet(true);
      } else {
        console.error('Failed to upload/transcribe audio', err);
        Alert.alert('Error', err?.message || 'Failed to transcribe audio.');
        setViewState('upload');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Select transcript from list ───────────────────────────────

  const handleSelectTranscript = async (transcript: AudioTranscriptSummary) => {
    if (!transcript.id) return;
    setIsLoading(true);
    try {
      const detail = await transcriptionService.getAudioTranscript(notebookId, transcript.id);
      setActiveDetail(detail);
      setViewState('detail');
    } catch (err: any) {
      console.error('Failed to fetch transcript detail', err);
      Alert.alert('Error', 'Failed to load transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Delete transcript ─────────────────────────────────────────

  const handleDeleteTranscript = (transcriptId: string) => {
    Alert.alert('Delete Transcript', 'Are you sure you want to delete this transcript?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(transcriptId);
          try {
            await transcriptionService.deleteAudioTranscript(notebookId, transcriptId);
            setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete transcript.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  // ─── Back from detail ─────────────────────────────────────────

  const handleBackFromDetail = () => {
    setActiveDetail(null);
    setViewState('list');
  };

  // ─── Detail screen (full-screen takeover) ─────────────────────

  if (viewState === 'detail' && activeDetail) {
    return (
      <TranscriptDetailScreen
        notebookId={notebookId}
        detail={activeDetail}
        transcriptionService={transcriptionService}
        onBack={handleBackFromDetail}
        onDeleted={() => {
          setActiveDetail(null);
          setViewState('list');
        }}
      />
    );
  }

  // ─── Transcribing (full-screen spinner) ───────────────────────

  if (viewState === 'transcribing') {
    return (
      <Screen className="flex-1 items-center justify-center bg-background">
        <View className="items-center gap-4 px-8">
          <ActivityIndicator size="large" />
          <Text className="text-center text-lg font-bold">Transcribing your lecture…</Text>
          <Text className="text-center text-sm text-muted-foreground">
            This may take a minute for longer recordings.{'\n'}Please keep this screen open.
          </Text>
        </View>
      </Screen>
    );
  }

  // ─── Loading state ────────────────────────────────────────────

  if (isLoading && viewState === 'list') {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  // ─── Main screen (list + upload) ──────────────────────────────

  return (
    <Screen className="flex-1 bg-background">
      <Header title={notebookTitle} actualId={notebookId} onNotebookUpdate={loadTranscripts} />

      <ScrollView contentContainerClassName="p-4 gap-6">
        {viewState === 'list' && (
          <View className="gap-4">
            <View className="flex-row items-center justify-between px-2">
              <Text variant="h3">AUDIO NOTES</Text>
              <Button onPress={handleUploadPress} size="icon" variant="outline">
                <Text>+</Text>
              </Button>
            </View>

            {transcripts.length === 0 ? (
              <Text className="py-10 text-center text-muted-foreground">
                {audioUnlocked ? 'No transcriptions yet.' : 'Upgrade to use this feature.'}
              </Text>
            ) : (
              transcripts.map((t) => (
                <TranscriptionListItem
                  key={t.id}
                  transcript={t}
                  onPress={() => handleSelectTranscript(t)}
                  onDelete={() => handleDeleteTranscript(t.id)}
                  isDeleting={deletingId === t.id}
                />
              ))
            )}
          </View>
        )}

        {viewState === 'upload' && (
          <View className="gap-6 px-3">
            <View className="flex-row items-center justify-between">
              <Text variant="h3">New Transcription</Text>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => {
                  setViewState('list');
                  setAudioFile(null);
                  setTitle('');
                }}>
                <Icon as={X} size={20} />
              </Button>
            </View>

            {/* Title input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted-foreground">LECTURE TITLE</Text>
              <Input
                placeholder="e.g. Data Structures — Lecture 5"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Audio file picker */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted-foreground">AUDIO FILE</Text>
              <Button variant="outline" onPress={handlePickAudio}>
                <Text numberOfLines={1}>{audioFile ? audioFile.name : 'Select Audio File'}</Text>
              </Button>
              {audioFile && (
                <Text className="text-xs text-muted-foreground">
                  {formatSize(audioFile.size ?? 0)}
                </Text>
              )}
            </View>

            {/* Tips */}
            <View className="gap-2 rounded-md border border-input bg-card p-4">
              <Text className="text-xs font-bold tracking-wider text-muted-foreground">
                TIPS FOR BETTER TRANSCRIPTION
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                • Record in a quiet room — background noise reduces accuracy.
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                • Hold your phone close to the professor.
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                • Avoid covering the mic during recording.
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                • Start recording before the lecture begins.
              </Text>
            </View>

            {/* Upload button */}
            <Button onPress={handleUpload} disabled={isUploading || !audioFile} size="lg">
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text>Upload & Transcribe →</Text>
              )}
            </Button>
          </View>
        )}
      </ScrollView>

      {viewState === 'list' && (
        <View className="w-full items-center gap-2 pb-8 pt-4">
          <Button onPress={handleUploadPress} size="lg">
            <Text>+ Upload Audio</Text>
          </Button>
          <BottomNav />
        </View>
      )}

      <UpgradeSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Upgrade your plan on the web"
        body="Audio transcription is available on paid plans. Upgrades are handled through your account on the web, outside the app."
      />
    </Screen>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
