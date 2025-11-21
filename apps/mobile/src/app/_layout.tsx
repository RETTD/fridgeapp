import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { trpc as trpcHook } from '@/utils/trpc';

function I18nInitializer() {
  const { i18n } = useTranslation();
  const { data: settings } = trpcHook.settings.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
    enabled: true,
  });

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <I18nInitializer />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="products" />
          <Stack.Screen name="add-product" />
          <Stack.Screen name="settings" />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

