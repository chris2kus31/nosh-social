import { CalendarClock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

export default function MyEvents() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <CalendarClock color="#fff" size={30} strokeWidth={1.5} />
        </View>
        <Text className="text-center text-2xl font-bold text-white">My Nosh Events</Text>
        <Text className="mt-2 text-center text-sm text-white/60">
          Upcoming, live, and past events will live here in an upcoming build.
        </Text>
      </View>
    </Screen>
  );
}
