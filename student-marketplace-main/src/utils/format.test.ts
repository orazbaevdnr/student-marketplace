import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, formatPrice } from './format';
import { strings } from '../i18n/strings';

afterEach(() => {
  vi.useRealTimers();
});

describe('format', () => {
  it('formats prices with grouping and KZT, and renders zero as Free', () => {
    const formatted = formatPrice(125000);

    expect(formatted).toMatch(/125[\s\u00A0\u202F\u2009]*000/);
    expect(formatted).toMatch(/₸|KZT/);
    expect(formatPrice(0)).toBe(strings.common.free);
  });

  it('formats relative and calendar dates against a fixed clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T12:00:00'));

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    expect(formatDate(new Date().toISOString())).toBe('Just now');
    expect(formatDate(fiveMinutesAgo)).toBe('5m ago');
    expect(formatDate(threeHoursAgo)).toBe('3h ago');
    expect(formatDate(yesterday)).toBe('Yesterday');
    expect(formatDate(threeDaysAgo)).toBe('3d ago');
    expect(formatDate('2026-11-01')).toBe('Nov 1');
  });
});
