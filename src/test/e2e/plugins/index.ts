/**
 * E2E Test Plugins for Products to Offers Comparison
 *
 * This module exports the 3 plugins used in the DSL-Based approach:
 * 1. legacyExtractPlugin - Extracts and normalizes Legacy API data to pivot format
 * 2. actualExtractPlugin - Extracts and normalizes New API data to pivot format
 * 3. productOfferComparisonPlugin - Compares data in pivot format using fuzzy comparison
 *
 * Key Concepts:
 * - PIVOT FORMAT: Common data structure for comparison (independent of source APIs)
 * - FUZZY COMPARISON: Tolerance on acceptable differences (e.g., price ±0.01)
 */

export { actualExtractPlugin } from './actual-extract.plugin'
export { productOfferComparisonPlugin } from './comparison.plugin'
export { legacyExtractPlugin } from './legacy-extract.plugin'
