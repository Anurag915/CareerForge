import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent unwanted refetches on focus
      retry: 1, // Only retry once by default
    },
    mutations: {
      retry: 0, // Never retry mutations automatically
    },
  },
});
