import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database, Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];

/** Tags one diner awards another in the wrap-up (matches submit_wrap_up). */
export type WrapUpTagGiven = { to_user_id: string; to_user_name: string; tags: string[] };

/** A single diner's wrap-up submission, stored in events.wrap_up_responses. */
export type WrapUpResponse = {
  user_id: string;
  user_name: string | null;
  tags_given: WrapUpTagGiven[];
  would_dine_again: boolean | null;
  completed_at: string;
};

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

/**
 * Whether an event's dining window has closed. The stored `status` column is
 * never auto-advanced, so we fall back to start time + duration (defaults to
 * 2h) — the same date math used by the My Events "Past" tab.
 */
export function hasEventEnded(
  event: Pick<EventRow, 'status' | 'date_time' | 'duration_minutes'>,
): boolean {
  if (event.status === 'completed') return true;
  if (!event.date_time) return false;
  const end = new Date(event.date_time).getTime() + (event.duration_minutes || 120) * 60 * 1000;
  return Date.now() >= end;
}

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

export type EventUpdate = Database['public']['Tables']['events']['Update'];

/**
 * Host-only edit of an event's own columns. RLS (events_update_host) enforces
 * that only the host can write, so no RPC is needed.
 */
export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: EventUpdate): Promise<EventRow> => {
      const { data, error } = await supabase
        .from('events')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(eventKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Submit a post-event wrap-up: award positive reputation tags to fellow diners
 * and record a "would dine again" answer. The submit_wrap_up RPC applies the
 * tags to each recipient and recomputes their reputation_score server-side.
 */
export function useSubmitWrapUp(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      tagsGiven: WrapUpTagGiven[];
      wouldDineAgain: boolean;
    }): Promise<EventRow> => {
      const { data, error } = await supabase.rpc('submit_wrap_up', {
        p_event_id: id,
        p_tags_given: vars.tagsGiven as unknown as Json,
        p_would_dine_again: vars.wouldDineAgain,
      });
      if (error) throw error;
      return data as unknown as EventRow;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(eventKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Recipients' reputation changed -> refresh any profile views.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Host-only delete of an event. RLS (events_delete_host) gates this. */
export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
