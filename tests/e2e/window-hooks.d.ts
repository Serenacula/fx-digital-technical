import type { RawMap } from '../../src/lib/image-processor.ts';
import type { ColourEntry } from '../../src/lib/aggregation-engine.ts';

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
