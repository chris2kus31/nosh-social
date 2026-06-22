import {
  Bell,
  BellOff,
  Camera,
  Check,
  ChefHat,
  Gem,
  Loader2,
  LogOut,
  SlidersHorizontal,
  UserX,
  Users,
  Utensils,
  VolumeX,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { useEvents } from '@/features/events/useEvents';
import { ReputationCard } from '@/features/profile/ReputationCard';
import { pickAndUploadAvatar } from '@/features/profile/uploadAvatar';
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPreferences,
  type Profile,
  useManageConnection,
  useMyProfile,
  useProfilesByIds,
  useUpdateProfile,
} from '@/features/profile/useProfile';
import { supabase } from '@/lib/supabase';
import { CUISINES, REPUTATION_TIERS, tierForScore } from '@/theme/nosh';

type TabKey = 'profile' | 'reputation' | 'notifications' | 'connections' | 'privacy';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'reputation', label: 'Reputation' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'connections', label: 'Connections' },
  { key: 'privacy', label: 'Privacy' },
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

function Avatar({
  uri,
  fallback,
  size = 80,
}: {
  uri?: string | null;
  fallback: string;
  size?: number;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      className="items-center justify-center overflow-hidden bg-nosh-maroon"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ fontSize: size * 0.4 }} className="font-bold text-white">
          {fallback}
        </Text>
      )}
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      className={`h-7 w-12 justify-center rounded-full px-1 ${value ? 'bg-green-500' : 'bg-white/20'}`}
    >
      <View className={`h-5 w-5 rounded-full bg-white ${value ? 'self-end' : 'self-start'}`} />
    </TouchableOpacity>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-full border px-3 py-1.5 ${
        active ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
      }`}
    >
      <Text className={`text-sm ${active ? 'text-white' : 'text-white/60'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState<TabKey>('profile');
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading || !profile) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      </Screen>
    );
  }

  const firstName = profile.full_name?.split(' ')[0];
  const lastInitial = profile.full_name?.split(' ').slice(-1)[0]?.charAt(0);
  const headerName =
    firstName && lastInitial && profile.full_name?.includes(' ')
      ? `${firstName} ${lastInitial}.`
      : (firstName ?? 'Your Profile');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text className="text-3xl font-bold text-white">{headerName}</Text>
        <Text className="mb-5 text-sm text-white/60">Manage your Nosh Social profile</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="-mx-1 mb-5 px-1"
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
              className={`rounded-full border px-5 py-2.5 ${
                tab === t.key ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
              }`}
            >
              <Text
                className={`text-sm font-medium ${tab === t.key ? 'text-white' : 'text-white/60'}`}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {tab === 'profile' && <ProfileTab profile={profile} />}
        {tab === 'reputation' && <ReputationTab profile={profile} />}
        {tab === 'notifications' && <NotificationsTab profile={profile} />}
        {tab === 'connections' && <ConnectionsTab profile={profile} />}
        {tab === 'privacy' && <PrivacyTab profile={profile} />}
      </ScrollView>
    </Screen>
  );
}

