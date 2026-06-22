import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { progressToNextTier, tierForScore } from '@/theme/nosh';

// Maps the tier's tailwind gradient classes to concrete colors for LinearGradient.
const TIER_BADGE_COLORS: Record<string, [string, string]> = {
  'from-yellow-400 to-orange-600': ['#facc15', '#ea580c'],
  'from-cyan-400 to-purple-600': ['#22d3ee', '#9333ea'],
  'from-slate-300 to-slate-500': ['#cbd5e1', '#64748b'],
  'from-yellow-500 to-yellow-600': ['#eab308', '#ca8a04'],
  'from-slate-300 to-slate-400': ['#cbd5e1', '#94a3b8'],
  'from-orange-600 to-orange-800': ['#ea580c', '#9a3412'],
  'from-slate-400 to-slate-600': ['#94a3b8', '#475569'],
};

export function ReputationCard({ score }: { score: number }) {
  const tier = tierForScore(score);
  const Icon = tier.icon;
  const progress = progressToNextTier(score);
  const badgeColors = TIER_BADGE_COLORS[tier.gradient] ?? ['#94a3b8', '#475569'];

  return (
    <View className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5">
      <View className="flex-row items-center gap-3">
        <LinearGradient
          colors={badgeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon color="#fff" size={28} />
        </LinearGradient>
        <View>
          <Text className="mb-1 text-xs font-medium text-white/60">Nosh Reputation</Text>
          <Text className="text-2xl font-bold text-white">{tier.name}</Text>
        </View>
      </View>

      <View className="mt-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-medium text-white/70">Progress to Next Tier</Text>
          <Text className="text-xs text-white/50">{progress}%</Text>
        </View>
        <View className="h-3 overflow-hidden rounded-full bg-white/10">
          <View className="h-full rounded-full bg-white/70" style={{ width: `${progress}%` }} />
        </View>
        <Text className="mt-2 text-center text-xs italic text-white/50">
          Nosh Reputation reflects your consistency and contribution.
        </Text>
      </View>
    </View>
  );
}
