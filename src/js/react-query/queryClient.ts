// queryClient.ts
// The one query cache, shared by index.tsx and RosterQuery, so a 401 from any request can sign the console out.
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export default queryClient;