function ProfileTab({ profile }: { profile: Profile }) {
  const { data: events = [] } = useEvents();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    bio: profile.bio ?? '',
    home_area: profile.home_area ?? '',
    favorite_cuisines: profile.favorite_cuisines ?? [],
    avatar_url: profile.avatar_url ?? '',
  });

  const stats = useMemo(() => {
    const isAttendee = (attendees: unknown, uid: string) =>
      Array.isArray(attendees) &&
      (attendees as { user_id?: string }[]).some((a) => a?.user_id === uid);

    const hosted = events.filter((e) => e.host_id === profile.id);
    const attended = events.filter((e) => isAttendee(e.attendees, profile.id)).length;
    const noshers = new Set<string>();
    hosted.forEach((e) => {
      if (Array.isArray(e.attendees)) {
        (e.attendees as { user_id?: string }[]).forEach((a) => {
          if (a?.user_id && a.user_id !== profile.id) noshers.add(a.user_id);
        });
      }
    });
    const tags = (profile.reputation_tags ?? {}) as Record<string, number>;
    const totalTags = Object.values(tags).reduce((sum, n) => sum + (n || 0), 0);
    return { hosted: hosted.length, attended, noshers: noshers.size, totalTags, tags };
  }, [events, profile]);

  const fallback = (profile.full_name?.charAt(0) ?? profile.email?.charAt(0) ?? 'U').toUpperCase();

  const handlePickAvatar = async () => {
    try {
      setUploading(true);
      const result = await pickAndUploadAvatar(profile.id);
      if (result.status === 'uploaded') setForm((f) => ({ ...f, avatar_url: result.url }));
      else if (result.status === 'denied')
        Alert.alert('Permission needed', 'Allow photo access to change your picture.');
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate(form, {
      onSuccess: () => setIsEditing(false),
      onError: (err) => Alert.alert('Could not save', (err as Error).message),
    });
  };

  const toggleCuisine = (c: string) =>
    setForm((f) => ({
      ...f,
      favorite_cuisines: f.favorite_cuisines.includes(c)
        ? f.favorite_cuisines.filter((x) => x !== c)
        : [...f.favorite_cuisines, c],
    }));

  return (
    <View className="gap-6">
      <ReputationCard score={profile.reputation_score} />

      <View className="rounded-3xl border border-white/20 bg-white/10 p-5">
        {!isEditing ? (
          <>
            <View className="mb-4 flex-row items-center gap-4">
              <Avatar uri={profile.avatar_url} fallback={fallback} />
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white">
                  {profile.full_name ?? profile.email ?? 'User'}
                </Text>
                <Text className="text-sm text-white/60">{profile.email}</Text>
              </View>
            </View>

            {!!profile.bio && (
              <View className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="text-sm leading-relaxed text-white/70">{profile.bio}</Text>
              </View>
            )}

            {!!profile.home_area && (
              <View className="mb-4">
                <Text className="mb-1 text-xs text-white/50">Home Area</Text>
                <Text className="text-sm text-white">{profile.home_area}</Text>
              </View>
            )}

            {profile.favorite_cuisines.length > 0 && (
              <View className="mb-4">
                <Text className="mb-2 text-xs text-white/50">Favorite Cuisines</Text>
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

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                activeOpacity={0.85}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10"
              >
                <SlidersHorizontal color="#fff" size={16} />
                <Text className="font-medium text-white">Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => supabase.auth.signOut()}
                activeOpacity={0.85}
                className="h-11 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/5"
                accessibilityLabel="Sign out"
              >
                <LogOut color="rgba(255,255,255,0.8)" size={18} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-white">Profile Photo</Text>
              <View className="flex-row items-center gap-4">
                <View>
                  <Avatar uri={form.avatar_url} fallback={fallback} />
                  {uploading && (
                    <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/50">
                      <Loader2 color="#fff" size={22} />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  disabled={uploading}
                  activeOpacity={0.85}
                  className="flex-row items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5"
                >
                  <Camera color="#fff" size={16} />
                  <Text className="text-white">{uploading ? 'Uploading…' : 'Change Photo'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-white">Name</Text>
              <TextInput
                value={form.full_name}
                onChangeText={(t) => setForm((f) => ({ ...f, full_name: t }))}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-white">Bio</Text>
              <TextInput
                value={form.bio}
                onChangeText={(t) => setForm((f) => ({ ...f, bio: t }))}
                placeholder="Tell others about yourself…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={3}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-white">Home Area</Text>
              <TextInput
                value={form.home_area}
                onChangeText={(t) => setForm((f) => ({ ...f, home_area: t }))}
                placeholder="e.g., Downtown, Fort Worth"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
              />
            </View>

            <View>
              <Text className="mb-1 text-sm font-medium text-white">Favorite Cuisines</Text>
              <Text className="mb-3 text-xs text-white/60">Select your favorite types of food</Text>
              <View className="flex-row flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={form.favorite_cuisines.includes(c)}
                    onPress={() => toggleCuisine(c)}
                  />
                ))}
              </View>
            </View>

            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                activeOpacity={0.85}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5"
              >
                <X color="#fff" size={16} />
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={updateProfile.isPending || uploading}
                activeOpacity={0.85}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-nosh-maroon"
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check color="#fff" size={16} />
                    <Text className="font-medium text-white">Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          icon={<ChefHat color="rgba(255,255,255,0.6)" size={22} />}
          value={stats.hosted}
          label="Noshes Hosted"
        />
        <StatCard
          icon={<Utensils color="rgba(255,255,255,0.6)" size={22} />}
          value={stats.attended}
          label="Noshes Attended"
        />
        <StatCard
          icon={<Users color="rgba(255,255,255,0.6)" size={22} />}
          value={stats.noshers}
          label="Noshers Hosted"
        />
        <StatCard
          icon={<Gem color="rgba(255,255,255,0.6)" size={22} />}
          value={stats.totalTags}
          label="Positive Tags"
        />
      </View>

      {Object.keys(stats.tags).length > 0 && (
        <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
          <Text className="mb-4 font-semibold text-white">Your Nosh Reputation Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(stats.tags)
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
    </View>
  );
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

function ReputationTab({ profile }: { profile: Profile }) {
  const currentTier = tierForScore(profile.reputation_score);
  return (
    <View className="gap-6">
      <ReputationCard score={profile.reputation_score} />
      <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
        <Text className="mb-4 text-lg font-bold text-white">Nosh Reputation Milestones</Text>
        <View className="gap-3">
          {[...REPUTATION_TIERS].reverse().map((m) => {
            const unlocked = profile.reputation_score >= m.threshold;
            const Icon = m.icon;
            return (
              <View
                key={m.name}
                className={`flex-row items-center justify-between rounded-xl border p-4 ${
                  unlocked ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      unlocked ? 'bg-green-500/20' : 'bg-white/10'
                    }`}
                  >
                    <Icon color={unlocked ? '#86efac' : 'rgba(255,255,255,0.3)'} size={20} />
                  </View>
                  <View>
                    <Text
                      className={`font-semibold ${unlocked ? 'text-green-300' : 'text-white/60'}`}
                    >
                      {m.name}
                      {m.name === currentTier.name ? '  • Current' : ''}
                    </Text>
                    <Text className="text-xs text-white/50">Reputation {m.threshold}+</Text>
                  </View>
                </View>
                {unlocked && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                    <Check color="#4ade80" size={12} strokeWidth={3} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function NotificationsTab({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFS,
    ...((profile.notification_preferences ?? {}) as Partial<NotificationPreferences>),
  });

  const persist = (next: NotificationPreferences) => {
    setPrefs(next);
    updateProfile.mutate({ notification_preferences: next });
  };
  const set = <K extends keyof NotificationPreferences>(k: K, v: NotificationPreferences[K]) =>
    persist({ ...prefs, [k]: v });
  const toggleArr = (k: 'notify_cuisines' | 'notify_price_ranges', v: string) =>
    persist({
      ...prefs,
      [k]: prefs[k].includes(v) ? prefs[k].filter((x) => x !== v) : [...prefs[k], v],
    });

  return (
    <View className="gap-6">
      <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {prefs.enabled ? (
              <Bell color="#fff" size={22} />
            ) : (
              <BellOff color="rgba(255,255,255,0.4)" size={22} />
            )}
            <View>
              <Text className="text-lg font-bold text-white">Event Notifications</Text>
              <Text className="text-sm text-white/60">
                {prefs.enabled ? 'Notifications are on' : 'Notifications are off'}
              </Text>
            </View>
          </View>
          <Toggle value={prefs.enabled} onChange={(v) => set('enabled', v)} />
        </View>
        <View className="mt-4 rounded-xl border border-blue-400/30 bg-blue-500/15 p-3">
          <Text className="text-xs text-blue-100">
            Preferences are saved now; delivery (push/email) ships in a later phase.
          </Text>
        </View>
      </View>

      {prefs.enabled && (
        <>
          <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="mb-2 text-lg font-bold text-white">Cuisine Preferences</Text>
            <Text className="mb-4 text-sm text-white/60">
              Get notified for events featuring these cuisines
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={prefs.notify_cuisines.includes(c)}
                  onPress={() => toggleArr('notify_cuisines', c)}
                />
              ))}
            </View>
          </View>

          <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="mb-2 text-lg font-bold text-white">Price Range</Text>
            <Text className="mb-4 text-sm text-white/60">
              Only notify for events in these ranges
            </Text>
            <View className="flex-row gap-2">
              {PRICE_RANGES.map((p) => {
                const active = prefs.notify_price_ranges.includes(p);
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => toggleArr('notify_price_ranges', p)}
                    activeOpacity={0.8}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      active ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Text className={`font-bold ${active ? 'text-white' : 'text-white/60'}`}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="mb-4 text-lg font-bold text-white">Special Notifications</Text>
            <View className="gap-4">
              <ToggleRow
                title="Events from Connections"
                subtitle="When people you're connected with host events"
                value={prefs.connections_events}
                onChange={(v) => set('connections_events', v)}
              />
              <ToggleRow
                title="Last-Minute Openings"
                subtitle="When seats open up in events you might like"
                value={prefs.last_minute_openings}
                onChange={(v) => set('last_minute_openings', v)}
              />
              <ToggleRow
                title="All New Events in Your Area"
                subtitle="Any new event posted near you"
                value={prefs.new_in_area}
                onChange={(v) => set('new_in_area', v)}
              />
              <ToggleRow
                title="Only Within My Preferred Distance"
                subtitle="Limit notifications to nearby events"
                value={prefs.within_distance_only}
                onChange={(v) => set('within_distance_only', v)}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <View className="mr-4 flex-1">
        <Text className="mb-1 text-sm font-medium text-white">{title}</Text>
        <Text className="text-xs text-white/60">{subtitle}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

function ConnectionsTab({ profile }: { profile: Profile }) {
  const manage = useManageConnection();
  const ids = useMemo(
    () => Array.from(new Set([...profile.connections, ...profile.connection_requests])),
    [profile.connections, profile.connection_requests],
  );
  const { data: people = [] } = useProfilesByIds(ids);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const requests = profile.connection_requests
    .map((id) => byId.get(id))
    .filter(Boolean) as Profile[];
  const connections = profile.connections.map((id) => byId.get(id)).filter(Boolean) as Profile[];

  return (
    <View className="gap-6">
      {requests.length > 0 && (
        <View className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <Text className="mb-4 font-semibold text-amber-200">
            Connection Requests ({requests.length})
          </Text>
          <View className="gap-3">
            {requests.map((u) => (
              <View key={u.id} className="flex-row items-center gap-3 rounded-xl bg-black/20 p-3">
                <Avatar
                  uri={u.avatar_url}
                  fallback={(u.full_name?.charAt(0) ?? 'U').toUpperCase()}
                  size={40}
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-white">{u.full_name ?? u.email}</Text>
                  <Text className="text-xs text-white/50">Wants to connect</Text>
                </View>
                <TouchableOpacity
                  onPress={() => manage.mutate({ targetUserId: u.id, action: 'accept' })}
                  className="rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2"
                >
                  <Text className="text-sm text-green-300">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => manage.mutate({ targetUserId: u.id, action: 'reject' })}
                  className="p-2"
                >
                  <X color="rgba(255,255,255,0.5)" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
        <Text className="mb-4 font-semibold text-white">My Connections ({connections.length})</Text>
        {connections.length === 0 ? (
          <Text className="py-8 text-center text-sm text-white/60">
            No connections yet. Connect with people you&apos;ve dined with!
          </Text>
        ) : (
          <View className="gap-3">
            {connections.map((u) => (
              <View key={u.id} className="flex-row items-center gap-3 rounded-xl bg-white/5 p-3">
                <Avatar
                  uri={u.avatar_url}
                  fallback={(u.full_name?.charAt(0) ?? 'U').toUpperCase()}
                  size={40}
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-white">{u.full_name ?? u.email}</Text>
                  <Text className="text-xs text-white/50">{u.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => manage.mutate({ targetUserId: u.id, action: 'remove' })}
                  className="rounded-lg border border-white/20 bg-white/5 p-2"
                  accessibilityLabel="Remove connection"
                >
                  <UserX color="rgba(255,255,255,0.6)" size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function PrivacyTab({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const ids = useMemo(
    () => Array.from(new Set([...profile.blocked_users, ...profile.muted_users])),
    [profile.blocked_users, profile.muted_users],
  );
  const { data: people = [] } = useProfilesByIds(ids);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const blocked = profile.blocked_users.map((id) => byId.get(id)).filter(Boolean) as Profile[];
  const muted = profile.muted_users.map((id) => byId.get(id)).filter(Boolean) as Profile[];

  const unblock = (id: string) =>
    updateProfile.mutate({ blocked_users: profile.blocked_users.filter((x) => x !== id) });
  const unmute = (id: string) =>
    updateProfile.mutate({ muted_users: profile.muted_users.filter((x) => x !== id) });

  return (
    <View className="gap-4">
      <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
        <View className="mb-2 flex-row items-center gap-2">
          <UserX color="rgba(255,255,255,0.6)" size={20} />
          <Text className="font-semibold text-white">Blocked Users</Text>
        </View>
        <Text className="mb-4 text-xs text-white/60">
          These users can&apos;t see your profile or invite you to events
        </Text>
        {blocked.length === 0 ? (
          <Text className="py-4 text-center text-sm text-white/60">No blocked users</Text>
        ) : (
          <View className="gap-2">
            {blocked.map((u) => (
              <View
                key={u.id}
                className="flex-row items-center justify-between rounded-xl bg-white/5 p-3"
              >
                <Text className="text-sm text-white">{u.full_name ?? u.email}</Text>
                <TouchableOpacity
                  onPress={() => unblock(u.id)}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5"
                >
                  <Text className="text-sm text-white">Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
        <View className="mb-2 flex-row items-center gap-2">
          <VolumeX color="rgba(255,255,255,0.6)" size={20} />
          <Text className="font-semibold text-white">Muted Users</Text>
        </View>
        <Text className="mb-4 text-xs text-white/60">
          You won&apos;t see their events or updates
        </Text>
        {muted.length === 0 ? (
          <Text className="py-4 text-center text-sm text-white/60">No muted users</Text>
        ) : (
          <View className="gap-2">
            {muted.map((u) => (
              <View
                key={u.id}
                className="flex-row items-center justify-between rounded-xl bg-white/5 p-3"
              >
                <Text className="text-sm text-white">{u.full_name ?? u.email}</Text>
                <TouchableOpacity
                  onPress={() => unmute(u.id)}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5"
                >
                  <Text className="text-sm text-white">Unmute</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
