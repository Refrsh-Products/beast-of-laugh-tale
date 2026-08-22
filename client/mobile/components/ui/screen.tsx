import { cn } from '@/lib/utils';
import * as React from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

// Default to the edges that matter for full-bleed screens. Bottom is omitted
// because these screens live inside the tab bar, which already clears the home
// indicator — adding it would double up the inset. Override `edges` for screens
// rendered outside the tabs.
const DEFAULT_EDGES = ['top', 'left', 'right'] as const satisfies readonly Edge[];

type ScreenProps = React.ComponentProps<typeof SafeAreaView> & {
  edges?: readonly Edge[];
};

/**
 * Full-screen wrapper that applies safe-area insets and always fills the
 * screen (`flex-1`). Use on any `headerShown: false` screen instead of a bare
 * `SafeAreaView`, which collapses without an explicit flex.
 */
function Screen({ className, edges = DEFAULT_EDGES, ...props }: ScreenProps) {
  return <SafeAreaView edges={edges} className={cn('flex-1 pt-5', className)} {...props} />;
}

export { Screen };
