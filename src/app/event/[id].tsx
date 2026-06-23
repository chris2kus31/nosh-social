import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Pencil,
  Share2,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type Attendee,
  type EventRow,
  type HostTag,
  type Waiter,
  useApproveWaitlist,
  useEvent,
  useJoinEvent,
  useJoinWaitlist,
  useLeaveEvent,
  useRejectWaitlist,
} from '@/features/events/useEvent';
import { useAuthStore } from '@/stores/auth';
import { noshColors } from '@/theme/nosh';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-white/20 bg-white/10 p-5 ${className}`}>
      {children}
    </View>
  );
}

/** Frosted-glass circular icon button: blur + glossy top sheen + bright rim. */
function GlassIconButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ width: 40, height: 40, borderRadius: 20 }}
      className="overflow-hidden border border-white/40"
    >
      <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-1 items-center justify-center">{children}</View>
    </TouchableOpacity>
  );
}

function TagPill({ label, count }: { label: string; count?: number | null }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
      <Text className="text-xs font-medium text-green-300">{label}</Text>
      {count ? <Text className="text-xs text-green-300/70">×{count}</Text> : null}
    </View>
  );
}

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: event, isLoading, error } = useEvent(id);
  const join = useJoinEvent(id);
  const leave = useLeaveEvent(id);
  const joinWaitlist = useJoinWaitlist(id);
  const approve = useApproveWaitlist(id);
  const reject = useRejectWaitlist(id);

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

  if (error || !event) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-white/70">Event not found</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/discover')}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-3"
          >
            <Text className="text-white">Back to Discover</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const attendees = (event.attendees as unknown as Attendee[]) ?? [];
  const waitlist = (event.waitlist as unknown as Waiter[]) ?? [];
  const hostTags = (event.host_reputation_tags as unknown as HostTag[]) ?? [];
  const intents = event.host_intent_tags ?? [];
  const vibe = event.vibe ?? [];

  const maxSeats = event.max_seats || 2;
  const seatsTaken = attendees.length;
  const seatsLeft = Math.max(0, maxSeats - seatsTaken);
  const durationDisplay =
    event.duration_type === 'open-ended'
      ? 'Open-ended'
      : `${Math.floor((event.duration_minutes || 0) / 60)}h`;

  const isHost = userId === event.host_id;
  const isAttendee = attendees.some((a) => a.user_id === userId);
  const isOnWaitlist = waitlist.some((w) => w.user_id === userId);

  const onShare = () => {
    Share.share({
      message: `Join me at ${event.venue_name}! noshsocial://event/${event.id}`,
    }).catch(() => {});
  };
  const openUrl = (url?: string | null) => url && Linking.openURL(url).catch(() => {});
  const onJoinError = (e: unknown) => Alert.alert('Could not join', (e as Error).message);

  const confirmLeave = () =>
    Alert.alert('Leave this Nosh?', 'You can re-join later if seats are open.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leave.mutate() },
    ]);

  const busy = join.isPending || leave.isPending || joinWaitlist.isPending;

  return (
    <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero */}
        <View style={{ height: 320 }}>
          {event.image_url ? (
            <Image
              source={{ uri: event.image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={noshColors.accentGradient}
              style={{ width: '100%', height: '100%' }}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
            style={{ position: 'absolute', inset: 0 }}
          />

          <View
            style={{ position: 'absolute', top: insets.top + 16, left: 16, right: 16 }}
            className="flex-row justify-between"
          >
            <GlassIconButton onPress={goBack}>
              <ArrowLeft color="#fff" size={20} />
            </GlassIconButton>
            <View className="flex-row gap-2">
              {isHost && (
                <GlassIconButton onPress={() => router.push(`/event/edit/${event.id}`)}>
                  <Pencil color="#fff" size={18} />
                </GlassIconButton>
              )}
              <GlassIconButton onPress={onShare}>
                <Share2 color="#fff" size={18} />
              </GlassIconButton>
            </View>
          </View>

          <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {seatsLeft > 0 ? (
                <Badge text={`${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`} />
              ) : (
                <Badge text={`Full (${waitlist.length} on waitlist)`} tone="red" />
              )}
              {event.allow_latecomers && <Badge text="Latecomers OK" tone="purple" />}
              {event.is_private && <Badge text="Private Event" tone="amber" />}
            </View>
            <Text className="text-3xl font-bold text-white">{event.title}</Text>
            {!!event.venue_name && (
              <Text className="mt-1 text-lg text-white/90">{event.venue_name}</Text>
            )}
            {!!event.venue_address && (
              <View className="mt-1 flex-row items-center gap-2">
                <MapPin color="rgba(255,255,255,0.7)" size={14} />
                <Text className="flex-1 text-sm text-white/70">{event.venue_address}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="gap-6 p-5">
          {/* Quick info */}
          <View className="flex-row flex-wrap gap-3">
            <InfoTile>
              <Clock color="rgba(255,255,255,0.6)" size={18} />
              <Text className="mt-2 text-sm font-medium text-white">
                {event.date_time ? format(new Date(event.date_time), 'MMM d') : 'TBD'}
              </Text>
              <Text className="text-xs text-white/70">
                {event.date_time ? format(new Date(event.date_time), 'h:mm a') : ''}
              </Text>
            </InfoTile>
            <InfoTile>
              <Users color="rgba(255,255,255,0.6)" size={18} />
              <Text className="mt-2 text-sm font-medium text-white">
                {seatsTaken}/{maxSeats} Joined
              </Text>
              <Text className="text-xs text-white/70">{durationDisplay}</Text>
            </InfoTile>
            <InfoTile>
              <Text className="text-sm font-medium text-white">{event.price_range}</Text>
              <Text className="text-xs text-white/70">{event.cuisine_type || 'Various'}</Text>
            </InfoTile>
            <InfoTile>
              <MapPin color="rgba(255,255,255,0.6)" size={18} />
              <Text className="mt-2 text-xs text-white/70">
                {event.rating && event.rating > 0 ? `${event.rating.toFixed(1)} ⭐` : 'Location'}
              </Text>
            </InfoTile>
          </View>

          {vibe.length > 0 && (
            <View>
              <Text className="mb-3 font-semibold text-white">Vibe</Text>
              <View className="flex-row flex-wrap gap-2">
                {vibe.map((v) => (
                  <View
                    key={v}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <Text className="text-sm text-white/80">{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Host */}
          <Card>
            <Text className="mb-4 font-semibold text-white">Your Host</Text>
            <View className="flex-row items-start gap-4">
              <View
                style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0 }}
                className="items-center justify-center overflow-hidden bg-nosh-maroon"
              >
                {event.host_avatar ? (
                  <Image
                    source={{ uri: event.host_avatar }}
                    style={{ width: 64, height: 64 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-xl font-bold text-white">
                    {event.host_name?.charAt(0)?.toUpperCase() ?? 'H'}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-lg font-medium text-white">
                  {event.host_name ?? 'Host'}
                </Text>
                {hostTags.length > 0 && (
                  <View className="mb-2 flex-row flex-wrap gap-1.5">
                    {hostTags.map((t) => (
                      <TagPill key={t.tag} label={t.tag} count={t.count} />
                    ))}
                  </View>
                )}
                {!!event.host_bio && (
                  <Text className="text-sm leading-relaxed text-white/70">{event.host_bio}</Text>
                )}
              </View>
            </View>
          </Card>

          {intents.length > 0 && (
            <Card>
              <View className="mb-3 flex-row items-center gap-2">
                <Sparkles color="rgba(255,255,255,0.6)" size={16} />
                <Text className="font-semibold text-white">What the Host is Looking For</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {intents.map((i) => (
                  <View
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
                  >
                    <Text className="text-xs text-white/80">{i}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {!!event.description && (
            <Card>
              <View className="mb-3 flex-row items-center gap-2">
                <Info color="rgba(255,255,255,0.6)" size={16} />
                <Text className="font-semibold text-white">About this Nosh</Text>
              </View>
              <Text className="text-sm leading-relaxed text-white/80">{event.description}</Text>
            </Card>
          )}

          {!!event.icebreaker && (
            <Card>
              <View className="mb-3 flex-row items-center gap-2">
                <Sparkles color="rgba(255,255,255,0.6)" size={16} />
                <Text className="font-semibold text-white">Icebreaker</Text>
              </View>
              <Text className="text-sm italic leading-relaxed text-white/80">
                “{event.icebreaker}”
              </Text>
            </Card>
          )}

          {!!event.topics_to_avoid && (
            <Card>
              <Text className="mb-3 font-semibold text-white">Topics We’d Like to Avoid</Text>
              <Text className="text-sm leading-relaxed text-white/80">{event.topics_to_avoid}</Text>
            </Card>
          )}

          {/* Location links */}
          {(event.map_link || event.review_link) && (
            <Card>
              <Text className="mb-1 font-semibold text-white">{event.venue_name}</Text>
              {!!event.venue_address && (
                <Text className="mb-4 text-sm text-white/80">{event.venue_address}</Text>
              )}
              <View className="flex-row gap-3">
                {!!event.map_link && (
                  <TouchableOpacity
                    onPress={() => openUrl(event.map_link)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3"
                  >
                    <MapPin color="#fff" size={16} />
                    <Text className="text-sm font-medium text-white">View Map</Text>
                    <ExternalLink color="#fff" size={12} />
                  </TouchableOpacity>
                )}
                {!!event.review_link && (
                  <TouchableOpacity
                    onPress={() => openUrl(event.review_link)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3"
                  >
                    <Text className="text-sm font-medium text-white">Reviews</Text>
                    <ExternalLink color="#fff" size={12} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          {/* Waitlist (host or member) */}
          {(isHost || isOnWaitlist) && waitlist.length > 0 && (
            <View className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <View className="mb-4 flex-row items-center gap-2">
                <Clock color="#fcd34d" size={18} />
                <Text className="font-semibold text-amber-200">Waitlist ({waitlist.length})</Text>
              </View>
              <View className="gap-3">
                {waitlist.map((w) => (
                  <View
                    key={w.user_id}
                    className="flex-row items-center justify-between rounded-xl bg-black/20 p-3"
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0 }}
                        className="items-center justify-center bg-white/10"
                      >
                        <Text className="text-sm text-white">
                          {w.user_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium text-white">{w.user_name}</Text>
                    </View>
                    {isHost ? (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => approve.mutate(w.user_id, { onError: onJoinError })}
                          className="rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2"
                        >
                          <Text className="text-sm text-green-300">Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => reject.mutate(w.user_id)} className="p-2">
                          <X color="rgba(255,255,255,0.5)" size={18} />
                        </TouchableOpacity>
                      </View>
                    ) : w.user_id === userId ? (
                      <View className="rounded bg-amber-500/20 px-2 py-1">
                        <Text className="text-xs text-amber-300">Pending</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Who's coming */}
          {attendees.length > 0 && (
            <Card>
              <Text className="mb-4 font-semibold text-white">
                Who’s Coming ({attendees.length})
              </Text>
              <View className="gap-3">
                {attendees.map((a) => {
                  const status = ARRIVAL[a.arrival_status ?? 'on_the_way'];
                  const StatusIcon = status.icon;
                  return (
                    <View
                      key={a.user_id}
                      className="flex-row items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <View
                        style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
                        className="items-center justify-center overflow-hidden bg-nosh-plum"
                      >
                        {a.avatar ? (
                          <Image
                            source={{ uri: a.avatar }}
                            style={{ width: 48, height: 48 }}
                            contentFit="cover"
                          />
                        ) : (
                          <Text className="text-sm font-semibold text-white">
                            {a.name?.charAt(0)?.toUpperCase() ?? 'A'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="mb-1 flex-row items-center justify-between">
                          <Text className="text-sm font-medium text-white">{a.name}</Text>
                          <View
                            className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${status.bg}`}
                          >
                            <StatusIcon color={status.color} size={12} />
                            <Text style={{ color: status.color }} className="text-[10px]">
                              {status.label}
                            </Text>
                          </View>
                        </View>
                        {!!a.bio && (
                          <Text className="mb-2 text-xs text-white/50" numberOfLines={2}>
                            {a.bio}
                          </Text>
                        )}
                        {a.traits?.length > 0 && (
                          <View className="flex-row flex-wrap gap-1">
                            {a.traits.slice(0, 3).map((t) => (
                              <TagPill key={t.tag} label={t.tag} count={t.count} />
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Action button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 20,
          paddingTop: 12,
        }}
      >
        <ActionButton
          event={event}
          isHost={isHost}
          isAttendee={isAttendee}
          isOnWaitlist={isOnWaitlist}
          seatsLeft={seatsLeft}
          busy={busy}
          onJoin={() => join.mutate(undefined, { onError: onJoinError })}
          onWaitlist={() => joinWaitlist.mutate(undefined, { onError: onJoinError })}
          onLeave={confirmLeave}
        />
      </View>
    </LinearGradient>
  );
}

const ARRIVAL: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  arrived: { icon: CheckCircle2, color: '#4ade80', bg: 'bg-green-500/20', label: 'Arrived' },
  on_the_way: { icon: Clock, color: '#60a5fa', bg: 'bg-blue-500/20', label: 'On Way' },
  late: { icon: AlertCircle, color: '#fbbf24', bg: 'bg-amber-500/20', label: 'Late' },
};

function Badge({
  text,
  tone = 'white',
}: {
  text: string;
  tone?: 'white' | 'red' | 'amber' | 'purple';
}) {
  const tones = {
    white: 'border-white/30 bg-white/20 text-white',
    red: 'border-red-500/30 bg-red-500/20 text-red-300',
    amber: 'border-amber-400/50 bg-amber-500/30 text-amber-200',
    purple: 'border-purple-400/30 bg-purple-500/20 text-white',
  }[tone];
  const [border, bg, textColor] = tones.split(' ');
  return (
    <View className={`rounded-full border px-3 py-1 ${border} ${bg}`}>
      <Text className={`text-xs font-medium ${textColor}`}>{text}</Text>
    </View>
  );
}

function InfoTile({ children }: { children: React.ReactNode }) {
  return (
    <View className="min-w-[47%] flex-1 rounded-2xl border border-white/20 bg-white/10 p-5">
      {children}
    </View>
  );
}

function ActionButton({
  event,
  isHost,
  isAttendee,
  isOnWaitlist,
  seatsLeft,
  busy,
  onJoin,
  onWaitlist,
  onLeave,
}: {
  event: EventRow;
  isHost: boolean;
  isAttendee: boolean;
  isOnWaitlist: boolean;
  seatsLeft: number;
  busy: boolean;
  onJoin: () => void;
  onWaitlist: () => void;
  onLeave: () => void;
}) {
  if (event.status === 'completed') {
    return <PrimaryButton label="Event Completed" disabled onPress={() => {}} />;
  }
  if (event.status === 'live') {
    return (
      <PrimaryButton
        label="Event is Live"
        onPress={() =>
          Alert.alert('Live room', 'The live event room (NoshingNow) comes in a later build.')
        }
      />
    );
  }
  if (isHost) {
    return <PrimaryButton label="You’re the Host" disabled onPress={() => {}} />;
  }
  if (isAttendee) {
    return (
      <View className="gap-2">
        <PrimaryButton label="You’re Going ✓" tone="green" disabled onPress={() => {}} />
        <TouchableOpacity onPress={onLeave} className="items-center py-1">
          <Text className="text-sm text-white/60">Leave this Nosh</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isOnWaitlist) {
    return <PrimaryButton label="On Waitlist" tone="amber" disabled onPress={() => {}} />;
  }
  if (seatsLeft === 0) {
    return <PrimaryButton label="Join Waitlist" tone="amber" busy={busy} onPress={onWaitlist} />;
  }
  return (
    <PrimaryButton
      label={`Join This Nosh • ${seatsLeft} ${seatsLeft === 1 ? 'Seat' : 'Seats'} Left`}
      busy={busy}
      onPress={onJoin}
    />
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
  tone = 'white',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'white' | 'green' | 'amber';
}) {
  const bg = {
    white: 'bg-white',
    green: 'bg-green-500/25 border border-green-500/40',
    amber: 'bg-amber-500/25 border border-amber-500/40',
  }[tone];
  const textColor = tone === 'white' ? 'text-nosh-maroon' : 'text-white';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.9}
      className={`h-14 flex-row items-center justify-center rounded-2xl ${bg} ${disabled || busy ? 'opacity-60' : ''}`}
    >
      {busy ? (
        <ActivityIndicator color={tone === 'white' ? '#590219' : '#fff'} />
      ) : (
        <Text className={`text-lg font-semibold ${textColor}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
