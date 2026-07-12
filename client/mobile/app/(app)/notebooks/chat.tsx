import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChatService } from '@/hooks/useChatService';
import { useNotebookService } from '@/hooks/useNotebookService';
import type { ChatSession, ChatMessage } from '@freshr/shared';
import { ArrowUp, MessageCirclePlus, History } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { Icon } from '@/components/ui/icon';
import { SessionHistorySheet } from '@/components/chat/sessionHistorySheet';

export default function ChatScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const chatService = useChatService();
  const { isDarkColorScheme } = useColorScheme();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const notebookService = useNotebookService();
  const [isArchived, setIsArchived] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');

  // ─── Typewriter streaming ─────────────────────────────────────────
  // SSE chunks arrive in uneven bursts; rendering them directly looks jumpy.
  // Chunks accumulate in a buffer and a ~30fps ticker reveals characters at a
  // rate that scales with the backlog — smooth glide normally, quick catch-up
  // when a long reply streams in faster than the glide rate.
  const [displayedText, setDisplayedText] = useState('');
  const streamBufferRef = useRef('');
  const displayedLenRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicker = () => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const startTicker = () => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(() => {
      const target = streamBufferRef.current;
      if (displayedLenRef.current >= target.length) return;
      const backlog = target.length - displayedLenRef.current;
      const step = Math.max(2, Math.ceil(backlog / 15));
      displayedLenRef.current = Math.min(target.length, displayedLenRef.current + step);
      setDisplayedText(target.slice(0, displayedLenRef.current));
    }, 33);
  };

  const resetStream = () => {
    stopTicker();
    streamBufferRef.current = '';
    displayedLenRef.current = 0;
    setDisplayedText('');
  };

  // Stop the ticker if the user leaves mid-stream.
  useEffect(() => stopTicker, []);

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
        const existing = await chatService.listChatSessions(notebookId);
        let currentSession = existing[0];

        if (!currentSession) {
          currentSession = await chatService.createChatSession(notebookId, 'New Chat');
          setSessions([currentSession]);
        } else {
          setSessions(existing);
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
    const isFirstMessage = messages.length === 0;
    setInputText('');
    setIsSending(true);
    resetStream();

    try {
      // Create user message
      const newMsg = await chatService.createChatSessionMessage(session.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);

      if (isFirstMessage) {
        const derivedTitle = textToSend.slice(0, 50);
        const sid = session.id;
        chatService
          .updateChatSession(sid, derivedTitle)
          .then(() => {
            setSession((cur) => (cur?.id === sid ? { ...cur, title: derivedTitle } : cur));
            setSessions((prev) =>
              prev.map((s) => (s.id === sid ? { ...s, title: derivedTitle } : s))
            );
          })
          .catch((err) => console.warn('Failed to set chat title', err));
      }

      // Stream AI reply into the buffer; the ticker reveals it smoothly.
      startTicker();
      await chatService.streamChatReply(session.id, (chunk) => {
        streamBufferRef.current += chunk;
      });

      // Let the typewriter finish revealing the tail before swapping in the
      // finalized message. Bails if the ticker was stopped (screen unmounted).
      await new Promise<void>((resolve) => {
        const wait = setInterval(() => {
          if (!tickerRef.current || displayedLenRef.current >= streamBufferRef.current.length) {
            clearInterval(wait);
            resolve();
          }
        }, 50);
      });

      // Re-fetch messages to get the finalized AI message from DB with proper ID
      const msgs = await chatService.getChatSessionMessages(session.id);
      setMessages(msgs.sort((a, b) => a.order_index - b.order_index));
      resetStream();
    } catch (err) {
      console.error('Failed to send message:', err);
      resetStream();
      Alert.alert('Error', 'Failed to get a reply. Please try again.');
    } finally {
      stopTicker();
      setIsSending(false);
    }
  };

  // ─── Sessions ─────────────────────────────────────────────────────

  const handleNewChat = async () => {
    if (isSending || !notebookId) return;
    // Already on a blank chat — reuse it instead of orphaning another.
    if (messages.length === 0) {
      setHistoryVisible(false);
      return;
    }
    try {
      const newSession = await chatService.createChatSession(notebookId, 'New Chat');
      setSessions((prev) => [newSession, ...prev]);
      setSession(newSession);
      setMessages([]);
      resetStream();
    } catch (err) {
      console.error('Failed to start new chat:', err);
      Alert.alert('Error', 'Failed to start a new chat.');
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (isSending || sessionId === session?.id) return;
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;
    setSession(target);
    resetStream();
    setIsLoading(true);
    try {
      const msgs = await chatService.getChatSessionMessages(sessionId);
      setMessages(msgs.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      console.error('Failed to load chat session:', err);
      Alert.alert('Error', 'Failed to load that chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameSession = async (sessionId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    // Optimistic — reflect immediately, roll back on failure.
    const prevTitle = sessions.find((s) => s.id === sessionId)?.title;
    setSession((cur) => (cur?.id === sessionId ? { ...cur, title: trimmed } : cur));
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s)));
    try {
      await chatService.updateChatSession(sessionId, trimmed);
    } catch (err) {
      console.error('Failed to rename chat:', err);
      setSession((cur) => (cur?.id === sessionId ? { ...cur, title: prevTitle ?? '' } : cur));
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: prevTitle ?? '' } : s))
      );
      Alert.alert('Error', 'Failed to rename chat.');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('Delete chat', 'Delete this chat and all its messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatService.deleteChatSession(sessionId);
            const remaining = sessions.filter((s) => s.id !== sessionId);
            setSessions(remaining);

            // If we deleted the active chat, switch to the next one (or a fresh one).
            if (sessionId === session?.id) {
              if (remaining[0]) {
                await handleSelectSession(remaining[0].id);
              } else {
                const fresh = await chatService.createChatSession(notebookId, 'New Chat');
                setSessions([fresh]);
                setSession(fresh);
                setMessages([]);
                resetStream();
              }
            }
          } catch (err) {
            console.error('Failed to delete chat session:', err);
            Alert.alert('Error', 'Failed to delete that chat.');
          }
        },
      },
    ]);
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

  // New sessions are titled "New Chat" until the first message seeds a real one.
  const rawTitle = session?.title?.trim();
  const activeSessionTitle =
    rawTitle && rawTitle.toLowerCase() !== 'new chat' ? rawTitle : 'New Chat';

  return (
    <Screen>
      <Header title={notebookTitle} actualId={notebookId} onNotebookUpdate={refreshNotebook} />
      <ArchiveBanner isArchived={isArchived} />
      <View className="flex w-full flex-row items-center justify-between px-5 pt-4">
        <View className="mr-3 flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chat
          </Text>
          <Text variant="h3" numberOfLines={1}>
            {activeSessionTitle}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onPress={() => setHistoryVisible(true)}
            accessibilityLabel="Chat history">
            <Icon as={History} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onPress={handleNewChat}
            disabled={isSending}
            accessibilityLabel="New chat">
            <Icon as={MessageCirclePlus} />
          </Button>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 py-4"
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
              keyExtractor={(item, index) => item.id ?? `msg-${index}`}
              renderItem={renderMessage}
              contentContainerClassName="py-4"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListFooterComponent={
                isSending || displayedText ? (
                  <View className="mb-4 max-w-[85%] self-start rounded-2xl bg-muted p-4">
                    {displayedText ? (
                      <Markdown style={{ body: { color: isDarkColorScheme ? '#fff' : '#000' } }}>
                        {displayedText}
                      </Markdown>
                    ) : (
                      <ThinkingIndicator />
                    )}
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
            {isSending && !displayedText ? (
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

      <SessionHistorySheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        sessions={sessions}
        activeSessionId={session?.id ?? null}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        onDelete={handleDeleteSession}
        onRename={handleRenameSession}
      />
    </Screen>
  );
}

/** Pulsing "Thinking…" shown in the reply bubble until the first token arrives. */
function ThinkingIndicator() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Text className="italic text-muted-foreground">Thinking…</Text>
    </Animated.View>
  );
}
