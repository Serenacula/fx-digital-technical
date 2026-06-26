export function quantize(value: number, bucketSize: number): number {
    const rounded = Math.round(value / bucketSize) * bucketSize
    return Math.min(255, Math.max(0, rounded))
}

export function toHex(red: number, green: number, blue: number): string {
    return '#' + [red, green, blue]
        .map(channel => channel.toString(16).padStart(2, '0'))
        .join('')
}
