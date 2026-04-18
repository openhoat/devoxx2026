# Spécification d'extraction Legacy

## Objectif

Extraire et normaliser les données de l'API Legacy Products vers le format pivot.

## Source des données

- Fichier JSON : `mocks/sequences/products-to-offers-comparison/{TEST_CASE_INDEX}-step-{STEP_NUMBER}-legacy-*.json`
- Chemin racine : `$.response.data.items`

## API Legacy

### Endpoint

```
GET /api/v1/products
```

### Format de réponse

```json
{
  "response": {
    "status": 200,
    "statusText": "OK",
    "headers": {
      "content-type": "application/json"
    },
    "data": {
      "items": [
        {
          "productId": "P001",
          "sku": "LAPTOP-PRO-15",
          "title": "Laptop Pro 15\"",
          "category": "electronics",
          "price": 1299.99,
          "currency": "EUR",
          "stock": 42,
          "rating": 4,
          "attributes": {
            "brand": "TechBrand",
            "weight": "2.5kg"
          }
        }
      ],
      "metadata": {
        "version": "v2",
        "totalItems": 3,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    }
  }
}
```

## Règles d'extraction

### JSONPath d'extraction

```
$.response.data.items[*]
```

### Mapping champs → Pivot

| Champ Legacy | JSONPath | Champ Pivot | Transformation |
|--------------|----------|-------------|----------------|
| `productId` | `$.response.data.items[*].productId` | `id` | `String()` |
| `sku` | `$.response.data.items[*].sku` | `sku` | `String()` |
| `title` | `$.response.data.items[*].title` | `name` | `String()` |
| `category` | `$.response.data.items[*].category` | `category` | `String()` |
| `price` | `$.response.data.items[*].price` | `price` | `Number()` |
| `currency` | `$.response.data.items[*].currency` | `currency` | `String()`, défaut: `"EUR"` |
| `stock` | `$.response.data.items[*].stock` | `stock` | `Number()`, défaut: `0` |
| `rating` | `$.response.data.items[*].rating` | `rating` | `Number()`, optionnel |
| `attributes` | `$.response.data.items[*].attributes` | `attributes` | Objet conservé tel quel |

## Code de transformation

```typescript
const extractLegacyProducts = (response: unknown): ProductPivot[] => {
  const data = response as { data: { items: unknown[] } }

  if (!data.data?.items || !Array.isArray(data.data.items)) {
    throw new Error('No items found in legacy response')
  }

  return data.data.items.map((product: unknown) => {
    const p = product as Record<string, unknown>

    return {
      id: String(p.productId),
      sku: String(p.sku ?? ''),
      name: String(p.title),
      category: String(p.category ?? ''),
      price: Number(p.price),
      currency: String(p.currency ?? 'EUR'),
      stock: Number(p.stock ?? 0),
      rating: p.rating !== undefined ? Number(p.rating) : undefined,
      attributes: (p.attributes as Record<string, unknown>) ?? {},
    }
  })
}
```

## Gestion des erreurs

- `response.data.items` absent ou non-tableau → Erreur
- Champ obligatoire manquant (`productId`, `title`, `price`) → Erreur
- Champ optionnel manquant (`currency`, `stock`, `rating`) → Valeur par défaut ou `undefined`

## Cas particuliers

- Le champ `productId` (Legacy) correspond au champ `id` dans le format pivot
- Le champ `title` (Legacy) correspond au champ `name` dans le format pivot
- Le champ `rating` est optionnel : présent dans le mock mais peut être absent
- Les métadonnées (`metadata.version`, `metadata.totalItems`, `metadata.timestamp`) ne sont pas extraites dans le pivot
