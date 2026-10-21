// RosterQuery.ts
// Every request the console makes goes through here, to relative /api/... paths that Vite forwards to the API.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { httpLog } from '../common/utils/logging';
import type { Job, StartJob } from './apiTypes';

async function get<T> (path: string): Promise<T> {
  httpLog(`HTTP GET /api${path}`);
  const response = await fetch(`/api${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `The API answered ${response.status} for ${path}. Is it running? dotnet run --project src/StateBallot.Api`);
  }
  return response.json();
}

// Polling is how a run started elsewhere (the CLI today) shows up without a reload.
export function useApi<T> (path: string, refetch?: number | ((data: T | undefined) => number | false)) {
  return useQuery<T, Error>({
    queryKey: [path],
    queryFn: () => get<T>(path),
    placeholderData: keepPreviousData,
    refetchInterval: typeof refetch === 'function' ? (query) => refetch(query.state.data) : refetch,
  });
}

/** Queues a run. Rejects with the API's reason when the request is refused. */
export async function startJob (request: StartJob): Promise<Job> {
  httpLog('HTTP POST /api/jobs', request);
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `The API answered ${response.status}.`);
  return body;
}
