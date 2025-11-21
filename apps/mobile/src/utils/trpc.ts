import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import Constants from 'expo-constants';
import type { AppRouter } from '@fridge/api';
import { supabase } from './supabase';

export const trpc = createTRPCReact<AppRouter>();

const getApiUrl = () => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl as string;
  if (apiUrl) return apiUrl;
  
  // Fallback dla developmentu
  if (__DEV__) {
    return 'http://localhost:3001/trpc';
  }
  
  throw new Error('API URL not configured');
};

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getApiUrl(),
        async headers() {
          const { data: { session } } = await supabase.auth.getSession();
          return {
            authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          };
        },
      }),
    ],
  });
};

