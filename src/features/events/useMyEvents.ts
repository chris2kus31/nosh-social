import { useMemo } from 'react';

import { useEvents, type EventRow } from '@/features/events/useEvents';
import { useAuthStore } from '@/stores/auth';

type AttendeeRef = { user_id: string };

const attendeesOf = (e: EventRow): AttendeeRef[] =>
  Array.isArray(e.attendees) ? (e.attendees as unknown as AttendeeRef[]) : [];

/** End of an event, derived from start time + duration (defaults to 2h). */
function endTime(e: EventRow): Date | null {
  if (!e.date_time) return null;
  const start = new Date(e.date_time);
  const minutes = e.duration_minutes || 120;
  return new Date(start.getTime() + minutes * 60 * 1000);
}

export type MyEventsCategory = 'upcoming' | 'live' | 'past';

export type MyEvents = {
  upcoming: EventRow[];
  live: EventRow[];
  past: EventRow[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isRefetching: boolean;
};

/**
 * Events the current user hosts or has joined, split into Upcoming / Noshing
 * Now / Past. Mirrors the web app's MyNoshEvents categorization, falling back
 * to date math when the stored `status` hasn't been updated yet.
 */
export function useMyEvents(): MyEvents {
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading, isError, refetch, isRefetching } = useEvents();

  const categories = useMemo(() => {
    const empty = { upcoming: [], live: [], past: [] } as Record<MyEventsCategory, EventRow[]>;
    if (!userId || !data) return empty;

    const now = new Date();
    const mine = data.filter(
      (e) => e.host_id === userId || attendeesOf(e).some((a) => a.user_id === userId),
    );

    const result: Record<MyEventsCategory, EventRow[]> = { upcoming: [], live: [], past: [] };

    for (const e of mine) {
      const end = endTime(e);
      const start = e.date_time ? new Date(e.date_time) : null;

      const isLive =
        e.status === 'live' ||
        (e.status !== 'completed' && start !== null && end !== null && now >= start && now < end);
      const isPast = e.status === 'completed' || (end !== null && now >= end);

      if (isLive) result.live.push(e);
      else if (isPast) result.past.push(e);
      else result.upcoming.push(e);
    }

    // Upcoming should read soonest-first; past should read most-recent-first.
    const byDateAsc = (a: EventRow, b: EventRow) =>
      new Date(a.date_time ?? 0).getTime() - new Date(b.date_time ?? 0).getTime();
    result.upcoming.sort(byDateAsc);
    result.live.sort(byDateAsc);
    result.past.sort((a, b) => -byDateAsc(a, b));

    return result;
  }, [data, userId]);

  return { ...categories, isLoading, isError, refetch, isRefetching };
}
