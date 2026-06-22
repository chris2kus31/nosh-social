import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import { CalendarDays, LogOut, MapPin, Users } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEvents, type EventRow } from '@/features/events/useEvents';
import { supabase } from '@/lib/supabase';

function EventCard({ event }: { event: EventRow }) {
  const when = event.date_time ? format(new Date(event.date_time), 'EEE, MMM d • h:mm a') : 'TBD';
  const seats = Array.isArray(event.attendees) ? event.attendees.length : (event.seats_taken ?? 0);

  return (
    <View className="mb-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <Text className="text-lg font-semibold text-neutral-900" numberOfLines={1}>
        {event.title}
      </Text>

      <View className="mt-2 flex-row items-center gap-1.5">
        <MapPin size={14} color="#737373" />
        <Text className="flex-1 text-sm text-neutral-500" numberOfLines={1}>
          {event.venue_name ?? 'Venue TBD'}
        </Text>
      </View>

      <View className="mt-1 flex-row items-center gap-1.5">
        <CalendarDays size={14} color="#737373" />
        <Text className="text-sm text-neutral-500">{when}</Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Users size={14} color="#590219" />
          <Text className="text-sm text-neutral-600">
            {seats}/{event.max_seats} seats
          </Text>
        </View>
        <Text className="text-xs font-medium uppercase text-nosh-rust">{event.status}</Text>
      </View>
    </View>
  );
}

export default function Discover() {
  const { data, isLoading, error, refetch, isRefetching } = useEvents();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <View>
          <Text className="text-2xl font-bold text-nosh-maroon">Discover</Text>
          <Text className="text-sm text-neutral-500">Find your next table</Text>
        </View>
        <TouchableOpacity
          className="rounded-full bg-neutral-100 p-2"
          onPress={() => supabase.auth.signOut()}
          accessibilityLabel="Sign out"
        >
          <LogOut size={18} color="#404040" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#590219" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-500">
            Couldn’t load events: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlashList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="mt-24 items-center px-6">
              <Text className="text-base font-medium text-neutral-700">No events yet</Text>
              <Text className="mt-1 text-center text-sm text-neutral-400">
                Once events are created they’ll show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
