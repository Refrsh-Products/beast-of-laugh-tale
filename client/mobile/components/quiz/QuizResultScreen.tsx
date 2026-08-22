import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, ChevronDown, ChevronUp, EllipsisVertical } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Repeated shapes, named once so a pill in one branch can't drift from another.
const BADGE = 'bg-primary min-w-[100px] items-center rounded-md px-5 py-2.5';
const BADGE_LABEL = 'text-primary-foreground/70 mb-0.5 text-[10px] font-semibold uppercase tracking-wide';
const BADGE_VALUE = 'text-primary-foreground text-lg font-extrabold';

const ANSWER_PILL = 'flex-row items-center justify-between rounded-md border px-3.5 py-2.5';
// Tinted fills rather than solid ones, matching how web renders quiz review:
// the 10% wash reads as a state on both the light and the dark card.
const PILL_CORRECT = 'border-success bg-success/10';
const PILL_WRONG = 'border-destructive bg-destructive/10';

const ACTION_BUTTON = 'flex-1 items-center justify-center rounded-md py-3.5';
import { ScoreRing } from '../ui/score-ring';

import type { QuizSession } from '@freshr/shared';

interface QuizResultScreenProps {
  quiz: QuizSession;
  onBack: () => void;
  onRetake: () => void;
  onTakeToChat: (questionText: string, options: string[], topic: string) => void;
  timeTaken?: number; // seconds
  isArchived?: boolean;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function QuizResultScreen({
  quiz,
  onBack,
  onRetake,
  onTakeToChat,
  timeTaken,
  isArchived,
}: QuizResultScreenProps) {
  const insets = useSafeAreaInsets();
  const [openExplanations, setOpenExplanations] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'wrong'>('all');

  const numQuestions = quiz.num_questions ?? 0;
  const scorePercent = Math.round((quiz.score ?? 0) * 100);
  const questions = quiz.questions ?? [];
  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel = topics.length > 0 ? topics.join(', ') : 'General';
  const quizTitle = quiz.title || quiz.topic || 'Quiz';
  const difficultyLabel = quiz.difficulty ?? 'MEDIUM';

  let calculatedTime = timeTaken;
  if (calculatedTime == null && quiz.started_at && quiz.completed_at) {
    const start = new Date(quiz.started_at).getTime();
    const end = new Date(quiz.completed_at).getTime();
    calculatedTime = Math.max(0, Math.floor((end - start) / 1000));
  }
  const displayTime = calculatedTime != null ? formatTime(calculatedTime) : '—';

  const filteredQuestions =
    filter === 'wrong'
      ? questions.filter(
          (q) => !(q.is_correct ?? (q.user_answer != null && q.user_answer === q.correct_answer))
        )
      : questions;

  function toggleExplanation(index: number) {
    setOpenExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2.5">
        <Pressable onPress={onBack} className="p-2">
          <Icon as={ChevronLeft} size={24} className="text-foreground" />
        </Pressable>
        <Text
          className="text-foreground flex-1 text-center text-base font-extrabold tracking-wider"
          numberOfLines={1}>
          {quizTitle.toUpperCase()}
        </Text>
        <Pressable className="p-2">
          <Icon as={EllipsisVertical} size={20} className="text-foreground" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
        showsVerticalScrollIndicator={false}>
        {/* Score section */}
        <View className="bg-muted mb-7 items-center rounded-2xl px-5 py-7">
          <ScoreRing scorePercent={scorePercent} />

          {/* Badges */}
          <View className="mt-5 flex-row gap-3">
            <View className={BADGE}>
              <Text className={BADGE_LABEL}>Time</Text>
              <Text className={BADGE_VALUE}>{displayTime}</Text>
            </View>
            <View className={BADGE}>
              <Text className={BADGE_LABEL}>Difficulty</Text>
              <Text className={BADGE_VALUE}>{difficultyLabel.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Detailed Review */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-foreground text-xl font-bold">Detailed Review</Text>

          <View className="bg-muted flex-row rounded-md p-1">
            {(['all', 'wrong'] as const).map((key) => (
              <Pressable
                key={key}
                className={cn('rounded-sm px-3 py-1.5', filter === key && 'bg-accent')}
                onPress={() => setFilter(key)}>
                <Text
                  className={cn(
                    'text-[13px] font-medium',
                    filter === key ? 'text-accent-foreground font-semibold' : 'text-muted-foreground'
                  )}>
                  {key === 'all' ? 'All' : 'Wrong'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-4">
          {filteredQuestions.length === 0 ? (
            <Text className="text-muted-foreground py-5 text-center text-sm">
              No questions to display.
            </Text>
          ) : (
            filteredQuestions.map((q) => {
              const qi = questions.indexOf(q);
              const correct =
                q.is_correct ?? (q.user_answer != null && q.user_answer === q.correct_answer);
              const userAnswerText = q.user_answer || '—';
              const correctAnswerText = q.correct_answer || '—';

              return (
                <View key={q.id} className="border-border bg-card rounded-lg border p-[18px]">
                  {/* Question header */}
                  <Text className="text-foreground mb-1 text-sm font-bold">Question {qi + 1}</Text>
                  <Text className="text-foreground mb-3.5 text-[13px] leading-5">
                    {q.question_text}
                  </Text>

                  {/* Answer pills */}
                  <View className="mb-3 gap-2">
                    {/* User's answer */}
                    <View className={cn(ANSWER_PILL, correct ? PILL_CORRECT : PILL_WRONG)}>
                      <Text className="text-foreground flex-1 text-[13px] font-semibold">
                        {userAnswerText}
                      </Text>
                      <Text
                        className={cn(
                          'text-[11px] font-semibold',
                          correct ? 'text-success' : 'text-destructive'
                        )}>
                        {correct ? 'Correct Answer' : 'Wrong Answer'}
                      </Text>
                    </View>

                    {/* If wrong, show the correct answer */}
                    {!correct && (
                      <View className={cn(ANSWER_PILL, PILL_CORRECT)}>
                        <Text className="text-foreground flex-1 text-[13px] font-semibold">
                          {correctAnswerText}
                        </Text>
                        <Text className="text-success text-[11px] font-semibold">
                          Correct Answer
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* AI Explanation accordion */}
                  {q.explanation && (
                    <>
                      <Pressable
                        className="flex-row items-center justify-between py-2"
                        onPress={() => toggleExplanation(qi)}>
                        <Text className="text-muted-foreground text-[13px] font-medium">
                          AI Explanation
                        </Text>
                        <Icon
                          as={openExplanations.has(qi) ? ChevronUp : ChevronDown}
                          size={16}
                          className="text-muted-foreground"
                        />
                      </Pressable>
                      {openExplanations.has(qi) && (
                        <View className="pb-2">
                          <Text className="text-foreground text-[13px] leading-5">
                            {q.explanation}
                          </Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Take to Chat button */}
                  <View className="mt-1 flex-row justify-end">
                    <Pressable
                      className="bg-primary rounded-sm px-3.5 py-2"
                      onPress={() => {
                        const choices = q.choices?.length > 0 ? q.choices : ['True', 'False'];
                        onTakeToChat(q.question_text, choices, topicLabel);
                      }}>
                      <Text className="text-primary-foreground text-xs font-semibold">
                        Take to Chat
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View
        className="border-border bg-card flex-row gap-3 border-t px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {!isArchived && (
          <Pressable
            className={cn(ACTION_BUTTON, 'border-primary bg-field border-[1.5px]')}
            onPress={onRetake}>
            <Text className="text-foreground text-sm font-bold">Retake Quiz</Text>
          </Pressable>
        )}
        <Pressable className={cn(ACTION_BUTTON, 'bg-primary')} onPress={onBack}>
          <Text className="text-primary-foreground text-sm font-bold">Back to Quiz</Text>
        </Pressable>
      </View>
    </View>
  );
}
