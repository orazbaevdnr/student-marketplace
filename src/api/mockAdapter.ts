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
import { DEMO_USER, SEED_LISTINGS, SEED_USERS } from './seed';

const STORAGE_KEY_LISTINGS = 'student_marketplace_listings_clean';
const STORAGE_KEY_USERS = 'student_marketplace_users_clean';
const STORAGE_KEY_FAVORITES_PREFIX = 'student_marketplace_favs_clean_';

const delay = (ms = Math.floor(Math.random() * 300) + 300) =>
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

export class MockApiClient implements ApiClient {
  constructor() {
    // Ensure initial storage is populated
    getStoredListings();
    getStoredUsers();
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

    // Sort
    const sort = query?.sort || 'newest';
    listings.sort((a, b) => {
      if (sort === 'price_asc') {
        return a.price - b.price;
      }
      if (sort === 'price_desc') {
        return b.price - a.price;
      }
      // default: newest
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
    const newListing: Listing = {
      ...data,
      id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    await delay(150);
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

    // Fallback if it's a new or demo user
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
}
