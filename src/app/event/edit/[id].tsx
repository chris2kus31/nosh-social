import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Minus, Plus, Save, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateTimeField } from '@/components/DateTimeField';
import {
  type EventRow,
  useDeleteEvent,
  useEvent,
  useUpdateEvent,
} from '@/features/events/useEvent';
import { useAuthStore } from '@/stores/auth';
import { HOST_INTENTS, noshColors, PRICE_RANGES, VIBES } from '@/theme/nosh';

type EditForm = {
  title: string;
  venue_name: string;
  venue_address: string;
  date_time: string;
  min_seats: number;
  max_seats: number;
  price_range: string;
  allow_latecomers: boolean;
  vibe: string[];
  host_intent_tags: string[];
  description: string;
  icebreaker: string;
  topics_to_avoid: string;
};

const inputClass = 'rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white';

function formFromEvent(event: EventRow): EditForm {
  return {
    title: event.title ?? '',
    venue_name: event.venue_name ?? '',
    venue_address: event.venue_address ?? '',
    date_time: event.date_time ?? '',
    min_seats: event.min_seats ?? 2,
    max_seats: event.max_seats ?? 4,
    price_range: event.price_range ?? '$$',
    allow_latecomers: event.allow_latecomers ?? true,
    vibe: event.vibe ?? [],
    host_intent_tags: event.host_intent_tags ?? [],
    description: event.description ?? '',
    icebreaker: event.icebreaker ?? '',
    topics_to_avoid: event.topics_to_avoid ?? '',
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-white">{label}</Text>
      {children}
    </View>
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
      <Text className={`text-xs ${active ? 'text-white' : 'text-white/60'}`}>{label}</Text>
    </TouchableOpacity>
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

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 items-center justify-center rounded-lg bg-white/10"
      >
        <Minus color="#fff" size={16} />
      </TouchableOpacity>
      <Text className="text-lg font-bold text-white">{value}</Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 items-center justify-center rounded-lg bg-white/10"
      >
        <Plus color="#fff" size={16} />
      </TouchableOpacity>
    </View>
  );
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: event, isLoading, error } = useEvent(id);
  const update = useUpdateEvent(id);
  const remove = useDeleteEvent(id);

  const [form, setForm] = useState<EditForm | null>(null);
  const [seededId, setSeededId] = useState<string | null>(null);

  // Seed the form once the event loads. Setting state during render (guarded by
  // a change check) is React's recommended alternative to a syncing effect.
  if (event && seededId !== event.id) {
    setSeededId(event.id);
    setForm(formFromEvent(event));
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(`/event/${id}`));

  if (isLoading || (!form && !error)) {
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
            onPress={goBack}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-3"
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (event.host_id !== userId) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-white/70">
            You don’t have permission to edit this event.
          </Text>
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

  if (!form) return null;

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const toggleIn = (k: 'vibe' | 'host_intent_tags', v: string) =>
    setForm((f) =>
      f ? { ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] } : f,
    );

  const canSave = !!form.title && !!form.date_time && form.max_seats >= form.min_seats;

  const handleSave = () => {
    if (!canSave) return;
    update.mutate(
      {
        title: form.title,
        venue_name: form.venue_name,
        venue_address: form.venue_address || null,
        date_time: form.date_time,
        min_seats: form.min_seats,
        max_seats: form.max_seats,
        price_range: form.price_range,
        allow_latecomers: form.allow_latecomers,
        vibe: form.vibe,
        host_intent_tags: form.host_intent_tags,
        lgbtq_friendly: form.vibe.includes('LGBTQ+ Friendly'),
        description: form.description || null,
        icebreaker: form.icebreaker || null,
        topics_to_avoid: form.topics_to_avoid || null,
      },
      {
        onSuccess: () => router.replace(`/event/${id}`),
        onError: (e) => Alert.alert('Could not save', (e as Error).message),
      },
    );
  };

  const confirmDelete = () => {
    const count = Array.isArray(event.attendees) ? event.attendees.length : 0;
    Alert.alert(
      'Delete this Nosh?',
      count > 0
        ? `This permanently deletes the event and removes it for ${count} ${count === 1 ? 'attendee' : 'attendees'}. This cannot be undone.`
        : 'This permanently deletes the event. This cannot be undone.',
      [
        { text: 'Keep Event', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            remove.mutate(undefined, {
              onSuccess: () => router.replace('/(tabs)/my-events'),
              onError: (e) => Alert.alert('Could not delete', (e as Error).message),
            }),
        },
      ],
    );
  };

  const busy = update.isPending || remove.isPending;

  return (
    <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={goBack}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white">Edit Your Nosh</Text>
        <Text className="mt-1 text-sm text-white/70" numberOfLines={1}>
          {event.title}
        </Text>

        <View className="mt-6 gap-6">
          {/* Basic details */}
          <View className="gap-4 rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="text-xl font-semibold text-white">Basic Details</Text>
            <Field label="Event Title">
              <TextInput
                value={form.title}
                onChangeText={(t) => set('title', t)}
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>
            <Field label="Venue Name">
              <TextInput
                value={form.venue_name}
                onChangeText={(t) => set('venue_name', t)}
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>
            <Field label="Address">
              <TextInput
                value={form.venue_address}
                onChangeText={(t) => set('venue_address', t)}
                placeholder="Street, city"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>
            <Field label="Date & Time">
              <DateTimeField value={form.date_time} onChange={(iso) => set('date_time', iso)} />
            </Field>
            <Field label="Group Size">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-white/60">Min</Text>
                  <Stepper
                    value={form.min_seats}
                    min={2}
                    max={form.max_seats}
                    onChange={(v) => set('min_seats', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-white/60">Max</Text>
                  <Stepper
                    value={form.max_seats}
                    min={form.min_seats}
                    max={20}
                    onChange={(v) => set('max_seats', v)}
                  />
                </View>
              </View>
            </Field>
            <Field label="Price Range">
              <View className="flex-row gap-2">
                {PRICE_RANGES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => set('price_range', p)}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      form.price_range === p
                        ? 'border-white/30 bg-white/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Text
                      className={`font-medium ${form.price_range === p ? 'text-white' : 'text-white/60'}`}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <View className="flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <Text className="mr-4 flex-1 text-sm text-white">
                Allow latecomers after start time
              </Text>
              <Toggle value={form.allow_latecomers} onChange={(v) => set('allow_latecomers', v)} />
            </View>
          </View>

          {/* Vibe */}
          <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="mb-4 text-xl font-semibold text-white">Vibe</Text>
            <View className="flex-row flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  active={form.vibe.includes(v)}
                  onPress={() => toggleIn('vibe', v)}
                />
              ))}
            </View>
          </View>

          {/* Host intent */}
          <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="mb-4 text-xl font-semibold text-white">What You’re Looking For</Text>
            <View className="flex-row flex-wrap gap-2">
              {HOST_INTENTS.map((i) => (
                <Chip
                  key={i}
                  label={i}
                  active={form.host_intent_tags.includes(i)}
                  onPress={() => toggleIn('host_intent_tags', i)}
                />
              ))}
            </View>
          </View>

          {/* Additional */}
          <View className="gap-4 rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="text-xl font-semibold text-white">Additional Details</Text>
            <Field label="Description">
              <TextInput
                value={form.description}
                onChangeText={(t) => set('description', t)}
                placeholder="Describe your event…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                className={inputClass}
                style={{ minHeight: 90, textAlignVertical: 'top' }}
              />
            </Field>
            <Field label="Icebreaker Question">
              <TextInput
                value={form.icebreaker}
                onChangeText={(t) => set('icebreaker', t)}
                placeholder="e.g., What’s the best meal you’ve ever had?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>
            <Field label="Topics to Avoid">
              <TextInput
                value={form.topics_to_avoid}
                onChangeText={(t) => set('topics_to_avoid', t)}
                placeholder="e.g., Politics, work stress"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>
          </View>

          {/* Danger zone */}
          <View className="gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <View className="flex-row items-center gap-2">
              <AlertTriangle color="#f87171" size={20} />
              <Text className="text-xl font-semibold text-white">Danger Zone</Text>
            </View>
            <Text className="text-sm text-red-200/80">
              Deleting this event removes it permanently for you and all attendees.
            </Text>
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={busy}
              className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20"
            >
              <Trash2 color="#fca5a5" size={18} />
              <Text className="font-semibold text-red-200">Delete This Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save bar */}
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        className="flex-row gap-3 border-t border-white/10 bg-black/30 px-5 pt-3"
      >
        <TouchableOpacity
          onPress={goBack}
          style={{ marginBottom: insets.bottom + 12 }}
          className="h-14 flex-1 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
        >
          <Text className="font-semibold text-white">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || busy}
          activeOpacity={0.9}
          style={{ marginBottom: insets.bottom + 12 }}
          className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white ${
            !canSave || busy ? 'opacity-50' : ''
          }`}
        >
          {update.isPending ? (
            <ActivityIndicator color="#590219" />
          ) : (
            <>
              <Save color="#590219" size={18} />
              <Text className="text-lg font-semibold text-nosh-maroon">Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
