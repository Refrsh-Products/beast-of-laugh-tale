import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChatService } from '@/hooks/useChatService';
import { useNotebookService } from '@/hooks/useNotebookService';
import type { ChatSession, ChatMessage } from '@freshr/shared';
import { ArrowUp, MessageCirclePlus, History, Sparkles } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { Icon } from '@/components/ui/icon';
import { SessionHistorySheet } from '@/components/chat/sessionHistorySheet';
import { THEME } from '@/lib/theme';

/** Tap-to-fill starters shown on an empty chat. */
const SUGGESTIONS = [
  'Summarize the key ideas from my notes',
  'Create a study plan for this material',
  'Explain the hardest concept simply',
];

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

  // Comfortable reading typography for AI replies, themed from lib/theme.
  const { markdownStyles, markdownRules } = useMemo(() => {
    const t = THEME[isDarkColorScheme ? 'dark' : 'light'];
    return { markdownStyles: buildMarkdownStyles(t), markdownRules: buildMarkdownRules(t) };
  }, [isDarkColorScheme]);

  // Gemini/Claude/ChatGPT layout: the user's message sits in a compact bubble on
  // the right; AI replies render full-width with no bubble — plain text on the
  // background reads best.
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'user') {
      return (
        <View className="mb-6 max-w-[80%] self-end rounded-3xl rounded-br-lg bg-primary px-4 py-3">
          <Text className="text-base leading-6 text-primary-foreground">{item.content}</Text>
        </View>
      );
    }
    return (
      <View className="mb-6 w-full self-start">
        <Markdown style={markdownStyles} rules={markdownRules}>
          {item.content}
        </Markdown>
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
      {/* Slim session bar: current chat name + quiet icon actions. */}
      <View className="w-full flex-row items-center justify-between p-4 pb-1 pt-2">
        <View className="mr-3 flex-1">
          <Text numberOfLines={1} className="text-base font-semibold">
            {activeSessionTitle}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Button
            variant="ghost"
            size="icon"
            onPress={() => setHistoryVisible(true)}
            accessibilityLabel="Chat history">
            <Icon as={History} size={20} className="text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onPress={handleNewChat}
            disabled={isSending}
            accessibilityLabel="New chat">
            <Icon as={MessageCirclePlus} size={20} className="text-muted-foreground" />
          </Button>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="flex-1 px-5">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item.id ?? `msg-${index}`}
              renderItem={renderMessage}
              contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                isSending ? null : (
                  <View className="flex-1 items-center justify-center gap-5 pb-12">
                    <View className="size-14 items-center justify-center rounded-full bg-muted">
                      <Icon as={Sparkles} size={26} className="text-muted-foreground" />
                    </View>
                    <View className="items-center gap-1.5 px-4">
                      <Text numberOfLines={2} className="text-center text-xl font-semibold">
                        Ask about {notebookTitle || 'your notebook'}
                      </Text>
                      <Text className="text-center text-sm leading-5 text-muted-foreground">
                        Answers are grounded in the files uploaded to this notebook.
                      </Text>
                    </View>
                    {!isArchived && (
                      <View className="w-full gap-2 pt-1">
                        {SUGGESTIONS.map((suggestion) => (
                          <Pressable
                            key={suggestion}
                            onPress={() => setInputText(suggestion)}
                            className="rounded-2xl border border-border bg-card px-4 py-3 active:opacity-70">
                            <Text className="text-sm">{suggestion}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )
              }
              ListFooterComponent={
                isSending || displayedText ? (
                  <View className="mb-6 w-full self-start">
                    {displayedText ? (
                      <Markdown style={markdownStyles} rules={markdownRules}>
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

        {/* Floating pill composer — no divider, blends into the background. */}
        <View className="flex-row items-center gap-2 px-4 py-1">
          <Input
            placeholder={isArchived ? 'Chat is disabled for archived notebooks.' : 'Ask anything…'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isArchived}
            className="max-h-32 min-h-12 flex-1 rounded-lg border bg-muted px-5 py-1 text-base leading-6 shadow-none dark:bg-muted"
          />
          <Button
            size="icon"
            className="h-12 w-12 rounded-full"
            onPress={handleSend}
            disabled={!inputText.trim() || isSending || isArchived}
            accessibilityLabel="Send message">
            {isSending && !displayedText ? (
              <ActivityIndicator
                size="small"
                color={THEME[isDarkColorScheme ? 'dark' : 'light'].primaryForeground}
              />
            ) : (
              <Icon as={ArrowUp} size={29} className="text-primary-foreground" />
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

/** Pulsing "Thinking…" shown where the reply will appear, until the first token arrives. */
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
      <View className="flex-row items-center gap-2.5">
        <View className="size-2.5 rounded-full bg-foreground" />
        <Text className="text-base text-muted-foreground">Thinking…</Text>
      </View>
    </Animated.View>
  );
}

/**
 * Typography for AI replies (react-native-markdown-display rule styles), themed
 * from lib/theme so it tracks light/dark. Tuned for comfortable long-form
 * reading: 16px body on a 25px line, breathing room between blocks, quiet
 * borders instead of filled boxes.
 */
function buildMarkdownStyles(t: (typeof THEME)['light']) {
  const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });
  return {
    body: { color: t.foreground, fontSize: 16, lineHeight: 25 },
    paragraph: { marginTop: 0, marginBottom: 12 },
    heading1: {
      fontSize: 22,
      fontWeight: '700' as const,
      marginTop: 8,
      marginBottom: 8,
      lineHeight: 30,
    },
    heading2: {
      fontSize: 19,
      fontWeight: '700' as const,
      marginTop: 8,
      marginBottom: 6,
      lineHeight: 26,
    },
    heading3: {
      fontSize: 17,
      fontWeight: '600' as const,
      marginTop: 6,
      marginBottom: 4,
      lineHeight: 24,
    },
    strong: { fontWeight: '700' as const },
    link: { color: t.foreground, textDecorationLine: 'underline' as const },
    code_inline: {
      backgroundColor: t.muted,
      color: t.foreground,
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 1,
      fontSize: 14,
      fontFamily: mono,
    },
    code_block: {
      backgroundColor: t.muted,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: mono,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: t.muted,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: mono,
      marginVertical: 8,
    },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftWidth: 3,
      borderLeftColor: t.border,
      paddingLeft: 12,
      marginLeft: 0,
      marginVertical: 8,
    },
    bullet_list: { marginBottom: 12 },
    ordered_list: { marginBottom: 12 },
    list_item: { marginBottom: 6 },
    hr: { backgroundColor: t.border, height: 1, marginVertical: 16 },
    // Fixed-width cells (no flex) keep columns aligned and let the row grow past
    // the screen, so the `table` rule below can scroll it horizontally instead
    // of cramming/wrapping text. See buildMarkdownRules.
    table: { borderWidth: 0 },
    tr: { borderBottomWidth: 1, borderColor: t.border, flexDirection: 'row' as const },
    th: {
      flex: 0,
      width: 150,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRightWidth: 1,
      borderColor: t.border,
      backgroundColor: t.muted,
    },
    td: {
      flex: 0,
      width: 150,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRightWidth: 1,
      borderColor: t.border,
    },
  };
}

/**
 * Custom markdown render rules. Wraps tables in a horizontal ScrollView so wide
 * tables scroll sideways (cells keep their full width and complete their words)
 * rather than squeezing every column onto the screen and wrapping text.
 */
function buildMarkdownRules(t: (typeof THEME)['light']) {
  return {
    table: (node: { key: string }, children: React.ReactNode) => (
      <ScrollView
        key={node.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 8 }}
        contentContainerStyle={{ flexGrow: 0 }}>
        <View
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
          {children}
        </View>
      </ScrollView>
    ),
  };
}
