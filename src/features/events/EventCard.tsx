import { differenceInHours, format } from 'date-fns';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, DollarSign, Flame, type LucideIcon, Users, Utensils } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { EventRow } from '@/features/events/useEvents';
import { noshColors } from '@/theme/nosh';

type HostTag = { tag: string; count?: number } | string;

/** "Christopher Moreno" -> "Christopher M." */
function shortName(name?: string | null) {
  if (!name) return 'Host';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function Chip({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'rep' }) {
  if (tone === 'rep') {
    return (
      <View className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5">
        <Text className="text-xs text-green-300">{label}</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      <Text className="text-xs font-medium text-white/70">{label}</Text>
    </View>
  );
}

const BADGE_TONES = {
  live: { bg: '#dc2626', fg: '#ffffff' },
  amber: { bg: '#f59e0b', fg: '#3d2102' },
  purple: { bg: '#5e4f73', fg: '#ffffff' },
  white: { bg: '#ffffff', fg: '#590219' },
  red: { bg: '#dc2626', fg: '#ffffff' },
} as const;

function InfoCell({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={{ flex: 1 }} className="flex-row items-center">
      <Icon color="rgba(255,255,255,0.5)" size={16} />
      <Text style={{ flex: 1, marginLeft: 8 }} className="text-sm text-white/70" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: keyof typeof BADGE_TONES }) {
  const { bg, fg } = BADGE_TONES[tone];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 5,
      }}
      className="flex-row items-center justify-center gap-1 rounded-full border"
    >
      {tone === 'live' && <Flame color={fg} size={12} />}
      <Text style={{ color: fg }} className="text-xs font-semibold">
        {label}
      </Text>
    </View>
  );
}

export function EventCard({ event }: { event: EventRow }) {
  const router = useRouter();

  const attendees = Array.isArray(event.attendees) ? (event.attendees as unknown[]) : [];
  const maxSeats = Math.max(2, event.max_seats || 2);
  const seatsTaken = Math.min(event.seats_taken || attendees.length || 0, maxSeats);
  const seatsLeft = Math.max(0, maxSeats - seatsTaken);
  const waitlistCount = Array.isArray(event.waitlist) ? (event.waitlist as unknown[]).length : 0;

  const hoursUntil = event.date_time
    ? differenceInHours(new Date(event.date_time), new Date())
    : null;
  const vibe = event.vibe ?? [];
  const intents = event.host_intent_tags ?? [];
  const repTags = (event.host_reputation_tags as unknown as HostTag[]) ?? [];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/event/${event.id}`)}
      className="w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10"
    >
      {/* Cover */}
      <View style={{ height: 176 }}>
        {event.image_url ? (
          <Image
            source={{ uri: event.image_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <LinearGradient
            colors={noshColors.accentGradient}
            style={{ width: '100%', height: '100%' }}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.55)']}
          locations={[0, 0.45, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
        />
        <View style={{ position: 'absolute', top: 12, right: 12 }} className="items-end gap-2">
          {event.status === 'live' ? (
            <Badge label="Noshing Now" tone="live" />
          ) : hoursUntil !== null && hoursUntil > 0 && hoursUntil <= 24 ? (
            <Badge label="Seating Soon" tone="amber" />
          ) : null}
          {event.allow_latecomers && <Badge label="Latecomers OK" tone="purple" />}
          {event.status === 'upcoming' && seatsLeft > 0 && (
            <Badge label={`${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`} tone="white" />
          )}
          {event.status === 'upcoming' && seatsLeft === 0 && (
            <Badge
              label={waitlistCount > 0 ? `Full • ${waitlistCount} waiting` : 'Full'}
              tone="red"
            />
          )}
        </View>
      </View>

      {/* Body */}
      <View className="p-5">
        <Text className="text-xl font-semibold leading-snug text-white" numberOfLines={2}>
          {event.title}
        </Text>

        {(event.lgbtq_only || event.lgbtq_friendly) && (
          <View className="mt-2 flex-row">
            <View className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-1">
              <Text className="text-xs font-medium text-purple-200">
                {event.lgbtq_only ? '🏳️‍⚧️ LGBTQ+ Only' : '🏳️‍🌈 LGBTQ+ Friendly'}
              </Text>
            </View>
          </View>
        )}

        {!!event.venue_name && (
          <Text className="mt-2 text-sm text-white/60" numberOfLines={1}>
            {event.venue_name}
          </Text>
        )}
        {event.venue_type === 'custom' && (
          <Text className="mt-1 text-xs text-white/50">📍 Custom Location</Text>
        )}

        {vibe.length > 0 && (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {vibe.slice(0, 3).map((v) => (
              <Chip key={v} label={v} />
            ))}
          </View>
        )}

        {/* Info grid: 2 columns × 2 rows */}
        <View className="mt-4" style={{ rowGap: 12 }}>
          <View className="flex-row" style={{ columnGap: 12 }}>
            <InfoCell
              icon={Clock}
              text={event.date_time ? format(new Date(event.date_time), 'MMM d, h:mm a') : 'TBD'}
            />
            <InfoCell icon={Users} text={`${seatsTaken}/${maxSeats} joined`} />
          </View>
          <View className="flex-row" style={{ columnGap: 12 }}>
            <InfoCell icon={DollarSign} text={event.price_range || '—'} />
            <InfoCell icon={Utensils} text={event.cuisine_type || 'Various'} />
          </View>
        </View>

        {intents.length > 0 && (
          <View className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <Text className="text-xs text-white/70" numberOfLines={1}>
              Looking for: {intents.slice(0, 2).join(', ')}
            </Text>
          </View>
        )}

        {/* Host row */}
        <View className="mt-4 border-t border-white/10 pt-4">
          <View className="flex-row items-center gap-3">
            <View
              style={{ width: 44, height: 44, borderRadius: 22, flexShrink: 0 }}
              className="items-center justify-center overflow-hidden bg-nosh-maroon"
            >
              {event.host_avatar ? (
                <Image
                  source={{ uri: event.host_avatar }}
                  style={{ width: 44, height: 44 }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-base font-bold text-white">
                  {event.host_name?.charAt(0)?.toUpperCase() ?? 'H'}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-white/90" numberOfLines={1}>
                {shortName(event.host_name)}
              </Text>
              {repTags.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {repTags.slice(0, 2).map((t, i) => {
                    const label =
                      typeof t === 'string' ? t : t.count ? `${t.tag} ×${t.count}` : t.tag;
                    return <Chip key={`${label}-${i}`} label={label} tone="rep" />;
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
