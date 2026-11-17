import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Heart,
  Package,
  User as UserIcon,
  LogOut,
  Search,
  MessageSquare,
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
      label: strings.nav.reviews,
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => navigate('/reviews'),
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
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-ink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group rounded-lg focus-visible:ring-2 focus-visible:ring-cobalt-500"
          >
            <div className="w-10 h-10 rounded-lg bg-cobalt-600 text-white flex items-center justify-center shadow-sm shadow-cobalt-100 group-hover:bg-cobalt-700 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-ink-900 text-lg tracking-tight block leading-tight">
                {strings.appName}
              </span>
              <span className="text-[11px] text-ink-500 font-medium block leading-none">
                Campus marketplace
              </span>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
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
                aria-label="Search listings"
                className="w-full pl-10 pr-4 py-2 bg-chalk border border-transparent rounded-lg text-sm text-ink-900 placeholder-ink-400 focus:bg-surface focus:border-cobalt-300 focus:ring-2 focus:ring-cobalt-100 transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink
              to="/reviews"
              className={({ isActive }) =>
                `hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 ${
                  isActive
                    ? 'text-cobalt-700 bg-cobalt-50'
                    : 'text-ink-600 hover:text-cobalt-700 hover:bg-chalk'
                }`
              }
              title="Campus reviews"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{strings.nav.reviews}</span>
            </NavLink>

            <Link to="/listings/new" className="rounded-lg focus-visible:ring-2 focus-visible:ring-cobalt-500">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="hidden sm:inline-flex"
              >
                {strings.nav.postListing}
              </Button>
            </Link>

            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `hidden md:flex p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 ${
                  isActive
                    ? 'text-coral-600 bg-coral-50'
                    : 'text-ink-600 hover:text-coral-600 hover:bg-chalk'
                }`
              }
              title={strings.nav.favorites}
            >
              <Heart className="w-5 h-5" />
            </NavLink>

            {/* User Dropdown */}
            {user ? (
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-chalk transition-colors">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-cobalt-100"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cobalt-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-cobalt-100">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-semibold text-ink-700 max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </div>
                }
                header={
                  <div>
                    <p className="font-semibold text-ink-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-ink-500 truncate">
                      {user.email}
                    </p>
                  </div>
                }
                items={dropdownItems}
              />
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  {strings.auth.signInBtn}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
