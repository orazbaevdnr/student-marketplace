import { getAccessToken, notifyAuthExpired, setAccessToken } from '../auth/session';
import {
  ApiClient,
  AuthResponse,
  CreateListingInput,
  Listing,
  ListingQuery,
  ListingStatus,
  Paged,
  Review,
  ReviewQuery,
  SellerProfile,
  UpdateListingInput,
  User,
} from './types';
export class RestApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || '/api/client';
  }

  private async request<T>(path: string, options?: RequestInit & { skipAuthExpire?: boolean }): Promise<T> {
    const token = getAccessToken();
    const { skipAuthExpire, ...init } = options || {};

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !skipAuthExpire && token) {
      notifyAuthExpired();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const error = new Error(err.message || err.detail || `API error ${res.status}`) as Error & {
        status?: number;
      };
      error.status = res.status;
      throw error;
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthExpire: true,
    });
    setAccessToken(result.token);
    return result;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      skipAuthExpire: true,
    });
    setAccessToken(result.token);
    return result;
  }

  async me(): Promise<User> {
    return this.request<User>('/auth/me');
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
    try {
      return await this.request<Listing>(`/listings/${id}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
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
    try {
      return await this.request<User>(`/users/${userId}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name,
        faculty: data.faculty,
        year: data.year,
        telegram: data.telegram,
      }),
    });
  }

  // ---- Reviews: the Spring Boot backend is the single source of truth ----

  async getReviews(query: ReviewQuery): Promise<Paged<Review>> {
    const params = new URLSearchParams();
    if (query.sellerId) params.set('sellerId', query.sellerId);
    if (query.reviewerId) params.set('reviewerId', query.reviewerId);
    if (query.listingId) params.set('listingId', query.listingId);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    const qs = params.toString();
    return await this.request<Paged<Review>>(`/reviews${qs ? `?${qs}` : ''}`);
  }

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    return await this.request<Review[]>(`/sellers/${sellerId}/reviews`);
  }

  async getMyReviewForListing(reviewerId: string, listingId: string): Promise<Review | null> {
    try {
      return await this.request<Review>(
        `/reviews/mine?reviewerId=${encodeURIComponent(reviewerId)}&listingId=${encodeURIComponent(listingId)}`
      );
    } catch (error) {
      // 404 simply means "this user has not reviewed this listing yet".
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    return await this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(
    id: string,
    data: Partial<Pick<Review, 'rating' | 'tags' | 'comment'>>
  ): Promise<Review> {
    return await this.request<Review>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: string): Promise<boolean> {
    await this.request<void>(`/reviews/${id}`, { method: 'DELETE' });
    return true;
  }

  async getSellerProfile(sellerId: string): Promise<SellerProfile> {
    return await this.request<SellerProfile>(`/sellers/${sellerId}/profile`);
  }
}
