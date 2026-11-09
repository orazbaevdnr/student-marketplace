import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Heart,
  Package,
  User as UserIcon,
  LogOut,
  Search,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { strings } from '../../i18n/strings';
import { getInitials } from '../../utils/format';
import { Dropdown } from '../ui/Dropdown';
import { Button } from '../ui/Button';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearchChange }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const dropdownItems = [
    {
      label: strings.nav.myListings,
      icon: <Package className="w-4 h-4" />,
      onClick: () => navigate('/my-listings'),
    },
    {
      label: strings.nav.favorites,
      icon: <Heart className="w-4 h-4" />,
      onClick: () => navigate('/favorites'),
    },
    {
      label: strings.nav.profile,
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => navigate('/profile'),
    },
    {
      label: strings.nav.signOut,
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleSignOut,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">
                {strings.appName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block leading-none">
                Campus Marketplace
              </span>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else if (location.pathname !== '/') {
                    navigate(`/?q=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && location.pathname !== '/') {
                    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                placeholder={strings.nav.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link to="/listings/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="hidden sm:inline-flex shadow-indigo-100"
              >
                {strings.nav.postListing}
              </Button>
            </Link>

            {/* Quick favorites link for tablet/desktop */}
            <Link
              to="/favorites"
              className="hidden md:flex p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors relative"
              title={strings.nav.favorites}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* User Dropdown */}
            {user ? (
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-indigo-100">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </div>
                }
                header={
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.faculty && (
                      <span className="inline-block mt-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {user.faculty}
                      </span>
                    )}
                  </div>
                }
                items={dropdownItems}
              />
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  {strings.auth.signInTab}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
