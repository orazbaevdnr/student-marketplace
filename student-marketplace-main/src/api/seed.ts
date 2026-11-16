import { Listing, User } from './types';

export const SEED_USERS: User[] = [];

export const DEMO_USER: User = {
  id: 'user_demo',
  name: 'Demo Student',
  email: 'demo.student@univ.edu',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  faculty: 'Software Engineering',
  year: 3,
  telegram: '@demo_student',
  emailVerified: true,
};

export const SEED_LISTINGS: Listing[] = [];
