/**
 * Centralized Date & Timezone Utilities for Asia/Jakarta (WIB, UTC+7)
 * Ensures 100% accurate date matching across Supabase UTC timestamps and local Indonesian time.
 */

export function getJakartaDateStr(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d); // Returns 'YYYY-MM-DD'
}

export function getJakartaMonthStr(dateInput?: string | Date | null): string {
  const str = getJakartaDateStr(dateInput || new Date());
  return str.substring(0, 7); // Returns 'YYYY-MM'
}

export function formatJakartaFullDate(dateInput?: string | Date | null): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

export function formatJakartaTime(dateInput?: string | Date | null): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}
