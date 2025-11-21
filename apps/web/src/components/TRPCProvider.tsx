'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from '@/utils/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        // Nie loguj błędów dla pustych odpowiedzi
        onError: (error: any) => {
          // Loguj tylko prawdziwe błędy (nie puste odpowiedzi)
          if (error?.data?.code && error.data.code !== 'UNAUTHORIZED') {
            // Tylko w trybie deweloperskim
            if (process.env.NODE_ENV === 'development') {
              console.error('Query error:', error);
            }
          }
        },
        // Ustaw domyślną wartość na undefined zamiast null
        placeholderData: (previousValue) => previousValue,
      },
    },
    // Wyłącz domyślne logowanie w React Query
    logger: {
      log: () => {},
      warn: () => {},
      error: (error: any) => {
        // Loguj tylko prawdziwe błędy
        if (error?.data?.code && error.data.code !== 'UNAUTHORIZED') {
          console.error('Query error:', error);
        }
      },
    },
  }));

  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

