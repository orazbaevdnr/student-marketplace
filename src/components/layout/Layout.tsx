import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { EmailVerificationBanner } from './EmailVerificationBanner';

interface LayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  hideHeaderSearch?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-8">
      <EmailVerificationBanner />
      <Header searchQuery={searchQuery} onSearchChange={onSearchChange} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
