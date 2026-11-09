export type Condition = 'new' | 'like_new' | 'good' | 'fair';

export type Category =
  | 'textbooks'
  | 'electronics'
  | 'furniture'
  | 'clothes'
  | 'dorm_home'
  | 'sports'
  | 'other';

export type ListingStatus = 'active' | 'sold';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  faculty?: string;
  year?: number;
  telegram?: string;
  emailVerified: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  images: string[];
  status: ListingStatus;
  sellerId: string;
  seller: Pick<User, 'id' | 'name' | 'avatarUrl' | 'faculty'>;
  contact: string;
  createdAt: string;
}

export interface ListingQuery {
  q?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
  condition?: Condition;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateListingInput = {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  images: string[];
  contact: string;
  sellerId: string;
  seller: Pick<User, 'id' | 'name' | 'avatarUrl' | 'faculty'>;
};

export type UpdateListingInput = Partial<
  Omit<Listing, 'id' | 'createdAt' | 'sellerId' | 'seller'>
>;

export interface ApiClient {
  getListings(query?: ListingQuery): Promise<Paged<Listing>>;
  getListing(id: string): Promise<Listing | null>;
  createListing(data: CreateListingInput): Promise<Listing>;
  updateListing(id: string, data: UpdateListingInput): Promise<Listing>;
  deleteListing(id: string): Promise<boolean>;
  setListingStatus(id: string, status: ListingStatus): Promise<Listing>;
  getMyListings(userId: string): Promise<Listing[]>;
  getFavorites(userId: string): Promise<Listing[]>;
  toggleFavorite(userId: string, listingId: string): Promise<{ isFavorite: boolean }>;
  isFavorite(userId: string, listingId: string): Promise<boolean>;
  getProfile(userId: string): Promise<User | null>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;
}
