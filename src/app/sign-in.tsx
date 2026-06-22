import { Redirect } from 'expo-router';
import { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function SignIn() {
  const session = useAuthStore((s) => s.session);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in -> leave the auth screen.
  if (session) {
    return <Redirect href="/(tabs)/discover" />;
  }

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert('Almost there', 'Check your email to confirm your account, then sign in.');
    }
  }

  const disabled = loading || !email || !password;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-4 px-6">
          <View className="mb-4">
            <Text className="text-4xl font-bold text-nosh-maroon">Nosh Social</Text>
            <Text className="mt-1 text-base text-neutral-500">Sign in to find your table.</Text>
          </View>

          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base"
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            className={`mt-2 items-center rounded-xl bg-nosh-maroon py-4 ${disabled ? 'opacity-50' : ''}`}
            disabled={disabled}
            onPress={signIn}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2" disabled={disabled} onPress={signUp}>
            <Text className="text-sm text-neutral-500">
              New here? <Text className="font-semibold text-nosh-maroon">Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
