import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, PlusCircle, Package, User } from 'lucide-react';
import { strings } from '../../i18n/strings';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: strings.nav.home, icon: Home },
    { to: '/favorites', label: strings.nav.favorites, icon: Heart },
    { to: '/listings/new', label: 'Post', icon: PlusCircle, highlight: true },
    { to: '/my-listings', label: 'My Items', icon: Package },
    { to: '/profile', label: strings.nav.profile, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors ${
                  item.highlight
                    ? 'text-indigo-600 font-semibold'
                    : isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon
                className={`w-5 h-5 ${
                  item.highlight ? 'stroke-[2.5] scale-110' : ''
                }`}
              />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
