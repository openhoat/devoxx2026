# Plugin Legacy - Génération du plugin d'extraction Legacy

## 🎯 Objectif

Générer `src/test/e2e/plugins/legacy-extract.plugin.ts` à partir des spécifications.

## 📋 Entrées

### Spécifications à lire

- `prompts/usecases/products-to-offers/specs/legacy-extract-analysis.spec.md` : Mappings JSONPath Legacy
- `prompts/usecases/products-to-offers/specs/pivot-format.spec.md` : Format Pivot cible

## 🚀 Instructions pour l'IA

### Étape 1 : Lire les spécifications

Lire les fichiers de spécification pour comprendre :

- Les mappings JSONPath pour Legacy
- Le format Pivot vers lequel transformer

### Étape 2 : Générer le plugin

Fichier cible : `src/test/e2e/plugins/legacy-extract.plugin.ts`

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'
import { JSONPath } from 'jsonpath-plus'

export const legacyExtractPlugin: Plugin = {
  name: 'legacy-extract',
  step: 'legacy-products',
  execute: async (store) => {
    // 1. Extraire les données selon les mappings de la spec Legacy
    // 2. Transformer vers le format Pivot
    // 3. Stocker dans store.state.legacyProducts
    
    const response = store.conversation['legacy-products']?.response
    // ... implémenter selon spec
    
    store.state.legacyProducts = extractedProducts
  }
}
```

### Étape 3 : Mettre à jour l'index

Ajouter l'export dans `src/test/e2e/plugins/index.ts` :

```typescript
export { legacyExtractPlugin } from './legacy-extract.plugin'
```

## 🔧 Validation

```bash
npm run build
```

## 📤 Résultat Attendu

- Plugin `legacy-extract.plugin.ts` généré
- Export ajouté dans `index.ts`
- Compilation réussie
