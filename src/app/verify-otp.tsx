import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

// Supabase's "Email OTP Length" is configurable (6–10). Accept the whole range
// so the screen doesn't break if that setting changes.
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;
const RESEND_COOLDOWN = 45;

export default function VerifyOtp() {
  const session = useAuthStore((s) => s.session);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Verified -> the auth listener sets the session -> into the app.
  if (session) return <Redirect href="/(tabs)/discover" />;
  // Guard against landing here without an email to verify.
  if (!email) return <Redirect href="/sign-in" />;

  const canVerify = code.length >= MIN_CODE_LENGTH && !verifying;

  async function handleVerify(value: string) {
    if (value.length < MIN_CODE_LENGTH || verifying || !email) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: value,
        type: 'signup',
      });
      if (error) {
        Alert.alert('Invalid or expired code', error.message);
        setCode('');
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        Alert.alert('Could not resend', error.message);
      } else {
        setCode('');
        setCooldown(RESEND_COOLDOWN);
        Alert.alert('Code sent', 'We sent a fresh code to your email.');
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1 px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity className="mt-4 self-start py-2" onPress={() => router.back()}>
          <Text className="text-base font-medium text-neutral-500">‹ Back</Text>
        </TouchableOpacity>

        <View className="mt-8">
          <Text className="text-2xl font-bold text-neutral-900">Verify your email</Text>
          <Text className="mt-2 text-base text-neutral-500">
            Enter the code we sent to{' '}
            <Text className="font-semibold text-neutral-700">{email}</Text>.
          </Text>
        </View>

        <TextInput
          className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 py-4 text-center text-neutral-900"
          style={{ fontSize: 28, letterSpacing: 8, fontWeight: '700' }}
          placeholder="Enter code"
          placeholderTextColor="#d4d4d4"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={MAX_CODE_LENGTH}
          autoFocus
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH))}
        />

        <TouchableOpacity
          className="mt-6 items-center rounded-xl bg-nosh-maroon py-4"
          style={{ opacity: canVerify ? 1 : 0.5 }}
          disabled={!canVerify}
          activeOpacity={0.9}
          onPress={() => handleVerify(code)}
        >
          {verifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">Verify</Text>
          )}
        </TouchableOpacity>

        <View className="mt-8 flex-row items-center justify-center gap-1">
          <Text className="text-sm text-neutral-500">Didn&apos;t get the code?</Text>
          <TouchableOpacity disabled={cooldown > 0 || resending} onPress={handleResend}>
            <Text
              className="text-sm font-semibold"
              style={{ color: cooldown > 0 ? '#a3a3a3' : '#590219' }}
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
