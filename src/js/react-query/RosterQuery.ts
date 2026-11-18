// RosterQuery.ts
// Every request the console makes goes through here, to relative /api/... paths that Vite forwards to the API.
// The API answers 401 to anyone not signed in, and any 401 shows the sign-in form again.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { httpLog } from '../common/utils/logging';
import type { Job, Me, RegionUrl, SaveUrl, StartJob } from './apiTypes';
import queryClient from './queryClient';

const ME = ['/me'];

function signedOut () {
  queryClient.setQueryData(ME, null);
}

async function get<T> (path: string): Promise<T> {
  httpLog(`HTTP GET /api${path}`);
  const response = await fetch(`/api${path}`);
  if (response.status === 401) signedOut();
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

/** Where a fetch's saved payload is served, exactly as the source sent it. Opened as a page, not fetched. */
export const payloadUrl = (captureId: number, seq: number) => `/api/captures/${captureId}/fetches/${seq}/payload`;

/** Sends a change. Rejects with the API's reason when the request is refused. */
async function send<T> (method: string, path: string, body?: unknown): Promise<T> {
  httpLog(`HTTP ${method} /api${path}`, body);
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const answer = await response.json().catch(() => null);
  if (response.status === 401 && path !== '/login') signedOut();
  if (!response.ok) throw new Error(answer?.error ?? `The API answered ${response.status}.`);
  return answer;
}

/** Queues a run. Rejects with the API's reason when the request is refused. */
export const startJob = (request: StartJob) => send<Job>('POST', '/jobs', request);

/** Adds a URL when urlId is null, otherwise saves a new version of it. */
export const saveUrl = (urlId: number | null, request: SaveUrl) => (urlId === null ?
  send<RegionUrl>('POST', `/states/${request.stateCode}/urls`, request) :
  send<RegionUrl>('PUT', `/urls/${urlId}`, request));

export const deleteUrl = (urlId: number) => send<null>('DELETE', `/urls/${urlId}`);

/** Makes an earlier version current again, as a new version. */
export const revertUrl = (urlId: number, versionId: number) => send<RegionUrl>('POST', `/urls/${urlId}/revert`, { versionId });

/** Who is signed in, or null when no one is. */
export function useMe () {
  return useQuery<Me | null, Error>({
    queryKey: ME,
    queryFn: async () => {
      const response = await fetch('/api/me');
      if (response.status === 401) return null;
      if (!response.ok) throw new Error(`The API answered ${response.status} for /me. Is it running? dotnet run --project src/StateBallot.Api`);
      return response.json();
    },
  });
}

/** Signs in. Rejects with the API's reason when the user name or password is refused. */
export async function signIn (userName: string, password: string) {
  queryClient.setQueryData(ME, await send<Me>('POST', '/login', { userName, password }));
}

/** Signs out and forgets everything this browser loaded while signed in. */
export async function signOut () {
  await send<null>('POST', '/logout');
  // Clearing the whole cache would also drop the query App watches for who is signed in, so App would never see the sign-out.
  signedOut();
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME[0] });
}
