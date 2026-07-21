'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useState } from 'react';
import { ToastProvider } from '@/src/context/ToastContext';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Bump this if a query's cached data shape ever changes incompatibly —
// it invalidates any previously-persisted cache instead of letting stale
// old-shaped data get restored and crash a component expecting new fields.
const PERSISTED_CACHE_VERSION = 'v1';

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session (not per render) — created lazily so
  // it isn't recreated (and caches lost) on every re-render of this provider.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data older than this triggers a background refetch on next use,
            // but never blocks already-rendered content behind a spinner again.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  // Mirrors the cache to localStorage so a full page reload (not just
  // client-side navigation) can also render last-known content instantly
  // instead of every query starting from empty. `storage` is left
  // `undefined` during the server render pass (no `window` yet); the
  // persister already no-ops safely in that case.
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      key: 'lifexp-query-cache',
    }),
  );

  return (
    <ConvexProvider client={convex}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000,
          buster: PERSISTED_CACHE_VERSION,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ConvexProvider>
  );
}
