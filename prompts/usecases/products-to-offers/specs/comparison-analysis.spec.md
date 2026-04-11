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

| Champ | Règle | Tolérance |
|-------|-------|-----------|
| `id` | Égalité stricte | Aucune |
| `name` | Égalité stricte | Aucune |
| `price` | Égalité numérique | ±0.01 (flottant) |
| `stock` | Égalité stricte | Aucune |
| `category` | Égalité stricte | Aucune |
| `attributes` | Comparaison optionnelle | - |

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
}

type Mismatch = {
  field: string
  legacyValue: unknown
  actualValue: unknown
}
```

### Critères de succès

- `matched = true` si :
  - Aucun élément manquant (`missingInActual` vide)
  - Aucun mismatch sur les champs critiques
  - `price`, `name`, `stock` correspondent

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
    }

    result.matchedItems.push(matchItem)

    if (!matchItem.nameMatch) {
      result.mismatches.push({
        field: `products[${id}].name`,
        legacyValue: product.name,
        actualValue: offer.name,
      })
    }

    if (!matchItem.priceMatch) {
      result.mismatches.push({
        field: `products[${id}].price`,
        legacyValue: product.price,
        actualValue: offer.price,
      })
    }

    if (!matchItem.stockMatch) {
      result.mismatches.push({
        field: `products[${id}].stock`,
        legacyValue: product.stock,
        actualValue: offer.stock,
      })
    }

    if (!matchItem.nameMatch || !matchItem.priceMatch || !matchItem.stockMatch) {
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
     - products[P001].price: 1299.99 vs 1349.99
