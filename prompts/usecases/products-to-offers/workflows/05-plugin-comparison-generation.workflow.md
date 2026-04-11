# Plugin Comparison - Génération du plugin de comparaison

## 🎯 Objectif

Générer `src/test/e2e/plugins/comparison.plugin.ts` à partir des spécifications et des nouvelles données des mocks.

## 📋 Entrées

### Spécifications à lire

- `prompts/usecases/products-to-offers/specs/pivot-format.spec.md` : Format Pivot
- `prompts/usecases/products-to-offers/specs/comparison-analysis.spec.md` : Règles de comparaison

### Mocks à analyser

- `mocks/sequences/products-to-offers-comparison/01-step-01-legacy-products-*.json` : Données Legacy
- `mocks/sequences/products-to-offers-comparison/01-step-02-actual-offers-*.json` : Données Actual

### Plugin existant à vérifier

- `src/test/e2e/plugins/comparison.plugin.ts` : Plugin de comparaison actuel

## 🚀 Instructions pour l'IA

### Étape 1 : Analyser le plugin existant

Lire le fichier `src/test/e2e/plugins/comparison.plugin.ts` pour identifier :

- Les champs actuellement comparés
- Les champs ignorés ou non comparés
- La structure du plugin actuel

### Étape 2 : Analyser les nouvelles données des mocks

Analyser les fichiers de mocks pour identifier :

- Les champs présents dans Legacy mais pas dans les specs
- Les champs présents dans Actual mais pas dans les specs
- Les changements de structure (ex: `price` → `pricing.total`)
- Les nouveaux champs à comparer (ex: `category`, `rating`, etc.)

### Étape 3 : Identifier les différences

Comparer le plugin existant avec les nouvelles données :

1. **Champs manquants** : Champs présents dans les mocks mais non comparés par le plugin
2. **Champs obsolètes** : Champs comparés par le plugin mais absents des mocks
3. **Champs à ajouter** : Nouveaux champs détectés qui nécessitent une comparaison

Si aucune différence n'est détectée, **arrêter le workflow** et signaler que le plugin est à jour.

### Étape 4 : Lire les spécifications

Lire les fichiers de spécification pour comprendre :

- Le format Pivot des données
- Les règles de comparaison (égalité stricte, tolérances, etc.)

### Étape 5 : Générer le plugin mis à jour

Fichier cible : `src/test/e2e/plugins/comparison.plugin.ts`

**IMPORTANT** : Le plugin généré doit inclure TOUS les champs identifiés dans l'étape 3, pas seulement ceux des spécifications.

Structure attendue :

```typescript
import type { Plugin } from '../../../main/http-sequencer'

export const comparisonPlugin: Plugin = {
  name: 'comparison',
  step: 'comparison',
  execute: async (store) => {
    // 1. Récupérer store.state.legacyProducts
    // 2. Récupérer store.state.actualOffers
    // 3. Comparer selon les règles de comparison-analysis.spec.md
    //    ET les nouvelles données identifiées dans l'étape 2
    // 4. Générer un rapport de comparaison
    // 5. Stocker le résultat dans store.state.comparisonResult
    
    const legacyProducts = store.state.legacyProducts
    const actualOffers = store.state.actualOffers
    
    // ... implémenter la comparaison selon spec + nouvelles données
    
    store.state.comparisonResult = {
      success: true/false,
      matchedCount: number,
      totalCount: number,
      differences: []
    }
  }
}
```

### Étape 6 : Mettre à jour l'index

Ajouter l'export dans `src/test/e2e/plugins/index.ts` :

```typescript
export { comparisonPlugin } from './comparison.plugin'
```

## 🔧 Validation

```bash
npm run build
```

## 📤 Résultat Attendu

- Plugin `comparison.plugin.ts` généré avec prise en compte des nouvelles données
- Export ajouté dans `index.ts`
- Compilation réussie

## ⚠️ Cas particuliers

### Aucune différence détectée

Si l'étape 3 révèle que le plugin existant couvre déjà tous les champs nécessaires :

- Ne PAS régénérer le plugin
- Signaler à l'utilisateur : "Le plugin de comparaison est déjà à jour et couvre tous les champs nécessaires."
- Terminer le workflow avec succès

### Différences détectées

Si des champs manquent dans le plugin existant :

- Lister les champs à ajouter
- Générer le plugin mis à jour
- Afficher un résumé des changements
