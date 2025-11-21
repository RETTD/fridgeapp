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
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
              console.error('Error getting session:', error);
              return {};
            }
            const token = session?.access_token;
            if (token) {
              return {
                authorization: `Bearer ${token}`,
              };
            }
            return {};
          } catch (error) {
            console.error('Error in headers:', error);
            return {};
          }
        },
        // Dodaj obsługę błędów HTTP
        fetch(url, options) {
          return fetch(url, options).then(async (response) => {
            if (!response.ok) {
              const text = await response.text();
              console.error('HTTP Error:', response.status, text);
              throw new Error(`HTTP Error: ${response.status}`);
            }
            return response;
          });
        },
      }),
    ],
  });
}

