import { strings } from '../i18n/strings';

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return strings.auth.errors.generic;

  const code = error.code || '';
  const message = error.message || '';

  if (code.includes('microsoft') || message.includes('microsoft') || message.includes('AADSTS')) {
    return strings.auth.microsoftOrgError;
  }

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return strings.auth.errors.userNotFound;
    case 'auth/wrong-password':
      return strings.auth.errors.wrongPassword;
    case 'auth/email-already-in-use':
      return strings.auth.errors.emailInUse;
    case 'auth/weak-password':
      return strings.auth.errors.weakPassword;
    case 'auth/too-many-requests':
      return strings.auth.errors.tooManyRequests;
    case 'auth/network-request-failed':
      return strings.auth.errors.networkError;
    case 'auth/invalid-email':
      return strings.auth.errors.invalidEmail;
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    default:
      if (message.includes('offline') || message.includes('network')) {
        return strings.auth.errors.networkError;
      }
      return error.message || strings.auth.errors.generic;
  }
}
