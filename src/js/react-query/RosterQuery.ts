// RosterQuery.ts
// Every request the console makes goes through here, to relative /api/... paths that Vite forwards to the API.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { httpLog } from '../common/utils/logging';
import type { Job, Ruleset, SampleResult, SaveRuleset, StartJob, TryRuleset } from './apiTypes';

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

/** Runs steps over each sample on its own, returning a result per sample. Rejects with the API's reason when the request is refused. */
export async function tryRuleset (request: TryRuleset): Promise<SampleResult[]> {
  httpLog('HTTP POST /api/rulesets/try', request);
  const response = await fetch('/api/rulesets/try', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `The API answered ${response.status}.`);
  return body.results;
}

/** Saves a new ruleset. Rejects with the API's reason when the request is refused. */
export async function createRuleset (request: SaveRuleset): Promise<Ruleset> {
  httpLog('HTTP POST /api/rulesets', request);
  const response = await fetch('/api/rulesets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `The API answered ${response.status}.`);
  return body;
}

/** Activates or deactivates (archives) a saved ruleset. Rejects with the API's reason when the request is refused. */
export async function setRulesetActive (rulesetId: number, isActive: boolean): Promise<Ruleset> {
  httpLog(`HTTP PUT /api/rulesets/${rulesetId}/active`, { isActive });
  const response = await fetch(`/api/rulesets/${rulesetId}/active`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `The API answered ${response.status}.`);
  return body;
}

/** Replaces a saved ruleset's name, description and steps. Rejects with the API's reason when the request is refused. */
export async function updateRuleset (rulesetId: number, request: SaveRuleset): Promise<Ruleset> {
  httpLog(`HTTP PUT /api/rulesets/${rulesetId}`, request);
  const response = await fetch(`/api/rulesets/${rulesetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `The API answered ${response.status}.`);
  return body;
}
