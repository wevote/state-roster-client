// yourName.ts
// The name a person types once, recorded on the runs they start and the URLs they edit.
// It lives in this browser only, and storage can be missing (a private window), so every access is guarded.
const NAME_KEY = 'roster-console.requested-by';

export function savedName (): string {
  try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; }
}

export function saveName (name: string) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* the name is only a convenience */ }
}
