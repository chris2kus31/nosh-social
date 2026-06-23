import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  Ban,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  MoreVertical,
  UserMinus,
  UserPlus,
  Users,
  Utensils,
  VolumeX,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReputationCard } from '@/features/profile/ReputationCard';
import {
  useBlockMute,
  useMyProfile,
  usePublicProfile,
  useManageConnection,
} from '@/features/profile/useProfile';
import { useEvents } from '@/features/events/useEvents';
import { useAuthStore } from '@/stores/auth';
import { noshColors } from '@/theme/nosh';

/** "Christopher Moreno" -> "Christopher M." */
function shortName(name?: string | null, fallback = 'User') {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View className="min-w-[47%] flex-1 rounded-2xl border border-white/20 bg-white/10 p-5">
      <View className="mb-3">{icon}</View>
      <Text className="mb-1 text-3xl font-bold text-white">{value}</Text>
      <Text className="text-sm text-white/70">{label}</Text>
    </View>
  );
}

type ConnectionState = 'self' | 'connected' | 'sent' | 'incoming' | 'none';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = useAuthStore((s) => s.user?.id);

  const { data: profile, isLoading, error } = usePublicProfile(id);
  const { data: me } = useMyProfile();
  const { data: events = [] } = useEvents();
  const manage = useManageConnection();
  const { isBlocked, isMuted, block, unblock, mute, unmute } = useBlockMute();

  const stats = useMemo(() => {
    const isAttendee = (attendees: unknown, uid: string) =>
      Array.isArray(attendees) &&
      (attendees as { user_id?: string }[]).some((a) => a?.user_id === uid);

    const hosted = events.filter((e) => e.host_id === id);
    const attended = events.filter((e) => isAttendee(e.attendees, id));
    const noshers = new Set<string>();
    hosted.forEach((e) => {
      if (Array.isArray(e.attendees)) {
        (e.attendees as { user_id?: string }[]).forEach((a) => {
          if (a?.user_id && a.user_id !== id) noshers.add(a.user_id);
        });
      }
    });
    const recent = events
      .filter((e) => e.host_id === id || isAttendee(e.attendees, id))
      .slice(0, 5);
    return { hosted: hosted.length, attended: attended.length, noshers: noshers.size, recent };
  }, [events, id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/discover'));

  if (isLoading) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      </LinearGradient>
    );
  }

  if (error || !profile) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-white/70">User not found</Text>
          <TouchableOpacity
            onPress={goBack}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-3"
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // If this user has blocked the viewer, don't surface their profile.
  if (myId && id !== myId && (profile.blocked_users ?? []).includes(myId)) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ban color="rgba(255,255,255,0.5)" size={36} />
          <Text className="mt-4 text-center text-white/70">This profile isn’t available.</Text>
          <TouchableOpacity
            onPress={goBack}
            className="mt-4 rounded-xl border border-white/20 bg-white/10 px-5 py-3"
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const iBlocked = isBlocked(id);
  const iMuted = isMuted(id);

  const confirmBlock = () =>
    Alert.alert(
      'Block user?',
      `${shortName(profile.full_name)} won’t be able to see your profile or invite you, and you won’t see their events. This also removes any connection between you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => block(id) },
      ],
    );

  const openActions = () =>
    Alert.alert(shortName(profile.full_name), undefined, [
      iMuted
        ? { text: 'Unmute', onPress: () => unmute(id) }
        : { text: 'Mute', onPress: () => mute(id) },
      iBlocked
        ? { text: 'Unblock', onPress: () => unblock(id) }
        : { text: 'Block', style: 'destructive', onPress: confirmBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const tags = (profile.reputation_tags ?? {}) as Record<string, number>;
  const totalTags = Object.values(tags).reduce((sum, n) => sum + (n || 0), 0);
  const fallback = (profile.full_name?.charAt(0) ?? profile.email?.charAt(0) ?? 'U').toUpperCase();

  const connState: ConnectionState =
    id === myId
      ? 'self'
      : me?.connections.includes(id)
        ? 'connected'
        : me?.connection_requests.includes(id)
          ? 'incoming'
          : me?.sent_requests.includes(id)
            ? 'sent'
            : 'none';

  const onConnectPress = () => {
    if (connState === 'connected') {
      Alert.alert(
        'Remove connection?',
        `Remove ${shortName(profile.full_name)} from your connections? You can reconnect later.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => manage.mutate({ targetUserId: id, action: 'remove' }),
          },
        ],
      );
      return;
    }
    const action =
      connState === 'sent' ? 'remove' : connState === 'incoming' ? 'accept' : 'request';
    manage.mutate({ targetUserId: id, action });
  };

  const connectButton = {
    connected: { label: 'Connected', icon: UserMinus, solid: false },
    sent: { label: 'Request Sent', icon: Clock, solid: false },
    incoming: { label: 'Accept Request', icon: Check, solid: true },
    none: { label: 'Connect', icon: UserPlus, solid: true },
  }[connState === 'self' ? 'none' : connState];

  return (
    <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={goBack}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
          >
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
          {connState !== 'self' && (
            <TouchableOpacity
              onPress={openActions}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
              accessibilityLabel="More options"
            >
              <MoreVertical color="#fff" size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View className="gap-6">
          {iBlocked && (
            <View className="flex-row items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/15 p-4">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <Ban color="#fca5a5" size={16} />
                  <Text className="font-semibold text-white">You blocked this user</Text>
                </View>
                <Text className="mt-1 text-xs text-white/70">
                  They can’t see your profile or invite you, and you won’t see their events.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => unblock(id)}
                className="rounded-lg border border-white/25 bg-white/15 px-3 py-2"
              >
                <Text className="text-sm text-white">Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          {iMuted && !iBlocked && (
            <View className="flex-row items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-4">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <VolumeX color="rgba(255,255,255,0.7)" size={16} />
                  <Text className="font-semibold text-white">You muted this user</Text>
                </View>
                <Text className="mt-1 text-xs text-white/70">
                  You won’t see their events in your feed.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => unmute(id)}
                className="rounded-lg border border-white/25 bg-white/15 px-3 py-2"
              >
                <Text className="text-sm text-white">Unmute</Text>
              </TouchableOpacity>
            </View>
          )}

          <ReputationCard score={profile.reputation_score} />

          {/* Header */}
          <View className="rounded-3xl border border-white/20 bg-white/10 p-5">
            <View className="flex-row items-start gap-4">
              <View
                style={{ width: 80, height: 80, borderRadius: 22, flexShrink: 0 }}
                className="items-center justify-center overflow-hidden bg-nosh-maroon"
              >
                {profile.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-3xl font-bold text-white">{fallback}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white">
                  {shortName(profile.full_name)}
                </Text>
                <Text className="mb-3 text-sm text-white/60">
                  {id === myId ? profile.email : 'Email hidden'}
                </Text>

                {connState !== 'self' && !iBlocked && (
                  <TouchableOpacity
                    onPress={onConnectPress}
                    disabled={manage.isPending}
                    activeOpacity={0.85}
                    className={`h-11 flex-row items-center justify-center gap-2 rounded-xl border ${
                      connectButton.solid
                        ? 'border-transparent bg-nosh-maroon'
                        : 'border-white/25 bg-white/15'
                    } ${manage.isPending ? 'opacity-60' : ''}`}
                  >
                    {manage.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <connectButton.icon color="#fff" size={16} />
                        <Text className="font-medium text-white">{connectButton.label}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {!!profile.bio && (
              <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="text-sm leading-relaxed text-white/80">{profile.bio}</Text>
              </View>
            )}

            {!!profile.home_area && (
              <View className="mt-4 flex-row items-center gap-2">
                <MapPin color="rgba(255,255,255,0.5)" size={16} />
                <Text className="text-sm text-white/70">{profile.home_area}</Text>
              </View>
            )}

            {profile.favorite_cuisines.length > 0 && (
              <View className="mt-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Utensils color="rgba(255,255,255,0.5)" size={16} />
                  <Text className="text-xs text-white/50">Favorite Cuisines</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {profile.favorite_cuisines.map((c) => (
                    <View
                      key={c}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1"
                    >
                      <Text className="text-sm text-white/80">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon={<Calendar color="rgba(255,255,255,0.6)" size={22} />}
              value={stats.hosted}
              label="Noshes Hosted"
            />
            <StatCard
              icon={<Heart color="rgba(255,255,255,0.6)" size={22} />}
              value={stats.attended}
              label="Noshes Attended"
            />
            <StatCard
              icon={<Users color="rgba(255,255,255,0.6)" size={22} />}
              value={stats.noshers}
              label="Noshers Hosted"
            />
            <StatCard
              icon={<Award color="rgba(255,255,255,0.6)" size={22} />}
              value={totalTags}
              label="Positive Tags"
            />
          </View>

          {/* Reputation tags */}
          {Object.keys(tags).length > 0 && (
            <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <View className="mb-4 flex-row items-center gap-2">
                <Award color="rgba(255,255,255,0.6)" size={20} />
                <Text className="font-semibold text-white">Reputation Tags</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(tags)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tag, count]) => (
                    <View
                      key={tag}
                      className="flex-row items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2"
                    >
                      <Text className="text-sm font-medium text-green-300">{tag}</Text>
                      <Text className="text-xs text-green-300/70">×{count}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Recent noshes */}
          {stats.recent.length > 0 && (
            <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-4 font-semibold text-white">
                Recent Noshes ({stats.recent.length})
              </Text>
              <View className="gap-3">
                {stats.recent.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => router.push(`/event/${e.id}`)}
                    activeOpacity={0.8}
                    className="flex-row items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <View className="flex-1">
                      <Text className="mb-1 text-sm font-medium text-white" numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text className="text-xs text-white/60" numberOfLines={1}>
                        {e.venue_name}
                      </Text>
                    </View>
                    {e.host_id === id && (
                      <View className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-1">
                        <Text className="text-xs font-medium text-blue-300">Host</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
