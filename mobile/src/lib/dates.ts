// Ported from the web app (frontend/src/utils/dates.ts): API timestamps without
// an explicit offset are UTC; parsing them bare would shift by the phone's offset.
export function parseApiDate(value: string): Date {
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    return new Date(value + 'Z');
  }
  return new Date(value);
}

export function timeAgo(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - parseApiDate(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
