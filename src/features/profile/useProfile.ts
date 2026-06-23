import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/** Notification preferences shape (stored in profiles.notification_preferences jsonb). */
export type NotificationPreferences = {
  enabled: boolean;
  notify_cuisines: string[];
  notify_price_ranges: string[];
  connections_events: boolean;
  last_minute_openings: boolean;
  new_in_area: boolean;
  within_distance_only: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  notify_cuisines: [],
  notify_price_ranges: [],
  connections_events: true,
  last_minute_openings: false,
  new_in_area: true,
  within_distance_only: true,
};

export const profileKeys = {
  me: ['profile', 'me'] as const,
  byIds: (ids: string[]) => ['profile', 'byIds', [...ids].sort()] as const,
  detail: (id: string) => ['profile', 'detail', id] as const,
};

/** Fetch any user's public profile by id (used for the UserProfile screen). */
export function usePublicProfile(id: string) {
  return useQuery({
    queryKey: profileKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

/** Fetch the signed-in user's profile row. */
export function useMyProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: profileKeys.me,
    enabled: !!userId,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Update the signed-in user's profile and refresh the cache. */
export function useUpdateProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ProfileUpdate): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId as string)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
    },
  });
}

/** Fetch a set of profiles by id (used for connections / requests lists). */
export function useProfilesByIds(ids: string[]) {
  return useQuery({
    queryKey: profileKeys.byIds(ids),
    enabled: ids.length > 0,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Block / mute actions, all writing to the signed-in user's own profile row.
 *
 * - Mute is a one-way soft hide: you stop seeing the target's events/updates.
 * - Block is a harder cut: it also severs any connection (via manage_connection)
 *   and drops the target from your muted list to avoid duplicate state.
 *
 * Enforcement is viewer-side (feed/list filtering) since profiles are public-read
 * in Phase 1; this matches the web app's behavior.
 */
export function useBlockMute() {
  const { data: me } = useMyProfile();
  const update = useUpdateProfile();
  const manage = useManageConnection();

  const blockedIds = me?.blocked_users ?? [];
  const mutedIds = me?.muted_users ?? [];

  const isBlocked = (id: string) => blockedIds.includes(id);
  const isMuted = (id: string) => mutedIds.includes(id);

  const block = async (id: string) => {
    // Sever any existing connection / pending request both ways first.
    if (
      me &&
      (me.connections.includes(id) ||
        me.sent_requests.includes(id) ||
        me.connection_requests.includes(id))
    ) {
      await manage.mutateAsync({ targetUserId: id, action: 'remove' });
    }
    await update.mutateAsync({
      blocked_users: Array.from(new Set([...blockedIds, id])),
      muted_users: mutedIds.filter((x) => x !== id),
    });
  };

  const unblock = (id: string) =>
    update.mutateAsync({ blocked_users: blockedIds.filter((x) => x !== id) });

  const mute = (id: string) =>
    update.mutateAsync({ muted_users: Array.from(new Set([...mutedIds, id])) });

  const unmute = (id: string) =>
    update.mutateAsync({ muted_users: mutedIds.filter((x) => x !== id) });

  return {
    blockedIds,
    mutedIds,
    isBlocked,
    isMuted,
    block,
    unblock,
    mute,
    unmute,
    isPending: update.isPending || manage.isPending,
  };
}

export type ConnectionAction = 'accept' | 'reject' | 'remove' | 'request';

/** Run a connection action through the controlled `manage_connection` RPC. */
export function useManageConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      action,
    }: {
      targetUserId: string;
      action: ConnectionAction;
    }) => {
      const { error } = await supabase.rpc('manage_connection', {
        p_action: action,
        p_target_user_id: targetUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh both the signed-in user and any cached public profiles, since a
      // connection action mutates both sides of the relationship.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
