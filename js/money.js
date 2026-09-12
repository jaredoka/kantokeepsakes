import { CURRENCY } from './config.js';

/** 65 -> "BND 65.00"; 1450 -> "BND 1,450.00"; junk -> "BND 0.00". */
export function formatPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${CURRENCY} 0.00`;
  return `${CURRENCY} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
