import '../global.css';

import type { EmailOtpType } from '@supabase/supabase-js';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

/**
 * Completes an auth flow that returns to the app via deep link (e.g. the email
 * confirmation link). Handles, in order:
 *   1. token-hash links (`?token_hash=&type=`) — the recommended mobile email
 *      pattern, since browsers block server redirects into custom URL schemes.
 *   2. PKCE code exchange (`?code=`).
 *   3. Implicit tokens in the URL fragment (`#access_token=&refresh_token=`).
 * Once verified, the auth store's listener picks up the new session.
 */
async function completeAuthFromUrl(url: string | null) {
  if (!url) return;
  try {
    const params = Linking.parse(url).queryParams ?? {};

    const tokenHash = params.token_hash;
    if (typeof tokenHash === 'string' && tokenHash) {
      const type = (typeof params.type === 'string' ? params.type : 'email') as EmailOtpType;
      await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      return;
    }

    const code = params.code;
    if (typeof code === 'string' && code) {
      await supabase.auth.exchangeCodeForSession(code);
      return;
    }

    const hashIndex = url.indexOf('#');
    if (hashIndex >= 0) {
      const fragment = new URLSearchParams(url.slice(hashIndex + 1));
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  } catch {
    // Ignore malformed or non-auth deep links.
  }
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => init(), [init]);

  useEffect(() => {
    Linking.getInitialURL().then(completeAuthFromUrl);
    const sub = Linking.addEventListener('url', ({ url }) => completeAuthFromUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="auth-callback" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event/[id]" />
            <Stack.Screen name="event/edit/[id]" />
            <Stack.Screen name="event/wrap-up/[id]" />
            <Stack.Screen name="user/[id]" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
