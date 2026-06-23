import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { noshColors } from '@/theme/nosh';

type ScreenProps = {
  children: ReactNode;
  /** Safe-area edges to pad. Defaults to top only (tab bar covers bottom). */
  edges?: Edge[];
};

/**
 * Full-bleed Nosh gradient background with a safe-area content wrapper.
 * Every authenticated screen renders inside this for consistent branding.
 *
 * Uses the `useSafeAreaInsets` hook (per react-native-safe-area-context's own
 * guidance) rather than the `SafeAreaView` component, which can flicker during
 * navigation transitions.
 */
export function Screen({ children, edges = ['top'] }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={noshColors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}
