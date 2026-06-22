import { Check, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { HOST_INTENTS, noshColors, PRICE_RANGES, VIBES } from '@/theme/nosh';

export const GROUP_SIZES = [
  { key: 'small', label: '2–4 people' },
  { key: 'medium', label: '5–8 people' },
  { key: 'large', label: '9+ people' },
] as const;
export type GroupSize = (typeof GROUP_SIZES)[number]['key'];

export const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this_week', label: 'This Week' },
] as const;
export type DateFilterKey = (typeof DATE_FILTERS)[number]['key'];

export type Filters = {
  price: string[];
  groupSize: GroupSize | null;
  vibes: string[];
  intents: string[];
  maxDistance: number;
  noDistanceLimit: boolean;
};

export const EMPTY_FILTERS: Filters = {
  price: [],
  groupSize: null,
  vibes: [],
  intents: [],
  maxDistance: 25,
  noDistanceLimit: false,
};

export const inGroupSize = (seats: number, size: GroupSize) =>
  size === 'small'
    ? seats >= 2 && seats <= 4
    : size === 'medium'
      ? seats >= 5 && seats <= 8
      : seats >= 9;

/** Count of filters that actively change results (distance is UI-only for now). */
export const activeFilterCount = (f: Filters, dateFilter: DateFilterKey | null) =>
  f.price.length + f.vibes.length + f.intents.length + (f.groupSize ? 1 : 0) + (dateFilter ? 1 : 0);

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${active ? 'border-white/40 bg-white/25' : 'border-white/15 bg-white/5'}`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-white/70'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-3 text-base font-semibold text-white">{title}</Text>
      <View className="flex-row flex-wrap" style={{ rowGap: 12, columnGap: 10 }}>
        {children}
      </View>
    </View>
  );
}

/** Lightweight slider built on PanResponder (no native module needed). */
function Slider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const trackWidth = useRef(0);
  const cfg = useRef({ min, max, step, disabled, onChange });
  useEffect(() => {
    cfg.current = { min, max, step, disabled, onChange };
  });

  const responder = useMemo(() => {
    const update = (x: number) => {
      const w = trackWidth.current;
      if (!w) return;
      const { min: lo, max: hi, step: st, onChange: cb } = cfg.current;
      const ratio = Math.min(1, Math.max(0, x / w));
      const snapped = Math.round((lo + ratio * (hi - lo)) / st) * st;
      cb(Math.min(hi, Math.max(lo, snapped)));
    };
    // PanResponder handlers run at gesture time, not during render; refs are safe here.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !cfg.current.disabled,
      onMoveShouldSetPanResponder: () => !cfg.current.disabled,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    });
  }, []);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}
      style={{ height: 32, justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          height: 6,
          borderRadius: 999,
          width: `${pct}%`,
          backgroundColor: noshColors.rust,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: `${pct}%`,
          marginLeft: -13,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: '#fff',
          borderWidth: 3,
          borderColor: noshColors.maroon,
        }}
      />
    </View>
  );
}

export function FilterSheet({
  visible,
  onClose,
  filters,
  setFilters,
  resultCount,
  onClear,
  topInset,
  bottomInset,
}: {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  resultCount: number;
  onClear: () => void;
  /** Safe-area insets passed from the parent (useSafeAreaInsets returns 0 inside a Modal). */
  topInset: number;
  bottomInset: number;
}) {
  // iOS renders a native page sheet that already insets from the status bar.
  // Android falls back to a full-screen modal, so we pad the top ourselves.
  const isIOS = Platform.OS === 'ios';
  const maxDistance = filters.maxDistance ?? 25;

  const toggleArray = (key: 'price' | 'vibes' | 'intents', value: string) =>
    setFilters((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isIOS ? 'pageSheet' : 'overFullScreen'}
      transparent={!isIOS}
      statusBarTranslucent={!isIOS}
      onRequestClose={onClose}
    >
      <View
        style={{ flex: 1, backgroundColor: '#2a0d18', paddingTop: isIOS ? 0 : topInset }}
        className={isIOS ? '' : 'overflow-hidden rounded-t-3xl border-t border-white/15'}
      >
        {/* Grab handle */}
        <View className="items-center pt-3">
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
          <TouchableOpacity onPress={onClear}>
            <Text className="text-sm font-medium text-white/60">Clear all</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Filters</Text>
          <TouchableOpacity
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <X color="#fff" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Price Range">
            {PRICE_RANGES.map((p) => (
              <Chip
                key={p}
                label={p}
                active={filters.price.includes(p)}
                onPress={() => toggleArray('price', p)}
              />
            ))}
          </Section>

          <Section title="Group Size">
            {GROUP_SIZES.map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                active={filters.groupSize === g.key}
                onPress={() =>
                  setFilters((p) => ({ ...p, groupSize: p.groupSize === g.key ? null : g.key }))
                }
              />
            ))}
          </Section>

          <Section title="Vibe">
            {VIBES.map((v) => (
              <Chip
                key={v}
                label={v}
                active={filters.vibes.includes(v)}
                onPress={() => toggleArray('vibes', v)}
              />
            ))}
          </Section>

          <Section title="Looking For">
            {HOST_INTENTS.map((t) => (
              <Chip
                key={t}
                label={t}
                active={filters.intents.includes(t)}
                onPress={() => toggleArray('intents', t)}
              />
            ))}
          </Section>

          {/* Max Distance */}
          <View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-white">Max Distance</Text>
              <Text className="text-sm font-medium text-white/80">
                {filters.noDistanceLimit ? 'Any distance' : `${maxDistance} miles`}
              </Text>
            </View>

            <Slider
              min={1}
              max={250}
              step={1}
              value={maxDistance}
              disabled={filters.noDistanceLimit}
              onChange={(v) => setFilters((p) => ({ ...p, maxDistance: v }))}
            />
            <View className="mt-1 flex-row justify-between">
              <Text className="text-xs text-white/40">1</Text>
              <Text className="text-xs text-white/40">250 miles</Text>
            </View>

            <TouchableOpacity
              onPress={() => setFilters((p) => ({ ...p, noDistanceLimit: !p.noDistanceLimit }))}
              className="mt-4 flex-row items-center"
              style={{ columnGap: 10 }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filters.noDistanceLimit ? '#fff' : 'transparent',
                  borderColor: filters.noDistanceLimit ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {filters.noDistanceLimit && <Check color={noshColors.maroon} size={15} />}
              </View>
              <Text className="text-sm text-white/80">No distance limit (for travelers)</Text>
            </TouchableOpacity>

            <Text className="mt-2 text-xs text-white/40">
              Distance filtering activates once venues have map coordinates.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={{ paddingBottom: bottomInset + 12 }}
          className="border-t border-white/10 px-5 pt-3"
        >
          <TouchableOpacity
            onPress={onClose}
            className="h-14 items-center justify-center rounded-2xl bg-white"
          >
            <Text className="text-lg font-semibold text-nosh-maroon">
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
