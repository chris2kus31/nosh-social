import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import { CalendarDays, MapPin, Users } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useEvents, type EventRow } from '@/features/events/useEvents';

function EventCard({ event }: { event: EventRow }) {
  const when = event.date_time ? format(new Date(event.date_time), 'EEE, MMM d • h:mm a') : 'TBD';
  const seats = Array.isArray(event.attendees) ? event.attendees.length : (event.seats_taken ?? 0);

  return (
    <View className="mb-3 rounded-2xl border border-white/15 bg-white/10 p-4">
      <Text className="text-lg font-semibold text-white" numberOfLines={1}>
        {event.title}
      </Text>

      <View className="mt-2 flex-row items-center gap-1.5">
        <MapPin size={14} color="rgba(255,255,255,0.6)" />
        <Text className="flex-1 text-sm text-white/60" numberOfLines={1}>
          {event.venue_name ?? 'Venue TBD'}
        </Text>
      </View>

      <View className="mt-1 flex-row items-center gap-1.5">
        <CalendarDays size={14} color="rgba(255,255,255,0.6)" />
        <Text className="text-sm text-white/60">{when}</Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Users size={14} color="#fff" />
          <Text className="text-sm text-white/80">
            {seats}/{event.max_seats} seats
          </Text>
        </View>
        <Text className="text-xs font-medium uppercase text-white/50">{event.status}</Text>
      </View>
    </View>
  );
}

export default function Discover() {
  const { data, isLoading, error, refetch, isRefetching } = useEvents();

  return (
    <Screen>
      <View className="px-5 pb-2 pt-2">
        <Text className="text-3xl font-bold text-white">Discover</Text>
        <Text className="text-sm text-white/60">Find your next table</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-300">
            Couldn’t load events: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlashList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="mt-24 items-center px-6">
              <Text className="text-base font-medium text-white/80">No events yet</Text>
              <Text className="mt-1 text-center text-sm text-white/50">
                Once events are created they’ll show up here.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
