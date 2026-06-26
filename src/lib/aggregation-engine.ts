import type { RawMap } from './image-processor.ts'
import type { ImageProcessor } from './image-processor.ts'
import { quantize, toHex } from './colour-utils.ts'

type AggregatedMap = Record<string, number>

export interface ColourEntry {
    hex: string
    count: number
    percentage: number
    isTransparent: boolean
    quantizedKey: string
}

export interface BlacklistEntry {
    quantizedKey: string
    bucketSize: number
    hex: string
    isTransparent: boolean
}

export interface ExcludedEntry extends BlacklistEntry {
    percentage: number
}

export interface AggregationResult {
    included: ColourEntry[]
    excluded: ExcludedEntry[]
}

export class AggregationEngine {
    private imageProcessor: ImageProcessor
    private blacklist: BlacklistEntry[] = []
    private _parsedKeyCache: { rawMap: RawMap; parsed: Map<string, [number, number, number]> } | null = null
    private _bucketIndexCache: { rawMap: RawMap; indexes: Map<number, Map<string, string[]>> } | null = null

    constructor(imageProcessor: ImageProcessor) {
        this.imageProcessor = imageProcessor
    }

    ban(entry: BlacklistEntry): void {
        if (!this.blacklist.some(existing => this.sameBan(existing, entry))) {
            this.blacklist.push(entry)
        }
    }

    unban(entry: BlacklistEntry): void {
        this.blacklist = this.blacklist.filter(existing => !this.sameBan(existing, entry))
    }

    resetBlacklist(): void {
        this.blacklist = []
    }

    aggregateRgb(bucketSize: number): AggregationResult {
        const rawMap = this.imageProcessor.rawMap
        if (!rawMap) {
            return { included: [], excluded: [] }
        }

        this.ensureParsedKeyCache(rawMap)

        const blacklistKeys = new Map<BlacklistEntry, string[]>()
        const excludedKeys = new Set<string>()
        for (const entry of this.blacklist) {
            const keys = this.rawKeysForBucket(rawMap, entry.quantizedKey, entry.bucketSize)
            blacklistKeys.set(entry, keys)
            for (const key of keys) {
                excludedKeys.add(key)
            }
        }

        const includedMap = this.reaggregate(rawMap, bucketSize, excludedKeys)
        const includedTotal = Object.values(includedMap).reduce((sum, count) => sum + count, 0)

        const excluded: ExcludedEntry[] = this.blacklist.map(entry => {
            const keys = blacklistKeys.get(entry) ?? []
            const count = keys.reduce((sum, key) => sum + (rawMap[key] ?? 0), 0)
            const percentage = this.imageProcessor.totalPixels > 0
                ? (count / this.imageProcessor.totalPixels) * 100
                : 0
            return { ...entry, percentage }
        })

        return { included: this.toColourEntries(includedMap, includedTotal), excluded }
    }

    private ensureParsedKeyCache(rawMap: RawMap): void {
        if (this._parsedKeyCache?.rawMap === rawMap) {
            return
        }
        const parsed = new Map<string, [number, number, number]>()
        for (const key of Object.keys(rawMap)) {
            if (key === 'transparent') {
                continue
            }
            parsed.set(key, this.parseRgbKey(key))
        }
        this._parsedKeyCache = { rawMap, parsed }
    }

    private sameBan(a: BlacklistEntry, b: BlacklistEntry): boolean {
        return a.quantizedKey === b.quantizedKey && a.bucketSize === b.bucketSize
    }

    private parseRgbKey(key: string): [number, number, number] {
        const parts = key.split(',')
        if (parts.length !== 3) {
            throw new Error(`Malformed colour key: "${key}"`)
        }
        return [parseInt(parts[0]!, 10), parseInt(parts[1]!, 10), parseInt(parts[2]!, 10)]
    }

    private getBucketIndex(rawMap: RawMap, bucketSize: number): Map<string, string[]> {
        if (this._bucketIndexCache?.rawMap !== rawMap) {
            this._bucketIndexCache = { rawMap, indexes: new Map() }
        }
        const cached = this._bucketIndexCache.indexes.get(bucketSize)
        if (cached) {
            return cached
        }
        const index = new Map<string, string[]>()
        if ('transparent' in rawMap) {
            index.set('transparent', ['transparent'])
        }
        for (const key of Object.keys(rawMap)) {
            if (key === 'transparent') {
                continue
            }
            const parsed = this._parsedKeyCache!.parsed.get(key)
            if (!parsed) {
                throw new Error(`Cache invariant violated: key "${key}" not found in parsedKeyCache`)
            }
            const [red, green, blue] = parsed
            const quantizedKey = `${quantize(red, bucketSize)},${quantize(green, bucketSize)},${quantize(blue, bucketSize)}`
            const existing = index.get(quantizedKey)
            if (existing) {
                existing.push(key)
            } else {
                index.set(quantizedKey, [key])
            }
        }
        this._bucketIndexCache.indexes.set(bucketSize, index)
        return index
    }

    private rawKeysForBucket(rawMap: RawMap, bucketKey: string, bucketSize: number): string[] {
        if (bucketKey === 'transparent') {
            return 'transparent' in rawMap ? ['transparent'] : []
        }
        return this.getBucketIndex(rawMap, bucketSize).get(bucketKey) ?? []
    }

    private reaggregate(map: RawMap, bucketSize: number, excludedKeys: Set<string>): AggregatedMap {
        const result: AggregatedMap = {}
        for (const [key, count] of Object.entries(map)) {
            if (excludedKeys.has(key)) {
                continue
            }
            if (key === 'transparent') {
                result['transparent'] = (result['transparent'] ?? 0) + count
                continue
            }
            const cached = this._parsedKeyCache?.parsed.get(key)
            const [red, green, blue] = cached ?? this.parseRgbKey(key)
            const quantizedKey = `${quantize(red, bucketSize)},${quantize(green, bucketSize)},${quantize(blue, bucketSize)}`
            result[quantizedKey] = (result[quantizedKey] ?? 0) + count
        }
        return result
    }

    private toColourEntries(map: AggregatedMap, totalPixels: number): ColourEntry[] {
        if (totalPixels <= 0) {
            return []
        }
        return Object.entries(map)
            .map(([key, count]): ColourEntry => {
                if (key === 'transparent') {
                    return { hex: 'transparent', count, percentage: (count / totalPixels) * 100, isTransparent: true, quantizedKey: 'transparent' }
                }
                // The _parsedKeyCache holds raw pixel keys, not quantized bucket keys — bypass it here.
                const [red, green, blue] = this.parseRgbKey(key)
                return { hex: toHex(red, green, blue), count, percentage: (count / totalPixels) * 100, isTransparent: false, quantizedKey: key }
            })
            .sort((a, b) => b.count - a.count)
    }
}
