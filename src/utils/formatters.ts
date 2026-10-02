import { Currency } from '../types';

export const USD_EXCHANGE_RATE = 1520;

export function formatPrice(amount: number, currency: Currency = 'IQD'): string {
  if (currency === 'USD') {
    const usd = amount / USD_EXCHANGE_RATE;
    return `$${usd.toFixed(2)}`;
  }
  return `${amount.toLocaleString('en-US')} د.ع`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function generateRandomBarcode(): string {
  const prefix = '629';
  const middle = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${middle}`;
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ckb-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ە')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/\s+/g, ' ');
}

