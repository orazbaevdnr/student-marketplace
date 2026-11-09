import { ApiClient } from './types';
import { MockApiClient } from './mockAdapter';
import { RestApiClient } from './restAdapter';
import { FirestoreApiClient } from './firestoreAdapter';
import { isFirebaseConfigured } from '../auth/firebase';

// If Firebase is configured, use real Cloud Firestore database!
// Otherwise fallback to mock or REST.
const useMock = import.meta.env.VITE_USE_MOCK === 'true' && !isFirebaseConfigured;

function createApiClient(): ApiClient {
  if (isFirebaseConfigured) {
    return new FirestoreApiClient();
  }
  if (useMock) {
    return new MockApiClient();
  }
  return new RestApiClient();
}

export const api: ApiClient = createApiClient();

export * from './types';
