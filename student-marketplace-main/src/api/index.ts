import { ApiClient } from './types';
import { RestApiClient } from './restAdapter';
import { MockApiClient } from './mockAdapter';

// Hybrid mode:
// 1. On GitHub Pages (in the cloud) or when VITE_USE_MOCK=true: uses MockApiClient so the online site is 100% interactive for professors/reviewers without requiring a local Java server.
// 2. Locally (default): connects to the real Spring Boot backend at /api/client with JWT tokens!
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
const forceMock = import.meta.env.VITE_USE_MOCK === 'true';

export const api: ApiClient = (isGitHubPages || forceMock)
  ? new MockApiClient()
  : new RestApiClient();

export * from './types';
