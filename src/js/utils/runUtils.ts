// runUtils.ts
import type { Job, Run, RunKind } from '../react-query/apiTypes';

export const isActive = (job: Job) => job.status === 'queued' || job.status === 'running';

/** Who started a retrieve or a normalization. Nothing runs on a schedule yet. */
export function runType (source: string): string {
  if (source === 'web') return 'Console';
  if (source === 'cli') return 'CLI';
  return source;
}

export const kindLabel: Record<RunKind, string> = {
  both: 'Retrieve and normalize',
  capture: 'Retrieve only',
  normalize: 'Normalize',
};

// Two elections can share a date and a type (TX specials), so the source's election id is part of the key.
export const electionKey = (r: Run) => [r.electionDate, r.electionType, r.sourceElectionId].map(encodeURIComponent).join('~');

export interface Election { key: string; latest: Run; runs: Run[] }

export function electionsFrom (runs: Run[]): Election[] {
  const byKey = new Map<string, Run[]>();
  [...runs].sort((a, b) => b.runId - a.runId).forEach((r) => {
    const key = electionKey(r);
    byKey.set(key, [...(byKey.get(key) ?? []), r]);
  });
  return [...byKey.entries()]
    .map(([key, list]) => ({ key, latest: list[0], runs: list }))
    .sort((a, b) => a.latest.electionDate.localeCompare(b.latest.electionDate) || a.runs[a.runs.length - 1].runId - b.runs[b.runs.length - 1].runId);
}
