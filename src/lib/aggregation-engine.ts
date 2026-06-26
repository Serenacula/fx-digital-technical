import {
    buildExcludedKeys,
    reaggregateExcluding,
    rawKeysForBucket,
    sortedColours,
} from './colour-algorithm.ts'
import type { ColourEntry, BlacklistEntry } from './colour-algorithm.ts'
import type { ImageProcessor } from './image-processor.ts'

export type { ColourEntry, BlacklistEntry }

export interface AggregationResult {
    included: ColourEntry[]
    excluded: BlacklistEntry[]
}

export class AggregationEngine {
    private imageProcessor: ImageProcessor
    blacklist: BlacklistEntry[] = []

    constructor(imageProcessor: ImageProcessor) {
        this.imageProcessor = imageProcessor
    }

    ban(entry: BlacklistEntry): void {
        const bucketSize = entry.bucketSize
        const duplicate = this.blacklist.some(
            existing =>
                existing.quantizedKey === entry.quantizedKey &&
                existing.bucketSize === bucketSize
        )
        if (!duplicate) {
            this.blacklist.push(entry)
        }
    }

    unban(entry: BlacklistEntry): void {
        this.blacklist = this.blacklist.filter(
            existing =>
                !(
                    existing.quantizedKey === entry.quantizedKey &&
                    existing.bucketSize === entry.bucketSize
                )
        )
    }

    resetBlacklist(): void {
        this.blacklist = []
    }

    aggregateRgb(bucketSize: number): AggregationResult {
        const rawMap = this.imageProcessor.rawMap
        if (!rawMap) return { included: [], excluded: [] }

        const excludedKeys = buildExcludedKeys(rawMap, this.blacklist)
        const includedMap = reaggregateExcluding(rawMap, bucketSize, excludedKeys)
        const includedTotal = Object.values(includedMap).reduce(
            (sum, count) => sum + count,
            0
        )
        const included = sortedColours(includedMap, includedTotal)
        return { included, excluded: this.blacklist }
    }

    rawKeysForEntry(entry: BlacklistEntry): string[] {
        const rawMap = this.imageProcessor.rawMap
        if (!rawMap) return []
        return rawKeysForBucket(rawMap, entry.quantizedKey, entry.bucketSize)
    }
}
