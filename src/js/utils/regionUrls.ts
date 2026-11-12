// regionUrls.ts
// Labels and comparisons for the URLs a person keeps on a state's page.
import type { UrlType, UrlVersion } from '../react-query/apiTypes';

export type UrlColumn = 'overview' | 'roster';

/** Every URL type, in the order the type picker lists them, under the column each is shown in. */
export const URL_TYPES: { value: UrlType; label: string; column: UrlColumn; prefix: string }[] = [
  { value: 'official_landing', label: 'Official Landing Page', column: 'overview', prefix: '' },
  { value: 'ballotpedia', label: 'Ballotpedia', column: 'overview', prefix: '' },
  { value: 'candidate_data', label: 'Candidate Data', column: 'roster', prefix: 'C' },
  { value: 'measure_data', label: 'Measure Data', column: 'roster', prefix: 'M' },
];

export const COLUMN_LABEL: Record<UrlColumn, string> = { overview: 'Overview', roster: 'Roster Page' };

const byValue = new Map(URL_TYPES.map((t) => [t.value, t]));

export const urlTypeLabel = (type: UrlType | null) => (type ? byValue.get(type)?.label ?? type : '');
export const urlColumn = (type: UrlType) => byValue.get(type)?.column ?? 'overview';
export const urlPrefix = (type: UrlType) => byValue.get(type)?.prefix ?? '';

/** A URL without its scheme or www, cut to fit a narrow column. */
export function shortUrl (url: string, max = 30): string {
  const short = url.replace(/^https?:\/\/(www\.)?/, '');
  return short.length > max ? `${short.slice(0, max - 1)}…` : short;
}

/** The format a URL's path ends in (pdf, csv, xlsx...), or '' for a page. */
export function urlFormat (url: string): string {
  try {
    const match = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return match && !['htm', 'html', 'aspx', 'php', 'jsp'].includes(match[1].toLowerCase()) ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

/** The part of a state a URL covers below the state itself: "Boone, Bradley · Little Rock", or ''. */
export const regionLabel = (counties: string[], city: string | null) => [counties.join(', '), city ?? ''].filter(Boolean).join(' · ');

/** Why a URL can't be saved as typed, or null when it can. */
export function urlProblem (url: string): string | null {
  const trimmed = url.trim();
  if (trimmed === '') return 'Enter a URL.';
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:' ? null : 'The URL must start with http:// or https://.';
  } catch {
    return 'That is not a complete URL.';
  }
}

export type VersionField = 'url' | 'urlType' | 'stateCode' | 'counties' | 'city';

const sameCounties = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((c, i) => c === [...b].sort()[i]);

/**
 * The fields each version changed from the one before it for the same URL, keyed by versionId.
 * Versions come newest first, and may mix URLs (a state's change log). A URL's first version
 * changed every field it has a value for.
 */
export function changedFields (versions: UrlVersion[]): Map<number, Set<VersionField>> {
  const changed = new Map<number, Set<VersionField>>();
  versions.forEach((v, i) => {
    const before = versions.slice(i + 1).find((o) => o.urlId === v.urlId);
    const fields = new Set<VersionField>();
    if (before ? v.url !== before.url : v.url) fields.add('url');
    if (before ? v.urlType !== before.urlType : v.urlType) fields.add('urlType');
    if (before ? v.stateCode !== before.stateCode : v.stateCode) fields.add('stateCode');
    if (before ? !sameCounties(v.counties, before.counties) : v.counties.length > 0) fields.add('counties');
    if (before ? (v.city ?? '') !== (before.city ?? '') : v.city) fields.add('city');
    changed.set(v.versionId, fields);
  });
  return changed;
}

/** The versionId each URL is at now: its newest version, in a newest-first list. */
export function currentVersions (versions: UrlVersion[]): Set<number> {
  const seen = new Set<number>();
  const current = new Set<number>();
  versions.forEach((v) => {
    if (!seen.has(v.urlId)) current.add(v.versionId);
    seen.add(v.urlId);
  });
  return current;
}
