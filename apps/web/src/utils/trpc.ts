import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@fridge/api';
import { supabase } from './supabase';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc',
        async headers() {
          const { data: { session } } = await supabase.auth.getSession();
          return {
            authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          };
        },
      }),
    ],
  });
}

