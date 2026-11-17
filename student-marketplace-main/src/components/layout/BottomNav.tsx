import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, PlusCircle, Package, User } from 'lucide-react';
import { strings } from '../../i18n/strings';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: strings.nav.home, icon: Home },
    { to: '/favorites', label: strings.nav.favorites, icon: Heart },
    { to: '/listings/new', label: 'Post', icon: PlusCircle, highlight: true },
    { to: '/my-listings', label: 'My items', icon: Package },
    { to: '/profile', label: strings.nav.profile, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-ink-200 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-lg">
      <div className="flex items-end justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center px-2 -mt-4 rounded-lg focus-visible:ring-2 focus-visible:ring-cobalt-500"
              >
                <span className="w-11 h-11 rounded-full bg-cobalt-600 text-white flex items-center justify-center shadow-md shadow-cobalt-200">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] mt-0.5 font-semibold text-cobalt-700">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 ${
                  isActive
                    ? 'text-cobalt-700 font-semibold bg-cobalt-50'
                    : 'text-ink-500 hover:text-ink-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
