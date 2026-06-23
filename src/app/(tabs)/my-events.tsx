import { useRouter } from 'expo-router';
import { CalendarClock, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { EventCard } from '@/features/events/EventCard';
import { type MyEventsCategory, useMyEvents } from '@/features/events/useMyEvents';
import { useAuthStore } from '@/stores/auth';

const TABS: { key: MyEventsCategory; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Noshing Now' },
  { key: 'past', label: 'Past' },
];

const EMPTY_COPY: Record<MyEventsCategory, { title: string; subtitle: string }> = {
  upcoming: {
    title: 'No upcoming events',
    subtitle: 'Join a Nosh or host your own to get started.',
  },
  live: {
    title: 'No live events right now',
    subtitle: 'Check back when one of your events is happening.',
  },
  past: {
    title: 'No past events yet',
    subtitle: 'Your completed Noshes will appear here.',
  },
};

function TabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center rounded-full border px-5 py-2.5 ${
        active ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
      }`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-white/60'}`}>
        {label}
      </Text>
      {count > 0 && (
        <View className={`ml-2 rounded-full px-2 py-0.5 ${active ? 'bg-white/25' : 'bg-white/10'}`}>
          <Text className="text-xs font-semibold text-white">{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MyEvents() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { upcoming, live, past, isLoading, refetch, isRefetching } = useMyEvents();
  const [activeTab, setActiveTab] = useState<MyEventsCategory>('upcoming');

  const lists = useMemo(() => ({ upcoming, live, past }), [upcoming, live, past]);
  const events = lists[activeTab];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#fff" />
        }
      >
        <View className="px-5 pt-2">
          <Text className="text-3xl font-bold text-white">My Nosh Events</Text>
          <Text className="mt-1 text-sm text-white/70">Your dining adventures</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}
          className="mt-8 grow-0"
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              count={lists[tab.key].length}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </ScrollView>

        <View className="mt-8 px-5" style={{ rowGap: 16 }}>
          {isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#fff" />
            </View>
          ) : events.length === 0 ? (
            <View className="items-center px-6 py-16">
              <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <CalendarClock color="rgba(255,255,255,0.6)" size={30} strokeWidth={1.5} />
              </View>
              <Text className="text-center text-lg font-semibold text-white">
                {EMPTY_COPY[activeTab].title}
              </Text>
              <Text className="mt-2 text-center text-sm text-white/60">
                {EMPTY_COPY[activeTab].subtitle}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  onPress={() => router.push('/host')}
                  className="mt-6 flex-row items-center rounded-full border border-white/30 bg-white/20 px-5 py-3"
                >
                  <Sparkles color="#fff" size={16} />
                  <Text className="ml-2 text-sm font-semibold text-white">Host Your Nosh</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            events.map((event) => (
              <EventCard key={event.id} event={event} isHost={event.host_id === userId} />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
