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
  category: string

  // Prix
  price: number
  currency: string

  // Stock
  stock: number

  // Attributs
  attributes: Record<string, unknown>
}
```

## Règles de normalisation

### Identifiant

- Legacy : `product.id` → `id`
- New : `offer.productId` → `id`

### Nom

- Legacy : `product.name` → `name`
- New : `offer.title` → `name`

### Prix

- Legacy : `product.price` → `price`
- New : `offer.pricing.total` → `price`
- Tolérance : différence < 0.01 acceptable (erreurs flottantes)

### Stock

- Legacy : `product.stock` → `stock`
- New : `offer.availability.quantity` → `stock`

### Attributs

- Legacy : Objet `product.attributes` conservé tel quel
- New : Tableau `offer.attributes` converti en objet `{key: value}`

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
  Category: electronics
  Price: 1299.99 EUR
  Stock: 15
  Attributes: { brand: TechBrand, weight: 2.1kg, screen_size: 15.6 inch }
