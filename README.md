# Devoxx 2026 - Tests E2E d'API générés par IA

Ce projet contient les slides et le harnais de démonstration pour la conférence Devoxx France 2026 : **"Tests end-to-end d'API générés par IA : un retour d'expérience en refonte legacy"**.

## Structure du projet

```
devoxx2026/
├── slides/                    # Présentation Marp
│   ├── presentation.md        # Slides principaux
│   └── assets/                # Diagrammes et images
├── src/
│   ├── main/                  # Moteur de séquence
│   │   ├── http-sequencer/
│   │   └── util/
│   └── test/                  # Tests E2E
│       └── e2e/
│           ├── plugins/
│           └── products-to-offers.sequence.yml
├── mocks/                     # Mocks pour la démo
│   └── sequences/
├── prompts/                   # Workflows et specs IA
│   └── usecases/
└── doc/                       # Documentation
```

## Prérequis

- Node.js 22+
- npm 10+

## Installation

```bash
npm install
```

## Utilisation

### Lancer les tests E2E

```bash
# Tests avec mocks (recommandé pour la démo)
npm run test:e2e:mock

# Tests pas à pas (utilisé pour la démo)
npm run test:e2e:step-by-step

# Avec logs détaillés
LOG_LEVEL=debug npm run test:e2e:mock
```

### Voir les slides

```bash
# Serveur local Marp
npm run slides:serve

# Générer HTML/PDF
npm run slides:build
```

## Architecture du harnais

### Moteur de séquence (DSL-Based)

Le moteur exécute des séquences définies en YAML :

```yaml
name: "Products to Offers Comparison"
steps:
  - name: legacy-products
    request:
      method: GET
      endpoint: "{{legacyBaseUrl}}/api/v1/products"
    plugins:
      - name: Extract legacy products
        type: legacyExtractPlugin
```

### Plugins

Les plugins sont générés par l'IA pour :

- Extraire et normaliser les données
- Comparer les formats legacy vs new
- Générer des rapports de comparaison

### Mocks

Les mocks permettent de tester sans APIs réelles :

```
mocks/
└── sequences/
    └── products-to-offers-comparison/
        ├── 01-step-01-legacy-products-*.json
        └── 01-step-02-actual-offers-*.json
```

## Domaine de démonstration

Le projet utilise un domaine **e-commerce simplifié** :

- **Legacy API** : `GET /api/v1/products` - Format produit legacy
- **New API** : `POST /api/v2/offers/search` - Format offre moderne

### Mapping des champs

| Legacy Product   | New Offer                     |
|------------------|-------------------------------|
| `product.id`     | `offer.productId`             |
| `product.name`   | `offer.title`                 |
| `product.price`  | `offer.pricing.total`         |
| `product.stock`  | `offer.availability.quantity` |

## Approches comparées

### AI-First

- Un prompt pour tout gérer
- Flexible mais lent
- Coût élevé par test

### DSL-Based (recommandé)

- Moteur déterministe
- Plugins générés par IA
- Rapide et reproductible

## Démo

La démo utilise 5 branches Git pour illustrer les scénarios :

| Branche                         | État | Scénario                             |
|---------------------------------|------|--------------------------------------|
| `main`                          | ✅   | Harnais fonctionnel sur APIs v1      |
| `matching-error`                | ❌   | Écart de prix détecté                |
| `api-evolution`                 | ❌   | Évolution API v2 — harnais cassé     |
| `api-evolution-fix`             | ✅   | Plugins corrigés par IA              |
| `api-evolution-matching-error`  | ❌   | Changement de prix en v2 détecté     |

Voir `doc/demo-script.md` pour le script de démo complet.

## Licence

MIT

## Auteurs

- cyrille.martraire@arolla.fr
- olivier.penhoat@arolla.fr

Présenté à Devoxx France 2026
