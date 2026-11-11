import { auth } from '../auth/firebase';
import {
  ApiClient,
  CreateListingInput,
  Listing,
  ListingQuery,
  ListingStatus,
  Paged,
  UpdateListingInput,
  User,
} from './types';

export class RestApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/client';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    // The backend accepts Firebase ID tokens as "Authorization: Bearer ...".
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.detail || `API error ${res.status}`);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json();
  }

  async getListings(query?: ListingQuery): Promise<Paged<Listing>> {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.category) params.set('category', query.category);
    if (query?.condition) params.set('condition', query.condition);
    if (query?.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
    if (query?.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
    if (query?.sort) params.set('sort', query.sort);
    if (query?.page) params.set('page', String(query.page));
    if (query?.pageSize) params.set('pageSize', String(query.pageSize));

    const qs = params.toString();
    return this.request<Paged<Listing>>(`/listings${qs ? `?${qs}` : ''}`);
  }

  async getListing(id: string): Promise<Listing | null> {
    return this.request<Listing>(`/listings/${id}`);
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    return this.request<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string): Promise<boolean> {
    await this.request<void>(`/listings/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  async setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getMyListings(userId: string): Promise<Listing[]> {
    return this.request<Listing[]>(`/users/${userId}/listings`);
  }

  async getFavorites(userId: string): Promise<Listing[]> {
    return this.request<Listing[]>(`/users/${userId}/favorites`);
  }

  async toggleFavorite(userId: string, listingId: string): Promise<{ isFavorite: boolean }> {
    return this.request<{ isFavorite: boolean }>(`/users/${userId}/favorites/${listingId}/toggle`, {
      method: 'POST',
    });
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const res = await this.request<{ isFavorite: boolean }>(`/users/${userId}/favorites/${listingId}`);
    return res.isFavorite;
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.request<User>(`/users/${userId}`);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
