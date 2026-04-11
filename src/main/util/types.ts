// Types for the API regression tester

export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

export type JsonRecord = Record<string, JsonValue>

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Type guard to check if a value is a JsonRecord (plain object)
 */
export const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Type guard to check if a value is a JsonObject
 */
export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Type guard to check if a value is a JsonArray
 */
export const isJsonArray = (value: unknown): value is JsonArray =>
  Array.isArray(value)

/**
 * Safely get a nested property from a JsonRecord
 */
export const getNestedValue = <T extends JsonValue = JsonValue>(
  obj: JsonRecord,
  path: string,
): T | undefined => {
  const keys = path.split('.')
  let current: JsonValue = obj

  for (const key of keys) {
    if (!isJsonRecord(current) || !(key in current)) {
      return undefined
    }
    current = current[key]
  }

  return current as T
}
