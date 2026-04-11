# Spécification d'extraction Legacy

## Objectif

Extraire et normaliser les données de l'API Legacy Products vers le format pivot.

## API Legacy

### Endpoint

```
GET /api/v1/products
```

### Format de réponse

```json
{
  "products": [
    {
      "id": "P001",
      "sku": "LAPTOP-PRO-15",
      "name": "Laptop Pro 15\"",
      "category": "electronics",
      "price": 1299.99,
      "currency": "EUR",
      "stock": 15,
      "attributes": {
        "brand": "TechBrand",
        "weight": "2.1kg",
        "screen_size": "15.6 inch"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "perPage": 10
  }
}
```

## Règles d'extraction

### JSONPath d'extraction

```
$.products[*]
```

### Mapping champs → Pivot

| Champ Legacy | JSONPath | Champ Pivot | Transformation |
|--------------|----------|-------------|----------------|
| `id` | `$.products[*].id` | `id` | `String()` |
| `sku` | `$.products[*].sku` | `sku` | `String()` |
| `name` | `$.products[*].name` | `name` | `String()` |
| `category` | `$.products[*].category` | `category` | `String()` |
| `price` | `$.products[*].price` | `price` | `Number()` |
| `currency` | `$.products[*].currency` | `currency` | `String()`, défaut: "EUR" |
| `stock` | `$.products[*].stock` | `stock` | `Number()`, défaut: 0 |
| `attributes` | `$.products[*].attributes` | `attributes` | Objet conservé tel quel |

## Code de transformation

```typescript
const extractLegacyProducts = (response: unknown): ProductPivot[] => {
  const data = response as { products: unknown[] }
  
  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('No products found in legacy response')
  }

  return data.products.map((product: unknown) => {
    const p = product as Record<string, unknown>
    
    return {
      id: String(p.id),
      sku: String(p.sku ?? ''),
      name: String(p.name),
      category: String(p.category ?? ''),
      price: Number(p.price),
      currency: String(p.currency ?? 'EUR'),
      stock: Number(p.stock ?? 0),
      attributes: (p.attributes as Record<string, unknown>) ?? {},
    }
  })
}
```

## Gestion des erreurs

- `products` absent ou non-tableau → Erreur
- Champ obligatoire manquant (`id`, `name`, `price`) → Erreur
- Champ optionnel manquant → Valeur par défaut
