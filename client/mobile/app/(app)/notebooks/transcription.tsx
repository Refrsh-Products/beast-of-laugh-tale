import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useTranscriptionService } from '@/hooks/useTranscriptionService';

type ViewState = 'list' | 'upload' | 'view';

export default function TranscriptionScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const transcriptionService = useTranscriptionService();
  
  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<any | null>(null);

  // Upload State
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  useEffect(() => {
    if (viewState === 'list' && notebookId) {
      loadTranscripts();
    }
  }, [viewState, notebookId]);

  const loadTranscripts = async () => {
    setIsLoading(true);
    try {
      const data = await transcriptionService.listAudioTranscripts(notebookId);
      setTranscripts(data);
    } catch (err) {
      console.error('Failed to load transcripts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        setAudioFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Failed to pick document', err);
    }
  };

  const handleUpload = async () => {
    if (!notebookId || !audioFile) return;
    setIsUploading(true);
    try {
      // React Native FormData expects an object with uri, name, and type
      const fileToUpload = {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.mimeType || 'audio/mpeg',
      };
      
      await transcriptionService.transcribeAudio(notebookId, fileToUpload as any, title || audioFile.name);
      
      setAudioFile(null);
      setTitle('');
      setViewState('list');
    } catch (err: any) {
      console.error('Failed to upload audio', err);
      Alert.alert('Error', err?.message || 'Failed to upload audio.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!notebookId || !activeTranscript) return;
    setIsGeneratingNotes(true);
    try {
      const updated = await transcriptionService.generateNotesFromTranscript(notebookId, activeTranscript.id);
      setActiveTranscript(updated);
    } catch (err: any) {
      console.error('Failed to generate notes', err);
      Alert.alert('Error', err?.message || 'Failed to generate notes.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  if (isLoading && viewState === 'list') {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-6">
        
        {viewState === 'list' && (
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">Transcriptions</Text>
              <Button onPress={() => setViewState('upload')} size="sm">
                <Text>+ Upload Audio</Text>
              </Button>
            </View>
            
            {transcripts.length === 0 ? (
              <Text className="text-center text-muted-foreground py-10">No transcriptions yet.</Text>
            ) : (
              transcripts.map((t) => (
                <Card key={t.id}>
                  <CardHeader>
                    <CardTitle>{t.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Text className="text-muted-foreground">Status: {t.status}</Text>
                    <Text className="text-muted-foreground text-xs mt-1">
                      {new Date(t.created_at).toLocaleString()}
                    </Text>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onPress={() => {
                        setActiveTranscript(t);
                        setViewState('view');
                      }}
                    >
                      <Text>View Details</Text>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </View>
        )}

        {viewState === 'upload' && (
          <View className="gap-6">
            <View className="flex-row items-center gap-4">
              <Button variant="ghost" size="icon" onPress={() => setViewState('list')}>
                <Text className="text-lg">←</Text>
              </Button>
              <Text className="text-2xl font-bold">New Transcription</Text>
            </View>
            
            <View className="gap-2">
              <Text className="font-medium">Title (Optional)</Text>
              <Input 
                placeholder="e.g. Lecture 5: Mitosis" 
                value={title} 
                onChangeText={setTitle} 
              />
            </View>
            
            <View className="gap-2">
              <Text className="font-medium">Audio File</Text>
              <Button variant="outline" onPress={handlePickAudio}>
                <Text>{audioFile ? audioFile.name : 'Select Audio File'}</Text>
              </Button>
            </View>
            
            <Button 
              className="mt-4" 
              onPress={handleUpload} 
              disabled={isUploading || !audioFile}
            >
              {isUploading ? <ActivityIndicator color="#fff" /> : <Text>Upload & Transcribe</Text>}
            </Button>
          </View>
        )}

        {viewState === 'view' && activeTranscript && (
          <View className="gap-6">
            <View className="flex-row items-center gap-4">
              <Button variant="ghost" size="icon" onPress={() => setViewState('list')}>
                <Text className="text-lg">←</Text>
              </Button>
              <Text className="text-xl font-bold flex-1" numberOfLines={1}>{activeTranscript.title}</Text>
            </View>

            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {activeTranscript.status === 'PROCESSING' ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" />
                    <Text className="text-muted-foreground mt-2">Processing audio...</Text>
                  </View>
                ) : (
                  <Text>{activeTranscript.transcript_text || 'No transcript available.'}</Text>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>AI Notes</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isGeneratingNotes || activeTranscript.status !== 'COMPLETED'}
                  onPress={handleGenerateNotes}
                >
                  {isGeneratingNotes ? <ActivityIndicator color="#fff" size="small" /> : <Text>Generate</Text>}
                </Button>
              </CardHeader>
              <CardContent>
                {activeTranscript.ai_notes ? (
                  <Text>{activeTranscript.ai_notes}</Text>
                ) : (
                  <Text className="text-muted-foreground italic">No notes generated yet.</Text>
                )}
              </CardContent>
            </Card>

          </View>
        )}

      </ScrollView>
    </Screen>
  );
}
