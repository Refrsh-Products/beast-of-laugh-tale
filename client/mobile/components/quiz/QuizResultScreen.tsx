import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, ChevronDown, ChevronUp, EllipsisVertical } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Icon as={ChevronLeft} size={24} className="text-foreground" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {quizTitle.toUpperCase()}
        </Text>
        <Pressable style={styles.headerButton}>
          <Icon as={EllipsisVertical} size={20} className="text-foreground" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Score section */}
        <View style={styles.scoreSection}>
          <ScoreRing scorePercent={scorePercent} />

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Time</Text>
              <Text style={styles.badgeValue}>{displayTime}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Difficulty</Text>
              <Text style={styles.badgeValue}>{difficultyLabel.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Detailed Review */}
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.reviewTitle}>Detailed Review</Text>

          <View style={styles.filterTabs}>
            <Pressable
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}>
              <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterTab, filter === 'wrong' && styles.filterTabActive]}
              onPress={() => setFilter('wrong')}>
              <Text
                style={[styles.filterTabText, filter === 'wrong' && styles.filterTabTextActive]}>
                Wrong
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.reviewList}>
          {filteredQuestions.length === 0 ? (
            <Text style={styles.noQuestionsText}>No questions to display.</Text>
          ) : (
            filteredQuestions.map((q) => {
              const qi = questions.indexOf(q);
              const correct =
                q.is_correct ?? (q.user_answer != null && q.user_answer === q.correct_answer);
              const userAnswerText = q.user_answer || '—';
              const correctAnswerText = q.correct_answer || '—';

              return (
                <View key={q.id} style={styles.reviewCard}>
                  {/* Question header */}
                  <Text style={styles.reviewQuestionTitle}>Question {qi + 1}</Text>
                  <Text style={styles.reviewQuestionText}>{q.question_text}</Text>

                  {/* Answer pills */}
                  <View style={styles.answerPills}>
                    {/* User's answer */}
                    <View
                      style={[
                        styles.answerPill,
                        correct ? styles.answerPillCorrect : styles.answerPillWrong,
                      ]}>
                      <Text
                        style={[
                          styles.answerPillText,
                          correct ? styles.answerPillTextCorrect : styles.answerPillTextWrong,
                        ]}>
                        {userAnswerText}
                      </Text>
                      <Text
                        style={[
                          styles.answerPillLabel,
                          correct ? styles.answerPillLabelCorrect : styles.answerPillLabelWrong,
                        ]}>
                        {correct ? 'Correct Answer' : 'Wrong Answer'}
                      </Text>
                    </View>

                    {/* If wrong, show the correct answer */}
                    {!correct && (
                      <View style={[styles.answerPill, styles.answerPillCorrect]}>
                        <Text style={[styles.answerPillText, styles.answerPillTextCorrect]}>
                          {correctAnswerText}
                        </Text>
                        <Text style={[styles.answerPillLabel, styles.answerPillLabelCorrect]}>
                          Correct Answer
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* AI Explanation accordion */}
                  {q.explanation && (
                    <>
                      <Pressable
                        style={styles.explanationToggle}
                        onPress={() => toggleExplanation(qi)}>
                        <Text style={styles.explanationToggleText}>AI Explanation</Text>
                        <Icon
                          as={openExplanations.has(qi) ? ChevronUp : ChevronDown}
                          size={16}
                          className="text-muted-foreground"
                        />
                      </Pressable>
                      {openExplanations.has(qi) && (
                        <View style={styles.explanationContent}>
                          <Text style={styles.explanationText}>{q.explanation}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Take to Chat button */}
                  <View style={styles.takeToChatRow}>
                    <Pressable
                      style={styles.takeToChatButton}
                      onPress={() => {
                        const choices = q.choices?.length > 0 ? q.choices : ['True', 'False'];
                        onTakeToChat(q.question_text, choices, topicLabel);
                      }}>
                      <Text style={styles.takeToChatText}>Take to Chat</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!isArchived && (
          <Pressable style={[styles.actionButton, styles.actionButtonOutline]} onPress={onRetake}>
            <Text style={styles.actionButtonOutlineText}>Retake Quiz</Text>
          </Pressable>
        )}
        <Pressable style={[styles.actionButton, styles.actionButtonFilled]} onPress={onBack}>
          <Text style={styles.actionButtonFilledText}>Back to Quiz</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Score section
  scoreSection: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  badge: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Review
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
  },
  filterTabTextActive: {
    color: '#18181B',
    fontWeight: '600',
  },
  noQuestionsText: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewList: {
    gap: 16,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 18,
    backgroundColor: '#FAFAFA',
  },
  reviewQuestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  reviewQuestionText: {
    fontSize: 13,
    color: '#3F3F46',
    lineHeight: 20,
    marginBottom: 14,
  },
  // Answer pills
  answerPills: {
    gap: 8,
    marginBottom: 12,
  },
  answerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  answerPillCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  answerPillWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  answerPillText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  answerPillTextCorrect: {
    color: '#166534',
  },
  answerPillTextWrong: {
    color: '#991B1B',
  },
  answerPillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  answerPillLabelCorrect: {
    color: '#16A34A',
  },
  answerPillLabelWrong: {
    color: '#DC2626',
  },
  // Explanation
  explanationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  explanationToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
  },
  explanationContent: {
    paddingBottom: 8,
  },
  explanationText: {
    fontSize: 13,
    color: '#3F3F46',
    lineHeight: 20,
  },
  // Take to Chat
  takeToChatRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  takeToChatButton: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  takeToChatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  actionButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  actionButtonFilled: {
    backgroundColor: '#18181B',
  },
  actionButtonOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  actionButtonFilledText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
