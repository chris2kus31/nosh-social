import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for server state (fetch / cache / invalidate),
 * mirroring the data pattern used by the original web app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
