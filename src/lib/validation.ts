/**
 * Helpers de validation côté server actions.
 * On garde les regex côté lib pour pouvoir les réutiliser et les tester
 * indépendamment des actions Supabase.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
