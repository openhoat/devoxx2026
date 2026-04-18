# Spécification d'extraction Actual (New API)

## Objectif

Extraire et normaliser les données de l'API New Offers vers le format pivot.

## API New (Actual)

### Endpoint

```
POST /api/v2/offers/search
```

### Payload de requête

```json
{
  "query": {
    "type": "product_search",
    "filters": {
      "category": "all"
    },
    "pagination": {
      "limit": 10
    }
  }
}
```

### Format de réponse

```json
{
  "offers": [
    {
      "offerId": "OFF-001",
      "productId": "P001",
      "sku": "LAPTOP-PRO-15",
      "title": "Laptop Pro 15\"",
      "category": {
        "id": "tech",
        "name": "Electronics"
      },
      "pricing": {
        "total": 1299.99,
        "currency": "EUR",
        "taxIncluded": true
      },
      "availability": {
        "quantity": 42,
        "status": "in_stock"
      },
      "customerReviews": {
        "averageRating": 3.2,
        "reviewCount": 156,
        "distribution": {
          "1": 16,
          "2": 25,
          "3": 32,
          "4": 38,
          "5": 45
        }
      },
      "attributes": [
        { "key": "brand", "value": "TechBrand" },
        { "key": "weight", "value": "2.5kg" }
      ]
    }
  ],
  "metadata": {
    "version": "v2",
    "totalOffers": 3,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Source des données

- Fichier JSON : `mocks/sequences/products-to-offers-comparison/{TEST_CASE_INDEX}-step-{STEP_NUMBER}-actual-*.json`
- Chemin racine : `$.response.data`
- Chemin liste des offres : `$.response.data.offers[*]`

## Règles d'extraction

### JSONPath d'extraction

```
$.response.data.offers[*]
```

### Mapping champs → Pivot

| Champ New API | JSONPath | Champ Pivot | Transformation |
|---|---|---|---|
| `offerId` | `$.response.data.offers[*].offerId` | `offerId` | `String()` |
| `productId` | `$.response.data.offers[*].productId` | `id` | `String()` |
| `sku` | `$.response.data.offers[*].sku` | `sku` | `String()` |
| `title` | `$.response.data.offers[*].title` | `name` | `String()` |
| `category.id` | `$.response.data.offers[*].category.id` | `category` | `String()` |
| `category.name` | `$.response.data.offers[*].category.name` | `categoryName` | `String()` |
| `pricing.total` | `$.response.data.offers[*].pricing.total` | `price` | `Number()` |
| `pricing.currency` | `$.response.data.offers[*].pricing.currency` | `currency` | `String()` |
| `availability.quantity` | `$.response.data.offers[*].availability.quantity` | `stock` | `Number()` |
| `customerReviews.averageRating` | `$.response.data.offers[*].customerReviews.averageRating` | `rating` | `Number()` |
| `customerReviews.reviewCount` | `$.response.data.offers[*].customerReviews.reviewCount` | `reviewCount` | `Number()` |
| `attributes` | `$.response.data.offers[*].attributes` | `attributes` | Tableau → Objet |

## Transformation des attributs

Les attributs dans l'API New sont un tableau de `{key, value}` :

```typescript
const isAttributeEntry = (value: unknown): value is { key: string; value: unknown } =>
  typeof value === 'object' &&
  value !== null &&
  'key' in value &&
  typeof (value as Record<string, unknown>).key === 'string'

const convertAttributes = (attrs: unknown): Record<string, unknown> => {
  if (!Array.isArray(attrs)) return {}
  const result: Record<string, unknown> = {}
  for (const attr of attrs) {
    if (isAttributeEntry(attr)) {
      result[attr.key] = attr.value
    }
  }
  return result
}
```

## Code de transformation

```typescript
import type { ProductPivot } from '../types'
import { isJsonRecord } from '../util/type-guards'

const extractActualOffers = (responseData: unknown): ProductPivot[] => {
  if (!isJsonRecord(responseData)) {
    throw new Error('Invalid response data structure')
  }

  const offers = responseData.offers
  if (!Array.isArray(offers)) {
    throw new Error('No offers array found in actual response')
  }

  return offers.map((offer: unknown) => {
    if (!isJsonRecord(offer)) {
      throw new Error('Invalid offer structure')
    }

    const pricing = isJsonRecord(offer.pricing) ? offer.pricing : {}
    const availability = isJsonRecord(offer.availability) ? offer.availability : {}
    const category = isJsonRecord(offer.category) ? offer.category : {}
    const customerReviews = isJsonRecord(offer.customerReviews) ? offer.customerReviews : {}

    return {
      offerId: typeof offer.offerId === 'string' ? offer.offerId : undefined,
      id: String(offer.productId),
      sku: String(offer.sku ?? ''),
      name: String(offer.title),
      category: String(category.id ?? ''),
      categoryName: typeof category.name === 'string' ? category.name : undefined,
      price: Number(pricing.total ?? 0),
      currency: String(pricing.currency ?? 'EUR'),
      stock: Number(availability.quantity ?? 0),
      rating: typeof customerReviews.averageRating === 'number' ? customerReviews.averageRating : undefined,
      reviewCount: typeof customerReviews.reviewCount === 'number' ? customerReviews.reviewCount : undefined,
      attributes: convertAttributes(offer.attributes),
    }
  })
}
```

## Gestion des erreurs

- `responseData` absent ou non-objet → Erreur
- `offers` absent ou non-tableau → Erreur
- Champ obligatoire manquant (`productId`, `title`, `pricing.total`) → Valeur par défaut (`String()` / `Number()`)
- Champ optionnel manquant (`offerId`, `categoryName`, `rating`, `reviewCount`) → `undefined`

## Cas particuliers

- `customerReviews` peut être absent dans certaines versions de l'API → champs `rating` et `reviewCount` à `undefined`
- `offerId` est spécifique à l'API v2 (absent côté legacy)
- `categoryName` est optionnel dans le pivot (complément informatif de `category`)
- La tolérance sur les prix est de 0.01 (erreurs flottantes) lors de la comparaison avec les données legacy
