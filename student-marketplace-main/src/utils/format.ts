import { strings } from '../i18n/strings';

export function formatPrice(price: number): string {
  if (price === 0) {
    return strings.common.free;
  }
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(isoString: string): string {
  try {
    const now = new Date();

    // The backend sends createdAt as a LocalDate ("2026-11-01"), i.e. a calendar
    // day without a time. Format it as a date: relative "14h ago" text would be
    // meaningless, because midnight is not the real moment of creation.
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
      const [y, m, d] = isoString.split('-').map(Number);
      const day = new Date(y, m - 1, d);
      if (isNaN(day.getTime())) return '';
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: day.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }).format(day);
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  } catch (e) {
    return '';
  }
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
