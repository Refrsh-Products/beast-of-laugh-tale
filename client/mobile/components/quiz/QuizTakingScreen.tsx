import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { Flag, LayoutGrid, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { QuizNavigatorGrid } from './QuizNavigatorGrid';
import type { QuizSession } from '@freshr/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The three bottom-bar buttons share a shape; only the fill differs.
const NAV_BUTTON = 'flex-1 items-center justify-center rounded-md py-3.5';
const NAV_BUTTON_OUTLINE = 'border-input bg-field border';

interface QuizTakingScreenProps {
  quiz: QuizSession;
  onComplete: (
    userAnswers: (number | null)[],
    timeTaken: number,
    flaggedQuestions: number[],
  ) => void;
  onExit: () => void;
}

export function QuizTakingScreen({
  quiz,
  onComplete,
  onExit,
}: QuizTakingScreenProps) {
  const insets = useSafeAreaInsets();
  const timed = quiz.quiz_type === 'TIMED' || quiz.quiz_type === 'timed';
  const totalSeconds = timed && quiz.time_limit ? quiz.time_limit : 0;
  const isPractice = !timed;
  const numQuestions = quiz.num_questions ?? 0;
  const questions = quiz.questions ?? [];

  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    Array(numQuestions).fill(null),
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);

  // Reset hint panel when navigating to a different question
  useEffect(() => {
    setHintOpen(false);
  }, [currentQ]);

  // Countdown timer (timed quizzes)
  useEffect(() => {
    if (!timed || totalSeconds === 0) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFrozen(true);
          // Time's up — auto-submit
          Alert.alert("Time's Up!", 'Your quiz has been submitted automatically.', [
            { text: 'See Results', onPress: () => onComplete(userAnswers, totalSeconds, flaggedQuestions) },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timed, totalSeconds, frozen]);

  // Count-up timer (practice quizzes)
  useEffect(() => {
    if (timed) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timed, frozen]);

  function formatTimer(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const progressPercent = numQuestions > 0 ? (answeredCount / numQuestions) * 100 : 0;
  const unansweredCount = numQuestions - answeredCount;
  const isFlagged = flaggedQuestions.includes(currentQ);

  function toggleFlag() {
    setFlaggedQuestions((prev) =>
      prev.includes(currentQ)
        ? prev.filter((i) => i !== currentQ)
        : [...prev, currentQ],
    );
  }

  function selectAnswer(optionIndex: number) {
    if (frozen) return;
    
    const isDeselecting = userAnswers[currentQ] === optionIndex;

    setUserAnswers((prev) => {
      const next = [...prev];
      // Toggle: if already selected, deselect
      next[currentQ] = isDeselecting ? null : optionIndex;
      return next;
    });

    // Auto-advance if we just selected an answer (not deselected) and it's not the last question
    if (!isDeselecting && currentQ < numQuestions - 1) {
      setTimeout(() => {
        setCurrentQ((q) => Math.min(q + 1, numQuestions - 1));
      }, 350); // Small delay to show selection animation
    }
  }

  function handleSubmitClick() {
    if (unansweredCount > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Submit anyway?`,
        [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  }

  function doSubmit() {
    setFrozen(true);
    const timeTaken = timed ? totalSeconds - secondsRemaining : secondsElapsed;
    onComplete(userAnswers, timeTaken, flaggedQuestions);
  }

  function handleExit() {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ],
    );
  }

  const question = questions[currentQ];
  const displayChoices =
    question?.choices?.length > 0 ? question.choices : ['True', 'False'];

  if (!question) return null;

  const quizTitle = quiz.title || quiz.topic || 'Quiz';

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text
          className="text-foreground mr-3 flex-1 text-lg font-extrabold tracking-widest"
          numberOfLines={1}>
          {quizTitle.toUpperCase()}
        </Text>
        <Pressable onPress={handleExit} className="flex-row items-center gap-1">
          <Icon as={X} size={14} className="text-destructive" />
          <Text className="text-destructive text-[13px] font-semibold">Exit Quiz</Text>
        </Pressable>
      </View>

      {/* Question counter + progress */}
      <View className="px-5 pb-3">
        <Text className="text-muted-foreground mb-1 text-[13px] font-medium">
          Question {currentQ + 1} of {numQuestions}
        </Text>
        <Progress value={progressPercent} className="h-1.5 mt-1" />
      </View>

      {/* Scrollable question area */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2 pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Question card */}
        <View className="border-border bg-card mb-4 rounded-lg border p-5">
          <Text className="text-foreground mb-2.5 text-[15px] font-bold">
            Question {currentQ + 1}
          </Text>
          <Text className="text-foreground text-sm leading-[22px]">{question.question_text}</Text>
        </View>

        {/* Answer options */}
        <View className="mb-4 gap-2">
          {displayChoices.map((opt: string, oi: number) => {
            const selected = userAnswers[currentQ] === oi;
            return (
              <Pressable
                key={oi}
                className={cn(
                  'border-border bg-field flex-row items-center gap-3.5 rounded-md border px-4 py-3.5',
                  selected && 'border-primary bg-accent border-2'
                )}
                onPress={() => selectAnswer(oi)}>
                <View
                  className={cn(
                    'border-input size-[22px] items-center justify-center rounded-full border-[1.5px]',
                    selected && 'border-primary'
                  )}>
                  {selected && <View className="bg-primary size-3 rounded-full" />}
                </View>
                <Text
                  className={cn(
                    'text-foreground flex-1 text-sm leading-5',
                    selected && 'font-semibold'
                  )}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hint accordion (practice mode) */}
        {isPractice && question.explanation && (
          <Pressable
            className="border-border bg-card mb-2 flex-row items-center justify-between rounded-md border px-4 py-3.5"
            onPress={() => setHintOpen(!hintOpen)}>
            <Text className="text-foreground text-sm font-semibold">Hint</Text>
            <Icon
              as={hintOpen ? ChevronUp : ChevronDown}
              size={18}
              className="text-muted-foreground"
            />
          </Pressable>
        )}
        {hintOpen && question.explanation && (
          <View className="border-border bg-muted mb-4 rounded-md border px-4 py-3.5">
            <Text className="text-foreground text-[13px] leading-5">{question.explanation}</Text>
          </View>
        )}

        {/* Flag + Navigator row */}
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable onPress={toggleFlag} className="p-2">
            <Icon
              as={Flag}
              size={18}
              className={isFlagged ? 'text-warning' : 'text-muted-foreground'}
            />
          </Pressable>

          <Pressable
            className="border-input bg-muted size-11 items-center justify-center rounded-full border"
            onPress={() => setShowNavigator(true)}>
            <Icon as={LayoutGrid} size={22} className="text-foreground" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View
        className="border-border bg-card flex-row justify-between gap-2.5 border-t px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Pressable
          className={cn(NAV_BUTTON, NAV_BUTTON_OUTLINE, currentQ === 0 && 'opacity-35')}
          onPress={() => setCurrentQ((q) => q - 1)}
          disabled={currentQ === 0}>
          <Text className="text-foreground text-sm font-semibold">Previous</Text>
        </Pressable>

        <Pressable
          className={cn(NAV_BUTTON, NAV_BUTTON_OUTLINE)}
          onPress={handleSubmitClick}>
          <Text className="text-foreground text-sm font-semibold">Submit</Text>
        </Pressable>

        <Pressable
          className={cn(
            NAV_BUTTON,
            'bg-primary',
            currentQ === numQuestions - 1 && 'opacity-35'
          )}
          onPress={() => setCurrentQ((q) => q + 1)}
          disabled={currentQ === numQuestions - 1}>
          <Text className="text-primary-foreground text-sm font-semibold">Next</Text>
        </Pressable>
      </View>

      {/* Navigator grid overlay */}
      <QuizNavigatorGrid
        visible={showNavigator}
        onClose={() => setShowNavigator(false)}
        totalQuestions={numQuestions}
        currentIndex={currentQ}
        userAnswers={userAnswers}
        flaggedQuestions={flaggedQuestions}
        onNavigate={setCurrentQ}
      />
    </View>
  );
}
