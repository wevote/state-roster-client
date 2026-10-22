// timeAndSizeFormat.ts
// For counts, use numberWithCommas from common/utils.

export function ago (iso: string | null): string {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours ago`;
  const days = Math.round(seconds / 86400);
  if (days === 1) return '1 day ago';
  return days < 14 ? `${days} days ago` : `${Math.round(days / 7)} weeks ago`;
}

export function duration (from: string | null, to: string | null): string {
  if (!from) return '';
  const seconds = Math.max(0, Math.round(((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function bytes (n: number | null): string {
  if (n === null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** An API timestamp as "2026-10-21 14:05". */
export const minuteOf = (iso: string) => iso.slice(0, 16).replace('T', ' ');
