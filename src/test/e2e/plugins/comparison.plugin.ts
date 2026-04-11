import type { Plugin } from '../../../main/http-sequencer/types'
import type { JsonObject } from '../../../main/util/types'
import { isJsonRecord } from '../../../main/util/types'

type PivotItem = {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
  category?: string
  currency?: string
  attributes?: JsonObject
}

type ComparisonResultItem = {
  legacyId: string
  actualId: string
  priceMatch: boolean
  stockMatch: boolean
  nameMatch: boolean
  categoryMatch: boolean
}

type ComparisonMismatch = {
  field: string
  legacyValue: unknown
  actualValue: unknown
}

type ComparisonResultData = {
  matched: boolean
  totalProducts: number
  totalOffers: number
  matchedItems: ComparisonResultItem[]
  missingInActual: string[]
  extraInActual: string[]
  mismatches: ComparisonMismatch[]
}

/**
 * Safely convert to PivotItem with defaults
 */
const toPivotItem = (item: unknown): PivotItem | null => {
  if (!isJsonRecord(item)) return null
  return {
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    price: Number(item.price ?? 0),
    stock: Number(item.stock ?? 0),
    sku: item.sku !== undefined ? String(item.sku) : undefined,
    category: item.category !== undefined ? String(item.category) : undefined,
    currency: item.currency !== undefined ? String(item.currency) : undefined,
    attributes: isJsonRecord(item.attributes) ? item.attributes : undefined,
  }
}

/**
 * Plugin to compare legacy products with new offers
 * Validates data equivalence between the two API responses using FUZZY COMPARISON
 *
 * FUZZY COMPARISON:
 * - Price: tolerance of ±0.01 for floating point differences
 * - Stock: exact match (critical data)
 * - Name: exact match (identity)
 *
 * This plugin compares data in PIVOT FORMAT (independent of source formats).
 * The comparison logic is separate from extraction, so API changes don't affect it.
 */
export const productOfferComparisonPlugin: Plugin = ({
  store,
  logger,
}): void => {
  logger.info('🔍 Comparing legacy products with actual offers...')

  if (!isJsonRecord(store.state)) {
    throw new Error('Invalid state structure')
  }

  const legacyProductsRaw = store.state.legacyProducts
  const actualOffersRaw = store.state.actualOffers

  if (!Array.isArray(legacyProductsRaw)) {
    throw new Error('No legacy products found in state')
  }
  if (!Array.isArray(actualOffersRaw)) {
    throw new Error('No actual offers found in state')
  }

  const legacyProducts = legacyProductsRaw
    .map(toPivotItem)
    .filter((item): item is PivotItem => item !== null)
  const actualOffers = actualOffersRaw
    .map(toPivotItem)
    .filter((item): item is PivotItem => item !== null)

  const result: ComparisonResultData = {
    matched: true,
    totalProducts: legacyProducts.length,
    totalOffers: actualOffers.length,
    matchedItems: [],
    missingInActual: [],
    extraInActual: [],
    mismatches: [],
  }

  // Create lookup maps
  const legacyMap = new Map<string, PivotItem>()
  for (const product of legacyProducts) {
    legacyMap.set(product.id, product)
  }

  const actualMap = new Map<string, PivotItem>()
  for (const offer of actualOffers) {
    actualMap.set(offer.id, offer)
  }

  // Check all legacy products exist in actual
  for (const [id, product] of legacyMap) {
    const offer = actualMap.get(id)

    if (!offer) {
      result.missingInActual.push(id)
      result.matched = false
      logger.warn(`❌ Product ${id} missing in actual offers`)
      continue
    }

    // Compare fields
    const matchResult: ComparisonResultItem = {
      legacyId: id,
      actualId: id,
      priceMatch: true,
      stockMatch: true,
      nameMatch: true,
      categoryMatch: true,
    }

    // Check name
    if (product.name !== offer.name) {
      matchResult.nameMatch = false
      result.mismatches.push({
        field: `products[${id}].name`,
        legacyValue: product.name,
        actualValue: offer.name,
      })
      result.matched = false
      logger.warn(`⚠️ Name mismatch for ${id}: ${product.name} vs ${offer.name}`)
    }

    // Check price (FUZZY: allow small floating point differences)
    const priceDiff = Math.abs(product.price - offer.price)
    if (priceDiff > 0.01) {
      matchResult.priceMatch = false
      result.mismatches.push({
        field: `products[${id}].price`,
        legacyValue: product.price,
        actualValue: offer.price,
      })
      result.matched = false
      logger.warn(
        `⚠️ Price mismatch for ${id}: ${product.price} vs ${offer.price}`,
      )
    }

    // Check stock (EXACT: critical data)
    if (product.stock !== offer.stock) {
      matchResult.stockMatch = false
      result.mismatches.push({
        field: `products[${id}].stock`,
        legacyValue: product.stock,
        actualValue: offer.stock,
      })
      result.matched = false
      logger.warn(
        `⚠️ Stock mismatch for ${id}: ${product.stock} vs ${offer.stock}`,
      )
    }

    // Check category (EXACT: important for classification)
    if (product.category !== offer.category) {
      matchResult.categoryMatch = false
      result.mismatches.push({
        field: `products[${id}].category`,
        legacyValue: product.category,
        actualValue: offer.category,
      })
      result.matched = false
      logger.warn(
        `⚠️ Category mismatch for ${id}: ${product.category} vs ${offer.category}`,
      )
    }

    // Debug log for comparison result
    if (
      matchResult.priceMatch &&
      matchResult.stockMatch &&
      matchResult.nameMatch
    ) {
      logger.debug(
        `  ✓ ${id} matched: price=✓ (${product.price}), stock=✓ (${product.stock}), name=✓ ("${product.name}")`,
      )
    } else {
      logger.debug(
        `  ✗ ${id} comparison: price=${matchResult.priceMatch ? '✓' : '✗'} (${product.price} vs ${offer.price}), stock=${matchResult.stockMatch ? '✓' : '✗'} (${product.stock} vs ${offer.stock}), name=${matchResult.nameMatch ? '✓' : '✗'} ("${product.name}" vs "${offer.name}")`,
      )
    }

    result.matchedItems.push(matchResult)
  }

  // Check for extra products in actual
  for (const [id] of actualMap) {
    if (!legacyMap.has(id)) {
      result.extraInActual.push(id)
      logger.info(`ℹ️ Extra offer in actual: ${id}`)
    }
  }

  // Store result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store.state.comparisonResult = result as any

  // Log summary
  if (result.matched) {
    logger.info(
      `✅ Comparison passed: ${result.matchedItems.length}/${result.totalProducts} products matched`,
    )
  } else {
    logger.error('❌ Comparison failed:')
    logger.error(`   - Missing in actual: ${result.missingInActual.length}`)
    logger.error(`   - Mismatches: ${result.mismatches.length}`)
  }

  // Throw if not matched
  if (!result.matched) {
    throw new Error(
      `Product/Offer comparison failed: ${result.missingInActual.length} missing, ${result.mismatches.length} mismatches`,
    )
  }
}
