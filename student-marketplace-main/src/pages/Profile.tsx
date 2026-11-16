import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { Review, SellerStats } from '../api/types';
import { strings } from '../i18n/strings';
import { getInitials } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { RatingSummary } from '../components/reviews/RatingSummary';
import { ReviewList } from '../components/reviews/ReviewList';

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
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setFaculty(user.faculty || '');
      setYear(user.year ? String(user.year) : '');
      setTelegram(user.telegram || '');

      // Load user listing stats & reviews
      Promise.all([
        api.getMyListings(user.id),
        api.getSellerProfile(user.id),
      ]).then(([items, profile]) => {
        const active = items.filter((i) => i.status === 'active').length;
        const sold = items.filter((i) => i.status === 'sold').length;
        setActiveCount(active);
        setSoldCount(sold);
        setSellerStats(profile.stats);
      });

      api.getSellerReviews(user.id).then((revs) => {
        setReceivedReviews(revs);
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
    <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-2xl flex items-center justify-center">
              {getInitials(user.name)}
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {user.name}
            </h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Student
              </span>
              {user.faculty && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {user.faculty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Public profile button */}
        <Link to={`/seller/${user.id}`}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Public Seller Profile
          </Button>
        </Link>
      </div>

      {/* Seller Activity Counters */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 text-center shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{activeCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">{strings.profile.activeCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 text-center shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-emerald-50 text-emerald-600 mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{soldCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">{strings.profile.soldCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 text-center shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-amber-50 text-amber-600 mb-2">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            {receivedReviews.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{strings.profile.reviewsReceived}</p>
        </div>
      </div>

      {/* Seller Rating Summary */}
      {sellerStats && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Your Seller Rating & Reputation
          </h2>
          <RatingSummary stats={sellerStats} />
        </div>
      )}

      {/* Edit Form */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Edit Profile Information
        </h2>
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

      {/* Reviews Received List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Reviews from Buyers ({receivedReviews.length})
        </h2>
        <ReviewList
          reviews={receivedReviews}
          currentUserId={user.id}
          emptyTitle="No reviews received yet"
          emptyDescription="When other students buy items from you and leave reviews, they will appear here."
        />
      </div>
    </div>
  );
};
