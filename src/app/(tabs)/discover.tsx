import { isThisWeek, isToday, isTomorrow } from 'date-fns';
import {
  Calendar,
  ChevronDown,
  Coffee,
  Filter,
  Flame,
  type LucideIcon,
  Moon,
  Sparkles,
  Sun,
  Wine,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { EventCard } from '@/features/events/EventCard';
import { useEvents, type EventRow } from '@/features/events/useEvents';
import { useMyProfile } from '@/features/profile/useProfile';
import { useAuthStore } from '@/stores/auth';
import { HOST_INTENTS, PRICE_RANGES, VIBES } from '@/theme/nosh';

const CARD_WIDTH = 300;

const TAGLINES = [
  'Find your perfect dining companions',
  'Connect over incredible food',
  'Turn strangers into dining buddies',
  'Every meal deserves great company',
  'Where strangers become friends',
];

const GROUP_SIZES = [
  { key: 'small', label: '2-4 people' },
  { key: 'medium', label: '5-8 people' },
  { key: 'large', label: '9+ people' },
] as const;
type GroupSize = (typeof GROUP_SIZES)[number]['key'];

const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this_week', label: 'This Week' },
] as const;
type DateFilterKey = (typeof DATE_FILTERS)[number]['key'];

type Filters = {
  price: string[];
  groupSize: GroupSize | null;
  vibes: string[];
  intents: string[];
};
const EMPTY_FILTERS: Filters = { price: [], groupSize: null, vibes: [], intents: [] };

type Attendee = { user_id: string };
const attendeesOf = (e: EventRow) =>
  Array.isArray(e.attendees) ? (e.attendees as unknown as Attendee[]) : [];
const hourOf = (e: EventRow) => (e.date_time ? new Date(e.date_time).getHours() : -1);
const isUpcoming = (e: EventRow) => e.status === 'upcoming';
const inGroupSize = (seats: number, size: GroupSize) =>
  size === 'small'
    ? seats >= 2 && seats <= 4
    : size === 'medium'
      ? seats >= 5 && seats <= 8
      : seats >= 9;

