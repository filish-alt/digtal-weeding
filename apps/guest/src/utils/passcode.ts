/**
 * Format a human-friendly unique passcode from an invitation or guest ID/token.
 * Example: 'c8a3014e-...' -> 'INV-C8A301'
 */
export function formatInvitationCode(idOrToken?: string | null): string {
  if (!idOrToken) return 'INV-000000';
  const clean = idOrToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const sub = clean.slice(0, 6).padEnd(6, '0');
  return `INV-${sub}`;
}

export function formatGuestPassCode(guestIdOrToken?: string | null): string {
  if (!guestIdOrToken) return 'PASS-000000';
  const clean = guestIdOrToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const sub = clean.slice(0, 6).padEnd(6, '0');
  return `PASS-${sub}`;
}
