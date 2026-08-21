import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Plus, SquareCheckBig, Trash2, X } from 'lucide-react-native';
import { Screen } from '@/components/ui/screen';
import { ArchiveBanner } from '@/components/notebook/archiveBanner';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import { getApiErrorCode, DAILY_QUIZ_QUOTA_EXCEEDED } from '@/lib/apiError';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useQuizService } from '@/hooks/useQuizService';
import { useNotebookService } from '@/hooks/useNotebookService';
import type { QuizSession, QuizGenerateOptions, QuizAnswerPayload } from '@freshr/shared';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { GenerateQuizModal } from '@/components/quiz/GenerateQuizModal';
import { QuizTakingScreen } from '@/components/quiz/QuizTakingScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';
import { DeleteQuizDialog } from '@/components/quiz/DeleteQuizDialog';

type ViewState = 'list' | 'take' | 'review';

export default function QuizScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const router = useRouter();
  const quizService = useQuizService();

  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSession[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);
  const [lastTimeTaken, setLastTimeTaken] = useState<number | undefined>(undefined);
  const notebookService = useNotebookService();
  const [isArchived, setIsArchived] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');

  // Generate State
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // ─── Selection / delete state ─────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  useEffect(() => {
    if (viewState === 'list' && notebookId) {
      loadQuizzes();
    }
  }, [viewState, notebookId]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await quizService.listQuizSessionsByNotebook(notebookId);
      setQuizzes(data);

      const nb = await notebookService.getNotebook(notebookId);
      setIsArchived(nb?.is_archived ?? false);
      setNotebookTitle(nb?.title ?? 'Quiz');
    } catch (err) {
      console.error('Failed to load quizzes', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Generate quiz ──
  const handleGenerate = async (options: QuizGenerateOptions) => {
    if (!notebookId) return;
    setIsGenerating(true);

    const isAllTopics = options.topics.length === 0 && !options.prompt;
    const payload = {
      notebook: notebookId,
      topic: isAllTopics ? 'All Topics' : options.topics.map((t) => t.name).join(', '),
      topic_id: isAllTopics ? undefined : options.topics[0]?.id,
      difficulty: options.difficulty,
      quiz_type: options.quizType,
      time_limit: options.timeLimit ? options.timeLimit * 60 : undefined,
      num_questions: options.questionCount,
    };

    try {
      const newQuiz = await quizService.createQuizSession(payload);
      setActiveQuiz(newQuiz);
      setViewState('take');
      setIsGenerateModalVisible(false);
    } catch (err: any) {
      if (getApiErrorCode(err) === DAILY_QUIZ_QUOTA_EXCEEDED) {
        setIsGenerateModalVisible(false);
        Alert.alert(
          'Daily quiz limit reached',
          "You've used all your quizzes for today on the free plan. Upgrade for more daily quizzes — or come back tomorrow.",
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => setShowUpgradeSheet(true) },
          ]
        );
      } else {
        console.error('Failed to generate quiz', err);
        Alert.alert('Error', err?.message || 'Failed to generate quiz.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Quiz completed ──────
  const handleQuizComplete = async (
    userAnswers: (number | null)[],
    timeTaken: number,
    _flaggedQuestions: number[]
  ) => {
    if (!activeQuiz) return;
    setIsLoading(true);

    const questions = activeQuiz.questions ?? [];
    const answers: QuizAnswerPayload[] = questions
      .map((q, i) => {
        const selectedIndex = userAnswers[i];
        if (selectedIndex === null) return null;
        const resolvedChoices = q.choices.length > 0 ? q.choices : ['True', 'False'];
        return {
          question_id: q.id,
          user_answer: resolvedChoices[selectedIndex],
        };
      })
      .filter((a): a is QuizAnswerPayload => a !== null);

    try {
      const completedQuiz = await quizService.submitQuiz(activeQuiz.id!, answers);
      setActiveQuiz(completedQuiz);
      setLastTimeTaken(timeTaken);
      setViewState('review');
    } catch (err: any) {
      console.error('Failed to submit quiz', err);
      Alert.alert('Error', 'Failed to submit quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Exit quiz-taking ─────────────────────────────────────────────
  const handleQuizExit = async () => {
    setActiveQuiz(null);
    setViewState('list');
  };

  // ─── Retake quiz ──────────────────────────────────────────────────
  const handleRetake = async () => {
    if (!activeQuiz?.id) return;
    setIsLoading(true);
    try {
      const newQuiz = await quizService.retakePastQuiz(activeQuiz.id);
      setActiveQuiz(newQuiz);
      setViewState('take');
    } catch (err: any) {
      console.error('Failed to retake quiz', err);
      Alert.alert('Error', 'Failed to generate retake quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Take to Chat ─────────────────────────────────────────────────
  const handleTakeToChat = (questionText: string, options: string[], topic: string) => {
    const formatted = [
      `I'm studying ${topic} and I need help with this question:`,
      '',
      `"${questionText}"`,
      '',
      'Options were:',
      ...options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`),
    ].join('\n');

    // Navigate to chat with the formatted message
    if (notebookId) {
      router.replace({
        pathname: '/notebooks/chat',
        params: {
          notebookId,
          prefillMessage: formatted,
        },
      });
    }
  };

  // ─── Select Quiz from List ────────────────────────────────────────
  const handleSelectQuiz = async (quiz: QuizSession) => {
    if (!quiz.id) return;
    setIsLoading(true);
    try {
      // Fetch full quiz session to get the questions array
      const fullQuiz = await quizService.fetchQuizSession(quiz.id);
      setActiveQuiz(fullQuiz);
      if (fullQuiz.status === 'COMPLETED') {
        setViewState('review');
      } else {
        setViewState('take');
      }
    } catch (err: any) {
      console.error('Failed to fetch full quiz session', err);
      Alert.alert('Error', 'Failed to load the quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Selection helpers ────────────────────────────────────────────
  const enterSelection = (quizId: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([quizId]));
  };

  const toggleSelect = (quizId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) {
        next.delete(quizId);
      } else {
        next.add(quizId);
      }
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // ─── Delete quizzes ───────────────────────────────────────────────
  // Deletes every currently-selected quiz. On partial failure it keeps only
  // the ones that still failed selected + throws, so the dialog's "Try again"
  // retries exactly those. On total success it clears selection + refreshes.
  const performDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const results = await Promise.allSettled(ids.map((id) => quizService.deleteQuizSession(id)));

    const failedIds = ids.filter((_, i) => results[i].status === 'rejected');

    // Optimistically drop the ones that succeeded from the visible list.
    const succeededIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'));
    if (succeededIds.size > 0) {
      setQuizzes((prev) => prev.filter((q) => !q.id || !succeededIds.has(q.id)));
    }

    if (failedIds.length > 0) {
      // Narrow selection to just the failures so a retry only re-attempts those.
      setSelectedIds(new Set(failedIds));
      const n = failedIds.length;
      throw new Error(`Couldn't delete ${n} of ${ids.length} ${n === 1 ? 'quiz' : 'quizzes'}.`);
    }
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogVisible(false);
    exitSelection();
    loadQuizzes();
  };

  // ─── Quiz Taking Screen ───────────────────────────────────────────
  if (viewState === 'take' && activeQuiz) {
    return (
      <QuizTakingScreen quiz={activeQuiz} onComplete={handleQuizComplete} onExit={handleQuizExit} />
    );
  }

  // ─── Quiz Result Screen ───────────────────────────────────────────
  if (viewState === 'review' && activeQuiz) {
    return (
      <QuizResultScreen
        quiz={activeQuiz}
        onBack={() => {
          setActiveQuiz(null);
          setViewState('list');
        }}
        onRetake={handleRetake}
        onTakeToChat={handleTakeToChat}
        timeTaken={lastTimeTaken}
        isArchived={isArchived}
      />
    );
  }

  // ─── Quiz List (default) ──────────────────────────────────────────
  if (isLoading && viewState === 'list') {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1 bg-background">
      <Header title={notebookTitle} actualId={notebookId} onNotebookUpdate={loadQuizzes} />
      <ArchiveBanner isArchived={isArchived} />
      <ScrollView
        contentContainerClassName={quizzes.length === 0 ? 'flex-grow px-8 py-6' : 'p-4 gap-6'}
        showsVerticalScrollIndicator={false}>
        {quizzes.length === 0 ? (
          /* Empty state — mirrors the chat/transcription treatment. */
          <View className="flex-1 items-center justify-center gap-5 pb-12">
            <View className="size-14 items-center justify-center rounded-full bg-muted">
              <Icon as={SquareCheckBig} size={26} className="text-muted-foreground" />
            </View>
            <View className="items-center gap-1.5 px-4">
              <Text className="text-center text-xl font-semibold">No quizzes yet</Text>
              <Text className="text-center text-sm leading-5 text-muted-foreground">
                {isArchived
                  ? 'This notebook is archived. Restore it to generate quizzes from your notes.'
                  : 'Generate a quiz from your notes to find out what you actually remember.'}
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row items-center justify-between px-2">
              <Text className="text-base font-semibold">
                {selectionMode ? `${selectedIds.size} selected` : 'Quiz'}
              </Text>
              {!isArchived &&
                (selectionMode ? (
                  <View className="flex-row items-center gap-2">
                    <Button variant="ghost" size="sm" onPress={exitSelection}>
                      <Icon as={X} size={18} />
                      <Text>Cancel</Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={selectedIds.size === 0}
                      onPress={() => setIsDeleteDialogVisible(true)}>
                      <Icon as={Trash2} className="text-destructive" />
                    </Button>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Button variant="outline" size="icon" onPress={() => setSelectionMode(true)}>
                      <Icon as={Trash2} />
                    </Button>
                    <Button
                      onPress={() => setIsGenerateModalVisible(true)}
                      size="icon"
                      variant="ghost"
                      accessibilityLabel="New quiz">
                      <Icon as={Plus} size={20} className="text-muted-foreground" />
                    </Button>
                  </View>
                ))}
            </View>

            {quizzes.map((q) => {
              const selected = !!q.id && selectedIds.has(q.id);
              return (
                <Pressable
                  key={q.id}
                  onLongPress={!isArchived && q.id ? () => enterSelection(q.id!) : undefined}
                  onPress={selectionMode && q.id ? () => toggleSelect(q.id!) : undefined}
                  delayLongPress={300}
                  className={cn(
                    'flex-row items-center gap-3',
                    selectionMode && 'active:opacity-70'
                  )}>
                  {selectionMode && (
                    <View pointerEvents="none">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => {}}
                        className="h-5 w-5 rounded-sm border-muted-foreground"
                      />
                    </View>
                  )}
                  <Card className={cn('flex-1', selected && 'border-primary')}>
                    <CardHeader>
                      <CardTitle>{q.title || q.topic || 'Quiz'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-muted-foreground">Difficulty: {q.difficulty}</Text>
                      <Text className="text-muted-foreground">
                        Score:{' '}
                        {q.score !== undefined && q.score !== null
                          ? `${Math.round(q.score * 100)}%`
                          : 'Not completed'}
                      </Text>
                    </CardContent>
                    {!selectionMode && (
                      <CardFooter>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onPress={() => handleSelectQuiz(q)}
                          disabled={isArchived && q.status !== 'COMPLETED'}>
                          <Text>{q.status === 'COMPLETED' ? 'Review' : 'Continue'}</Text>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="w-full items-center gap-4 pb-8 pt-4">
        {!isArchived && (
          <Button onPress={() => setIsGenerateModalVisible(true)} variant="default">
            <Text>+ New Quiz</Text>
          </Button>
        )}
        <BottomNav />
      </View>

      <GenerateQuizModal
        visible={isGenerateModalVisible}
        onClose={() => setIsGenerateModalVisible(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        notebookId={notebookId}
      />

      <DeleteQuizDialog
        visible={isDeleteDialogVisible}
        count={selectedIds.size}
        onConfirm={performDelete}
        onSuccess={handleDeleteSuccess}
        onClose={() => setIsDeleteDialogVisible(false)}
      />

      <UpgradeSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Upgrade your plan on the web"
        body="Paid plans unlock more daily quizzes, notebooks, and storage. Upgrades are handled through your account on the web, outside the app."
      />
    </Screen>
  );
}
