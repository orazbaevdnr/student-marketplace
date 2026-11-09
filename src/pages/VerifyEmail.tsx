import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../i18n/strings';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const VerifyEmail: React.FC = () => {
  const { user, resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification();
      toast.success(strings.verifyEmail.resendSuccess);
    } catch (e: any) {
      toast.error('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-100 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {strings.verifyEmail.title}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          {strings.verifyEmail.subtitle}{' '}
          <span className="font-semibold text-slate-800">
            {user?.email || 'your email'}
          </span>
          .
        </p>

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          {strings.verifyEmail.checkInbox}
        </p>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            isLoading={isResending}
            onClick={handleResend}
          >
            {strings.verifyEmail.resendBtn}
          </Button>

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSkip}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {strings.verifyEmail.skipBtn}
          </Button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Verification is optional and will not block any feature.</span>
        </div>
      </div>
    </div>
  );
};
