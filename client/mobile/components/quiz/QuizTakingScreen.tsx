import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { Flag, LayoutGrid, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { QuizNavigatorGrid } from './QuizNavigatorGrid';
import type { QuizSession } from '@freshr/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.quizTitle} numberOfLines={1}>
          {quizTitle.toUpperCase()}
        </Text>
        <Pressable onPress={handleExit} style={styles.exitButton}>
          <Icon as={X} size={14} color="#DC2626" />
          <Text style={styles.exitText}>Exit Quiz</Text>
        </Pressable>
      </View>

      {/* Question counter + progress */}
      <View style={styles.progressSection}>
        <Text style={styles.questionCounter}>
          Question {currentQ + 1} of {numQuestions}
        </Text>
        <Progress value={progressPercent} className="h-1.5 mt-1" />
      </View>

      {/* Scrollable question area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Question card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>
            Question {currentQ + 1}
          </Text>
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>

        {/* Answer options */}
        <View style={styles.optionsList}>
          {displayChoices.map((opt: string, oi: number) => {
            const selected = userAnswers[currentQ] === oi;
            return (
              <Pressable
                key={oi}
                style={[
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                ]}
                onPress={() => selectAnswer(oi)}>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hint accordion (practice mode) */}
        {isPractice && question.explanation && (
          <Pressable
            style={styles.hintToggle}
            onPress={() => setHintOpen(!hintOpen)}>
            <Text style={styles.hintToggleText}>Hint</Text>
            <Icon
              as={hintOpen ? ChevronUp : ChevronDown}
              size={18}
              className="text-muted-foreground"
            />
          </Pressable>
        )}
        {hintOpen && question.explanation && (
          <View style={styles.hintContent}>
            <Text style={styles.hintText}>{question.explanation}</Text>
          </View>
        )}

        {/* Flag + Navigator row */}
        <View style={styles.actionRow}>
          <Pressable onPress={toggleFlag} style={styles.flagButton}>
            <Icon
              as={Flag}
              size={18}
              color={isFlagged ? '#18181B' : '#A1A1AA'}
            />
          </Pressable>

          <Pressable
            style={styles.navigatorButton}
            onPress={() => setShowNavigator(true)}>
            <Icon as={LayoutGrid} size={22} className="text-foreground" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.navButton, styles.navButtonOutline, currentQ === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentQ((q) => q - 1)}
          disabled={currentQ === 0}>
          <Text style={[styles.navButtonText, currentQ === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, styles.navButtonOutline]}
          onPress={handleSubmitClick}>
          <Text style={styles.navButtonText}>Submit</Text>
        </Pressable>

        <Pressable
          style={[
            styles.navButton,
            styles.navButtonFilled,
            currentQ === numQuestions - 1 && styles.navButtonDisabled,
          ]}
          onPress={() => setCurrentQ((q) => q + 1)}
          disabled={currentQ === numQuestions - 1}>
          <Text
            style={[
              styles.navButtonFilledText,
              currentQ === numQuestions - 1 && styles.navButtonTextDisabled,
            ]}>
            Next
          </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 1,
    flex: 1,
    marginRight: 12,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
    marginBottom: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    color: '#3F3F46',
    lineHeight: 22,
  },
  optionsList: {
    gap: 8,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  optionRowSelected: {
    borderColor: '#18181B',
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D4D4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#18181B',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#18181B',
  },
  optionText: {
    fontSize: 14,
    color: '#3F3F46',
    flex: 1,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#18181B',
    fontWeight: '600',
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  hintToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  hintContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 13,
    color: '#3F3F46',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  flagButton: {
    padding: 8,
  },
  navigatorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  navButtonOutline: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
  },
  navButtonFilled: {
    backgroundColor: '#18181B',
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  navButtonTextDisabled: {
    color: '#A1A1AA',
  },
  navButtonFilledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
