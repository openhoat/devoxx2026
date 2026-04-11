import { JSONPath } from 'jsonpath-plus'
import type { Plugin } from '../../../main/http-sequencer/types'
import type { JsonObject } from '../../../main/util/types'
import { isJsonRecord } from '../../../main/util/types'

type ActualOffer = {
  id: string
  offerId: string
  sku: string
  name: string
  category: string
  price: number
  currency: string
  stock: number
  attributes: JsonObject
}

/**
 * Plugin to extract and normalize new offers
 * Transforms new offer format to a standard PIVOT FORMAT for comparison
 *
 * PIVOT FORMAT:
 * {
 *   id: string,      // Unique identifier
 *   name: string,    // Product name
 *   price: number,   // Price
 *   stock: number,   // Stock quantity
 *   // ...other normalized fields
 * }
 *
 * This plugin maps from New API format to the pivot format.
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

  // Normalize to PIVOT FORMAT (mapping from old format - BEFORE v2)
  const normalizedOffers: ActualOffer[] = []

  for (const item of offers) {
    if (!isJsonRecord(item)) continue
    if (typeof item.id === 'undefined' || typeof item.name === 'undefined')
      continue

    normalizedOffers.push({
      id: String(item.id),
      offerId: String(item.offerId ?? ''),
      sku: String(item.sku ?? ''),
      name: String(item.name),
      category: String(item.category ?? ''),
      price: Number(item.price ?? 0),
      currency: String(item.currency ?? 'EUR'),
      stock: Number(item.stock ?? 0),
      attributes: isJsonRecord(item.attributes) ? item.attributes : {},
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
