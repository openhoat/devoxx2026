import { JSONPath } from 'jsonpath-plus'
import type { Plugin } from '../../../main/http-sequencer/types'
import type { JsonObject, JsonValue } from '../../../main/util/types'
import { isJsonRecord } from '../../../main/util/types'

type ActualOffer = {
  id: string
  offerId?: string
  sku: string
  name: string
  category: string
  categoryName?: string
  price: number
  currency: string
  stock: number
  rating?: number
  reviewCount?: number
  attributes: JsonObject
}

const isJsonValue = (value: unknown): value is JsonValue =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  Array.isArray(value) ||
  (typeof value === 'object' && value !== null)

const isAttributeEntry = (
  value: unknown,
): value is { key: string; value: JsonValue } =>
  typeof value === 'object' &&
  value !== null &&
  'key' in value &&
  typeof (value as Record<string, unknown>).key === 'string' &&
  isJsonValue((value as Record<string, unknown>).value)

const convertAttributes = (attrs: unknown): JsonObject => {
  if (!Array.isArray(attrs)) return {}
  const result: JsonObject = {}
  for (const attr of attrs) {
    if (isAttributeEntry(attr)) {
      result[attr.key] = attr.value
    }
  }
  return result
}

/**
 * Plugin to extract and normalize new offers (API v2)
 * Transforms new offer format to a standard PIVOT FORMAT for comparison
 *
 * PIVOT FORMAT:
 * {
 *   id: string,      // Unique identifier (productId)
 *   name: string,    // Product name (title)
 *   price: number,   // Price (pricing.total)
 *   stock: number,   // Stock quantity (availability.quantity)
 *   // ...other normalized fields
 * }
 *
 * This plugin maps from New API v2 format to the pivot format.
 * If the New API evolves, only this plugin needs to be updated.
 */
export const actualExtractPlugin: Plugin = ({ store, logger }): void => {
  logger.info('📦 Extracting actual offers...')

  const actualData = JSONPath({
    path: "$.conversation['actual-offers'].response.data",
    json: store,
    wrap: false,
  })

  if (!isJsonRecord(actualData)) {
    throw new Error('Invalid actual response data structure')
  }

  const offers = actualData.offers

  if (!Array.isArray(offers)) {
    throw new Error('No offers array found in actual response')
  }

  // Normalize to PIVOT FORMAT (mapping from New API v2 format)
  const normalizedOffers: ActualOffer[] = []

  for (const item of offers) {
    if (!isJsonRecord(item)) continue

    // Validate required fields: productId and title per spec
    if (
      typeof item.productId === 'undefined' ||
      typeof item.title === 'undefined'
    )
      continue

    const pricing = isJsonRecord(item.pricing) ? item.pricing : {}
    const availability = isJsonRecord(item.availability)
      ? item.availability
      : {}
    const category = isJsonRecord(item.category) ? item.category : {}
    const customerReviews = isJsonRecord(item.customerReviews)
      ? item.customerReviews
      : {}

    normalizedOffers.push({
      id: String(item.productId),
      offerId: typeof item.offerId === 'string' ? item.offerId : undefined,
      sku: String(item.sku ?? ''),
      name: String(item.title),
      category: String(category.id ?? ''),
      categoryName:
        typeof category.name === 'string' ? category.name : undefined,
      price: Number(pricing.total ?? 0),
      currency: String(pricing.currency ?? 'EUR'),
      stock: Number(availability.quantity ?? 0),
      rating:
        typeof customerReviews.averageRating === 'number'
          ? customerReviews.averageRating
          : undefined,
      reviewCount:
        typeof customerReviews.reviewCount === 'number'
          ? customerReviews.reviewCount
          : undefined,
      attributes: convertAttributes(item.attributes),
    })
  }

  // Store in state
  if (!isJsonRecord(store.state)) {
    store.state = {}
  }
  ;(store.state as Record<string, unknown>).actualOffers = normalizedOffers

  logger.info(`✅ Extracted ${normalizedOffers.length} actual offers`)

  // Detailed debug logs for each item
  for (const offer of normalizedOffers) {
    logger.debug(
      `  📦 Actual item ${offer.id}: name="${offer.name}", price=${offer.price}, stock=${offer.stock}`,
    )
  }
}
