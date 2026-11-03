import { describe, expect, it } from 'vitest';
import type { Job, Run } from '../../src/js/react-query/apiTypes';
import { electionKey, electionsFrom, isActive, pipelineCommitUrl, runType } from '../../src/js/utils/runUtils';

const run = (runId: number, electionDate: string, electionType: string, sourceElectionId: string): Run => ({
  runId,
  passId: runId,
  stateCode: 'TX',
  electionDate,
  electionType,
  electionName: '',
  sourceElectionId,
  isPending: false,
  candidateCount: 0,
  measureCount: 0,
  countyBallotCount: 0,
  createdAt: '2026-10-01T00:00:00Z',
  runCount: 1,
});

describe('electionsFrom', () => {
  it('groups runs by election, newest run first, elections by date', () => {
    const runs = [
      run(1, '2026-11-03', 'General', '55'),
      run(2, '2026-05-02', 'Special', '61'),
      run(3, '2026-11-03', 'General', '55'),
    ];

    const elections = electionsFrom(runs);

    expect(elections.map((e) => e.latest.runId)).toEqual([2, 3]);
    expect(elections[1].runs.map((r) => r.runId)).toEqual([3, 1]);
  });

  it('keeps two elections apart when they share a date and a type', () => {
    // TX publishes several specials on one day. Only the source's election id tells them apart.
    const elections = electionsFrom([run(1, '2026-11-03', 'Special', '66618'), run(2, '2026-11-03', 'Special', '66734')]);

    expect(elections).toHaveLength(2);
  });
});

describe('electionKey', () => {
  it('encodes each part, so a key is safe in a URL', () => {
    expect(electionKey(run(1, '2026-11-03', 'General / Special', '5 5'))).toBe('2026-11-03~General%20%2F%20Special~5%205');
  });
});

describe('isActive', () => {
  it('is true only while queued or running', () => {
    const job = (status: Job['status']) => ({ status }) as Job;
    expect(['queued', 'running', 'succeeded', 'failed'].map((s) => isActive(job(s as Job['status'])))).toEqual([true, true, false, false]);
  });
});

describe('runType', () => {
  it('names where a run came from', () => {
    expect(runType('web')).toBe('Console');
    expect(runType('cli')).toBe('CLI');
    expect(runType('schedule')).toBe('schedule');
  });
});

describe('pipelineCommitUrl', () => {
  it('links the commit on GitHub', () => {
    expect(pipelineCommitUrl('e0893040aa762218b2950ea95ff2c4eddb946ebf'))
      .toBe('https://github.com/vote-usa/state-roster-pipeline/commit/e0893040aa762218b2950ea95ff2c4eddb946ebf');
  });
});
