import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChatService } from '@/hooks/useChatService';
import { useNotebookService } from '@/hooks/useNotebookService';
import type { ChatSession, ChatMessage } from '@freshr/shared';
import { ArrowUp, MessageCirclePlus, Info } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { Icon } from '@/components/ui/icon';

export default function ChatScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const chatService = useChatService();
  const { isDarkColorScheme } = useColorScheme();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const notebookService = useNotebookService();
  const [isArchived, setIsArchived] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');

  const refreshNotebook = async () => {
    if (!notebookId) return;
    try {
      const nb = await notebookService.getNotebook(notebookId);
      setIsArchived(nb?.is_archived ?? false);
      setNotebookTitle(nb?.title ?? 'Chat');
    } catch (err) {
      console.error('Failed to refresh notebook:', err);
    }
  };

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function loadChat() {
      if (!notebookId) return;
      try {
        const sessions = await chatService.listChatSessions(notebookId);
        let currentSession = sessions[0];

        if (!currentSession) {
          currentSession = await chatService.createChatSession(notebookId, 'New Chat');
        }
        setSession(currentSession);

        const msgs = await chatService.getChatSessionMessages(currentSession.id);
        setMessages(msgs.sort((a, b) => a.order_index - b.order_index));

        const nb = await notebookService.getNotebook(notebookId);
        setIsArchived(nb?.is_archived ?? false);
        setNotebookTitle(nb?.title ?? 'Chat');
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChat();
  }, [notebookId, chatService, notebookService]);

  const handleSend = async () => {
    if (!inputText.trim() || !session || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);
    setStreamingText('');

    try {
      // Create user message
      const newMsg = await chatService.createChatSessionMessage(session.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);

      // Stream AI reply
      let currentStream = '';
      await chatService.streamChatReply(session.id, (chunk) => {
        currentStream += chunk;
        setStreamingText(currentStream);
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      // Re-fetch messages to get the finalized AI message from DB with proper ID
      const msgs = await chatService.getChatSessionMessages(session.id);
      setMessages(msgs.sort((a, b) => a.order_index - b.order_index));
      setStreamingText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        className={`mb-4 max-w-[85%] rounded-2xl p-4 ${isUser ? 'self-end bg-primary' : 'self-start bg-muted'}`}>
        {isUser ? (
          <Text className="text-primary-foreground">{item.content}</Text>
        ) : (
          <Markdown style={{ body: { color: isDarkColorScheme ? '#fff' : '#000' } }}>
            {item.content}
          </Markdown>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <Header title={notebookTitle} actualId={notebookId} onNotebookUpdate={refreshNotebook} />
      <ArchiveBanner isArchived={isArchived} />
      <View className="flex w-full flex-row items-center justify-between px-5 pt-4">
        <Text variant="h3">CHAT</Text>
        <Button variant="outline" size="icon">
          <Icon as={MessageCirclePlus} />
        </Button>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="flex-1 px-4">
          {isLoading ? (
            // Use skeleton component here not activity indicator
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerClassName="py-4"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListFooterComponent={
                streamingText ? (
                  <View className="mb-4 max-w-[85%] self-start rounded-2xl bg-muted p-4">
                    <Markdown style={{ body: { color: isDarkColorScheme ? '#fff' : '#000' } }}>
                      {streamingText}
                    </Markdown>
                  </View>
                ) : null
              }
            />
          )}
        </View>

        <View className="flex-row items-end gap-2 border-t border-border bg-background p-4">
          <View className="flex-1">
            <Input
              placeholder={
                isArchived
                  ? 'Chat is disabled for archived notebooks.'
                  : 'Ask anything about your notebook...'
              }
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isArchived}
              className="max-h-32 min-h-[44px] rounded-2xl"
            />
          </View>
          <Button
            size="icon"
            className="h-11 w-11 rounded-full"
            onPress={handleSend}
            disabled={!inputText.trim() || isSending || isArchived}>
            {isSending && !streamingText ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ArrowUp color="#fff" size={20} />
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
      <View className="w-full items-center pb-8 pt-4">
        <BottomNav />
      </View>
    </Screen>
  );
}
