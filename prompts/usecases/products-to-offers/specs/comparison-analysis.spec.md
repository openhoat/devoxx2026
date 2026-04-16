# Spécification de comparaison Legacy vs Actual

## Objectif

Comparer les données pivot extraites des APIs Legacy et Actual pour détecter les régressions.

## Algorithme de comparaison

### Étapes

1. **Vérification du nombre d'éléments**
   - Legacy count vs Actual count
   - Si différent → Régression potentielle

2. **Création des maps d'index**
   - Map par ID pour accès rapide

3. **Détection des éléments manquants**
   - Produits dans Legacy mais pas dans Actual
   - Produits dans Actual mais pas dans Legacy

4. **Comparaison champ par champ**
   - Pour chaque produit commun, comparer les champs

## Champs comparés

| Champ | Règle | Tolérance | Priorité |
|-------|-------|-----------|----------|
| `id` | Égalité stricte | Aucune | CRITIQUE |
| `name` | Égalité stricte | Aucune | CRITIQUE |
| `price` | Égalité numérique | ±0.01 (flottant) | CRITIQUE |
| `stock` | Égalité stricte | Aucune | CRITIQUE |
| `category` | Égalité stricte | Aucune | HAUTE |
| `categoryName` | Égalité stricte | Aucune | OPTIONNELLE |
| `rating` | Égalité numérique | ±0.1 | OPTIONNELLE |
| `reviewCount` | Égalité stricte | Aucune | OPTIONNELLE |
| `sku` | Égalité stricte | Aucune | HAUTE |
| `currency` | Égalité stricte | Aucune | HAUTE |
| `attributes` | Comparaison optionnelle | - | OPTIONNELLE |

### Priorités des champs

- **CRITIQUE** : Échec si non match → `matched = false`
- **HAUTE** : Warning si non match, mais n'échoue pas forcément
- **OPTIONNELLE** : Information seulement, n'affecte pas le résultat

## Résultat de comparaison

### Structure

```typescript
type ComparisonResult = {
  matched: boolean
  totalProducts: number
  totalOffers: number
  matchedItems: MatchedItem[]
  missingInActual: string[]
  extraInActual: string[]
  mismatches: Mismatch[]
}

type MatchedItem = {
  legacyId: string
  actualId: string
  nameMatch: boolean
  priceMatch: boolean
  stockMatch: boolean
  categoryMatch: boolean
  ratingMatch?: boolean
}

type Mismatch = {
  field: string
  legacyValue: unknown
  actualValue: unknown
  priority: 'CRITIQUE' | 'HAUTE' | 'OPTIONNELLE'
}
```

### Critères de succès

- `matched = true` si :
  - Aucun élément manquant (`missingInActual` vide)
  - Aucun mismatch sur les champs CRITIQUES
  - `price`, `name`, `stock`, `id` correspondent

## Code de comparaison

```typescript
const compareProducts = (
  legacy: ProductPivot[],
  actual: ProductPivot[],
): ComparisonResult => {
  const result: ComparisonResult = {
    matched: true,
    totalProducts: legacy.length,
    totalOffers: actual.length,
    matchedItems: [],
    missingInActual: [],
    extraInActual: [],
    mismatches: [],
  }

  // Create lookup maps
  const legacyMap = new Map(legacy.map(p => [p.id, p]))
  const actualMap = new Map(actual.map(p => [p.id, p]))

  // Check all legacy products exist in actual
  for (const [id, product] of legacyMap) {
    const offer = actualMap.get(id)

    if (!offer) {
      result.missingInActual.push(id)
      result.matched = false
      continue
    }

    // Compare fields
    const matchItem = {
      legacyId: id,
      actualId: id,
      nameMatch: product.name === offer.name,
      priceMatch: Math.abs(product.price - offer.price) < 0.01,
      stockMatch: product.stock === offer.stock,
      categoryMatch: product.category === offer.category,
      ratingMatch: product.rating !== undefined && offer.rating !== undefined
        ? Math.abs(product.rating - offer.rating) < 0.1
        : true,
    }

    result.matchedItems.push(matchItem)

    // CRITIQUE fields
    if (!matchItem.nameMatch) {
      result.mismatches.push({
        field: `products[${id}].name`,
        legacyValue: product.name,
        actualValue: offer.name,
        priority: 'CRITIQUE',
      })
    }

    if (!matchItem.priceMatch) {
      result.mismatches.push({
        field: `products[${id}].price`,
        legacyValue: product.price,
        actualValue: offer.price,
        priority: 'CRITIQUE',
      })
    }

    if (!matchItem.stockMatch) {
      result.mismatches.push({
        field: `products[${id}].stock`,
        legacyValue: product.stock,
        actualValue: offer.stock,
        priority: 'CRITIQUE',
      })
    }

    // HAUTE priority fields
    if (!matchItem.categoryMatch) {
      result.mismatches.push({
        field: `products[${id}].category`,
        legacyValue: product.category,
        actualValue: offer.category,
        priority: 'HAUTE',
      })
    }

    // Check CRITIQUE mismatches for matched flag
    const hasCritiqueMismatch = result.mismatches.some(
      m => m.priority === 'CRITIQUE' && m.field.includes(`[${id}]`)
    )
    if (hasCritiqueMismatch) {
      result.matched = false
    }
  }

  // Check for extra products in actual
  for (const [id] of actualMap) {
    if (!legacyMap.has(id)) {
      result.extraInActual.push(id)
    }
  }

  return result
}
```

## Messages de résultat

### Succès

```
✅ Comparison passed: 3/3 products matched
```

### Échec - Produit manquant

```
❌ Comparison failed:
   - Missing in actual: 1 (P003)
   - Mismatches: 0
```

### Échec - Écart de prix

```
❌ Comparison failed:
   - Missing in actual: 0
   - Mismatches: 1
     - products[P001].price (CRITIQUE): 1299.99 vs 1349.99
```

### Échec - Catégorie différente

```
⚠️ Comparison warnings:
   - products[P001].category (HAUTE): electronics vs tech
