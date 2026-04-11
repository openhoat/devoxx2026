import { isObject as isLodashObject } from 'lodash'
import type { JsonRecord, JsonValue } from './types'

export const isObject = (o: unknown): o is Record<string, unknown> =>
  isLodashObject(o)

export const isDefined = <T>(v: T | undefined): v is T =>
  typeof v !== 'undefined'

export const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) return true
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item))
  }
  if (isJsonRecord(value)) {
    return Object.values(value).every((val) => isJsonValue(val))
  }
  return false
}
