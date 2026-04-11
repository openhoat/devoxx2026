# Workflow de génération de plugins DSL-Based

## Objectif

Générer les plugins TypeScript pour l'architecture DSL-Based.

## Contexte

- Tu es un développeur TypeScript expert.
- Tu dois générer du code TypeScript propre et typé.
- Les plugins seront utilisés par le moteur de séquence YAML.

## Architecture DSL-Based

Le moteur de séquence exécute des fichiers YAML qui référencent des plugins :

```yaml
steps:
  - name: legacy-products
    plugins:
      - name: Extract legacy products
        type: legacyExtractPlugin
```

## Plugins à générer

### 1. Plugin d'extraction Legacy

**Type** : `legacyExtractPlugin`

**Entrée** : `store.conversation['legacy-products'].response.data`

**Sortie** : `store.state.legacyProducts` (tableau ProductPivot)

**Spécification** : Voir `specs/legacy-extract-analysis.spec.md`

### 2. Plugin d'extraction Actual

**Type** : `actualExtractPlugin`

**Entrée** : `store.conversation['actual-offers'].response.data`

**Sortie** : `store.state.actualOffers` (tableau ProductPivot)

**Spécification** : Voir `specs/actual-extract-analysis.spec.md`

### 3. Plugin de comparaison

**Type** : `productOfferComparisonPlugin`

**Entrée** : `store.state.legacyProducts` et `store.state.actualOffers`

**Sortie** : `store.state.comparisonResult` (ComparisonResult)

**Spécification** : Voir `specs/comparison-analysis.spec.md`

## Template de plugin

```typescript
import type { Plugin } from '../../../main/http-sequencer/types'
import { JSONPath } from 'jsonpath-plus'

/**
 * [Description du plugin]
 * [Spécification référencée]
 */
export const [pluginName]Plugin: Plugin = (
  { store, logger },
): void => {
  logger.info('[emoji] [Action]...')

  // Extraction des données
  const data = JSONPath({
    path: '$.conversation.[stepName].response.data',
    json: store,
    wrap: false,
  })

  // Validation
  if (![condition]) {
    throw new Error('[Erreur]')
  }

  // Transformation
  const result = // ...

  // Stockage
  if (!store.state) {
    store.state = {}
  }
  ;(store.state as Record<string, unknown>).[outputKey] = result

  logger.info(`✅ [Résultat]`)
}
```

## Étapes de génération

### 1. Analyser les spécifications

Lire les fichiers :

- `specs/pivot-format.spec.md`
- `specs/legacy-extract-analysis.spec.md`
- `specs/actual-extract-analysis.spec.md`
- `specs/comparison-analysis.spec.md`

### 2. Générer le plugin Legacy

Créer `src/test/e2e/plugins/[nom].plugin.ts`

### 3. Générer le plugin Actual

Créer `src/test/e2e/plugins/[nom].plugin.ts`

### 4. Générer le plugin de comparaison

Créer `src/test/e2e/plugins/[nom].plugin.ts`

### 5. Valider le code

- Vérifier que le code compile
- Vérifier que les types sont corrects
- Vérifier que les logs sont informatifs

## Critères de qualité

- Code TypeScript typé (pas de `any`)
- Gestion des erreurs explicite
- Logs informatifs avec emojis
- Nommage cohérent
- Documentation JSDoc

## Avantages DSL-Based

- Exécution rapide (< 2 secondes)
- Résultats reproductibles
- Coût minimal à l'exécution
- Intégration CI/CD facile
