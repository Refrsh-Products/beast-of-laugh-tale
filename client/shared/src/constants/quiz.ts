import type { QuizDifficulty } from '../types';

export const QUESTION_COUNT_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
];

export const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export const MODE_OPTIONS = [
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'TIMED', label: 'Timed' },
];

export const TIMER_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
];

export const COLLAPSED_MAX = 4;
