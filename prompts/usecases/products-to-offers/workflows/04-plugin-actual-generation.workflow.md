# Plugin Actual - Génération du plugin d'extraction Actual

## 🎯 Objectif

Générer `src/test/e2e/plugins/actual-extract.plugin.ts` à partir des spécifications.

## 📋 Entrées

### Spécifications à lire

- `prompts/usecases/products-to-offers/specs/actual-extract-analysis.spec.md` : Mappings JSONPath Actual
- `prompts/usecases/products-to-offers/specs/pivot-format.spec.md` : Format Pivot cible

## 🚀 Instructions pour l'IA

### Étape 1 : Lire les spécifications

Lire les fichiers de spécification pour comprendre :

- Les mappings JSONPath pour Actual
- Le format Pivot vers lequel transformer

### Étape 2 : Générer le plugin

Fichier cible : `src/test/e2e/plugins/actual-extract.plugin.ts`

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'
import { JSONPath } from 'jsonpath-plus'

export const actualExtractPlugin: Plugin = {
  name: 'actual-extract',
  step: 'actual-offers',
  execute: async (store) => {
    // 1. Extraire les données selon les mappings de la spec Actual
    // 2. Transformer vers le format Pivot
    // 3. Stocker dans store.state.actualOffers
    
    const response = store.conversation['actual-offers']?.response
    // ... implémenter selon spec
    
    store.state.actualOffers = extractedOffers
  }
}
```

### Étape 3 : Mettre à jour l'index

Ajouter l'export dans `src/test/e2e/plugins/index.ts` :

```typescript
export { actualExtractPlugin } from './actual-extract.plugin'
```

## 🔧 Validation

```bash
npm run build
```

## 📤 Résultat Attendu

- Plugin `actual-extract.plugin.ts` généré
- Export ajouté dans `index.ts`
- Compilation réussie
