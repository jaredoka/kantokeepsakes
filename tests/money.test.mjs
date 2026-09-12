import { describe, expect, it } from 'vitest';
import { formatPrice } from '../public/js/money.js';

describe('formatPrice', () => {
  it('renders BND with two decimals', () => {
    expect(formatPrice(65)).toBe('BND 65.00');
    expect(formatPrice(8.5)).toBe('BND 8.50');
  });

  it('groups thousands', () => {
    expect(formatPrice(1450)).toBe('BND 1,450.00');
  });

  it('survives a missing or junk amount', () => {
    expect(formatPrice(undefined)).toBe('BND 0.00');
    expect(formatPrice('abc')).toBe('BND 0.00');
  });
});
