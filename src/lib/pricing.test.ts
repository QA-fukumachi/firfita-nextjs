import { describe, expect, it } from 'vitest';
import {
  calculateTotal,
  DELIVERY_PRICES,
  EXPRESS_MAX_QUANTITY,
  EXPRESS_PRICE,
  type OrderSpec,
} from './pricing';

const base: OrderSpec = {
  size: '12',
  color: 'Black',
  quantity: 1,
  stickerType: 'default',
  outerSleeve: false,
  manufacturingTime: 'standard',
  delivery: 'tbilisi',
};

describe('calculateTotal', () => {
  it('adds a flat delivery fee, not per unit', () => {
    const one = calculateTotal({ ...base, quantity: 1 }); // 100 + 15
    expect(one).toBe(115);
    const ten = calculateTotal({ ...base, quantity: 10 }); // 10 * 100 + 15
    expect(ten).toBe(1015);
  });

  it('charges regions delivery at its own rate', () => {
    expect(calculateTotal({ ...base, delivery: 'regions' })).toBe(100 + DELIVERY_PRICES.regions);
    expect(DELIVERY_PRICES.tbilisi).toBe(15);
    expect(DELIVERY_PRICES.regions).toBe(25);
  });

  it('makes pickup free', () => {
    expect(DELIVERY_PRICES.pickup).toBe(0);
    expect(calculateTotal({ ...base, delivery: 'pickup' })).toBe(100);
  });

  it('stacks delivery with per-unit surcharges', () => {
    const total = calculateTotal({
      ...base,
      quantity: 2,
      color: 'Red', // +20/unit
      stickerType: 'custom', // +8/unit
      outerSleeve: true, // 12" sleeve, qty 2 → 20/unit
      delivery: 'regions',
    });
    expect(total).toBe(2 * (100 + 20 + 8 + 20) + 25);
  });

  it('keeps the express quantity limit at 2', () => {
    expect(EXPRESS_MAX_QUANTITY).toBe(2);
  });

  it('adds a flat express manufacturing fee, not per unit', () => {
    expect(EXPRESS_PRICE).toBe(100);
    // 100 (vinyl) + 100 (express) + 15 (delivery)
    expect(calculateTotal({ ...base, manufacturingTime: 'express' })).toBe(215);
    // 2 * 100 + 100 + 15 — fee does not scale with quantity
    expect(calculateTotal({ ...base, manufacturingTime: 'express', quantity: 2 })).toBe(315);
  });
});
