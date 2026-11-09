import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { strings } from '../../i18n/strings';

export const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{strings.verifyEmail.banner}</span>
          <Link
            to="/verify-email"
            className="font-semibold underline hover:text-amber-700 ml-1 whitespace-nowrap"
          >
            {strings.verifyEmail.bannerAction}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-100/50 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
