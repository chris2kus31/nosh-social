import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Apple } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 6;

const inputClass =
  'rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900';

export default function SignIn() {
  const session = useAuthStore((s) => s.session);
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in -> leave the auth screen.
  if (session) {
    return <Redirect href="/(tabs)/discover" />;
  }

  const isSignUp = mode === 'signup';
  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const passwordValid = password.length >= MIN_PASSWORD;
  const nameValid = !isSignUp || name.trim().length > 0;
  const confirmValid = !isSignUp || password === confirm;
  const canSubmit = emailValid && passwordValid && nameValid && confirmValid && !loading;

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setConfirm('');
  };

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error) Alert.alert('Sign in failed', error.message);
    // On success, the auth store's listener updates the session and the
    // <Redirect> above sends the user into the app.
  }

  async function handleSignUp() {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // Supabase returns a user with no identities when the email already exists.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      Alert.alert('Account exists', 'That email is already registered. Try signing in instead.');
      switchMode('signin');
      return;
    }

    if (data.session) {
      // Email confirmation is disabled -> user is signed in immediately.
      return;
    }

    // Email confirmation is required.
    Alert.alert(
      'Check your email',
      'We sent a confirmation link to your email. Confirm it, then sign in.',
      [{ text: 'OK', onPress: () => switchMode('signin') }],
    );
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (isSignUp) await handleSignUp();
      else await handleSignIn();
    } finally {
      setLoading(false);
    }
  }

  const comingSoon = (provider: string) =>
    Alert.alert(`${provider} sign-in`, 'Social sign-in is coming soon.');

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-10 items-center">
            <View
              style={{
                width: 184,
                height: 230,
                borderRadius: 24,
                overflow: 'hidden',
                backgroundColor: '#000',
                padding: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../../assets/brand/nosh-lockup.png')}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
            <Text className="mt-6 text-center text-base text-neutral-500">
              {isSignUp ? 'Create your account to find your table.' : 'Sign in to find your table.'}
            </Text>
          </View>

          {/* Mode toggle */}
          <View className="mb-7 flex-row rounded-xl bg-neutral-100 p-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => switchMode(m)}
                activeOpacity={0.8}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  mode === m ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    mode === m ? 'text-nosh-maroon' : 'text-neutral-500'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="gap-4">
            {isSignUp && (
              <TextInput
                className={inputClass}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                value={name}
                onChangeText={setName}
              />
            )}

            <TextInput
              className={inputClass}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              className={inputClass}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              secureTextEntry
              textContentType={isSignUp ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
            />

            {isSignUp && (
              <TextInput
                className={inputClass}
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
            )}

            {isSignUp && password.length > 0 && !passwordValid && (
              <Text className="-mt-1 text-xs text-red-500">
                Password must be at least {MIN_PASSWORD} characters.
              </Text>
            )}
            {isSignUp && confirm.length > 0 && !confirmValid && (
              <Text className="-mt-1 text-xs text-red-500">Passwords don’t match.</Text>
            )}

            <TouchableOpacity
              className={`mt-2 items-center rounded-xl bg-nosh-maroon py-4 ${
                canSubmit ? '' : 'opacity-50'
              }`}
              disabled={!canSubmit}
              activeOpacity={0.9}
              onPress={onSubmit}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="mb-8 mt-10 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-neutral-200" />
            <Text className="text-xs font-medium text-neutral-400">OR</Text>
            <View className="h-px flex-1 bg-neutral-200" />
          </View>

          {/* Social sign-in (disabled for now) */}
          <View className="gap-4">
            <SocialButton
              label="Continue with Google"
              icon={<GoogleGlyph />}
              onPress={() => comingSoon('Google')}
            />
            <SocialButton
              label="Continue with Apple"
              icon={<Apple color="#111" size={18} fill="#111" />}
              onPress={() => comingSoon('Apple')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Disabled social sign-in button with a "Soon" badge. */
function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="h-12 flex-row items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white opacity-60"
    >
      {icon}
      <Text className="text-base font-medium text-neutral-700">{label}</Text>
      <View className="rounded-full bg-neutral-100 px-2 py-0.5">
        <Text className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          Soon
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** Minimal "G" mark so we don't need an image asset. */
function GoogleGlyph() {
  return (
    <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-neutral-100">
      <Text className="text-xs font-bold text-[#4285F4]">G</Text>
    </View>
  );
}
