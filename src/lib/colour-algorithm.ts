export type RawMap = Record<string, number>
export type AggregatedMap = Record<string, number>

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

export function quantize(value: number, bucketSize: number): number {
    const rounded = Math.round(value / bucketSize) * bucketSize
    return Math.min(255, Math.max(0, rounded))
}

export function rawKeysForBucket(
    map: RawMap,
    bucketKey: string,
    bucketSize: number,
): string[] {
    if (bucketKey === "transparent") {
        return "transparent" in map ? ["transparent"] : []
    }
    const parts = bucketKey.split(",")
    const qr = parseInt(parts[0]!, 10)
    const qg = parseInt(parts[1]!, 10)
    const qb = parseInt(parts[2]!, 10)
    return Object.keys(map).filter((key) => {
        if (key === "transparent") return false
        const kp = key.split(",")
        return (
            quantize(parseInt(kp[0]!, 10), bucketSize) === qr &&
            quantize(parseInt(kp[1]!, 10), bucketSize) === qg &&
            quantize(parseInt(kp[2]!, 10), bucketSize) === qb
        )
    })
}

export function buildExcludedKeys(
    map: RawMap,
    blacklist: BlacklistEntry[],
): Set<string> {
    const excluded = new Set<string>()
    for (const entry of blacklist) {
        for (const key of rawKeysForBucket(
            map,
            entry.quantizedKey,
            entry.bucketSize,
        )) {
            excluded.add(key)
        }
    }
    return excluded
}

export function reaggregateExcluding(
    map: RawMap,
    bucketSize: number,
    excludedKeys: Set<string>,
): AggregatedMap {
    const result: AggregatedMap = {}

    for (const [key, count] of Object.entries(map)) {
        if (excludedKeys.has(key)) continue

        if (key === "transparent") {
            result["transparent"] = (result["transparent"] ?? 0) + count
            continue
        }

        const parts = key.split(",")
        if (parts.length !== 3)
            throw new Error(`Malformed colour key: "${key}"`)
        const red = quantize(parseInt(parts[0]!, 10), bucketSize)
        const green = quantize(parseInt(parts[1]!, 10), bucketSize)
        const blue = quantize(parseInt(parts[2]!, 10), bucketSize)

        if (
            !Number.isFinite(red) ||
            !Number.isFinite(green) ||
            !Number.isFinite(blue)
        ) {
            throw new Error(`Malformed colour key: "${key}"`)
        }

        const quantizedKey = `${red},${green},${blue}`
        result[quantizedKey] = (result[quantizedKey] ?? 0) + count
    }

    return result
}

export function toHex(red: number, green: number, blue: number): string {
    return (
        "#" +
        [red, green, blue]
            .map((channel) => channel.toString(16).padStart(2, "0"))
            .join("")
    )
}

export function sortedColours(
    map: AggregatedMap,
    totalPixels: number,
): ColourEntry[] {
    if (totalPixels <= 0) return []

    const entries: ColourEntry[] = Object.entries(map).map(([key, count]) => {
        if (key === "transparent") {
            return {
                hex: "transparent",
                count,
                percentage: (count / totalPixels) * 100,
                isTransparent: true,
                quantizedKey: "transparent",
            }
        }

        const parts = key.split(",")
        if (parts.length !== 3)
            throw new Error(`Malformed colour key: "${key}"`)
        const red = parseInt(parts[0]!, 10)
        const green = parseInt(parts[1]!, 10)
        const blue = parseInt(parts[2]!, 10)

        return {
            hex: toHex(red, green, blue),
            count,
            percentage: (count / totalPixels) * 100,
            isTransparent: false,
            quantizedKey: key,
        }
    })

    return entries.sort((a, b) => b.count - a.count)
}
