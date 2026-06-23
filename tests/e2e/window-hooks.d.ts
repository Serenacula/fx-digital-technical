import type { RawMap, ColourEntry } from '../../src/lib/colour-algorithm.ts';

declare global {
  interface Window {
    __lastResult: { map: RawMap; totalPixels: number } | undefined;
    __lastRendered: ColourEntry[] | undefined;
    __recalcCount: number;
    __delayProcessing: number | undefined;
    __createObjectURLCount: number | undefined;
  }
}

export {};
