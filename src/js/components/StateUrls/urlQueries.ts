import type { QueryClient } from '@tanstack/react-query';

/** Refetches every URL list and history, since an edit can move a URL between states. */
export default function invalidateUrls (queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/urls'),
  });
}
