import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { hostSnapshot, useCreateEvent } from '@/features/events/useCreateEvent';
import { pickAndUploadEventPhoto } from '@/features/events/uploadEventPhoto';
import { useMyProfile } from '@/features/profile/useProfile';
import { HOST_INTENTS, PRICE_RANGES, TOPICS_TO_AVOID, VIBES } from '@/theme/nosh';

type VenueType = 'restaurant' | 'custom';

type HostForm = {
  venue_type: VenueType;
  venue_name: string;
  venue_address: string;
  cuisine_type: string;
  price_range: string;
  image_url: string;
  title: string;
  date_time: string;
  duration_minutes: number;
  duration_type: 'fixed' | 'open-ended';
  min_seats: number;
  max_seats: number;
  allow_latecomers: boolean;
  vibe: string[];
  host_intent_tags: string[];
  topics_to_avoid: string;
  icebreaker: string;
  description: string;
  is_private: boolean;
  lgbtq_only: boolean;
};

const INITIAL_FORM: HostForm = {
  venue_type: 'restaurant',
  venue_name: '',
  venue_address: '',
  cuisine_type: '',
  price_range: '$$',
  image_url: '',
  title: '',
  date_time: '',
  duration_minutes: 120,
  duration_type: 'fixed',
  min_seats: 2,
  max_seats: 4,
  allow_latecomers: true,
  vibe: [],
  host_intent_tags: [],
  topics_to_avoid: '',
  icebreaker: '',
  description: '',
  is_private: false,
  lgbtq_only: false,
};

const STEP_TITLES = ['Choose Venue', 'Event Details', 'Vibe & Intent', 'Share Your Event'];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-white">{label}</Text>
      {children}
    </View>
  );
}

const inputClass = 'rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white';

