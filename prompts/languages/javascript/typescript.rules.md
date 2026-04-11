# Exigences du code TypeScript

Le code source généré doit respecter les règles suivantes :

- Etre en langage **TypeScript**.
- Compiler sans erreur.
- Respecter les règles de qualité.
- Etre suffisamment structuré et découpé pour faciliter sa maintenance.
- Utiliser des constantes nommées plutôt que des valeurs hardcodées.
- Etre le plus explicite possible dans la déclaration des types.
- Pas de commentaires sauf si le traitement effectué est particulièrement complexe ou spécifique et qu'un commentaire
  pour expliquer l'intention se justifie.
- Pour la définition de types, utiliser plutôt `type` que `interface`, sauf pour définir l'interface d'une classe.
- Eviter l'utilisation du type `any`, préférer `unknown` si la situation le permet, sinon définir un type spécifique.
- Eviter les castings forcés avec `as` : si besoin, sécuriser le code avec des types guards.
- Utiliser en priorité les types déclarés localement dans le projet.
- Préférer les **arrow functions** (`=>`) aux fonctions déclarées avec `function`, sauf quand le contexte `this` est
  utilisé.
- Pour les fonctions d'une seule ligne avec `return`, utiliser la **syntaxe d'expression** (sans accolades ni
  instruction `return`).

    ```typescript
    // ❌ INCORRECT - corps de fonction inutile
    const doubleBad = (x: number): number => {
      return x * 2
    }
    
    // ✅ CORRECT - expression concise
    const doubleGood = (x: number): number => x * 2
    ```

## Optimisation des imports

**OBLIGATOIRE** : Tous les imports doivent être optimisés selon une méthodologie rigoureuse.

### 1. Principe fondamental

**TOUS les imports doivent être raccourcis autant que possible** sans changer la dépendance réelle du module.

### 2. Méthodologie systématique

**Phase 1 - Audit exhaustif OBLIGATOIRE** :

1. Identifier TOUS les imports vers des fichiers spécifiques (ex: `./types.ts`, `./evaluator.ts`)
2. Localiser TOUS les fichiers `index.ts` disponibles dans le projet
3. Mapper tous les raccourcissements possibles avant toute correction

**Phase 2 - Optimisation** :

1. Utiliser les fichiers `index.ts` quand ils existent et exposent les éléments nécessaires
2. Si un `index.ts` n'expose pas un élément, l'ajouter au fichier `index.ts` quand c'est approprié
3. Éviter les imports directs vers des sous-fichiers quand un `index.ts` peut être utilisé

### 3. Exemples d'optimisation

```typescript
// ❌ INCORRECT - imports non optimisés
import {runSequenceStep} from '../../main/util/http-sequencer/step-executor'
import type {HttpSequence} from '../../main/util/http-sequencer/types'
import {loadYamlFile} from '../../main/util/http-sequencer/yaml-loader'

// ✅ CORRECT - imports optimisés via index.ts
import {runSequenceStep, loadYamlFile} from '../../main/util/http-sequencer'
import type {HttpSequence} from '../../main/util/http-sequencer'
```

### 4. Cas particuliers

**Répertoires utilitaires** : Ne PAS créer de fichier `index.ts` dans les répertoires de utilities (comme `util/`) car
ils ne constituent pas des modules cohérents.

```typescript
// ✅ CORRECT - imports directs pour les utilitaires
import {isDefined} from '../util/type-guards'
import type {JsonRecord} from '../util/types'
import {sendRequest} from '../util/http.helper'
```

**Modules cohérents** : Utiliser les fichiers `index.ts` pour les modules qui représentent une fonctionnalité cohérente.

```typescript
// ✅ CORRECT - import via index pour un module cohérent
import {runSequence, evaluateValue} from '../../main/util/http-sequencer'
```

### 5. Processus de validation

**OBLIGATOIRE** : Après optimisation, exécuter une recherche exhaustive pour vérifier qu'aucun import ne peut être
davantage raccourci :

```shell
# Rechercher tous les imports potentiellement optimisables
grep -r "from.*/" src/ --include="*.ts"
```

**RÈGLE IMPÉRATIVE** : Aucun code ne doit être considéré comme terminé tant que tous les imports ne sont pas optimisés
au maximum.

## Type Guards et validation des types

**Important** : Pour une meilleure sûreté des types et éviter l'utilisation excessive de `as`, utiliser des **type
guards** :

1. **Type guards pour JsonRecord** : Créer une fonction de type guard réutilisable

   ```typescript
   const isJsonRecord = (value: unknown): value is JsonRecord =>
     typeof value === 'object' && value !== null && !Array.isArray(value)
   ```

   **Important** : Utiliser `unknown` plutôt que `JsonValue` pour permettre la validation de n'importe quelle valeur.

2. **Validation des propriétés imbriquées** : Utiliser le type guard pour valider chaque niveau

   ```typescript
   // ❌ INCORRECT - utilisation excessive de 'as'
   const data = response.data?.config?.settings as SettingsType
   
   // ✅ CORRECT - avec type guards
   if (!isJsonRecord(response.data)) {
     logger.error('Invalid response.data structure')
     return
   }
   
   const config = response.data.config
   if (!isJsonRecord(config)) {
     logger.error('Invalid config structure')
     return
   }
   
   const settings = config.settings
   if (!isSettingsType(settings)) {  // type guard spécifique
     logger.error('Invalid settings structure')
     return
   }
   // TypeScript sait maintenant que settings est de type SettingsType
   ```

