import type { ReactNode } from 'react';
import { View } from 'react-native';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Frosted "glassmorphism" card matching the web app: translucent white fill
 * with a subtle white border on the maroon gradient background.
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <View className={`rounded-3xl border border-white/20 bg-white/10 p-5 ${className}`}>
      {children}
    </View>
  );
}
