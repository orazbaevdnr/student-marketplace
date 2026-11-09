import { ApiClient } from './types';
import { MockApiClient } from './mockAdapter';
import { RestApiClient } from './restAdapter';

const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const api: ApiClient = useMock ? new MockApiClient() : new RestApiClient();

export * from './types';
