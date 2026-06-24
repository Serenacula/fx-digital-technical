import { describe, it, expect } from 'vitest';
import {
  quantize,
  rawKeysForBucket,
  buildExcludedKeys,
  reaggregateExcluding,
  toHex,
  sortedColours,
} from '../../src/lib/colour-algorithm.ts';
import type { BlacklistEntry } from '../../src/lib/colour-algorithm.ts';

describe('quantize', () => {
  it('identity at bucketSize 1', () => {
    expect(quantize(0, 1)).toBe(0);
    expect(quantize(128, 1)).toBe(128);
    expect(quantize(255, 1)).toBe(255);
  });

  it('rounds to nearest bucket multiple', () => {
    expect(quantize(123, 10)).toBe(120);
    expect(quantize(125, 10)).toBe(130);
    expect(quantize(126, 10)).toBe(130);
  });

  it('exact multiple passes through', () => {
    expect(quantize(120, 10)).toBe(120);
    expect(quantize(64, 32)).toBe(64);
  });

  it('clamps at 0', () => {
    expect(quantize(1, 64)).toBe(0);
  });

  it('clamps at 255 with no overflow', () => {
    expect(quantize(255, 64)).toBe(255);
  });

  it('large bucketSize collapses the range', () => {
    expect(quantize(0, 64)).toBe(0);
    expect(quantize(32, 64)).toBe(64);
    expect(quantize(64, 64)).toBe(64);
    expect(quantize(128, 64)).toBe(128);
    expect(quantize(192, 64)).toBe(192);
    expect(quantize(255, 64)).toBe(255);
  });
});

describe('rawKeysForBucket', () => {
  it('returns raw keys that map to the given quantized bucket', () => {
    const map = { '11,0,0': 3, '14,0,0': 7, '100,0,0': 2 };
    const keys = rawKeysForBucket(map, '10,0,0', 10);
    expect(keys.sort()).toEqual(['11,0,0', '14,0,0']);
  });

  it('returns transparent key when bucket is transparent', () => {
    const map = { 'transparent': 5, '255,0,0': 3 };
    expect(rawKeysForBucket(map, 'transparent', 10)).toEqual(['transparent']);
  });

  it('returns empty array when transparent bucket key absent from map', () => {
    expect(rawKeysForBucket({ '255,0,0': 3 }, 'transparent', 10)).toEqual([]);
  });

  it('does not include transparent key when looking up a colour bucket', () => {
    const map = { 'transparent': 5, '10,0,0': 3 };
    const keys = rawKeysForBucket(map, '10,0,0', 10);
    expect(keys).not.toContain('transparent');
  });
});

describe('buildExcludedKeys', () => {
  const makeEntry = (quantizedKey: string, bucketSize: number): BlacklistEntry => ({
    quantizedKey,
    bucketSize,
    hex: '#000000',
    isTransparent: false,
  });

  it('returns empty set for empty blacklist', () => {
    const result = buildExcludedKeys({ '255,0,0': 10 }, []);
    expect(result.size).toBe(0);
  });

  it('collects raw keys for a blacklisted bucket', () => {
    const map = { '11,0,0': 3, '14,0,0': 7, '100,0,0': 2 };
    const result = buildExcludedKeys(map, [makeEntry('10,0,0', 10)]);
    expect(result).toEqual(new Set(['11,0,0', '14,0,0']));
  });

  it('merges raw keys across multiple blacklist entries', () => {
    const map = { '11,0,0': 3, '100,0,0': 2, 'transparent': 5 };
    const result = buildExcludedKeys(map, [
      makeEntry('10,0,0', 10),
      { quantizedKey: 'transparent', bucketSize: 1, hex: 'transparent', isTransparent: true },
    ]);
    expect(result).toEqual(new Set(['11,0,0', 'transparent']));
  });

  it('banning at different quant levels anchors to that level', () => {
    // '11,0,0' and '14,0,0' are both in the '10,0,0' bucket at bucketSize=10
    // but only '11,0,0' is in the '10,0,0' bucket at bucketSize=5 (rounds to 10)
    // and '14,0,0' rounds to 15 at bucketSize=5
    const map = { '11,0,0': 3, '14,0,0': 7 };
    const result = buildExcludedKeys(map, [makeEntry('10,0,0', 10)]);
    expect(result.has('11,0,0')).toBe(true);
    expect(result.has('14,0,0')).toBe(true);
  });
});

