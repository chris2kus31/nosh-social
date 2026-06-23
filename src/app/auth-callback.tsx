import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/auth';

/**
 * Landing screen for the email-confirmation deep link
 * (`noshsocial://auth-callback`). The session is completed by the deep-link
 * handler in the root layout; this screen just shows a friendly "confirming"
 * state and routes the user once the session lands (or back to sign-in if the
 * link was stale / invalid).
 */
export default function AuthCallback() {
  const session = useAuthStore((s) => s.session);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (session) return <Redirect href="/(tabs)/discover" />;
  if (timedOut) {
    return <Redirect href={{ pathname: '/sign-in', params: { confirmed: '1' } }} />;
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="mt-6 text-xl font-semibold text-white">Confirming your account</Text>
        <Text className="mt-2 text-center text-base text-white/70">
          Hang tight — we&apos;re finishing up and signing you in.
        </Text>
      </View>
    </Screen>
  );
}
