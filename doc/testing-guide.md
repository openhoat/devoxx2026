# Guide des Tests E2E

Ce document explique la stratégie de test du projet de démo Devoxx 2026.

## Structure des Tests

Le projet contient deux types de tests E2E complémentaires :

### 1. Tests Full (`products-to-offers.e2e.test.ts`)

**Objectif** : Valider le scénario métier complet

```typescript
// Exécute la séquence entière d'un coup
await runner.executeAll()

// Vérifie le résultat final
expect(comparisonResult.matched).toBe(true)
```

**Caractéristiques** :

- Teste le **flux métier end-to-end**
- Exécute toutes les étapes en une seule commande
- Vérifie les **résultats finaux** (comparaison, extraction)
- Simule un **vrai cas d'usage** de la séquence
- Inclut les **cas d'erreur** (test cases 2 et 3)

**Quand l'utiliser** :

- CI/CD pour valider le comportement global
- Tests de non-régression sur le scénario complet
- Démonstration du flux métier

---

### 2. Tests Step-by-Step (`products-to-offers.step-by-step.test.ts`)

**Objectif** : Valider les fonctionnalités du `SequenceRunner`

```typescript
// Exécute étape par étape
await runner.executeStep('legacy-products')
expect(runner.currentStepIndex).toBe(1)

await runner.executeStep('actual-offers')
expect(runner.currentStepIndex).toBe(2)

// Teste la réinitialisation
runner.reset()
expect(runner.isComplete).toBe(false)
```

**Caractéristiques** :

- Teste les **API du SequenceRunner** (`executeStep`, `executeAll`, `reset`)
- Vérifie l'**état intermédiaire** après chaque étape
- Teste les **cas limites** (réinitialisation, ré-exécution)
- Plus **granulaire** et détaillé

**Quand l'utiliser** :

- Développement du framework de test
- Debug d'un problème spécifique à une étape
- Validation des nouvelles fonctionnalités du runner

---

## Comparaison

| Aspect | Full | Step-by-Step |
|--------|------|--------------|
| Portée | Scénario métier | Framework de test |
| Granularité | Grossière | Fine |
| Vitesse | Rapide (1 exécution) | Plus lent (répétitions) |
| CI/CD | ✅ Recommandé | Optionnel |
| Debug | Difficile | Facile |

---

## Commandes npm

```bash
# Exécuter tous les tests
npm test

# Tests E2E avec mocks
npm run test:e2e:mock

# Tests E2E en mode live (sans mocks)
npm run test:e2e:live

# Scénario métier complet (recommandé pour CI)
npm run test:e2e

# Test du framework step-by-step
npm run test:e2e:step-by-step
```

---

## Configuration des Logs

Par défaut, les logs sont silencieux en environnement de test :

```typescript
// jest.setup.ts
process.env.NODE_ENV = 'test'

// logger.ts
const LOG_LEVEL = process.env.LOG_LEVEL || 
  (process.env.NODE_ENV === 'test' ? 'silent' : 'info')
```

### Activer les logs pour debug

Dans le fichier de test, décommenter :

```typescript
beforeAll(async () => {
  process.env.MOCK = 'true'
  process.env.LOG_LEVEL = 'debug' // 🔓 Activer les logs
  // ...
})
```

Ou utiliser la variable d'environnement :

```bash
LOG_LEVEL=debug npm run test:e2e:mock
```

---

## Séparation des Préoccupations

Cette stratégie permet de séparer :

- **Le "quoi"** (métier) → Tests Full
- **Le "comment"** (framework) → Tests Step-by-Step

Les tests Full valident que le scénario métier fonctionne comme attendu, tandis que les tests Step-by-Step valident que l'infrastructure de test fonctionne correctement.
