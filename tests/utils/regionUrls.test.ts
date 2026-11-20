import { describe, expect, it } from 'vitest';
import type { UrlVersion } from '../../src/js/react-query/apiTypes';
import { changedFields, currentVersions, regionLabel, shortUrl, urlColumn, urlFormat, urlProblem } from '../../src/js/utils/regionUrls';

const version = (versionId: number, urlId: number, change: Partial<UrlVersion> = {}): UrlVersion => ({
  versionId,
  urlId,
  action: 'edited',
  stateCode: 'AR',
  counties: [],
  city: null,
  url: 'https://www.sos.arkansas.gov/elections',
  urlType: 'candidate_data',
  editedAt: '2026-10-01T00:00:00Z',
  editedBy: 'tester',
  lastUsedAt: null,
  ...change,
});

describe('urlColumn', () => {
  it('puts landing pages under Overview and data pages under Roster', () => {
    expect(urlColumn('official_landing')).toBe('overview');
    expect(urlColumn('ballotpedia')).toBe('overview');
    expect(urlColumn('candidate_data')).toBe('roster');
    expect(urlColumn('measure_data')).toBe('roster');
  });
});

describe('shortUrl', () => {
  it('drops the scheme and www, and cuts a long URL to fit', () => {
    expect(shortUrl('https://www.ballotpedia.org/Arkansas')).toBe('ballotpedia.org/Arkansas');
    expect(shortUrl('https://elections.arkansas.gov/candidates/2026/general', 20)).toBe('elections.arkansas.…');
  });
});

describe('urlFormat', () => {
  it('names a file format, but not a page', () => {
    expect(urlFormat('https://sos.ar.gov/files/Candidates.PDF')).toBe('pdf');
    expect(urlFormat('https://sos.ar.gov/list.csv?year=2026')).toBe('csv');
    expect(urlFormat('https://sos.ar.gov/candidates.aspx')).toBe('');
    expect(urlFormat('https://sos.ar.gov/candidates')).toBe('');
    expect(urlFormat('not a url')).toBe('');
  });
});

describe('regionLabel', () => {
  it('lists counties then the city, and is empty for the whole state', () => {
    expect(regionLabel(['Boone', 'Bradley'], 'Little Rock')).toBe('Boone, Bradley · Little Rock');
    expect(regionLabel([], 'Little Rock')).toBe('Little Rock');
    expect(regionLabel([], null)).toBe('');
  });
});

describe('urlProblem', () => {
  it('accepts http and https URLs only', () => {
    expect(urlProblem(' https://sos.ar.gov ')).toBeNull();
    expect(urlProblem('')).toBe('Enter a URL.');
    expect(urlProblem('sos.ar.gov')).toBe('That is not a complete URL.');
    expect(urlProblem('ftp://sos.ar.gov')).toBe('The URL must start with http:// or https://.');
  });
});

describe('changedFields', () => {
  it('marks what each version changed from the one before it', () => {
    const versions = [
      version(3, 1, { counties: ['Boone'], city: 'Little Rock' }),
      version(2, 1, { counties: ['Boone']}),
      version(1, 1, { counties: ['Washington'], urlType: null }),
    ];

    const changed = changedFields(versions);

    expect([...changed.get(3)!]).toEqual(['city']);
    expect([...changed.get(2)!].sort()).toEqual(['counties', 'urlType']);
    expect([...changed.get(1)!].sort()).toEqual(['counties', 'stateCode', 'url']);
  });

  it('compares each version only with earlier ones of the same URL, and ignores county order', () => {
    const versions = [
      version(4, 2, { url: 'https://ballotpedia.org/Arkansas', urlType: 'ballotpedia' }),
      version(3, 1, { counties: ['Bradley', 'Boone']}),
      version(2, 1, { counties: ['Boone', 'Bradley']}),
    ];

    const changed = changedFields(versions);

    expect([...changed.get(4)!].sort()).toEqual(['stateCode', 'url', 'urlType']);
    expect(changed.get(3)!.size).toBe(0);
  });
});

describe('currentVersions', () => {
  it('is the newest version of each URL', () => {
    expect([...currentVersions([version(5, 2), version(4, 1), version(3, 2), version(2, 1)])]).toEqual([5, 4]);
  });
});
