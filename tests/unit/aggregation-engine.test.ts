import { describe, it, expect } from 'vitest'
import { AggregationEngine } from '../../src/lib/aggregation-engine.ts'
import { quantize, toHex } from '../../src/lib/colour-utils.ts'
import type { ImageProcessor } from '../../src/lib/image-processor.ts'
import type { RawMap } from '../../src/lib/image-processor.ts'

function makeProcessor(rawMap: RawMap | null, totalPixels = 0): ImageProcessor {
    return { rawMap, totalPixels } as unknown as ImageProcessor
}

function makeEngine(rawMap: RawMap | null, totalPixels?: number): AggregationEngine {
    return new AggregationEngine(makeProcessor(rawMap, totalPixels ?? Object.values(rawMap ?? {}).reduce((a, b) => a + b, 0)))
}

describe('quantize', () => {
    it('identity at bucketSize 1', () => {
        expect(quantize(0, 1)).toBe(0)
        expect(quantize(128, 1)).toBe(128)
        expect(quantize(255, 1)).toBe(255)
    })

    it('rounds to nearest bucket multiple', () => {
        expect(quantize(123, 10)).toBe(120)
        expect(quantize(125, 10)).toBe(130)
        expect(quantize(126, 10)).toBe(130)
    })

    it('exact multiple passes through', () => {
        expect(quantize(120, 10)).toBe(120)
        expect(quantize(64, 32)).toBe(64)
    })

    it('clamps at 0', () => {
        expect(quantize(1, 64)).toBe(0)
    })

    it('clamps at 255 with no overflow', () => {
        expect(quantize(255, 64)).toBe(255)
    })

    it('large bucketSize collapses the range', () => {
        expect(quantize(0, 64)).toBe(0)
        expect(quantize(32, 64)).toBe(64)
        expect(quantize(64, 64)).toBe(64)
        expect(quantize(128, 64)).toBe(128)
        expect(quantize(192, 64)).toBe(192)
        expect(quantize(255, 64)).toBe(255)
    })
})

describe('toHex', () => {
    it('primary colours', () => {
        expect(toHex(255, 0, 0)).toBe('#ff0000')
        expect(toHex(0, 255, 0)).toBe('#00ff00')
        expect(toHex(0, 0, 255)).toBe('#0000ff')
    })

    it('zero-pads single-digit hex values', () => {
        expect(toHex(0, 1, 15)).toBe('#00010f')
    })

    it('black and white', () => {
        expect(toHex(0, 0, 0)).toBe('#000000')
        expect(toHex(255, 255, 255)).toBe('#ffffff')
    })
})

describe('AggregationEngine.aggregateRgb', () => {
    it('returns empty result when rawMap is null', () => {
        const engine = makeEngine(null)
        const result = engine.aggregateRgb(10)
        expect(result.included).toEqual([])
        expect(result.excluded).toEqual([])
    })

    it('single RGB entry at bucketSize 1', () => {
        const engine = makeEngine({ '255,0,0': 4 })
        const [entry] = engine.aggregateRgb(1).included
        expect(entry).toMatchObject({ hex: '#ff0000', count: 4, isTransparent: false, quantizedKey: '255,0,0' })
        expect(entry!.percentage).toBeCloseTo(100)
    })

    it('collapses similar colours into one bucket', () => {
        const engine = makeEngine({ '11,0,0': 3, '14,0,0': 7 })
        const { included } = engine.aggregateRgb(10)
        expect(included).toHaveLength(1)
        expect(included[0]!.count).toBe(10)
        expect(included[0]!.hex).toBe('#0a0000')
    })

    it('transparent sentinel passes through', () => {
        const engine = makeEngine({ '11,0,0': 3, 'transparent': 42 })
        const { included } = engine.aggregateRgb(10)
        const transparent = included.find(entry => entry.isTransparent)!
        expect(transparent.hex).toBe('transparent')
        expect(transparent.count).toBe(42)
    })

    it('sorts included entries descending by count', () => {
        const engine = makeEngine({ '0,0,255': 10, '255,0,0': 30, '0,255,0': 20 })
        const { included } = engine.aggregateRgb(1)
        expect(included[0]!.hex).toBe('#ff0000')
        expect(included[1]!.hex).toBe('#00ff00')
        expect(included[2]!.hex).toBe('#0000ff')
    })

    it('percentages sum to 100', () => {
        const engine = makeEngine({ '255,0,0': 1, '0,0,255': 1, 'transparent': 2 })
        const { included } = engine.aggregateRgb(1)
        const total = included.reduce((sum, entry) => sum + entry.percentage, 0)
        expect(total).toBeCloseTo(100, 3)
    })

    it('returns empty array when map is empty', () => {
        const engine = makeEngine({})
        expect(engine.aggregateRgb(10).included).toEqual([])
    })

    it('throws on malformed colour key', () => {
        const engine = makeEngine({ 'bad-key': 1 })
        expect(() => engine.aggregateRgb(10)).toThrow('Malformed colour key: "bad-key"')
    })
})

