# Format Pivot - Produit à Offre

## Objectif

Définir le format pivot pour la comparaison entre les produits legacy et les offres new.

## Type Pivot

```typescript
type ProductPivot = {
  // Identifiant
  id: string

  // Informations produit
  sku: string
  name: string

  // Catégorie (normalisée)
  category: string // ID de la catégorie
  categoryName?: string // Nom de la catégorie (optionnel)

  // Prix
  price: number
  currency: string

  // Stock
  stock: number

  // Évaluation
  rating?: number // Note moyenne ( Legacy: rating, Actual: customerReviews.averageRating)
  reviewCount?: number // Nombre d'avis (Actual uniquement)

  // Identifiant offre (Actual uniquement)
  offerId?: string

  // Attributs
  attributes: Record<string, unknown>
}
```

## Règles de normalisation

### Identifiant

- Legacy : `product.productId` → `id`
- Actual : `offer.productId` → `id`

### Nom

- Legacy : `product.title` → `name`
- Actual : `offer.title` → `name`

### Catégorie

- Legacy : `product.category` (string) → `category`
- Actual : `offer.category.id` → `category`, `offer.category.name` → `categoryName`

### Prix

- Legacy : `product.price` → `price`
- Actual : `offer.pricing.total` → `price`
- Tolérance : différence < 0.01 acceptable (erreurs flottantes)

### Devise

- Legacy : `product.currency` → `currency`
- Actual : `offer.pricing.currency` → `currency`

### Stock

- Legacy : `product.stock` → `stock`
- Actual : `offer.availability.quantity` → `stock`

### Évaluation (nouveaux champs API v2)

- Legacy : `product.rating` → `rating`
- Actual : `offer.customerReviews.averageRating` → `rating`
- Actual : `offer.customerReviews.reviewCount` → `reviewCount`

### Identifiant offre (nouveau champ API v2)

- Legacy : non applicable
- Actual : `offer.offerId` → `offerId`

### Attributs

- Legacy : Objet `product.attributes` conservé tel quel
- Actual : Tableau `offer.attributes` converti en objet `{key: value}`

## Fonction de validation

```typescript
const validatePivot = (data: unknown): ProductPivot => {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object')
  }

  const pivot = data as Record<string, unknown>

  if (typeof pivot.id !== 'string') {
    throw new Error('id must be a string')
  }
  if (typeof pivot.name !== 'string') {
    throw new Error('name must be a string')
  }
  if (typeof pivot.price !== 'number') {
    throw new Error('price must be a number')
  }
  if (typeof pivot.stock !== 'number') {
    throw new Error('stock must be a number')
  }

  return pivot as ProductPivot
}
```

## Format de sortie pour debugging

```
Product Pivot:
  ID: P001
  SKU: LAPTOP-PRO-15
  Name: Laptop Pro 15"
  Category: tech (Electronics)
  Price: 1299.99 EUR
  Stock: 42
  Rating: 4.0 (156 reviews)
  Offer ID: OFF-001
  Attributes: { brand: TechBrand, weight: 2.5kg }
