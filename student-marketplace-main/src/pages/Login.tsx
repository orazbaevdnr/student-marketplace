import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Tag,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { isMockMode } from '../api';
import { strings } from '../i18n/strings';
import { isValidEmail } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

const BRAND_POINTS = [
  {
    icon: Tag,
    title: 'Fair campus prices',
    text: 'Textbooks, electronics and dorm gear from students a few buildings away.',
  },
  {
    icon: ShieldCheck,
    title: 'Reviews you can trust',
    text: 'Every seller is rated by real buyers after the exchange.',
  },
  {
    icon: HeartHandshake,
    title: 'Meet on campus',
    text: 'No shipping, no strangers. Agree on a spot between classes.',
  },
];

export const Login: React.FC = () => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = (location.state as { from?: string } | null)?.from || '/';

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
      } else {
        await signUp(name, email, password);
        toast.success('Account created!');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || strings.auth.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn('demo.student@kbtu.kz', 'Demo12345!');
      toast.success('Signed in as Demo Student!');
      navigate(from, { replace: true });
    } catch {
      // Fallback
      navigate(from, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chalk lg:grid lg:grid-cols-2">
      {/* Brand side (desktop only) */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-ink-900 px-12 py-12 text-white overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-24 h-40 w-40 rounded-full bg-cobalt-600/30 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cobalt-600 flex items-center justify-center shadow-lg shadow-cobalt-950/40">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">
              {strings.appName}
            </p>
            <p className="text-xs text-ink-300">Campus marketplace</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-[1.1]">
            Good stuff, <span className="text-sun-400">better prices</span>, same
            campus.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-300">
            {strings.appPitch}. Post an item in a minute and find a buyer between
            lectures.
          </p>

          <ul className="mt-8 space-y-4">
            {BRAND_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sun-400">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{point.title}</p>
                    <p className="text-xs leading-relaxed text-ink-300">{point.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative">
          {/* A quiet preview of the one loud element: the price tag. */}
          <div className="w-64 rounded-xl bg-surface p-3 text-ink-900 shadow-xl">
            <div className="h-28 rounded-lg bg-chalk" aria-hidden="true" />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold truncate">Calculus, 8th edition</p>
              <span className="price-tag text-sm">4 500 ₸</span>
            </div>
            <p className="mt-1 text-[11px] text-ink-500">Like new · Dorm pickup</p>
          </div>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-cobalt-600 text-white items-center justify-center shadow-sm mb-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900 tracking-tight">
              {strings.appName}
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">{strings.appPitch}</p>
          </div>

          <div className="bg-surface py-8 px-6 shadow-sm border border-ink-200 rounded-2xl sm:px-8">
            <div className="hidden lg:block mb-6">
              <h2 className="font-display text-2xl font-bold text-ink-900">
                {tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {tab === 'signin'
                  ? 'Sign in to post listings, save items and leave reviews.'
                  : 'Join with your university email and start trading.'}
              </p>
            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Authentication"
              className="flex border-b border-ink-200 mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signin'}
                onClick={() => {
                  setTab('signin');
                  setError(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ${
                  tab === 'signin'
                    ? 'border-cobalt-600 text-cobalt-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                {strings.auth.signInTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signup'}
                onClick={() => {
                  setTab('signup');
                  setError(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ${
                  tab === 'signup'
                    ? 'border-cobalt-600 text-cobalt-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                {strings.auth.signUpTab}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg bg-coral-50 border border-coral-200 text-coral-800 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <Input
                  label={strings.auth.fullNameLabel}
                  placeholder={strings.auth.fullNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  autoComplete="name"
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
                helperText="Use your university email (@kbtu.kz)"
                autoComplete="email"
                required
              />

              <Input
                label={strings.auth.passwordLabel}
                type="password"
                placeholder={strings.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                required
              />

              {tab === 'signup' && (
                <Input
                  label={strings.auth.confirmPasswordLabel}
                  type="password"
                  placeholder={strings.auth.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="new-password"
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

            {/* Instant Demo Login Button: only the in-browser mock has a demo account. */}
            {isMockMode && (
              <div className="mt-5 pt-4 border-t border-ink-100 text-center">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={handleDemoLogin}
                  leftIcon={<Sparkles className="w-4 h-4 text-cobalt-500" />}
                >
                  {strings.auth.demoBtn}
                </Button>
                <p className="text-[11px] text-ink-400 mt-1.5">
                  One-click evaluation access for grading and defense
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-400">
            By continuing you agree to keep exchanges respectful and on campus.
          </p>
        </div>
      </main>
    </div>
  );
};
