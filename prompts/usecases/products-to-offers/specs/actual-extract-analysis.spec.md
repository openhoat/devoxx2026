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
      "offerId": "OFF-P001-2026",
      "productId": "P001",
      "sku": "LAPTOP-PRO-15",
      "title": "Laptop Pro 15\"",
      "description": "Professional laptop with 15.6 inch display",
      "category": {
        "id": "electronics",
        "name": "Electronics"
      },
      "pricing": {
        "basePrice": 1199.99,
        "tax": 100.00,
        "total": 1299.99,
        "currency": "EUR"
      },
      "availability": {
        "status": "in_stock",
        "quantity": 15,
        "warehouse": "EU-WEST-1"
      },
      "attributes": [
        {"key": "brand", "value": "TechBrand"},
        {"key": "weight", "value": "2.1kg"},
        {"key": "screen_size", "value": "15.6 inch"}
      ]
    }
  ],
  "metadata": {
    "totalResults": 3,
    "pageNumber": 1,
    "pageSize": 10,
    "query": "product_search"
  }
}
```

## Règles d'extraction

### JSONPath d'extraction

```
$.offers[*]
```

### Mapping champs → Pivot

| Champ New API | JSONPath | Champ Pivot | Transformation |
|---------------|----------|-------------|----------------|
| `productId` | `$.offers[*].productId` | `id` | `String()` |
| `sku` | `$.offers[*].sku` | `sku` | `String()` |
| `title` | `$.offers[*].title` | `name` | `String()` |
| `category.id` | `$.offers[*].category.id` | `category` | `String()` |
| `pricing.total` | `$.offers[*].pricing.total` | `price` | `Number()` |
| `pricing.currency` | `$.offers[*].pricing.currency` | `currency` | `String()` |
| `availability.quantity` | `$.offers[*].availability.quantity` | `stock` | `Number()` |
| `attributes` | `$.offers[*].attributes` | `attributes` | Tableau → Objet |

## Transformation des attributs

Les attributs dans l'API New sont un tableau de `{key, value}` :

```typescript
const convertAttributes = (attrs: Array<{key: string, value: unknown}>) => {
  const result: Record<string, unknown> = {}
  for (const attr of attrs) {
    result[attr.key] = attr.value
  }
  return result
}
```

## Code de transformation

```typescript
const extractActualOffers = (response: unknown): ProductPivot[] => {
  const data = response as { offers: unknown[] }
  
  if (!data.offers || !Array.isArray(data.offers)) {
    throw new Error('No offers found in actual response')
  }

  return data.offers.map((offer: unknown) => {
    const o = offer as Record<string, unknown>
    const pricing = (o.pricing as Record<string, unknown>) ?? {}
    const availability = (o.availability as Record<string, unknown>) ?? {}
    const category = (o.category as Record<string, unknown>) ?? {}
    const attributes = (o.attributes as Array<{key: string, value: unknown}>) ?? []
    
    // Convert attributes array to object
    const attrMap: Record<string, unknown> = {}
    for (const attr of attributes) {
      attrMap[attr.key] = attr.value
    }
    
    return {
      id: String(o.productId),
      sku: String(o.sku ?? ''),
      name: String(o.title),
      category: String(category.id ?? ''),
      price: Number(pricing.total ?? 0),
      currency: String(pricing.currency ?? 'EUR'),
      stock: Number(availability.quantity ?? 0),
      attributes: attrMap,
    }
  })
}
```

## Gestion des erreurs

- `offers` absent ou non-tableau → Erreur
- Champ obligatoire manquant (`productId`, `title`, `pricing.total`) → Erreur
- Champ optionnel manquant → Valeur par défaut
