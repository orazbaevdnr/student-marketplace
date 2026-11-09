import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Calendar,
  Send,
  Save,
  LogOut,
  Package,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { strings } from '../i18n/strings';
import { getInitials } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export const Profile: React.FC = () => {
  const { user, signOut, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [year, setYear] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [activeCount, setActiveCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setFaculty(user.faculty || '');
      setYear(user.year ? String(user.year) : '');
      setTelegram(user.telegram || '');

      // Load user listing stats
      api.getMyListings(user.id).then((items) => {
        const active = items.filter((i) => i.status === 'active').length;
        const sold = items.filter((i) => i.status === 'sold').length;
        setActiveCount(active);
        setSoldCount(sold);
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentUser({
        name: name.trim(),
        faculty: faculty.trim() || undefined,
        year: year ? Number(year) : undefined,
        telegram: telegram.trim() || undefined,
      });
      toast.success(strings.profile.savedSuccess);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {strings.profile.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {strings.profile.subtitle}
        </p>
      </div>

      <div className="space-y-6">
        {/* User Card & Stats */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center ring-4 ring-indigo-50 shrink-0 shadow-sm">
              {getInitials(user.name)}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {user.name}
            </h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-base font-bold text-slate-900 leading-none">
                    {activeCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {strings.profile.activeCount}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-base font-bold text-slate-900 leading-none">
                    {soldCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {strings.profile.soldCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form
          onSubmit={handleSave}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
        >
          <Input
            label={strings.profile.nameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label={strings.profile.emailLabel}
            value={user.email}
            disabled
            leftIcon={<Mail className="w-4 h-4" />}
            helperText={strings.profile.emailHelp}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={strings.profile.facultyLabel}
              placeholder={strings.profile.facultyPlaceholder}
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              leftIcon={<GraduationCap className="w-4 h-4" />}
            />

            <Input
              label={strings.profile.yearLabel}
              type="number"
              min="1"
              max="6"
              placeholder={strings.profile.yearPlaceholder}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <Input
            label={strings.profile.telegramLabel}
            placeholder={strings.profile.telegramPlaceholder}
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            leftIcon={<Send className="w-4 h-4" />}
            helperText="Buyers can reach out to you via this Telegram handle"
          />

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="danger"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              {strings.profile.signOutBtn}
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {strings.profile.saveProfileBtn}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
