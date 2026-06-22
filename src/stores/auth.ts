import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  /** Subscribe to Supabase auth changes. Returns an unsubscribe fn. */
  init: () => () => void;
};

/**
 * Global client state for the authenticated session.
 * Server data lives in TanStack Query; this store only tracks the session.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        initializing: false,
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, initializing: false });
    });

    return () => data.subscription.unsubscribe();
  },
}));
