export const theme = {
  bg: '#FCFCFC',
  card: '#FFFFFF',
  border: '#EEE6E0',
  text: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  accent: '#FF7F50',
  up: '#1D9E75',
  upBg: '#E8FBF5',
  warn: '#BA7517',
  warnBg: '#FFF4DE',
  down: '#E24B4A',
  downBg: '#FFF0F0',
  pending: '#6B7280',
  pendingBg: '#F3F4F6',
};

export const statusColors: Record<string, { color: string; bg: string }> = {
  UP: { color: theme.up, bg: theme.upBg },
  WARN: { color: theme.warn, bg: theme.warnBg },
  DOWN: { color: theme.down, bg: theme.downBg },
  PENDING: { color: theme.pending, bg: theme.pendingBg },
};
