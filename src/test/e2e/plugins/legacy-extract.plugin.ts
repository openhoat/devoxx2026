import { JSONPath } from 'jsonpath-plus'
import type { Plugin } from '../../../main/http-sequencer/types'
import type { JsonObject } from '../../../main/util/types'
import { isJsonRecord } from '../../../main/util/types'

type LegacyProduct = {
  id: string
  sku: string
  name: string
  category: string
  price: number
  currency: string
  stock: number
  attributes: JsonObject
}

/**
 * Plugin to extract and normalize legacy products
 * Transforms legacy product format to a standard PIVOT FORMAT for comparison
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
 * This plugin maps from Legacy API format to the pivot format.
 * If the Legacy API evolves, only this plugin needs to be updated.
 */
export const legacyExtractPlugin: Plugin = ({ store, logger }): void => {
  logger.info('📦 Extracting legacy products...')

  const legacyData = JSONPath({
    path: "$.conversation['legacy-products'].response.data",
    json: store,
    wrap: false,
  })

  if (!isJsonRecord(legacyData)) {
    throw new Error('Invalid legacy response data structure')
  }

  // Get products array
  const products = legacyData.products

  if (!Array.isArray(products)) {
    throw new Error('No products array found in legacy response')
  }

  // Normalize to PIVOT FORMAT
  const normalizedProducts: LegacyProduct[] = []

  for (const item of products) {
    if (!isJsonRecord(item)) continue

    // Validate required fields
    if (typeof item.id === 'undefined' || typeof item.name === 'undefined')
      continue

    normalizedProducts.push({
      id: String(item.id),
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
  ;(store.state as Record<string, unknown>).legacyProducts = normalizedProducts

  logger.info(`✅ Extracted ${normalizedProducts.length} legacy products`)

  // Detailed debug logs for each item
  for (const product of normalizedProducts) {
    logger.debug(
      `  📦 Legacy item ${product.id}: name="${product.name}", price=${product.price}, stock=${product.stock}`,
    )
  }
}
