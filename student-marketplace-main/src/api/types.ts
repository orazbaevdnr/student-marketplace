export type Condition = 'new' | 'like_new' | 'good' | 'fair';

export type Category =
  | 'textbooks'
  | 'electronics'
  | 'furniture'
  | 'clothes'
  | 'dorm_home'
  | 'sports'
  | 'other';

export type ListingStatus = 'active' | 'sold' | 'reserved' | 'hidden';

export interface User {
  id: string;
  name: string;
  /** Null for other people's profiles: the backend only exposes the e-mail to its owner. */
  email?: string;
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
  sellerId?: string;
  seller?: Pick<User, 'id' | 'name' | 'avatarUrl' | 'faculty'>;
};

export type UpdateListingInput = Partial<
  Omit<Listing, 'id' | 'createdAt' | 'sellerId' | 'seller'>
>;

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

// ---- Reviews ----

export type ReviewTag =
  | 'as_described'
  | 'fast_reply'
  | 'fair_price'
  | 'on_time'
  | 'friendly'
  | 'not_as_described'
  | 'slow_reply'
  | 'late'
  | 'overpriced';

export interface Review {
  id: string;
  sellerId: string;
  reviewerId: string;
  listingId: string;
  listingTitle: string; // snapshot
  reviewerName: string; // snapshot
  reviewerAvatarUrl?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: ReviewTag[];
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerStats {
  reviewCount: number;
  averageRating: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  topTags: ReviewTag[];
  badges: SellerBadge[];
}

export type SellerBadge = 'trusted_seller' | 'fast_responder' | 'honest_listings' | 'new_seller';

export interface ReviewQuery {
  sellerId?: string;
  reviewerId?: string;
  listingId?: string;
  page?: number;
  pageSize?: number;
}

export interface SellerProfile {
  user: User;
  stats: SellerStats;
  activeListingsCount: number;
  soldCount: number;
}

export interface ApiClient {
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string): Promise<AuthResponse>;
  me(): Promise<User>;
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
  // Reviews
  getReviews(query: ReviewQuery): Promise<Paged<Review>>;
  getSellerReviews(sellerId: string): Promise<Review[]>;
  getMyReviewForListing(reviewerId: string, listingId: string): Promise<Review | null>;
  createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review>;
  updateReview(id: string, data: Partial<Pick<Review, 'rating' | 'tags' | 'comment'>>): Promise<Review>;
  deleteReview(id: string): Promise<boolean>;
  getSellerProfile(sellerId: string): Promise<SellerProfile>;
}
