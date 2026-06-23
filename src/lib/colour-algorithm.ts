export type RawMap = Record<string, number>;
export type AggregatedMap = Record<string, number>;

export interface ColourEntry {
  hex: string;
  count: number;
  percentage: number;
  isTransparent: boolean;
}

export function quantize(value: number, bucketSize: number): number {
  const rounded = Math.round(value / bucketSize) * bucketSize;
  return Math.min(255, Math.max(0, rounded));
}

export function reaggregate(map: RawMap, bucketSize: number): AggregatedMap {
  const result: AggregatedMap = {};

  for (const [key, count] of Object.entries(map)) {
    if (key === 'transparent') {
      result['transparent'] = (result['transparent'] ?? 0) + count;
      continue;
    }

    const parts = key.split(',');
    if (parts.length !== 3) {
      throw new Error(`Malformed colour key: "${key}"`);
    }
    const red = quantize(parseInt(parts[0]!, 10), bucketSize);
    const green = quantize(parseInt(parts[1]!, 10), bucketSize);
    const blue = quantize(parseInt(parts[2]!, 10), bucketSize);

    if (!Number.isFinite(red) || !Number.isFinite(green) || !Number.isFinite(blue)) {
      throw new Error(`Malformed colour key: "${key}"`);
    }

    const quantizedKey = `${red},${green},${blue}`;
    result[quantizedKey] = (result[quantizedKey] ?? 0) + count;
  }

  return result;
}

export function toHex(red: number, green: number, blue: number): string {
  return '#' + [red, green, blue].map(channel => channel.toString(16).padStart(2, '0')).join('');
}

export function sortedColours(map: AggregatedMap, totalPixels: number): ColourEntry[] {
  if (totalPixels <= 0) return [];

  const entries: ColourEntry[] = Object.entries(map).map(([key, count]) => {
    if (key === 'transparent') {
      return {
        hex: 'transparent',
        count,
        percentage: (count / totalPixels) * 100,
        isTransparent: true,
      };
    }

    const parts = key.split(',');
    if (parts.length !== 3) {
      throw new Error(`Malformed colour key: "${key}"`);
    }
    const red = parseInt(parts[0]!, 10);
    const green = parseInt(parts[1]!, 10);
    const blue = parseInt(parts[2]!, 10);

    return {
      hex: toHex(red, green, blue),
      count,
      percentage: (count / totalPixels) * 100,
      isTransparent: false,
    };
  });

  return entries.sort((a, b) => b.count - a.count);
}
