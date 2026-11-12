// RosterQuery.ts
// Every request the console makes goes through here, to relative /api/... paths that Vite forwards to the API.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { httpLog } from '../common/utils/logging';
import type { Job, RegionUrl, SaveUrl, StartJob } from './apiTypes';

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
  if (!response.ok) throw new Error(answer?.error ?? `The API answered ${response.status}.`);
  return answer;
}

/** Queues a run. Rejects with the API's reason when the request is refused. */
export const startJob = (request: StartJob) => send<Job>('POST', '/jobs', request);

/** Adds a URL when urlId is null, otherwise saves a new version of it. */
export const saveUrl = (urlId: number | null, request: SaveUrl) => (urlId === null ?
  send<RegionUrl>('POST', `/states/${request.stateCode}/urls`, request) :
  send<RegionUrl>('PUT', `/urls/${urlId}`, request));

export const deleteUrl = (urlId: number, editedBy: string) => send<null>('DELETE', `/urls/${urlId}?editedBy=${encodeURIComponent(editedBy)}`);

/** Makes an earlier version current again, as a new version. */
export const revertUrl = (urlId: number, versionId: number, editedBy: string) => send<RegionUrl>('POST', `/urls/${urlId}/revert`, { versionId, editedBy });
