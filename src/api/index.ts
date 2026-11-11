import { ApiClient } from './types';
import { MockApiClient } from './mockAdapter';
import { RestApiClient } from './restAdapter';
import { FirestoreApiClient } from './firestoreAdapter';
import { isFirebaseConfigured } from '../auth/firebase';

// Priority:
// 1. VITE_USE_MOCK=false -> real Spring Boot backend (REST)
// 2. Firebase configured -> Cloud Firestore
// 3. otherwise -> local mock
function createApiClient(): ApiClient {
  if (import.meta.env.VITE_USE_MOCK === 'false') {
    return new RestApiClient();
  }
  if (isFirebaseConfigured) {
    return new FirestoreApiClient();
  }
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return new MockApiClient();
  }
  return new RestApiClient();
}

export const api: ApiClient = createApiClient();

export * from './types';
