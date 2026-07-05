import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQuizService } from '@/hooks/useQuizService';
import type { QuizSession, QuizGenerateOptions, QuizAnswerPayload } from '@freshr/shared';
import { Header } from '@/components/notebook/header';
import { BottomNav } from '@/components/notebook/bottomNav';
import { GenerateQuizModal } from '@/components/quiz/GenerateQuizModal';
import { QuizTakingScreen } from '@/components/quiz/QuizTakingScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';

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

  // Generate State
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
      console.error('Failed to generate quiz', err);
      Alert.alert('Error', err?.message || 'Failed to generate quiz.');
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
      <Header title="Notebook Title" />
      <ScrollView contentContainerClassName="p-4 gap-6">
        <View className="gap-4">
          <View className="flex-row items-center justify-between px-2">
            <Text variant="h3">QUIZ</Text>
            <Button onPress={() => setIsGenerateModalVisible(true)} size="icon" variant="outline">
              <Text>+</Text>
            </Button>
          </View>

          {quizzes.length === 0 ? (
            <Text className="py-10 text-center text-muted-foreground">No quizzes yet.</Text>
          ) : (
            quizzes.map((q) => (
              <Card key={q.id}>
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
                <CardFooter>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onPress={() => handleSelectQuiz(q)}>
                    <Text>{q.status === 'COMPLETED' ? 'Review' : 'Continue'}</Text>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <View className="w-full items-center gap-2 pb-8 pt-4">
        <Button onPress={() => setIsGenerateModalVisible(true)} size="lg">
          <Text>+ New Quiz</Text>
        </Button>
        <BottomNav />
      </View>

      <GenerateQuizModal
        visible={isGenerateModalVisible}
        onClose={() => setIsGenerateModalVisible(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        notebookId={notebookId}
      />
    </Screen>
  );
}
