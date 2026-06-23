import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ExternalLink, Heart, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type Attendee,
  useEvent,
  useSubmitWrapUp,
  type WrapUpResponse,
  type WrapUpTagGiven,
} from '@/features/events/useEvent';
import { useAuthStore } from '@/stores/auth';
import { noshColors, POSITIVE_REPUTATION_TAGS } from '@/theme/nosh';

type Person = { user_id: string; name: string | null; avatar: string | null; is_host: boolean };

export default function WrapUpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: event, isLoading } = useEvent(id);
  const submit = useSubmitWrapUp(id);

  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});
  const [wouldDineAgain, setWouldDineAgain] = useState<boolean | null>(null);

  const people = useMemo<Person[]>(() => {
    if (!event || !userId) return [];
    const attendees = (event.attendees as unknown as Attendee[]) ?? [];
    const list: Person[] = attendees.map((a) => ({
      user_id: a.user_id,
      name: a.name,
      avatar: a.avatar,
      is_host: a.user_id === event.host_id,
    }));
    if (event.host_id && !list.some((p) => p.user_id === event.host_id)) {
      list.push({
        user_id: event.host_id,
        name: event.host_name,
        avatar: event.host_avatar,
        is_host: true,
      });
    }
    return list.filter((p) => p.user_id !== userId);
  }, [event, userId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-events'));

  if (isLoading || !event) {
    return (
      <LinearGradient colors={noshColors.gradient} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      </LinearGradient>
    );
  }

  const wrapUps = (event.wrap_up_responses as unknown as WrapUpResponse[]) ?? [];
  const alreadySubmitted = wrapUps.some((r) => r.user_id === userId);

  const toggleTag = (uid: string, tag: string) =>
    setSelectedTags((prev) => {
      const current = prev[uid] ?? [];
      return {
        ...prev,
        [uid]: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
      };
    });

  const handleSubmit = () => {
    if (wouldDineAgain === null) return;
    const tagsGiven: WrapUpTagGiven[] = people
      .map((p) => ({
        to_user_id: p.user_id,
        to_user_name: p.name ?? 'Guest',
        tags: selectedTags[p.user_id] ?? [],
      }))
      .filter((t) => t.tags.length > 0);

    submit.mutate(
      { tagsGiven, wouldDineAgain },
      {
        onSuccess: () => setStep('done'),
        onError: (e) => Alert.alert('Could not submit', (e as Error).message),
      },
    );
  };

  const openReview = () => {
    const link = event.review_link;
    if (link) {
      const url = /^https?:\/\//.test(link) ? link : `https://${link}`;
      Linking.openURL(url).catch(() => {});
    } else if (event.venue_name) {
      const q = encodeURIComponent(`${event.venue_name} ${event.venue_address ?? ''} reviews`);
      Linking.openURL(`https://www.google.com/search?q=${q}`).catch(() => {});
    }
  };

  const progress = step === 'done' ? 100 : step === 1 ? 50 : 100;

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
        <TouchableOpacity
          onPress={() => (step === 2 ? setStep(1) : goBack())}
          className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white">Wrap-Up</Text>
        <Text className="mt-1 text-sm text-white/70">{event.title} has ended</Text>

        {step !== 'done' && (
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <View style={{ width: `${progress}%` }} className="h-full rounded-full bg-nosh-rust" />
          </View>
        )}

        {/* Already submitted */}
        {alreadySubmitted && step !== 'done' ? (
          <View className="mt-10 items-center rounded-3xl border border-green-500/30 bg-green-500/15 p-8">
            <CheckCircle2 color="#4ade80" size={40} />
            <Text className="mt-3 text-center text-xl font-bold text-white">
              You already wrapped up
            </Text>
            <Text className="mt-1 text-center text-sm text-white/70">
              Thanks for your feedback on this Nosh.
            </Text>
            <TouchableOpacity
              onPress={goBack}
              className="mt-6 rounded-xl border border-white/25 bg-white/15 px-5 py-3"
            >
              <Text className="font-medium text-white">Back to My Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-6 gap-6">
            {/* Step 1: tag fellow diners */}
            {step === 1 && (
              <View className="rounded-3xl border border-white/20 bg-white/10 p-5">
                <View className="mb-3 flex-row items-center gap-2">
                  <Users color="rgba(255,255,255,0.7)" size={20} />
                  <Text className="text-xl font-semibold text-white">Tag Your Fellow Diners</Text>
                </View>
                <Text className="mb-5 text-sm text-white/70">
                  Share positive feedback about the people you dined with (optional, but
                  appreciated!).
                </Text>

                {people.length === 0 ? (
                  <Text className="py-8 text-center text-sm text-white/60">No one else to tag</Text>
                ) : (
                  <View className="gap-5">
                    {people.map((p) => (
                      <View
                        key={p.user_id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <View className="mb-3 flex-row items-center gap-3">
                          <View
                            style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0 }}
                            className="items-center justify-center overflow-hidden bg-nosh-maroon"
                          >
                            {p.avatar ? (
                              <Image
                                source={{ uri: p.avatar }}
                                style={{ width: 40, height: 40 }}
                                contentFit="cover"
                              />
                            ) : (
                              <Text className="text-sm font-bold text-white">
                                {p.name?.charAt(0)?.toUpperCase() ?? 'A'}
                              </Text>
                            )}
                          </View>
                          <Text className="text-base font-medium text-white">
                            {p.name ?? 'Guest'}
                          </Text>
                          {p.is_host && (
                            <View className="rounded border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5">
                              <Text className="text-[10px] font-bold text-purple-200">HOST</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                          {POSITIVE_REPUTATION_TAGS.map((tag) => {
                            const active = (selectedTags[p.user_id] ?? []).includes(tag);
                            return (
                              <TouchableOpacity
                                key={tag}
                                onPress={() => toggleTag(p.user_id, tag)}
                                activeOpacity={0.8}
                                className={`rounded-full border px-3 py-1.5 ${
                                  active
                                    ? 'border-green-500/40 bg-green-500/20'
                                    : 'border-white/10 bg-white/5'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-medium ${active ? 'text-green-300' : 'text-white/60'}`}
                                >
                                  {tag}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Step 2: would dine again + review */}
            {step === 2 && (
              <>
                <View className="rounded-3xl border border-white/20 bg-white/10 p-5">
                  <View className="mb-3 flex-row items-center gap-2">
                    <Heart color="rgba(255,255,255,0.7)" size={20} />
                    <Text className="text-xl font-semibold text-white">
                      Would You Dine Here Again?
                    </Text>
                  </View>
                  <Text className="mb-5 text-sm text-white/70">
                    Help others know if this spot is worth a visit.
                  </Text>
                  <View className="flex-row gap-3">
                    <DineChoice
                      emoji="👍"
                      label="Yes!"
                      sub="Recommend"
                      active={wouldDineAgain === true}
                      activeClass="border-green-500/50 bg-green-500/20"
                      onPress={() => setWouldDineAgain(true)}
                    />
                    <DineChoice
                      emoji="👎"
                      label="No"
                      sub="Not for me"
                      active={wouldDineAgain === false}
                      activeClass="border-red-500/50 bg-red-500/20"
                      onPress={() => setWouldDineAgain(false)}
                    />
                  </View>
                </View>

                {(event.review_link || event.venue_name) && (
                  <TouchableOpacity
                    onPress={openReview}
                    activeOpacity={0.85}
                    className="h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10"
                  >
                    <ExternalLink color="#fff" size={18} />
                    <Text className="font-medium text-white">
                      {event.review_link ? 'Leave a Restaurant Review' : 'Find on Google'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Done */}
            {step === 'done' && (
              <View className="items-center rounded-3xl border border-green-500/30 bg-green-500/15 p-8">
                <CheckCircle2 color="#4ade80" size={44} />
                <Text className="mt-3 text-center text-2xl font-bold text-white">
                  Thanks for your feedback!
                </Text>
                <Text className="mt-1 text-center text-sm text-white/70">
                  Your wrap-up is in. The tags you gave boost your fellow noshers&apos; reputation.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/(tabs)/my-events')}
                  className="mt-6 rounded-xl bg-nosh-maroon px-6 py-3"
                >
                  <Text className="font-semibold text-white">Back to My Events</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer action */}
      {!alreadySubmitted && step !== 'done' && (
        <View
          style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 20, paddingTop: 12 }}
          className="border-t border-white/10 bg-black/20"
        >
          {step === 1 ? (
            <TouchableOpacity
              onPress={() => setStep(2)}
              activeOpacity={0.9}
              className="h-14 items-center justify-center rounded-2xl bg-white"
            >
              <Text className="text-lg font-semibold text-nosh-maroon">Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={wouldDineAgain === null || submit.isPending}
              activeOpacity={0.9}
              style={{ opacity: wouldDineAgain === null || submit.isPending ? 0.5 : 1 }}
              className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-white"
            >
              {submit.isPending ? (
                <ActivityIndicator color="#590219" />
              ) : (
                <>
                  <CheckCircle2 color="#590219" size={20} />
                  <Text className="text-lg font-semibold text-nosh-maroon">Complete Wrap-Up</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

function DineChoice({
  emoji,
  label,
  sub,
  active,
  activeClass,
  onPress,
}: {
  emoji: string;
  label: string;
  sub: string;
  active: boolean;
  activeClass: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`h-28 flex-1 items-center justify-center rounded-2xl border ${
        active ? activeClass : 'border-white/10 bg-white/5'
      }`}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text className="mt-2 font-medium text-white">{label}</Text>
      <Text className="mt-0.5 text-[11px] text-white/60">{sub}</Text>
    </TouchableOpacity>
  );
}
