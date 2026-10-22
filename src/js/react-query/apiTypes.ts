// apiTypes.ts
// The shapes of what the API (src/StateBallot.Api in state-roster-pipeline) returns.

export type Status = 'queued' | 'running' | 'succeeded' | 'failed';
export type RunKind = 'capture' | 'normalize' | 'both';

export interface Capture {
  captureId: number; stateCode: string; year: number; status: Status; source: string; requestedBy: string;
  startedAt: string; finishedAt: string | null; wayback: string | null; rawDir: string | null;
  fetchCount: number; rawBytes: number; gitSha: string | null; logText: string | null; errorText: string | null;
  filesPresent: boolean;
}

export interface Fetch {
  seq: number; role: string | null; keys: Record<string, unknown> | null; method: string; url: string;
  status: number | null; contentType: string | null; bytes: number | null; durationMs: number; error: string | null;
}

export interface Source { group: string; url: string; format: string; hashed: boolean }
export interface NextRun { after: string | null; reason: string | null }

export interface Pass {
  passId: number; captureId: number | null; stateCode: string; year: number; status: Status; source: string;
  requestedBy: string; requestedAt: string; finishedAt: string | null; electionFilter: string | null; gitSha: string | null;
  runCount: number; candidateCount: number; measureCount: number; countyBallotCount: number;
  countyDirectoryCount: number; proposedMeasureCount: number; unassignedRowCount: number;
  gaps: string[]; nextRun: NextRun | null; sources: Source[];
  summary: string | null; logText: string | null; errorText: string | null;
}

export interface Run {
  runId: number; passId: number; stateCode: string; electionDate: string; electionType: string; electionName: string;
  sourceElectionId: string; isPending: boolean; candidateCount: number; measureCount: number; countyBallotCount: number;
  createdAt: string; runCount: number;
}

export interface Candidate {
  office: string; district: string | null; county: string | null; name: string; party: string | null;
  status: string | null; ocdDivisionId: string | null; sourceOfficeType: string | null;
}

export interface Measure { measureId: string; title: string | null; jurisdiction: string; county: string | null }
export interface CountyBallot { county: string; candidateCount: number; measureCount: number }
export interface Page<T> { total: number; rows: T[] }

export interface StateSummary {
  code: string; name: string; implemented: boolean; lastCapture: Capture | null; lastPass: Pass | null;
  gapCount: number | null; nextRun: NextRun | null; sources: Source[]; elections: Run[];
}

export interface StateDetail {
  code: string; name: string; implemented: boolean; gaps: string[]; nextRun: NextRun | null; sources: Source[];
  captures: Capture[]; passes: Pass[]; runs: Run[];
}
export interface CaptureDetail { capture: Capture; fetches: Fetch[]; passes: Pass[]; runs: Run[] }
export interface RunDetail { run: Run; pass: Pass }
export interface ActivityData { captures: Capture[]; passes: Pass[]; runs: Run[] }

export interface Job {
  jobId: number; stateCode: string; year: number; kind: RunKind; normalizeCaptureId: number | null;
  electionFilter: string | null; status: Status; requestedBy: string; requestedAt: string;
  startedAt: string | null; finishedAt: string | null; captureId: number | null; passId: number | null;
  errorText: string | null;
}

export interface JobsData { jobs: Job[]; runs: Run[] }

export interface StartJob {
  stateCode: string; year: number; kind: RunKind; normalizeCaptureId: number | null;
  electionFilter: string | null; requestedBy: string;
}
