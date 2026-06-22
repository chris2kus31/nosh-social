import { Redirect, Tabs } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth';

export default function TabsLayout() {
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) return null;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#590219' }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
