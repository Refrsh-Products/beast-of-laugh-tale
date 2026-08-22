import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSans } from '@/lib/design';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Markdown from 'react-native-markdown-display';
import type { AudioTranscriptDetail } from '@freshr/shared';
import type { TranscriptionService } from '@freshr/shared';

// ─── Types ─────────────────────────────────────────────────────────

type DetailTab = 'transcript' | 'notes';

interface TranscriptDetailScreenProps {
  notebookId: string;
  detail: AudioTranscriptDetail;
  transcriptionService: TranscriptionService;
  onBack: () => void;
  onDeleted: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

// ─── Component ─────────────────────────────────────────────────────

export function TranscriptDetailScreen({
  notebookId,
  detail: initialDetail,
  transcriptionService,
  onBack,
  onDeleted,
}: TranscriptDetailScreenProps) {
  const colors = useThemeColors();
  const [detail, setDetail] = useState(initialDetail);
  const [activeTab, setActiveTab] = useState<DetailTab>(
    initialDetail.has_notes ? 'notes' : 'transcript'
  );

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(initialDetail.transcript_text);
  const [editedTitle, setEditedTitle] = useState(initialDetail.title);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notes generation state
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear save success indicator after 2.5s
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  // ─── Polling helper ─────────────────────────────────────────────

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
          throw new Error('Still processing — check back in a few minutes.');
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    },
    [notebookId, transcriptionService]
  );

  // ─── Save edits ─────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await transcriptionService.updateAudioTranscript(notebookId, detail.id, {
        transcript_text: editedTranscript,
        title: editedTitle,
      });
      setDetail((prev) => ({
        ...prev,
        transcript_text: editedTranscript,
        title: editedTitle,
      }));
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Generate notes ─────────────────────────────────────────────

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      // Kick off notes generation (returns 202)
      await transcriptionService.generateNotesFromTranscript(notebookId, detail.id);

      // Poll until notes are ready or failed
      const updated = await pollUntilDone(
        detail.id,
        (d) => d.notes_status === 'ready' || d.notes_status === 'failed'
      );

      if (updated.notes_status === 'failed') {
        throw new Error(updated.notes_error || 'Notes generation failed.');
      }

      setDetail(updated);
      setActiveTab('notes');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to generate notes.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert('Delete Transcript', 'Are you sure you want to delete this transcript?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await transcriptionService.deleteAudioTranscript(notebookId, detail.id);
            onDeleted();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete transcript.');
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  // ─── Cancel editing ─────────────────────────────────────────────

  const handleCancelEdit = () => {
    setEditedTranscript(detail.transcript_text);
    setEditedTitle(detail.title);
    setIsEditing(false);
  };

  // ─── Word count ─────────────────────────────────────────────────

  const wordCount = (editedTranscript || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <Screen className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="w-full px-5 pb-3">
          <View className="flex-row items-center gap-3">
            <Button variant="ghost" size="sm" onPress={onBack}>
              <Text>← Back</Text>
            </Button>
            <Text className="flex-1 text-lg font-bold" numberOfLines={1}>
              {detail.title || 'Untitled Recording'}
            </Text>
          </View>
          <Separator className="mt-2.5 h-px" />
        </View>

        {/* Tab bar */}
        <View className="flex-row px-5 gap-2 mb-3">
          {(['transcript', 'notes'] as DetailTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onPress={() => setActiveTab(tab)}
            >
              <Text>
                {tab === 'transcript'
                  ? 'Transcript'
                  : `Notes${!detail.has_notes ? ' (none)' : ''}`}
              </Text>
            </Button>
          ))}
        </View>

        <ScrollView contentContainerClassName="px-5 pb-8 gap-4" className="flex-1">
          {/* ─── Transcript Tab ──────────────────────────────────────── */}
          {activeTab === 'transcript' && (
            <View className="gap-4">
              {isEditing ? (
                <>
                  {/* Editable title */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-muted-foreground">TITLE</Text>
                    <Input
                      value={editedTitle}
                      onChangeText={setEditedTitle}
                      placeholder="Lecture title"
                    />
                  </View>

                  {/* Editable transcript */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-muted-foreground">
                      TRANSCRIPT
                    </Text>
                    <TextInput
                      value={editedTranscript}
                      onChangeText={setEditedTranscript}
                      multiline
                      textAlignVertical="top"
                      className="rounded-md border border-input bg-background px-3 py-3 text-base text-foreground min-h-[240px]"
                      style={{ lineHeight: 22 }}
                    />
                    <Text className="text-xs text-muted-foreground">
                      {wordCount.toLocaleString()} words
                    </Text>
                  </View>

                  {/* Save / Cancel buttons */}
                  <View className="flex-row gap-2">
                    <Button variant="outline" onPress={handleCancelEdit} disabled={isSaving}>
                      <Text>Cancel</Text>
                    </Button>
                    <Button className="flex-1" onPress={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <ButtonSpinner size="small" />
                      ) : (
                        <Text>{saveSuccess ? 'Saved ✓' : 'Save Changes'}</Text>
                      )}
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  {/* Read-only transcript */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-base leading-6">
                        {detail.transcript_text || 'No transcript available.'}
                      </Text>
                      <Text className="mt-3 text-xs text-muted-foreground">
                        {wordCount.toLocaleString()} words
                      </Text>
                    </CardContent>
                  </Card>

                  {/* Edit button */}
                  <Button
                    variant="outline"
                    onPress={() => {
                      setEditedTranscript(detail.transcript_text);
                      setEditedTitle(detail.title);
                      setIsEditing(true);
                    }}
                  >
                    <Text>Edit Transcript</Text>
                  </Button>
                </>
              )}
            </View>
          )}

          {/* ─── Notes Tab ───────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <View className="gap-4">
              {detail.has_notes && detail.notes_text ? (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Markdown style={{ body: { color: colors.foreground, fontFamily: fontSans } }}>
                      {detail.notes_text}
                    </Markdown>
                  </CardContent>
                </Card>
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-center text-muted-foreground">
                    No notes generated yet.{'\n'}Generate notes from the transcript below.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ─── Bottom action bar ─────────────────────────────────────── */}
        <View className="px-5 pb-6 pt-3 gap-2">
          <Button
            onPress={handleGenerateNotes}
            disabled={isGeneratingNotes || !detail.transcript_text}
          >
            {isGeneratingNotes ? (
              <View className="flex-row items-center gap-2">
                <ButtonSpinner size="small" />
                <Text>Generating Notes…</Text>
              </View>
            ) : (
              <Text>{detail.has_notes ? 'Regenerate Notes' : 'Generate Notes'}</Text>
            )}
          </Button>
          <Button variant="destructive" onPress={handleDelete} disabled={isDeleting}>
            <Text>{isDeleting ? 'Deleting…' : 'Delete Transcript'}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
