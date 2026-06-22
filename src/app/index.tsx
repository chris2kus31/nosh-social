import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#590219" />
      </View>
    );
  }

  return <Redirect href={session ? '/(tabs)/discover' : '/sign-in'} />;
}
