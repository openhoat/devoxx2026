import type { Plugin } from '../../../main/http-sequencer'
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
  rating?: number
  attributes?: JsonObject
}

type ComparisonResultItem = {
  legacyId: string
  actualId: string
  nameMatch: boolean
  priceMatch: boolean
  stockMatch: boolean
  categoryMatch: boolean
  ratingMatch?: boolean
}

type ComparisonMismatch = {
  field: string
  legacyValue: unknown
  actualValue: unknown
  priority: 'CRITIQUE' | 'HAUTE' | 'OPTIONNELLE'
}

type ComparisonResultData = {
  matched: boolean
  totalLegacy: number
  totalActual: number
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
    rating: typeof item.rating === 'number' ? item.rating : undefined,
    attributes: isJsonRecord(item.attributes) ? item.attributes : undefined,
  }
}

/**
 * Plugin to compare legacy products with new offers
 * Validates data equivalence between the two API responses using FUZZY COMPARISON
 *
 * COMPARISON RULES:
 * - CRITIQUE fields (name, price, stock): failure if mismatch → matched = false
 * - HAUTE fields (category, sku, currency): warning only, does not fail comparison
 * - OPTIONNELLE fields (rating): informational only
 *
 * FUZZY COMPARISON:
 * - Price: tolerance of ±0.01 for floating point differences
 * - Rating: tolerance of ±0.1
 * - All other fields: exact match
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
    totalLegacy: legacyProducts.length,
    totalActual: actualOffers.length,
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

    const matchResult: ComparisonResultItem = {
      legacyId: id,
      actualId: id,
      nameMatch: true,
      priceMatch: true,
      stockMatch: true,
      categoryMatch: true,
    }

    // --- CRITIQUE fields ---

    // Check name (CRITIQUE)
    if (product.name !== offer.name) {
      matchResult.nameMatch = false
      result.mismatches.push({
        field: `products[${id}].name`,
        legacyValue: product.name,
        actualValue: offer.name,
        priority: 'CRITIQUE',
      })
      result.matched = false
      logger.warn(
        `⚠️ Name mismatch for ${id}: "${product.name}" vs "${offer.name}"`,
      )
    }

    // Check price (CRITIQUE — fuzzy: tolerance ±0.01)
    if (Math.abs(product.price - offer.price) > 0.01) {
      matchResult.priceMatch = false
      result.mismatches.push({
        field: `products[${id}].price`,
        legacyValue: product.price,
        actualValue: offer.price,
        priority: 'CRITIQUE',
      })
      result.matched = false
      logger.warn(
        `⚠️ Price mismatch for ${id}: ${product.price} vs ${offer.price}`,
      )
    }

    // Check stock (CRITIQUE)
    if (product.stock !== offer.stock) {
      matchResult.stockMatch = false
      result.mismatches.push({
        field: `products[${id}].stock`,
        legacyValue: product.stock,
        actualValue: offer.stock,
        priority: 'CRITIQUE',
      })
      result.matched = false
      logger.warn(
        `⚠️ Stock mismatch for ${id}: ${product.stock} vs ${offer.stock}`,
      )
    }

    // --- HAUTE fields (warning only, no matched = false) ---

    // Check category (HAUTE)
    if (product.category !== offer.category) {
      matchResult.categoryMatch = false
      result.mismatches.push({
        field: `products[${id}].category`,
        legacyValue: product.category,
        actualValue: offer.category,
        priority: 'HAUTE',
      })
      logger.warn(
        `⚠️ Category mismatch for ${id}: "${product.category}" vs "${offer.category}" [HAUTE]`,
      )
    }

    // Check sku (HAUTE)
    if (
      product.sku !== undefined &&
      offer.sku !== undefined &&
      product.sku !== offer.sku
    ) {
      result.mismatches.push({
        field: `products[${id}].sku`,
        legacyValue: product.sku,
        actualValue: offer.sku,
        priority: 'HAUTE',
      })
      logger.warn(
        `⚠️ SKU mismatch for ${id}: "${product.sku}" vs "${offer.sku}" [HAUTE]`,
      )
    }

    // Check currency (HAUTE)
    if (
      product.currency !== undefined &&
      offer.currency !== undefined &&
      product.currency !== offer.currency
    ) {
      result.mismatches.push({
        field: `products[${id}].currency`,
        legacyValue: product.currency,
        actualValue: offer.currency,
        priority: 'HAUTE',
      })
      logger.warn(
        `⚠️ Currency mismatch for ${id}: "${product.currency}" vs "${offer.currency}" [HAUTE]`,
      )
    }

    // --- OPTIONNELLE fields ---

    // Check rating (OPTIONNELLE — fuzzy: tolerance ±0.1)
    if (product.rating !== undefined && offer.rating !== undefined) {
      const ratingMatch = Math.abs(product.rating - offer.rating) < 0.1
      matchResult.ratingMatch = ratingMatch
      if (!ratingMatch) {
        result.mismatches.push({
          field: `products[${id}].rating`,
          legacyValue: product.rating,
          actualValue: offer.rating,
          priority: 'OPTIONNELLE',
        })
        logger.info(
          `ℹ️ Rating mismatch for ${id}: ${product.rating} vs ${offer.rating} [OPTIONNELLE]`,
        )
      }
    }

    // Debug log for comparison result
    if (
      matchResult.nameMatch &&
      matchResult.priceMatch &&
      matchResult.stockMatch
    ) {
      logger.debug(
        `  ✓ ${id} matched: name=✓ ("${product.name}"), price=✓ (${product.price}), stock=✓ (${product.stock})`,
      )
    } else {
      logger.debug(
        `  ✗ ${id} comparison: name=${matchResult.nameMatch ? '✓' : '✗'} ("${product.name}" vs "${offer.name}"), price=${matchResult.priceMatch ? '✓' : '✗'} (${product.price} vs ${offer.price}), stock=${matchResult.stockMatch ? '✓' : '✗'} (${product.stock} vs ${offer.stock})`,
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
  ;(store.state as Record<string, unknown>).comparisonResult = result

  // Log summary
  if (result.matched) {
    logger.info(
      `✅ Comparison passed: ${result.matchedItems.length}/${result.totalLegacy} products matched`,
    )
  } else {
    logger.error('❌ Comparison failed:')
    logger.error(
      `   - Missing in actual: ${result.missingInActual.length}${result.missingInActual.length > 0 ? ` (${result.missingInActual.join(', ')})` : ''}`,
    )
    logger.error(
      `   - Mismatches: ${result.mismatches.filter((m) => m.priority === 'CRITIQUE').length}`,
    )
    for (const mismatch of result.mismatches.filter(
      (m) => m.priority === 'CRITIQUE',
    )) {
      logger.error(
        `     - ${mismatch.field} (${mismatch.priority}): ${mismatch.legacyValue} vs ${mismatch.actualValue}`,
      )
    }
  }

  // Throw if not matched
  if (!result.matched) {
    throw new Error(
      `Product/Offer comparison failed: ${result.missingInActual.length} missing, ${result.mismatches.filter((m) => m.priority === 'CRITIQUE').length} critical mismatches`,
    )
  }
}
