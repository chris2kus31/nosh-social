import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import type { Profile } from '@/features/profile/useProfile';
import { supabase } from '@/lib/supabase';

export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventRow = Database['public']['Tables']['events']['Row'];

/** Build the denormalized host snapshot the events table stores (web parity). */
export function hostSnapshot(profile: Profile) {
  const tags = (profile.reputation_tags ?? {}) as Record<string, number>;
  const host_reputation_tags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  return {
    host_id: profile.id,
    host_name: profile.full_name,
    host_bio: profile.bio,
    host_avatar: profile.avatar_url,
    host_reputation_tags,
  };
}

/** Insert a new event as the signed-in host and refresh event lists. */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: EventInsert): Promise<EventRow> => {
      const { data, error } = await supabase.from('events').insert(event).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