describe('reaggregateExcluding', () => {
  it('single key with bucketSize 1 and empty excluded is a no-op', () => {
    expect(reaggregateExcluding({ '255,0,0': 5 }, 1, new Set())).toEqual({ '255,0,0': 5 });
  });

  it('distinct keys that do not collide after quantization', () => {
    expect(reaggregateExcluding({ '10,0,0': 3, '100,0,0': 7 }, 10, new Set())).toEqual({ '10,0,0': 3, '100,0,0': 7 });
  });

  it('two keys that collide after quantization', () => {
    expect(reaggregateExcluding({ '11,0,0': 3, '14,0,0': 7 }, 10, new Set())).toEqual({ '10,0,0': 10 });
  });

  it('transparent sentinel passes through unchanged', () => {
    expect(reaggregateExcluding({ '11,0,0': 3, 'transparent': 42 }, 10, new Set())).toEqual({ '10,0,0': 3, 'transparent': 42 });
  });

  it('excluded raw key is skipped', () => {
    const result = reaggregateExcluding({ '255,0,0': 10, '0,0,255': 5 }, 1, new Set(['255,0,0']));
    expect(result).toEqual({ '0,0,255': 5 });
  });

  it('excluded transparent is skipped', () => {
    const result = reaggregateExcluding({ 'transparent': 8, '0,0,0': 2 }, 1, new Set(['transparent']));
    expect(result).toEqual({ '0,0,0': 2 });
  });

  it('empty map', () => {
    expect(reaggregateExcluding({}, 10, new Set())).toEqual({});
  });

  it('throws on malformed colour key', () => {
    expect(() => reaggregateExcluding({ 'bad-key': 1 }, 10, new Set())).toThrow('Malformed colour key: "bad-key"');
  });
});

describe('toHex', () => {
  it('primary colours', () => {
    expect(toHex(255, 0, 0)).toBe('#ff0000');
    expect(toHex(0, 255, 0)).toBe('#00ff00');
    expect(toHex(0, 0, 255)).toBe('#0000ff');
  });

  it('zero-pads single-digit hex values', () => {
    expect(toHex(0, 1, 15)).toBe('#00010f');
  });

  it('black and white', () => {
    expect(toHex(0, 0, 0)).toBe('#000000');
    expect(toHex(255, 255, 255)).toBe('#ffffff');
  });
});

describe('sortedColours', () => {
  it('single RGB entry', () => {
    const result = sortedColours({ '255,0,0': 4 }, 4);
    expect(result).toEqual([{ hex: '#ff0000', count: 4, percentage: 100, isTransparent: false, quantizedKey: '255,0,0' }]);
  });

  it('sorted descending by count', () => {
    const result = sortedColours({ '0,0,255': 10, '255,0,0': 30, '0,255,0': 20 }, 60);
    expect(result[0]!.hex).toBe('#ff0000');
    expect(result[0]!.count).toBe(30);
    expect(result[1]!.hex).toBe('#00ff00');
    expect(result[1]!.count).toBe(20);
    expect(result[2]!.hex).toBe('#0000ff');
    expect(result[2]!.count).toBe(10);
  });

  it('transparent entry has isTransparent true and correct data', () => {
    const result = sortedColours({ '255,0,0': 3, 'transparent': 1 }, 4);
    const red = result.find(entry => entry.hex === '#ff0000')!;
    const transparent = result.find(entry => entry.isTransparent)!;
    expect(red).toEqual({ hex: '#ff0000', count: 3, percentage: 75, isTransparent: false, quantizedKey: '255,0,0' });
    expect(transparent).toEqual({ hex: 'transparent', count: 1, percentage: 25, isTransparent: true, quantizedKey: 'transparent' });
    expect(result[0]!.hex).toBe('#ff0000');
  });

  it('percentages sum to 100 across all entries', () => {
    const result = sortedColours({ '255,0,0': 1, '0,0,255': 1, 'transparent': 2 }, 4);
    const total = result.reduce((acc, entry) => acc + entry.percentage, 0);
    expect(total).toBeCloseTo(100, 3);
  });

  it('empty map returns empty array', () => {
    expect(sortedColours({}, 100)).toEqual([]);
  });

  it('map with only transparent', () => {
    const result = sortedColours({ 'transparent': 5 }, 5);
    expect(result).toHaveLength(1);
    expect(result[0]!.isTransparent).toBe(true);
    expect(result[0]!.percentage).toBe(100);
  });

  it('returns empty array when totalPixels is zero', () => {
    expect(sortedColours({ 'transparent': 5 }, 0)).toEqual([]);
  });

  it('throws on malformed colour key', () => {
    expect(() => sortedColours({ 'bad-key': 1 }, 10)).toThrow('Malformed colour key: "bad-key"');
  });
});
