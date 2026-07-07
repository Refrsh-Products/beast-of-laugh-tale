import type { TextLength } from "../services/presentation";

export const SLIDE_COUNT_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: "5" },
  { value: 8, label: "8" },
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 20, label: "20" },
];

export const TEXT_LENGTH_OPTIONS: { value: TextLength; label: string }[] = [
  { value: "BRIEF", label: "Brief" },
  { value: "BALANCED", label: "Balanced" },
  { value: "DETAILED", label: "Detailed" },
];

export const COLLAPSED_MAX_PRESENTATION = 4;