describe('AggregationEngine blacklist', () => {
    it('ban removes matching pixels from included', () => {
        const engine = makeEngine({ '11,0,0': 3, '14,0,0': 7, '100,0,0': 2 })
        engine.ban({ quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false })
        const { included } = engine.aggregateRgb(10)
        expect(included.every(entry => entry.hex !== '#0a0000')).toBe(true)
        expect(included).toHaveLength(1)
    })

    it('ban is anchored to the bucketSize it was made at', () => {
        const engine = makeEngine({ '11,0,0': 3, '14,0,0': 7 })
        // At bucketSize 10, both keys map to '10,0,0'
        engine.ban({ quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false })
        // Even if we re-aggregate at bucketSize 1, both raw keys are still excluded
        const { included } = engine.aggregateRgb(1)
        expect(included).toHaveLength(0)
    })

    it('banned entry appears in excluded with percentage', () => {
        const engine = makeEngine({ '11,0,0': 3, '14,0,0': 7, '100,0,0': 2 }, 12)
        engine.ban({ quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false })
        const { excluded } = engine.aggregateRgb(10)
        expect(excluded).toHaveLength(1)
        expect(excluded[0]!.percentage).toBeCloseTo((10 / 12) * 100, 3)
    })

    it('unban re-includes the entry', () => {
        const engine = makeEngine({ '11,0,0': 3, '100,0,0': 2 })
        const entry = { quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false }
        engine.ban(entry)
        engine.unban(entry)
        const { included, excluded } = engine.aggregateRgb(10)
        expect(excluded).toHaveLength(0)
        expect(included.some(e => e.count === 3)).toBe(true)
    })

    it('duplicate ban is ignored', () => {
        const engine = makeEngine({ '11,0,0': 3 })
        const entry = { quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false }
        engine.ban(entry)
        engine.ban(entry)
        expect(engine.aggregateRgb(10).excluded).toHaveLength(1)
    })

    it('resetBlacklist clears all bans', () => {
        const engine = makeEngine({ '11,0,0': 3, '100,0,0': 2 })
        engine.ban({ quantizedKey: '10,0,0', bucketSize: 10, hex: '#0a0000', isTransparent: false })
        engine.resetBlacklist()
        const { included, excluded } = engine.aggregateRgb(10)
        expect(excluded).toHaveLength(0)
        expect(included).toHaveLength(2)
    })

    it('transparent can be banned', () => {
        const engine = makeEngine({ 'transparent': 5, '255,0,0': 3 })
        engine.ban({ quantizedKey: 'transparent', bucketSize: 1, hex: 'transparent', isTransparent: true })
        const { included, excluded } = engine.aggregateRgb(1)
        expect(excluded).toHaveLength(1)
        expect(included.every(entry => !entry.isTransparent)).toBe(true)
    })

    it('included percentages rescale to 100% among included entries after a ban', () => {
        // rawMap: 3 red pixels + 1 green pixel. After banning green, included = 3 red pixels.
        // includedTotal = 3, so red should be 100% of the remaining visible palette.
        const engine = makeEngine({ '255,0,0': 3, '0,255,0': 1 }, 4)
        engine.ban({ quantizedKey: '0,255,0', bucketSize: 1, hex: '#00ff00', isTransparent: false })
        const { included } = engine.aggregateRgb(1)
        expect(included).toHaveLength(1)
        expect(included[0]!.percentage).toBeCloseTo(100, 3)
    })

    it('included percentages rescale correctly when multiple colours remain after ban', () => {
        // rawMap: 3 red + 1 green + 6 blue = 10 pixels. Ban green.
        // includedTotal = 9 (3 red + 6 blue). red = 3/9 * 100 ≈ 33.33%, blue = 6/9 * 100 ≈ 66.67%
        const engine = makeEngine({ '255,0,0': 3, '0,255,0': 1, '0,0,255': 6 }, 10)
        engine.ban({ quantizedKey: '0,255,0', bucketSize: 1, hex: '#00ff00', isTransparent: false })
        const { included } = engine.aggregateRgb(1)
        expect(included).toHaveLength(2)
        const total = included.reduce((sum, entry) => sum + entry.percentage, 0)
        expect(total).toBeCloseTo(100, 3)
    })
})
