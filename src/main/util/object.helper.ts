import { createHash } from 'node:crypto'

/**
 * Sort object keys recursively for consistent hashing
 */
export function sortObjectKeys<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys) as T
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(obj).sort()
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    }
    return sorted as T
  }

  return obj
}

/**
 * Generate a hash from an object
 */
export function hashObject(obj: unknown): string {
  const sorted = sortObjectKeys(obj)
  const str = JSON.stringify(sorted)
  return createHash('md5').update(str).digest('hex').slice(0, 12)
}
