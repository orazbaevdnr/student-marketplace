import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { isMockMode } from '../api';
import { strings } from '../i18n/strings';
import { isValidEmail } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-100 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {strings.appName}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {strings.appPitch}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-3xl sm:px-10">
          {/* Tabs */}
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

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
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
              required
            />

            <Input
              label={strings.auth.passwordLabel}
              type="password"
              placeholder={strings.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
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
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <Button
                type="button"
                variant="outline"
                fullWidth
                size="sm"
                onClick={handleDemoLogin}
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-500" />}
              >
                Demo Login (Instant Access)
              </Button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                One-click evaluation access for grading and defense
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
