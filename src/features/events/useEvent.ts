import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];

/** Attendee object stored in events.attendees (built server-side by join_event). */
export type Attendee = {
  user_id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  traits: { tag: string; count: number }[];
  arrival_status?: string;
};

/** Waitlist entry stored in events.waitlist (built by join_waitlist). */
export type Waiter = {
  user_id: string;
  user_name: string | null;
  joined_at: string;
};

/** Host reputation tag snapshot stored on the event. */
export type HostTag = { tag: string; count: number };

export const eventKeys = {
  detail: (id: string) => ['event', id] as const,
};

/** Fetch a single event by id. */
export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<EventRow> => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

type RpcName = 'join_event' | 'leave_event' | 'join_waitlist';

/** Caller-scoped event action (join / leave / waitlist) via SECURITY DEFINER RPCs. */
function useEventActionRpc(rpc: RpcName, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(rpc, { p_event_id: id });
      if (error) throw error;
      return data as unknown as EventRow;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(eventKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export const useJoinEvent = (id: string) => useEventActionRpc('join_event', id);
export const useLeaveEvent = (id: string) => useEventActionRpc('leave_event', id);
export const useJoinWaitlist = (id: string) => useEventActionRpc('join_waitlist', id);

/** Host-only waitlist decisions (approve / reject) for a specific user. */
function useWaitlistDecision(rpc: 'approve_waitlist' | 'reject_waitlist', id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc(rpc, { p_event_id: id, p_user_id: userId });
      if (error) throw error;
      return data as unknown as EventRow;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(eventKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export const useApproveWaitlist = (id: string) => useWaitlistDecision('approve_waitlist', id);
export const useRejectWaitlist = (id: string) => useWaitlistDecision('reject_waitlist', id);
