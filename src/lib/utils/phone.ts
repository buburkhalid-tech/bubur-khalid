/**
 * Utility functions for Indonesian phone and WhatsApp numbers normalization and display formatting.
 * Ensures numbers entered in various formats (e.g. '08123456789', '+628123456789', '0812-3456-789', '8123456789')
 * are cleanly parsed into valid WhatsApp international format (628...) and human-readable format.
 */

export const DEFAULT_ADMIN_WHATSAPP = '6285274281819';
export const DEFAULT_OWNER_WHATSAPP = '6285274281819';

/**
 * Normalizes any Indonesian phone number string to WhatsApp API standard format (e.g. 6285274281819).
 */
export function formatIndonesianWhatsappNumber(rawPhone?: string | null, fallback = DEFAULT_ADMIN_WHATSAPP): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return fallback;
  }

  // Remove all non-numeric characters
  let digits = rawPhone.replace(/\D/g, '');

  if (!digits) {
    return fallback;
  }

  // Handle leading 0 (e.g. 0852... -> 62852...)
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  }
  // Handle leading 8 without country code (e.g. 852... -> 62852...)
  else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  // Handle numbers with 62 prefix
  else if (digits.startsWith('62')) {
    // already starts with 62
  }

  // Validate minimum sensible length for Indonesian mobile (62 + 8... + at least 7 digits = ~10 digits)
  if (digits.length < 9) {
    return fallback;
  }

  return digits;
}

/**
 * Formats a phone number for clean, friendly human display (e.g. +62 852-7428-1819).
 */
export function formatDisplayPhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return '-';
  }

  const clean = formatIndonesianWhatsappNumber(rawPhone);
  if (!clean || clean.length < 9) {
    return rawPhone;
  }

  if (clean.startsWith('62')) {
    const prefix = clean.slice(2, 5);
    const mid = clean.slice(5, 9);
    const rest = clean.slice(9);
    return `+62 ${prefix}-${mid}${rest ? '-' + rest : ''}`;
  }

  return rawPhone;
}