function Pill({
  label,
  active,
  onPress,
  size = 'sm',
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}) {
  const pad = size === 'md' ? 'px-4 py-2' : 'px-3 py-1.5';
  const text = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-full border ${pad} ${active ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'}`}
    >
      <Text className={`${text} font-medium ${active ? 'text-white' : 'text-white/60'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterDropdown({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center justify-between p-3.5"
      >
        <Text className="text-sm font-medium text-white">{title}</Text>
        <View className="flex-row items-center gap-2">
          {!!summary && <Text className="text-xs text-white/60">{summary}</Text>}
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <ChevronDown color="rgba(255,255,255,0.6)" size={18} />
          </View>
        </View>
      </TouchableOpacity>
      {open && <View className="flex-row flex-wrap gap-2 px-3.5 pb-3.5">{children}</View>}
    </View>
  );
}

function Carousel({
  title,
  icon: Icon,
  color,
  events,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  events: EventRow[];
}) {
  if (events.length === 0) return null;
  return (
    <View className="mt-8">
      <View className="mb-4 flex-row items-center gap-2 px-5">
        <Icon color={color} size={20} />
        <Text className="text-xl font-bold text-white">{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
      >
        {events.map((event) => (
          <View key={`${title}-${event.id}`} style={{ width: CARD_WIDTH }}>
            <EventCard event={event} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Grid({ events, columns }: { events: EventRow[]; columns: number }) {
  const rows: EventRow[][] = [];
  for (let i = 0; i < events.length; i += columns) rows.push(events.slice(i, i + columns));

  return (
    <View className="mt-4 gap-4 px-5">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-4">
          {row.map((event) => (
            <View key={event.id} className="flex-1">
              <EventCard event={event} />
            </View>
          ))}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} className="flex-1" />
            ))}
        </View>
      ))}
    </View>
  );
}

export default function Discover() {
  const { data, isLoading, error, refetch, isRefetching } = useEvents();
  const { data: profile } = useMyProfile();
  const userId = useAuthStore((s) => s.user?.id);
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 700 ? 2 : 1;

  const [dateFilter, setDateFilter] = useState<DateFilterKey | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTaglineIndex((i) => (i + 1) % TAGLINES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const events = useMemo(() => data ?? [], [data]);

  const toggleArray = (key: 'price' | 'vibes' | 'intents', value: string) =>
    setFilters((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));

  const activeCount =
    filters.price.length +
    filters.vibes.length +
    filters.intents.length +
    (filters.groupSize ? 1 : 0) +
    (dateFilter ? 1 : 0);
  const hasFilters = activeCount > 0;

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setDateFilter(null);
  };

  const recommended = useMemo(() => {
    if (!profile) return [];
    const favorites = profile.favorite_cuisines ?? [];
    const connections = profile.connections ?? [];
    return events
      .filter((e) => isUpcoming(e) && !attendeesOf(e).some((a) => a.user_id === userId))
      .map((event) => {
        let score = 0;
        if (event.cuisine_type && favorites.includes(event.cuisine_type)) score += 3;
        if (connections.includes(event.host_id)) score += 5;
        return { event, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.event);
  }, [events, profile, userId]);

  const trending = useMemo(
    () =>
      events
        .filter((e) => isUpcoming(e) && (e.seats_taken || 0) > 0)
        .sort((a, b) => (b.seats_taken || 0) - (a.seats_taken || 0))
        .slice(0, 5),
    [events],
  );

  const categories = useMemo(() => {
    const upcoming = events.filter(isUpcoming).filter((e) => e.date_time);
    const onDate = (pred: (d: Date) => boolean) =>
      upcoming.filter((e) => pred(new Date(e.date_time as string)));
    return {
      tonight: onDate(isToday),
      tomorrow: onDate(isTomorrow),
      thisWeek: onDate((d) => isThisWeek(d) && !isToday(d) && !isTomorrow(d)),
      earlyRisers: upcoming.filter((e) => {
        const h = hourOf(e);
        const text = `${e.title ?? ''} ${e.description ?? ''}`.toLowerCase();
        return (
          (h >= 5 && h < 11) || text.includes('coffee') || (e.vibe ?? []).includes('Brunch Vibes')
        );
      }),
      happyHour: upcoming.filter((e) => {
        const h = hourOf(e);
        const vibe = e.vibe ?? [];
        return (
          (h >= 16 && h < 19) ||
          vibe.includes('Cocktails & Drinks') ||
          vibe.includes('Wine Focused') ||
          (e.title ?? '').toLowerCase().includes('happy hour')
        );
      }),
    };
  }, [events]);

  const allUpcoming = useMemo(() => {
    let list = events.filter((e) => e.status === 'upcoming' || e.status === 'live');
    if (dateFilter) {
      list = list.filter((e) => {
        if (!e.date_time) return false;
        const d = new Date(e.date_time);
        if (dateFilter === 'today') return isToday(d);
        if (dateFilter === 'tomorrow') return isTomorrow(d);
        return isThisWeek(d);
      });
    }
    if (filters.price.length)
      list = list.filter((e) => e.price_range && filters.price.includes(e.price_range));
    if (filters.groupSize)
      list = list.filter((e) => inGroupSize(e.max_seats || 0, filters.groupSize as GroupSize));
    if (filters.vibes.length)
      list = list.filter((e) => (e.vibe ?? []).some((v) => filters.vibes.includes(v)));
    if (filters.intents.length)
      list = list.filter((e) =>
        (e.host_intent_tags ?? []).some((t) => filters.intents.includes(t)),
      );
    return list;
  }, [events, dateFilter, filters]);

  return (
    <Screen>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-300">
            Couldn’t load events: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#fff" />
          }
        >
          <View className="px-5 pt-2">
            <Text className="text-center text-3xl font-bold text-white">Discover Noshes</Text>
            <Text className="mt-1 text-center text-sm text-white/70">{TAGLINES[taglineIndex]}</Text>
          </View>

          {/* Filters button */}
          <View className="mt-4 flex-row gap-3 px-5">
            <TouchableOpacity
              onPress={() => setShowFilters((s) => !s)}
              className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border ${showFilters || hasFilters ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'}`}
            >
              <Filter color="#fff" size={16} />
              <Text className="font-medium text-white">Filters</Text>
              {activeCount > 0 && (
                <View className="rounded-full bg-white/30 px-2 py-0.5">
                  <Text className="text-xs font-semibold text-white">{activeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {hasFilters && (
              <TouchableOpacity
                onPress={clearAll}
                className="h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5"
              >
                <X color="#fff" size={18} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick date filters */}
          <View className="mt-3 flex-row px-5" style={{ columnGap: 10 }}>
            {DATE_FILTERS.map((f) => (
              <Pill
                key={f.key}
                size="md"
                label={f.label}
                active={dateFilter === f.key}
                onPress={() => setDateFilter(dateFilter === f.key ? null : f.key)}
              />
            ))}
          </View>

          {/* Filter panel: collapsible dropdowns */}
          {showFilters && (
            <View className="mx-5 mt-4 gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <FilterDropdown title="Price Range" summary={filters.price.join('  ')}>
                {PRICE_RANGES.map((p) => (
                  <Pill
                    key={p}
                    label={p}
                    active={filters.price.includes(p)}
                    onPress={() => toggleArray('price', p)}
                  />
                ))}
              </FilterDropdown>
              <FilterDropdown
                title="Group Size"
                summary={GROUP_SIZES.find((g) => g.key === filters.groupSize)?.label ?? ''}
              >
                {GROUP_SIZES.map((g) => (
                  <Pill
                    key={g.key}
                    label={g.label}
                    active={filters.groupSize === g.key}
                    onPress={() =>
                      setFilters((p) => ({ ...p, groupSize: p.groupSize === g.key ? null : g.key }))
                    }
                  />
                ))}
              </FilterDropdown>
              <FilterDropdown
                title="Vibe"
                summary={filters.vibes.length ? `${filters.vibes.length} selected` : ''}
              >
                {VIBES.map((v) => (
                  <Pill
                    key={v}
                    label={v}
                    active={filters.vibes.includes(v)}
                    onPress={() => toggleArray('vibes', v)}
                  />
                ))}
              </FilterDropdown>
              <FilterDropdown
                title="Looking For"
                summary={filters.intents.length ? `${filters.intents.length} selected` : ''}
              >
                {HOST_INTENTS.map((t) => (
                  <Pill
                    key={t}
                    label={t}
                    active={filters.intents.includes(t)}
                    onPress={() => toggleArray('intents', t)}
                  />
                ))}
              </FilterDropdown>
            </View>
          )}

          {/* Curated shelves (hidden while any filter is active) */}
          {!hasFilters && (
            <>
              <Carousel
                title="Recommended for You"
                icon={Sparkles}
                color="#facc15"
                events={recommended}
              />
              <Carousel
                title="Left to do Tonight"
                icon={Moon}
                color="#818cf8"
                events={categories.tonight}
              />
              <Carousel title="Tomorrow" icon={Sun} color="#fbbf24" events={categories.tomorrow} />
              <Carousel title="Trending Now" icon={Flame} color="#f87171" events={trending} />
              <Carousel
                title="Early Risers & Coffee"
                icon={Coffee}
                color="#fb923c"
                events={categories.earlyRisers}
              />
              <Carousel
                title="Other things this Week"
                icon={Calendar}
                color="#4ade80"
                events={categories.thisWeek}
              />
              <Carousel
                title="Happy Hour Crowd"
                icon={Wine}
                color="#f472b6"
                events={categories.happyHour}
              />
            </>
          )}

          {/* All upcoming (the master list) */}
          <View className="mt-8">
            <Text className="px-5 text-xl font-bold text-white">
              {hasFilters ? 'Results' : 'All Upcoming Noshes'}
            </Text>
            {allUpcoming.length === 0 ? (
              <View className="mt-10 items-center px-6">
                <Text className="text-base font-medium text-white/80">No events found</Text>
                <Text className="mt-1 text-center text-sm text-white/50">
                  {hasFilters ? 'Try adjusting your filters' : 'Be the first to host!'}
                </Text>
              </View>
            ) : (
              <Grid events={allUpcoming} columns={columns} />
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
