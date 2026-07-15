let refreshPromise: Promise<{ access?: string; refresh?: string } | null> | null =
  null;

export async function sharedRefresh(
  refreshFn: () => Promise<{ access?: string; refresh?: string } | null>
) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await refreshFn();
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}
