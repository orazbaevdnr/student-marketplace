const TOKEN_KEY = 'sm_access_token';

export const AUTH_EXPIRED_EVENT = 'sm-auth-expired';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function notifyAuthExpired(): void {
  setAccessToken(null);
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
