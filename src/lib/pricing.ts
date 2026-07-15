// Single source of truth for order pricing. Used by the order form (display)
// and by /api/orders (authoritative recalculation — client totals are never
// trusted). All amounts are GEL major units.

export type Size = '7' | '10' | '12';
export type Color = 'Red' | 'Transparent' | 'Black';
export type StickerType = 'default' | 'custom';
export type ManufacturingTime = 'standard' | 'express';
export type Delivery = 'tbilisi' | 'regions';

export const SIZES: Size[] = ['7', '10', '12'];
export const COLORS: Color[] = ['Black', 'Red', 'Transparent'];
export const MANUFACTURING_TIMES: ManufacturingTime[] = ['standard', 'express'];
export const DELIVERIES: Delivery[] = ['tbilisi', 'regions'];

export const CUSTOM_STICKER_PRICE = 8;
export const COLOR_SURCHARGE = 20;
// Flat delivery fee in GEL, not per unit.
export const DELIVERY_PRICES: Record<Delivery, number> = { tbilisi: 15, regions: 25 };
// Express manufacturing (24-48h) is only possible for small runs.
export const EXPRESS_MAX_QUANTITY = 2;
// Flat express manufacturing surcharge in GEL, not per unit.
export const EXPRESS_PRICE = 100;

export interface TierPrice {
  base: number;
  current: number;
}

export function getVinylPricing(size: Size | null, qty: number): TierPrice {
  if (size === '12') {
    if (qty >= 51) return { base: 100, current: 60 };
    if (qty >= 26) return { base: 100, current: 70 };
    if (qty >= 11) return { base: 100, current: 80 };
    return { base: 100, current: 100 };
  }
  if (size === '10') {
    if (qty >= 51) return { base: 80, current: 60 };
    if (qty >= 26) return { base: 80, current: 70 };
    return { base: 80, current: 80 };
  }
  if (size === '7') {
    if (qty >= 51) return { base: 55, current: 40 };
    if (qty >= 11) return { base: 55, current: 45 };
    return { base: 55, current: 55 };
  }
  return { base: 0, current: 0 };
}

export function getSleevePricing(size: Size | null, sleeveQty: number): TierPrice {
  if (size === '12') {
    if (sleeveQty >= 51) return { base: 20, current: 12 };
    if (sleeveQty >= 26) return { base: 20, current: 16 };
    return { base: 20, current: 20 };
  }
  if (size === '10') {
    if (sleeveQty >= 51) return { base: 15, current: 8 };
    if (sleeveQty >= 26) return { base: 15, current: 12 };
    return { base: 15, current: 15 };
  }
  if (size === '7') {
    if (sleeveQty >= 101) return { base: 10, current: 7 };
    if (sleeveQty >= 26) return { base: 10, current: 8 };
    return { base: 10, current: 10 };
  }
  return { base: 0, current: 0 };
}

export interface OrderSpec {
  size: Size;
  color: Color;
  quantity: number;
  stickerType: StickerType;
  outerSleeve: boolean;
  manufacturingTime: ManufacturingTime;
  delivery: Delivery;
}

export function calculateTotal(spec: OrderSpec): number {
  const vinyl = getVinylPricing(spec.size, spec.quantity);
  let total = vinyl.current * spec.quantity;

  if (spec.outerSleeve) {
    const sleeve = getSleevePricing(spec.size, spec.quantity);
    total += sleeve.current * spec.quantity;
  }

  if (spec.stickerType === 'custom' && (spec.size === '12' || spec.size === '10' || spec.size === '7')) {
    total += CUSTOM_STICKER_PRICE * spec.quantity;
  }

  if (spec.color === 'Transparent' || spec.color === 'Red') {
    total += COLOR_SURCHARGE * spec.quantity;
  }

  if (spec.manufacturingTime === 'express') {
    total += EXPRESS_PRICE;
  }

  total += DELIVERY_PRICES[spec.delivery];

  return total;
}
