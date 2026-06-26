import type { RawMap } from './image-processor.ts'
import type { ImageProcessor } from './image-processor.ts'

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

export function quantize(value: number, bucketSize: number): number {
    const rounded = Math.round(value / bucketSize) * bucketSize
    return Math.min(255, Math.max(0, rounded))
}

export function toHex(red: number, green: number, blue: number): string {
    return '#' + [red, green, blue]
        .map(channel => channel.toString(16).padStart(2, '0'))
        .join('')
}

export class AggregationEngine {
    private imageProcessor: ImageProcessor
    private blacklist: BlacklistEntry[] = []

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

        const excludedKeys = this.buildExcludedKeys(rawMap)
        const includedMap = this.reaggregate(rawMap, bucketSize, excludedKeys)
        const includedTotal = Object.values(includedMap).reduce((sum, count) => sum + count, 0)

        const excluded: ExcludedEntry[] = this.blacklist.map(entry => {
            const keys = this.rawKeysForBucket(rawMap, entry.quantizedKey, entry.bucketSize)
            const count = keys.reduce((sum, key) => sum + (rawMap[key] ?? 0), 0)
            const percentage = this.imageProcessor.totalPixels > 0
                ? (count / this.imageProcessor.totalPixels) * 100
                : 0
            return { ...entry, percentage }
        })

        return { included: this.toColourEntries(includedMap, includedTotal), excluded }
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

    private rawKeysForBucket(map: RawMap, bucketKey: string, bucketSize: number): string[] {
        if (bucketKey === 'transparent') {
            return 'transparent' in map ? ['transparent'] : []
        }
        const [quantRed, quantGreen, quantBlue] = this.parseRgbKey(bucketKey)
        return Object.keys(map).filter(key => {
            if (key === 'transparent') {
                return false
            }
            const [red, green, blue] = this.parseRgbKey(key)
            return (
                quantize(red, bucketSize) === quantRed &&
                quantize(green, bucketSize) === quantGreen &&
                quantize(blue, bucketSize) === quantBlue
            )
        })
    }

    private buildExcludedKeys(map: RawMap): Set<string> {
        const excluded = new Set<string>()
        for (const entry of this.blacklist) {
            for (const key of this.rawKeysForBucket(map, entry.quantizedKey, entry.bucketSize)) {
                excluded.add(key)
            }
        }
        return excluded
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
            const [red, green, blue] = this.parseRgbKey(key)
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
                const [red, green, blue] = this.parseRgbKey(key)
                return { hex: toHex(red, green, blue), count, percentage: (count / totalPixels) * 100, isTransparent: false, quantizedKey: key }
            })
            .sort((a, b) => b.count - a.count)
    }
}
