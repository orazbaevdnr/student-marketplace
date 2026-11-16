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
import { DEMO_USER, SEED_LISTINGS, SEED_USERS } from './seed';
import { SEED_REVIEWS } from './seedReviews';
import { computeSellerStats, sanitizeText } from '../utils/reviews';
import { setAccessToken } from '../auth/session';

const STORAGE_KEY_LISTINGS = 'student_marketplace_listings_live_v2';
const STORAGE_KEY_USERS = 'student_marketplace_users_live_v2';
const STORAGE_KEY_FAVORITES_PREFIX = 'student_marketplace_favs_live_v2_';
const STORAGE_KEY_REVIEWS = 'student_marketplace_reviews_v1';

// Remove all previous demo items from browser storage
try {
  localStorage.removeItem('student_marketplace_listings_v1');
  localStorage.removeItem('student_marketplace_listings_clean');
  localStorage.removeItem('student_marketplace_users_v1');
  localStorage.removeItem('student_marketplace_users_clean');
} catch (e) {}

const delay = (ms = Math.floor(Math.random() * 200) + 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getStoredListings(): Listing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(SEED_LISTINGS));
      return SEED_LISTINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read listings from localStorage', e);
    return SEED_LISTINGS;
  }
}

function saveStoredListings(listings: Listing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
  } catch (e) {
    console.error('Failed to save listings to localStorage', e);
  }
}

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      const allUsers = [...SEED_USERS, DEMO_USER];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
      return allUsers;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read users from localStorage', e);
    return [...SEED_USERS, DEMO_USER];
  }
}

function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
}

