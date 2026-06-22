import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];

/**
 * Server state for the Discover feed. Mirrors the web app's
 * `NoshEvent.list('-date_time')` ordering.
 */
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date_time', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
