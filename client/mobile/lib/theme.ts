/**
 * GENERATED FILE — do not edit.
 * Run `npm run tokens` after changing lib/design/tokens.ts.
 *
 * The JS-readable mirror of the CSS variables in `global.css`. Needed because
 * react-navigation's ThemeProvider, `ActivityIndicator color=`,
 * `placeholderTextColor`, `RefreshControl tintColor` and react-native-svg
 * cannot read a className.
 *
 * Prefer the `useThemeColors()` hook over importing THEME directly — it picks
 * the active scheme for you.
 */

import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(60 26.3% 92.5%)',
    foreground: 'hsl(80 11.1% 5.3%)',
    card: 'hsl(60 26.3% 96.3%)',
    cardForeground: 'hsl(80 11.1% 5.3%)',
    popover: 'hsl(60 26.3% 96.3%)',
    popoverForeground: 'hsl(80 11.1% 5.3%)',
    primary: 'hsl(159.4 39% 16.1%)',
    primaryForeground: 'hsl(100 10% 88.2%)',
    secondary: 'hsl(91 100% 71.6%)',
    secondaryForeground: 'hsl(159.4 39% 16.1%)',
    muted: 'hsl(60 26.3% 88.8%)',
    mutedForeground: 'hsl(142.5 9.8% 32.2%)',
    accent: 'hsl(145.3 37.3% 90%)',
    accentForeground: 'hsl(159.4 39% 16.1%)',
    destructive: 'hsl(3.2 71.3% 41%)',
    destructiveForeground: 'hsl(0 0% 100%)',
    success: 'hsl(95.1 81% 22.7%)',
    successForeground: 'hsl(0 0% 100%)',
    border: 'hsl(60 26.1% 76.7%)',
    input: 'hsl(43.6 24.7% 43.7%)',
    field: 'hsl(60 26.3% 92.5%)',
    ring: 'hsl(156.7 43.2% 30.4%)',
    chart1: 'hsl(159.4 39% 16.1%)',
    chart2: 'hsl(92.8 95.6% 44.3%)',
    chart3: 'hsl(155.1 38.3% 39.4%)',
    chart4: 'hsl(94.9 92.8% 27.3%)',
    chart5: 'hsl(151.6 32.5% 66.9%)',
    radius: 12,
  },
  dark: {
    background: 'hsl(162 43.5% 9%)',
    foreground: 'hsl(100 10% 88.2%)',
    card: 'hsl(159.4 39% 16.1%)',
    cardForeground: 'hsl(100 10% 88.2%)',
    popover: 'hsl(159.4 39% 16.1%)',
    popoverForeground: 'hsl(100 10% 88.2%)',
    primary: 'hsl(91 100% 71.6%)',
    primaryForeground: 'hsl(159.4 39% 16.1%)',
    secondary: 'hsl(158.1 41.9% 24.3%)',
    secondaryForeground: 'hsl(100 10% 88.2%)',
    muted: 'hsl(158 40.6% 19.8%)',
    mutedForeground: 'hsl(142.9 13.7% 70%)',
    accent: 'hsl(156.7 43.2% 30.4%)',
    accentForeground: 'hsl(60 26.3% 92.5%)',
    destructive: 'hsl(7.2 100% 73.9%)',
    destructiveForeground: 'hsl(80 11.1% 5.3%)',
    success: 'hsl(91.9 92.1% 55.5%)',
    successForeground: 'hsl(80 11.1% 5.3%)',
    border: 'hsl(158.1 41.9% 24.3%)',
    input: 'hsl(153.7 29.6% 51.6%)',
    field: 'hsl(158 40.6% 19.8%)',
    ring: 'hsl(91 100% 71.6%)',
    chart1: 'hsl(91 100% 71.6%)',
    chart2: 'hsl(151.6 32.5% 66.9%)',
    chart3: 'hsl(92.8 95.6% 44.3%)',
    chart4: 'hsl(153.7 29.6% 51.6%)',
    chart5: 'hsl(90 100% 79.2%)',
    radius: 12,
  },
};

export type ThemeColors = (typeof THEME)['light'];

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    fonts: {
      ...DefaultTheme.fonts,
      regular: { fontFamily: 'InstrumentSans_400Regular', fontWeight: '400' },
      medium: { fontFamily: 'InstrumentSans_500Medium', fontWeight: '500' },
      bold: { fontFamily: 'InstrumentSans_700Bold', fontWeight: '700' },
      heavy: { fontFamily: 'InstrumentSans_700Bold', fontWeight: '700' },
    },
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    fonts: {
      ...DarkTheme.fonts,
      regular: { fontFamily: 'InstrumentSans_400Regular', fontWeight: '400' },
      medium: { fontFamily: 'InstrumentSans_500Medium', fontWeight: '500' },
      bold: { fontFamily: 'InstrumentSans_700Bold', fontWeight: '700' },
      heavy: { fontFamily: 'InstrumentSans_700Bold', fontWeight: '700' },
    },
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
