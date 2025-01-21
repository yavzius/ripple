import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a persister
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'SHORETIDE_CACHE', // Custom key for the cache
  throttleTime: 1000, // How often to write to storage
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data),
});

// Set up persistence
persistQueryClient({
  queryClient,
  persister,
  maxAge: Infinity, // Data will never expire
  buster: 'v1', // Cache version - bump this to invalidate old caches
  dehydrateOptions: {
    shouldDehydrateQuery: query => {
      // Only persist specific queries
      const persistedQueries = ['workspace'];
      return persistedQueries.some(key => 
        query.queryKey[0] === key
      );
    },
  },
}); 