3. **Type guards personnalisés** : Créer des type guards spécifiques pour vos types métier

   ```typescript
   const isUserProfile = (value: unknown): value is UserProfile => {
     if (!isJsonRecord(value)) return false
     return (
       typeof value.id === 'string' &&
       typeof value.name === 'string' &&
       typeof value.email === 'string' &&
       Array.isArray(value.roles)
     )
   }
   ```

4. **Initialisation et mise à jour d'objets** : Éviter `as` même pour les initialisations

   ```typescript
   // ❌ INCORRECT - utilise 'as'
   if (!cache.items) {
     cache.items = {} as JsonRecord
   }
   const items = cache.items as JsonRecord
   items.results = data
   
   // ✅ CORRECT - sans 'as', avec validation
   if (!cache.items) {
     cache.items = {}
   }
   
   if (!isJsonRecord(cache.items)) {
     logger.error('Invalid cache.items structure')
     return
   }
   
   cache.items.results = data
   ```

**Avantages des type guards** :

- ✅ Sûreté des types à l'exécution (runtime type checking)
- ✅ Meilleure détection d'erreurs avec messages explicites
- ✅ Code plus maintenable et compréhensible
- ✅ Évite les erreurs silencieuses dues aux casts inappropriés
- ✅ Respecte les bonnes pratiques TypeScript

## Paramètres option nommés `options`

**OBLIGATOIRE** : Lorsqu'une fonction accepte un paramètre nommé `options`, celui-ci doit suivre des règles strictes :

1. **Le paramètre `options` doit être optionnel** (utiliser `?`)
2. **Toutes les propriétés de l'objet `options` doivent être optionnelles**

### Exemples

❌ **INCORRECT** - `options` optionnel mais propriétés obligatoires :

```typescript
const buildConfig = <T>(
    spec: ConfigSpec<T>,
    options?: {
        envProvider?: EnvProvider
        logger: Logger  // ❌ Propriété obligatoire dans options optionnel
    },
): z.infer<T> => {
    // Implementation
}
```

✅ **CORRECT** - `options` optionnel et toutes propriétés optionnelles :

```typescript
const buildConfig = <T>(
    spec: ConfigSpec<T>,
    options?: {
        envProvider?: EnvProvider
        logger?: Logger  // ✅ Propriété optionnelle
    },
): z.infer<T> => {
    // Implementation
}
```

✅ **CORRECT** - `options` optionnel avec propriétés optionnelles :

```typescript
const evaluateValue = (
    value: string,
    defaultValue: unknown = undefined,
    options?: { logger?: Logger },  // ✅ TOUT est optionnel
) => {
    // Implementation
}
```

### Justification

Cette règle garantit la cohérence et évite les contradictions dans l'API :

- Si `options` est optionnel, l'utilisateur peut ne pas le passer
- Si une propriété est obligatoire dans `options`, l'utilisateur est forcé de passer `options` juste pour cette
  propriété
- Cela crée une incohérence dans la conception de l'API

### Cas particulier et méthodologie de refactoring

Si une propriété est vraiment obligatoire, elle ne doit pas être dans `options` mais être un paramètre direct de la
fonction.

**Méthodologie systématique** :

Lorsqu'une propriété obligatoire est identifiée dans `options` :

1. **Extraire la propriété** comme paramètre direct de la fonction
2. **Mettre à jour la signature** pour placer le paramètre obligatoire avant `options`
3. **Adapter le corps** de la fonction pour utiliser le paramètre direct
4. **Nettoyer `options`** pour ne garder que les propriétés véritablement optionnelles

**Exemple de refactoring complet** :

```typescript
// ❌ AVANT - propriété obligatoire dans options
const buildConfigBad = <T>(
    spec: ConfigSpec<T>,
    options?: {
        envProvider?: EnvProvider
        logger: Logger  // Obligatoire mais dans options optionnel
    },
): z.infer<T> => {
    const {envProvider = process.env, logger} = options ?? {}
    // ... utilisation de logger
    return {} as z.infer<T>
}

// ✅ APRÈS - paramètre obligatoire extrait
const buildConfigGood = <T>(
    spec: ConfigSpec<T>,
    logger: Logger,  // Paramètre obligatoire direct
    options?: {
        envProvider?: EnvProvider  // Options facultatives uniquement
    },
): z.infer<T> => {
    const {envProvider = process.env} = options ?? {}
    // ... utilisation directe de logger
    return {} as z.infer<T>
}
```

**Principe fondamental** : Les `options` doivent uniquement contenir des paramètres véritablement optionnels. Tous les
paramètres obligatoires doivent être extraits comme paramètres directs de la fonction pour garantir une API cohérente et
claire.

## Validation

**OBLIGATOIRE** : Toujours vérifier la compilation TypeScript avant de considérer le code comme complet.

**Compilation TypeScript** :

Le processus de compilation est exposé via le script **npm** `build`.

```shell
npm run build
```

**INSTRUCTION IMPÉRATIVE** : Utiliser SYSTÉMATIQUEMENT l'outil MCP `shell` pour exécuter cette validation.

**Processus obligatoire** :

1. **TOUJOURS exécuter** la compilation avec l'outil MCP shell
2. **Vérifier qu'il n'y a pas d'erreurs** :
    - Vérifier qu'il n'y a pas d'imports inutilisés
    - Vérifier qu'il n'y a pas d'erreurs de types
3. **Si des erreurs apparaissent** : les corriger, puis **obligatoirement** revérifier avant de livrer le code en
   reprenant au point 1
4. **AUCUN code ne doit être considéré comme terminé** sans validation TypeScript réussie

**Note importante** : Cette étape de validation est **NON NÉGOCIABLE** et doit être exécutée pour chaque modification de
code TypeScript.
