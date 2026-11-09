import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../auth/firebase';
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

// Helper to remove any undefined fields recursively so Firestore accepts the object
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as any;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = typeof val === 'object' && val !== null ? sanitizeForFirestore(val) : val;
      }
    }
    return clean as T;
  }
  return obj;
}

export class FirestoreApiClient implements ApiClient {
  private getDb() {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    return db;
  }

  async getListings(listingQuery?: ListingQuery): Promise<Paged<Listing>> {
    const firestore = this.getDb();
    const listingsRef = collection(firestore, 'listings');

    // Fetch listings ordered by createdAt desc
    const q = query(listingsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    let items: Listing[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Listing[];

    // In-memory filters for flexible query handling
    if (listingQuery?.q) {
      const search = listingQuery.q.toLowerCase().trim();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search)
      );
    }

    if (listingQuery?.category) {
      items = items.filter((l) => l.category === listingQuery.category);
    }

    if (listingQuery?.condition) {
      items = items.filter((l) => l.condition === listingQuery.condition);
    }

    if (
      listingQuery?.minPrice !== undefined &&
      listingQuery.minPrice !== null &&
      !isNaN(listingQuery.minPrice)
    ) {
      items = items.filter((l) => l.price >= (listingQuery.minPrice as number));
    }

    if (
      listingQuery?.maxPrice !== undefined &&
      listingQuery.maxPrice !== null &&
      !isNaN(listingQuery.maxPrice)
    ) {
      items = items.filter((l) => l.price <= (listingQuery.maxPrice as number));
    }

    // Sort
    const sort = listingQuery?.sort || 'newest';
    items.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = items.length;
    const page = Math.max(1, listingQuery?.page || 1);
    const pageSize = Math.max(1, listingQuery?.pageSize || 12);
    const startIndex = (page - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: pagedItems,
      total,
      page,
      pageSize,
    };
  }

  async getListing(id: string): Promise<Listing | null> {
    const firestore = this.getDb();
    const docRef = doc(firestore, 'listings', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Listing;
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    const firestore = this.getDb();
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newListing: Listing = {
      ...data,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, 'listings', id), sanitizeForFirestore(newListing));
    return newListing;
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    const firestore = this.getDb();
    const docRef = doc(firestore, 'listings', id);
    await updateDoc(docRef, sanitizeForFirestore(data) as any);

    const updated = await this.getListing(id);
    if (!updated) throw new Error('Listing not found');
    return updated;
  }

  async deleteListing(id: string): Promise<boolean> {
    const firestore = this.getDb();
    await deleteDoc(doc(firestore, 'listings', id));
    return true;
  }

  async setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
    const firestore = this.getDb();
    const docRef = doc(firestore, 'listings', id);
    await updateDoc(docRef, { status });

    const updated = await this.getListing(id);
    if (!updated) throw new Error('Listing not found');
    return updated;
  }

  async getMyListings(userId: string): Promise<Listing[]> {
    const firestore = this.getDb();
    const q = query(
      collection(firestore, 'listings'),
      where('sellerId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Listing[];

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getFavorites(userId: string): Promise<Listing[]> {
    const firestore = this.getDb();
    const userDocRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) return [];
    const favoriteIds: string[] = snapshot.data()?.favoriteIds || [];
    if (favoriteIds.length === 0) return [];

    const items: Listing[] = [];
    for (const favId of favoriteIds) {
      const item = await this.getListing(favId);
      if (item) items.push(item);
    }
    return items;
  }

  async toggleFavorite(
    userId: string,
    listingId: string
  ): Promise<{ isFavorite: boolean }> {
    const firestore = this.getDb();
    const userDocRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userDocRef);

    let favoriteIds: string[] = snapshot.exists()
      ? snapshot.data()?.favoriteIds || []
      : [];
    let isFavorite = false;

    if (favoriteIds.includes(listingId)) {
      favoriteIds = favoriteIds.filter((id) => id !== listingId);
      isFavorite = false;
    } else {
      favoriteIds.push(listingId);
      isFavorite = true;
    }

    await setDoc(userDocRef, { favoriteIds }, { merge: true });
    return { isFavorite };
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const firestore = this.getDb();
    const userDocRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) return false;
    const favoriteIds: string[] = snapshot.data()?.favoriteIds || [];
    return favoriteIds.includes(listingId);
  }

  async getProfile(userId: string): Promise<User | null> {
    const firestore = this.getDb();
    const userDocRef = doc(firestore, 'users', userId);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as User;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const firestore = this.getDb();
    const userDocRef = doc(firestore, 'users', userId);
    const existing = await this.getProfile(userId);

    const updatedUser: User = {
      id: userId,
      name: data.name || existing?.name || 'Student',
      email: data.email || existing?.email || '',
      emailVerified: data.emailVerified ?? existing?.emailVerified ?? false,
      faculty: data.faculty ?? existing?.faculty,
      year: data.year ?? existing?.year,
      telegram: data.telegram ?? existing?.telegram,
      avatarUrl: data.avatarUrl ?? existing?.avatarUrl,
    };

    await setDoc(userDocRef, sanitizeForFirestore(updatedUser), { merge: true });
    return updatedUser;
  }
}
