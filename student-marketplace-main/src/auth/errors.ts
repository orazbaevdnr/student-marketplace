import { strings } from '../i18n/strings';

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return strings.auth.errors.generic;

  const message: string = error.message || '';
  const status: number | undefined = error.status;
  const lower = message.toLowerCase();

  if (status === 409 || lower.includes('already registered') || lower.includes('already exists')) {
    return strings.auth.errors.emailInUse;
  }
  if (status === 401 || lower.includes('wrong e-mail') || lower.includes('wrong email') || lower.includes('password')) {
    return strings.auth.errors.wrongPassword;
  }
  if (lower.includes('university e-mail') || lower.includes('university email')) {
    return message;
  }
  if (lower.includes('8 to 72') || lower.includes('must be 8')) {
    return strings.auth.errors.weakPassword;
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return strings.auth.errors.networkError;
  }
  return message || strings.auth.errors.generic;
}