export default function Host() {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<HostForm>(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof HostForm>(k: K, v: HostForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleIn = (k: 'vibe' | 'host_intent_tags', v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const topics = form.topics_to_avoid ? form.topics_to_avoid.split(', ').filter(Boolean) : [];
  const toggleTopic = (t: string) => {
    const next = topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t];
    set('topics_to_avoid', next.join(', '));
  };

  const chooseVenueType = (t: VenueType) =>
    setForm((f) => ({ ...f, venue_type: t, is_private: t === 'custom' ? true : f.is_private }));

  const handlePhoto = async () => {
    if (!profile) return;
    try {
      setUploading(true);
      const res = await pickAndUploadEventPhoto(profile.id);
      if (res.status === 'uploaded') set('image_url', res.url);
      else if (res.status === 'denied')
        Alert.alert('Permission needed', 'Allow photo access to add an event photo.');
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return form.venue_type === 'restaurant'
        ? !!form.venue_name && !!form.price_range
        : !!form.venue_name && !!form.venue_address && !!form.price_range;
    }
    if (step === 2) {
      return (
        !!form.title && !!form.date_time && form.min_seats >= 2 && form.max_seats >= form.min_seats
      );
    }
    if (step === 3) return form.vibe.length > 0;
    return true;
  };

  const handlePublish = () => {
    if (!profile) return;
    createEvent.mutate(
      {
        ...hostSnapshot(profile),
        venue_type: form.venue_type,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        cuisine_type: form.cuisine_type || null,
        price_range: form.price_range,
        image_url: form.image_url || null,
        title: form.title,
        date_time: form.date_time,
        duration_minutes: form.duration_minutes,
        duration_type: form.duration_type,
        min_seats: form.min_seats,
        max_seats: form.max_seats,
        allow_latecomers: form.allow_latecomers,
        vibe: form.vibe,
        host_intent_tags: form.host_intent_tags,
        topics_to_avoid: form.topics_to_avoid || null,
        icebreaker: form.icebreaker || null,
        description: form.description || null,
        is_private: form.is_private,
        lgbtq_only: form.lgbtq_only,
        lgbtq_friendly: form.vibe.includes('LGBTQ+ Friendly'),
        status: 'upcoming',
      },
      {
        onSuccess: (created) => {
          setCreatedId(created.id);
          setStep(4);
        },
        onError: (err) => Alert.alert('Could not publish', (err as Error).message),
      },
    );
  };

  const eventLink = createdId ? `noshsocial://event/${createdId}` : '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(eventLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Share.share({ message: `Join me at ${form.venue_name}! ${eventLink}` }).catch(() => {});
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(1);
    setCreatedId(null);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          {step > 1 && step < 4 && (
            <TouchableOpacity
              onPress={() => setStep((s) => s - 1)}
              className="mb-4 h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
            >
              <ArrowLeft color="#fff" size={20} />
            </TouchableOpacity>
          )}
          <View className="mb-2 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <Sparkles color="#fff" size={20} />
            </View>
            <Text className="text-3xl font-bold text-white">Host Your Nosh</Text>
          </View>
          <Text className="text-sm text-white/70">
            Step {Math.min(step, 4)} of 4: {STEP_TITLES[step - 1]}
          </Text>
          {step < 4 && (
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full rounded-full bg-nosh-rust"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </View>
          )}
        </View>

        {step === 1 && (
          <View className="gap-6">
            <View className="gap-6 rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="text-xl font-semibold text-white">Find Your Venue</Text>

              <Field label="Venue Type *">
                <View className="flex-row gap-3">
                  {(['restaurant', 'custom'] as VenueType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => chooseVenueType(t)}
                      activeOpacity={0.85}
                      className={`flex-1 rounded-xl border-2 p-4 ${
                        form.venue_type === t
                          ? 'border-white/30 bg-white/20'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Text className="mb-1 font-medium text-white">
                        {t === 'restaurant' ? 'Restaurant' : 'Custom Location'}
                      </Text>
                      <Text className="text-xs text-white/60">
                        {t === 'restaurant'
                          ? 'Meet at a restaurant or cafe'
                          : 'Home, office, or other'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              {form.venue_type === 'custom' && (
                <View className="rounded-xl border border-amber-500/30 bg-amber-500/20 p-4">
                  <Text className="mb-1 text-sm font-medium text-amber-200">🏠 Safety First</Text>
                  <Text className="text-xs leading-relaxed text-amber-200/80">
                    Be careful who you invite to your personal space. The address is shared only
                    with confirmed guests. Custom events default to private.
                  </Text>
                </View>
              )}

              <Field
                label={form.venue_type === 'restaurant' ? 'Restaurant Name *' : 'Location Name *'}
              >
                <TextInput
                  value={form.venue_name}
                  onChangeText={(t) => set('venue_name', t)}
                  placeholder={
                    form.venue_type === 'restaurant' ? 'e.g., Joe’s Trattoria' : 'e.g., My Home'
                  }
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className={inputClass}
                />
                {form.venue_type === 'restaurant' && (
                  <Text className="mt-1 text-xs text-white/40">
                    Smart venue search (Google Places) activates once the API key is connected.
                  </Text>
                )}
              </Field>

              <Field label={form.venue_type === 'custom' ? 'Address *' : 'Address'}>
                <TextInput
                  value={form.venue_address}
                  onChangeText={(t) => set('venue_address', t)}
                  placeholder="Street, city"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className={inputClass}
                />
              </Field>

              {form.venue_type === 'custom' && (
                <Field label="Type of Food/Meal">
                  <TextInput
                    value={form.cuisine_type}
                    onChangeText={(t) => set('cuisine_type', t)}
                    placeholder="e.g., Homemade Italian, Potluck, BBQ"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Price Range *">
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

              <Field label="Event Photo">
                {form.image_url ? (
                  <View className="mb-2 overflow-hidden rounded-xl">
                    <Image
                      source={{ uri: form.image_url }}
                      style={{ width: '100%', height: 180 }}
                    />
                    <TouchableOpacity
                      onPress={() => set('image_url', '')}
                      className="absolute right-3 top-3 rounded-lg bg-red-500/80 px-3 py-1.5"
                    >
                      <Text className="text-sm text-white">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={handlePhoto}
                  disabled={uploading}
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3"
                >
                  {uploading ? (
                    <Loader2 color="#fff" size={18} />
                  ) : (
                    <Camera color="#fff" size={18} />
                  )}
                  <Text className="text-white">{uploading ? 'Uploading…' : 'Upload Photo'}</Text>
                </TouchableOpacity>
              </Field>
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-4 rounded-2xl border border-white/20 bg-white/10 p-5">
            <Text className="text-xl font-semibold text-white">Event Details</Text>

            <Field label="Event Title *">
              <TextInput
                value={form.title}
                onChangeText={(t) => set('title', t)}
                placeholder="e.g., Sunday Brunch & Books"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className={inputClass}
              />
            </Field>

            <Field label="Date & Time *">
              <DateTimeField value={form.date_time} onChange={(iso) => set('date_time', iso)} />
            </Field>

            <Field label="Group Size *">
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

            <Field label="Duration">
              <View className="rounded-xl border border-white/10 bg-white/5 p-3">
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5, 6].map((h) => {
                    const active =
                      form.duration_type === 'fixed' && form.duration_minutes === h * 60;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => {
                          set('duration_minutes', h * 60);
                          set('duration_type', 'fixed');
                        }}
                        className={`flex-1 items-center rounded-lg border py-2 ${
                          active ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <Text className={`text-sm ${active ? 'text-white' : 'text-white/60'}`}>
                          {h}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  onPress={() =>
                    set(
                      'duration_type',
                      form.duration_type === 'open-ended' ? 'fixed' : 'open-ended',
                    )
                  }
                  className="mt-3 flex-row items-center gap-2 border-t border-white/10 pt-3"
                >
                  <View
                    className={`h-5 w-5 items-center justify-center rounded border ${
                      form.duration_type === 'open-ended'
                        ? 'border-white bg-white'
                        : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {form.duration_type === 'open-ended' && (
                      <Check color="#590219" size={14} strokeWidth={3} />
                    )}
                  </View>
                  <Text className="text-sm text-white/80">Open-ended (no set end time)</Text>
                </TouchableOpacity>
              </View>
            </Field>

            <View className="flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <Text className="mr-4 flex-1 text-sm text-white">
                Allow latecomers after start time
              </Text>
              <Toggle value={form.allow_latecomers} onChange={(v) => set('allow_latecomers', v)} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-6">
            <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-1 text-xl font-semibold text-white">Set the Vibe *</Text>
              <Text className="mb-4 text-sm text-white/70">Select all that apply</Text>
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

            <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-1 text-xl font-semibold text-white">What You’re Looking For</Text>
              <Text className="mb-4 text-sm text-white/70">
                What you hope to get from this meal
              </Text>
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

            <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-4 text-xl font-semibold text-white">Privacy</Text>
              <View className="flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <Text className="mr-4 flex-1 text-sm text-white">Private event (invite-only)</Text>
                <Toggle
                  value={form.is_private}
                  onChange={(v) => {
                    if (form.venue_type === 'custom' && !v) {
                      Alert.alert(
                        'Custom locations stay private',
                        'For your safety we keep custom-location events private.',
                      );
                      return;
                    }
                    set('is_private', v);
                  }}
                />
              </View>
              <View className="mt-3 flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <Text className="mr-4 flex-1 text-sm text-white">🏳️‍⚧️ LGBTQ+ only event</Text>
                <Toggle value={form.lgbtq_only} onChange={(v) => set('lgbtq_only', v)} />
              </View>
            </View>

            <View className="gap-4 rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="text-xl font-semibold text-white">Additional Details</Text>
              <Field label="Description (optional)">
                <TextInput
                  value={form.description}
                  onChangeText={(t) => set('description', t)}
                  placeholder="Describe your event and what makes it special…"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  className={inputClass}
                  style={{ minHeight: 90, textAlignVertical: 'top' }}
                />
              </Field>
              <Field label="Topics to Avoid (optional)">
                <View className="flex-row flex-wrap gap-2">
                  {TOPICS_TO_AVOID.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      active={topics.includes(t)}
                      onPress={() => toggleTopic(t)}
                    />
                  ))}
                </View>
              </Field>
              <Field label="Icebreaker Question (optional)">
                <TextInput
                  value={form.icebreaker}
                  onChangeText={(t) => set('icebreaker', t)}
                  placeholder="e.g., What’s the best meal you’ve ever had?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className={inputClass}
                />
              </Field>
            </View>
          </View>
        )}

        {step === 4 && (
          <View className="gap-6">
            <View className="items-center rounded-2xl border border-green-500/30 bg-green-500/20 p-6">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 color="#4ade80" size={32} />
              </View>
              <Text className="mb-1 text-2xl font-bold text-white">Your Nosh is Live!</Text>
              <Text className="text-center text-sm text-white/80">
                Invite your friends and make it happen.
              </Text>
            </View>

            <View className="gap-3 rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-1 text-lg font-semibold text-white">Event Preview</Text>
              <PreviewRow
                icon={<Sparkles color="rgba(255,255,255,0.6)" size={16} />}
                text={form.title}
              />
              <PreviewRow
                icon={<MapPin color="rgba(255,255,255,0.6)" size={16} />}
                text={form.venue_name}
              />
              <PreviewRow
                icon={<Clock color="rgba(255,255,255,0.6)" size={16} />}
                text={form.date_time ? new Date(form.date_time).toLocaleString() : ''}
              />
              <PreviewRow
                icon={<Users color="rgba(255,255,255,0.6)" size={16} />}
                text={`${form.min_seats}-${form.max_seats} seats`}
              />
              <PreviewRow
                icon={<DollarSign color="rgba(255,255,255,0.6)" size={16} />}
                text={form.price_range}
              />
            </View>

            <View className="gap-3 rounded-2xl border border-white/20 bg-white/10 p-5">
              <Text className="mb-1 text-lg font-semibold text-white">Invite & Share</Text>
              <TouchableOpacity
                onPress={handleCopy}
                className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10"
              >
                {copied ? <Check color="#4ade80" size={20} /> : <Copy color="#fff" size={20} />}
                <Text className="text-white">{copied ? 'Link Copied!' : 'Copy Event Link'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10"
              >
                <Share2 color="#fff" size={20} />
                <Text className="text-white">Share via…</Text>
              </TouchableOpacity>
              {createdId && (
                <TouchableOpacity
                  onPress={() => {
                    const newId = createdId;
                    reset();
                    router.replace(`/event/${newId}`);
                  }}
                  className="h-12 flex-row items-center justify-center rounded-xl border border-white/20 bg-white/10"
                >
                  <Text className="font-semibold text-white">View Your Event</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  reset();
                  router.replace('/(tabs)/discover');
                }}
                className="h-12 flex-row items-center justify-center rounded-xl bg-nosh-maroon"
              >
                <Text className="font-semibold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {step < 4 && (
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-3">
          <TouchableOpacity
            onPress={() => (step === 3 ? handlePublish() : setStep((s) => s + 1))}
            disabled={!canProceed() || createEvent.isPending}
            activeOpacity={0.9}
            className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-white ${
              !canProceed() || createEvent.isPending ? 'opacity-50' : ''
            }`}
          >
            {createEvent.isPending ? (
              <ActivityIndicator color="#590219" />
            ) : step === 3 ? (
              <>
                <CheckCircle2 color="#590219" size={20} />
                <Text className="text-lg font-semibold text-nosh-maroon">Publish Nosh</Text>
              </>
            ) : (
              <Text className="text-lg font-semibold text-nosh-maroon">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

function PreviewRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="flex-1 text-sm text-white/80">{text}</Text>
    </View>
  );
}
