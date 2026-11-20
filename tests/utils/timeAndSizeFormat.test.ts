import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ago, bytes, duration, minuteOf } from '../../src/js/utils/timeAndSizeFormat';

const NOW = new Date('2026-11-02T12:00:00Z');
const before = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString();

describe('ago', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('is empty with no time', () => {
    expect(ago(null)).toBe('');
  });

  it('counts seconds, minutes, hours, days and weeks', () => {
    expect(ago(before(42))).toBe('42s ago');
    expect(ago(before(5 * 60))).toBe('5 min ago');
    expect(ago(before(3 * 3600))).toBe('3 hours ago');
    expect(ago(before(86400))).toBe('1 day ago');
    expect(ago(before(5 * 86400))).toBe('5 days ago');
    expect(ago(before(21 * 86400))).toBe('3 weeks ago');
  });

  it('never goes negative when the server clock is ahead', () => {
    expect(ago(before(-30))).toBe('0s ago');
  });
});

describe('duration', () => {
  it('is empty before a start', () => {
    expect(duration(null, null)).toBe('');
  });

  it('gives seconds under a minute, then minutes and seconds', () => {
    expect(duration('2026-11-02T12:00:00Z', '2026-11-02T12:00:45Z')).toBe('45s');
    expect(duration('2026-11-02T12:00:00Z', '2026-11-02T12:02:05Z')).toBe('2m 5s');
  });

  it('runs to now while unfinished', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(duration(before(90), null)).toBe('1m 30s');
    vi.useRealTimers();
  });
});

describe('bytes', () => {
  it('picks B, KB or MB', () => {
    expect(bytes(null)).toBe('');
    expect(bytes(512)).toBe('512 B');
    expect(bytes(62010)).toBe('61 KB');
    expect(bytes(14833345)).toBe('14.1 MB');
  });
});

describe('minuteOf', () => {
  it('trims an API timestamp to the minute', () => {
    expect(minuteOf('2026-10-21T17:34:56Z')).toBe('2026-10-21 17:34');
  });
});
