import { describe, expect, it } from 'vitest';
import { buildSignature, toMinorUnits, verifyCallbackSignature } from './client';
import { mapOrderStatus } from './orders';

describe('buildSignature', () => {
  // Worked example from docs.flitt.com/api/building-signature/: secret "test"
  // with these params must sign the string
  // test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/
  const docsExample = {
    order_id: 'TestOrder2',
    order_desc: 'Test payment',
    currency: 'GEL',
    amount: 1000,
    merchant_id: 1549901,
    server_callback_url: 'http://myshop/callback/',
  };
  // sha1('test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/')
  const docsExampleSignature = 'cd0edb710cbbdb6c2a4d965cdb91fdfabc343215';

  it('matches the documented example', async () => {
    expect(await buildSignature(docsExample, 'test')).toBe(docsExampleSignature);
  });

  it('ignores signature and response_signature_string fields', async () => {
    const withMeta = {
      ...docsExample,
      signature: 'anything',
      response_signature_string: 'anything',
    };
    expect(await buildSignature(withMeta, 'test')).toBe(docsExampleSignature);
  });

  it('skips empty values but keeps zeros', async () => {
    const withEmpty = { ...docsExample, sender_email: '', rectoken: null };
    expect(await buildSignature(withEmpty, 'test')).toBe(docsExampleSignature);

    // "0" and 0 must be included, not dropped as falsy.
    const withZero = { ...docsExample, reversal_amount: '0' };
    expect(await buildSignature(withZero, 'test')).not.toBe(docsExampleSignature);
    expect(await buildSignature({ ...docsExample, reversal_amount: 0 }, 'test')).toBe(
      await buildSignature(withZero, 'test'),
    );
  });
});

describe('verifyCallbackSignature', () => {
  const secret = 'test';
  const payload = async (): Promise<Record<string, unknown>> => {
    const base: Record<string, unknown> = {
      order_id: 'abc',
      order_status: 'approved',
      amount: '148000',
      payment_id: 999075839,
    };
    return { ...base, signature: await buildSignature(base, secret) };
  };

  it('accepts a correctly signed payload', async () => {
    expect(await verifyCallbackSignature(await payload(), secret)).toBe(true);
  });

  it('accepts uppercase hex signatures', async () => {
    const p = await payload();
    p.signature = String(p.signature).toUpperCase();
    expect(await verifyCallbackSignature(p, secret)).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const p = await payload();
    p.order_status = 'declined';
    expect(await verifyCallbackSignature(p, secret)).toBe(false);
  });

  it('rejects a missing or empty signature', async () => {
    const p = await payload();
    delete p.signature;
    expect(await verifyCallbackSignature(p, secret)).toBe(false);
    expect(await verifyCallbackSignature({ ...p, signature: '' }, secret)).toBe(false);
  });

  it('rejects the wrong secret', async () => {
    expect(await verifyCallbackSignature(await payload(), 'wrong')).toBe(false);
  });
});

describe('toMinorUnits', () => {
  it('converts GEL to tetri', () => {
    expect(toMinorUnits(14.8)).toBe(1480);
    expect(toMinorUnits(1480)).toBe(148000);
    expect(toMinorUnits(0)).toBe(0);
  });

  it('is safe against floating point drift', () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0.29)).toBe(29); // 0.29 * 100 === 28.999999999999996
    expect(toMinorUnits(1.15)).toBe(115);
  });
});

describe('mapOrderStatus', () => {
  it('maps final statuses', () => {
    expect(mapOrderStatus('approved')).toBe('paid');
    expect(mapOrderStatus('declined')).toBe('failed');
    expect(mapOrderStatus('expired')).toBe('cancelled');
  });

  it('leaves intermediate and unknown statuses untouched', () => {
    expect(mapOrderStatus('created')).toBeNull();
    expect(mapOrderStatus('processing')).toBeNull();
    expect(mapOrderStatus('reversed')).toBeNull();
    expect(mapOrderStatus('')).toBeNull();
  });
});
