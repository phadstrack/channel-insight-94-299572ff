export const logger = {
  info: (label: string, data?: any) => console.log(`[ARC3 INFO] ${label}`, data || ''),
  error: (label: string, error?: any) => console.error(`[ARC3 ERROR] ${label}`, error || ''),
  warn: (label: string, data?: any) => console.warn(`[ARC3 WARN] ${label}`, data || ''),
};

export function generateID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function normalizeString(s: string): string {
  return s.trim().toLowerCase().normalize('NFD');
}

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function getDateRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

export function calculatePercentChange(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}
