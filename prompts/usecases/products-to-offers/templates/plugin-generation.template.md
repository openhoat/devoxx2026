# Plugin Generation Template

## 🎯 Objectif

Générer les 3 plugins nécessaires pour le harnais de test à partir des spécifications d'extraction.

## 📋 Entrées

### Spécifications à lire

1. **Spec Legacy** : `prompts/usecases/products-to-offers/specs/legacy-extract-analysis.spec.md`
2. **Spec Actual** : `prompts/usecases/products-to-offers/specs/actual-extract-analysis.spec.md`
3. **Spec Pivot** : `prompts/usecases/products-to-offers/specs/pivot-format.spec.md`

## 🚀 Instructions pour l'IA

### Étape 1 : Lire les spécifications

Lire les 3 fichiers de spécification pour comprendre :

- Les mappings JSONPath pour Legacy
- Les mappings JSONPath pour Actual
- Le format Pivot commun

### Étape 2 : Générer le plugin Legacy

Fichier : `src/test/e2e/plugins/legacy-extract.plugin.ts`

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'
import { JSONPath } from 'jsonpath-plus'

export const legacyExtractPlugin: Plugin = {
  name: 'legacy-extract',
  step: 'legacy-products',
  execute: async (store) => {
    // Extraire les données selon les mappings de la spec Legacy
    // Transformer vers le format Pivot
    // Stocker dans store.state.legacyProducts
  }
}
```

### Étape 3 : Générer le plugin Actual

Fichier : `src/test/e2e/plugins/actual-extract.plugin.ts`

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'
import { JSONPath } from 'jsonpath-plus'

export const actualExtractPlugin: Plugin = {
  name: 'actual-extract',
  step: 'actual-offers',
  execute: async (store) => {
    // Extraire les données selon les mappings de la spec Actual
    // Transformer vers le format Pivot
    // Stocker dans store.state.actualOffers
  }
}
```

### Étape 4 : Générer le plugin de comparaison

Fichier : `src/test/e2e/plugins/comparison.plugin.ts`

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'

export const productOfferComparisonPlugin: Plugin = {
  name: 'comparison',
  step: 'comparison',
  execute: async (store) => {
    // Comparer store.state.legacyProducts avec store.state.actualOffers
    // Générer un rapport de comparaison
    // Stocker le résultat dans store.state.comparisonResult
  }
}
```

### Étape 5 : Mettre à jour l'index

Mettre à jour `src/test/e2e/plugins/index.ts` pour exporter les nouveaux plugins.

## 🔧 Validation

Après génération, exécuter :

```bash
npm run build
npm run test:e2e:mock
```

## 📤 Résultat Attendu

- 3 plugins générés et fonctionnels
- Tests passant avec les mocks