function getFavoritesSet(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_FAVORITES_PREFIX}${userId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function saveFavoritesSet(userId: string, set: Set<string>): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_FAVORITES_PREFIX}${userId}`,
      JSON.stringify(Array.from(set))
    );
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

function getStoredReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read reviews from localStorage', e);
    return SEED_REVIEWS;
  }
}

function saveStoredReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews to localStorage', e);
  }
}

export class MockApiClient implements ApiClient {
  constructor() {
    getStoredListings();
    getStoredUsers();
    getStoredReviews();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = getStoredUsers();
    let found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        emailVerified: true,
      };
      users.push(found);
      saveStoredUsers(users);
    }
    const token = `mock-jwt-token-${found.id}`;
    setAccessToken(token);
    return {
      token,
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: found,
    };
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = getStoredUsers();
    const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists');
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      emailVerified: true,
    };
    users.push(newUser);
    saveStoredUsers(users);
    const token = `mock-jwt-token-${newUser.id}`;
    setAccessToken(token);
    return {
      token,
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: newUser,
    };
  }

  async me(): Promise<User> {
    await delay(100);
    const users = getStoredUsers();
    return users[0] || DEMO_USER;
  }

  async getListings(query?: ListingQuery): Promise<Paged<Listing>> {
    await delay();
    let listings = getStoredListings();

    if (query?.q) {
      const q = query.q.toLowerCase().trim();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }

    if (query?.category) {
      listings = listings.filter((l) => l.category === query.category);
    }

    if (query?.condition) {
      listings = listings.filter((l) => l.condition === query.condition);
    }

    if (query?.minPrice !== undefined && query.minPrice !== null && !isNaN(query.minPrice)) {
      listings = listings.filter((l) => l.price >= (query.minPrice as number));
    }

    if (query?.maxPrice !== undefined && query.maxPrice !== null && !isNaN(query.maxPrice)) {
      listings = listings.filter((l) => l.price <= (query.maxPrice as number));
    }

    const sort = query?.sort || 'newest';
    listings.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = listings.length;
    const page = Math.max(1, query?.page || 1);
    const pageSize = Math.max(1, query?.pageSize || 12);
    const startIndex = (page - 1) * pageSize;
    const items = listings.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async getListing(id: string): Promise<Listing | null> {
    await delay();
    const listings = getStoredListings();
    return listings.find((l) => l.id === id) || null;
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    await delay();
    const listings = getStoredListings();
    const users = getStoredUsers();
    const seller = data.seller || {
      id: users[0]?.id || 'user_demo',
      name: users[0]?.name || 'Student',
      avatarUrl: users[0]?.avatarUrl,
      faculty: users[0]?.faculty,
    };

    const newListing: Listing = {
      ...data,
      id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sellerId: data.sellerId || seller.id,
      seller,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    listings.unshift(newListing);
    saveStoredListings(listings);
    return newListing;
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    await delay();
    const listings = getStoredListings();
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Listing with id ${id} not found`);
    }
    const updated: Listing = {
      ...listings[index],
      ...data,
    };
    listings[index] = updated;
    saveStoredListings(listings);
    return updated;
  }

  async deleteListing(id: string): Promise<boolean> {
    await delay();
    const listings = getStoredListings();
    const filtered = listings.filter((l) => l.id !== id);
    saveStoredListings(filtered);
    return true;
  }

  async setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
    await delay();
    const listings = getStoredListings();
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Listing with id ${id} not found`);
    }
    listings[index].status = status;
    saveStoredListings(listings);
    return listings[index];
  }

  async getMyListings(userId: string): Promise<Listing[]> {
    await delay();
    const listings = getStoredListings();
    return listings
      .filter((l) => l.sellerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFavorites(userId: string): Promise<Listing[]> {
    await delay();
    const favSet = getFavoritesSet(userId);
    const listings = getStoredListings();
    return listings.filter((l) => favSet.has(l.id));
  }

  async toggleFavorite(userId: string, listingId: string): Promise<{ isFavorite: boolean }> {
    await delay(100);
    const favSet = getFavoritesSet(userId);
    let isFavorite = false;
    if (favSet.has(listingId)) {
      favSet.delete(listingId);
      isFavorite = false;
    } else {
      favSet.add(listingId);
      isFavorite = true;
    }
    saveFavoritesSet(userId, favSet);
    return { isFavorite };
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const favSet = getFavoritesSet(userId);
    return favSet.has(listingId);
  }

  async getProfile(userId: string): Promise<User | null> {
    await delay();
    const users = getStoredUsers();
    const found = users.find((u) => u.id === userId);
    if (found) return found;
    if (userId === DEMO_USER.id) return DEMO_USER;
    return null;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await delay();
    const users = getStoredUsers();
    let index = users.findIndex((u) => u.id === userId);
    let user: User;
    if (index === -1) {
      user = {
        id: userId,
        name: data.name || 'Student User',
        email: data.email || 'student@univ.edu',
        emailVerified: false,
        ...data,
      };
      users.push(user);
    } else {
      user = {
        ...users[index],
        ...data,
      };
      users[index] = user;
    }
    saveStoredUsers(users);
    return user;
  }

  // ---- Reviews ----

  async getReviews(query: ReviewQuery): Promise<Paged<Review>> {
    await delay();
    let reviews = getStoredReviews();
    if (query.sellerId) {
      reviews = reviews.filter((r) => r.sellerId === query.sellerId);
    }
    if (query.reviewerId) {
      reviews = reviews.filter((r) => r.reviewerId === query.reviewerId);
    }
    if (query.listingId) {
      reviews = reviews.filter((r) => r.listingId === query.listingId);
    }
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = reviews.length;
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);
    const items = reviews.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    await delay();
    const reviews = getStoredReviews();
    return reviews
      .filter((r) => r.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMyReviewForListing(reviewerId: string, listingId: string): Promise<Review | null> {
    await delay(100);
    const reviews = getStoredReviews();
    return reviews.find((r) => r.reviewerId === reviewerId && r.listingId === listingId) || null;
  }

  async createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    await delay();
    if (data.reviewerId === data.sellerId) {
      throw new Error('You cannot review your own listing');
    }
    const reviews = getStoredReviews();
    const existing = reviews.find(
      (r) => r.reviewerId === data.reviewerId && r.listingId === data.listingId
    );
    if (existing) {
      throw new Error('You have already reviewed this seller for this listing');
    }
    const now = new Date().toISOString();
    const newReview: Review = {
      ...data,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      comment: sanitizeText(data.comment || ''),
      createdAt: now,
      updatedAt: now,
    };
    reviews.unshift(newReview);
    saveStoredReviews(reviews);
    return newReview;
  }

  async updateReview(
    id: string,
    data: Partial<Pick<Review, 'rating' | 'tags' | 'comment'>>
  ): Promise<Review> {
    await delay();
    const reviews = getStoredReviews();
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Review not found');
    }
    const updated: Review = {
      ...reviews[idx],
      ...data,
      comment: data.comment !== undefined ? sanitizeText(data.comment) : reviews[idx].comment,
      updatedAt: new Date().toISOString(),
    };
    reviews[idx] = updated;
    saveStoredReviews(reviews);
    return updated;
  }

  async deleteReview(id: string): Promise<boolean> {
    await delay();
    const reviews = getStoredReviews();
    const filtered = reviews.filter((r) => r.id !== id);
    saveStoredReviews(filtered);
    return true;
  }

  async getSellerProfile(sellerId: string): Promise<SellerProfile> {
    await delay();
    const user = (await this.getProfile(sellerId)) || {
      id: sellerId,
      name: 'Student Seller',
      email: `${sellerId}@univ.edu`,
      emailVerified: true,
    };
    const sellerReviews = await this.getSellerReviews(sellerId);
    const stats = computeSellerStats(sellerReviews);
    const listings = getStoredListings().filter((l) => l.sellerId === sellerId);
    const activeListingsCount = listings.filter((l) => l.status === 'active').length;
    const soldCount = listings.filter((l) => l.status === 'sold').length;

    return {
      user,
      stats,
      activeListingsCount,
      soldCount,
    };
  }
}
