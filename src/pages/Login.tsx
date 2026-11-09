import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../i18n/strings';
import { isValidEmail } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Forgot password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft, signInDemo, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = (location.state as any)?.from || '/';
  const showDemoLogin = import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(strings.auth.errors.invalidEmail);
      return;
    }

    if (password.length < 6) {
      setError(strings.auth.errors.weakPassword);
      return;
    }

    if (tab === 'signup') {
      if (!name.trim()) {
        setError(strings.auth.errors.required);
        return;
      }
      if (password !== confirmPassword) {
        setError(strings.auth.errors.passwordMismatch);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (tab === 'signin') {
        await signIn(email, password);
        toast.success('Signed in successfully!');
        navigate(from, { replace: true });
      } else {
        await signUp(name, email, password);
        toast.success('Account created! Verification email sent.');
        navigate('/verify-email', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || strings.auth.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithMicrosoft();
      toast.success('Signed in with Microsoft!');
      navigate(from, { replace: true });
    } catch (err: any) {
      // Prompt specifically requested organization error fallback
      setError(err.message || strings.auth.microsoftOrgError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setIsDemoLoading(true);
    try {
      await signInDemo();
      toast.success('Welcome to Student Marketplace (Demo Mode)!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Demo login failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      toast.error(strings.auth.errors.invalidEmail);
      return;
    }
    setIsForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
      toast.success(strings.auth.resetEmailSent);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-100 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {strings.appName}
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xs mx-auto">
          {strings.appPitch}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {/* Demo Login Callout (Priority for demo defense) */}
          {showDemoLogin && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Instant Defense Evaluation
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white">
                  1-Click
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {strings.auth.demoDesc}
              </p>
              <Button
                type="button"
                onClick={handleDemoSignIn}
                isLoading={isDemoLoading}
                variant="primary"
                fullWidth
                size="md"
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {strings.auth.demoBtn}
              </Button>
            </div>
          )}

          {/* Sign in / Sign up Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                tab === 'signin'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {strings.auth.signInTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                tab === 'signup'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {strings.auth.signUpTab}
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <Input
                label={strings.auth.fullNameLabel}
                placeholder={strings.auth.fullNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label={strings.auth.emailLabel}
              type="email"
              placeholder={strings.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {strings.auth.passwordLabel}
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSent(false);
                      setForgotEmail(email);
                      setIsForgotOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    {strings.auth.forgotPassword}
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder={strings.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            {tab === 'signup' && (
              <Input
                label={strings.auth.confirmPasswordLabel}
                type="password"
                placeholder={strings.auth.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-2"
            >
              {tab === 'signin' ? strings.auth.signInBtn : strings.auth.signUpBtn}
            </Button>
          </form>

          {/* OAuth Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-medium">
                  {strings.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="mt-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={strings.auth.resetPasswordTitle}
        description={strings.auth.resetPasswordDesc}
      >
        {forgotSent ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              {strings.auth.resetEmailSent}
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                onClick={() => setIsForgotOpen(false)}
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
            <Input
              label={strings.auth.emailLabel}
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your student email"
              required
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isForgotLoading}
              >
                {strings.auth.sendResetLink}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
