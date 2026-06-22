import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { noshColors } from '@/theme/nosh';

type ScreenProps = {
  children: ReactNode;
  /** Safe-area edges to pad. Defaults to top only (tab bar covers bottom). */
  edges?: Edge[];
};

/**
 * Full-bleed Nosh gradient background with a safe-area content wrapper.
 * Every authenticated screen renders inside this for consistent branding.
 */
export function Screen({ children, edges = ['top'] }: ScreenProps) {
  return (
    <LinearGradient
      colors={noshColors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
