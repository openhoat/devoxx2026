# Workflow AI-First : Analyse complète Legacy vs Actual

## Objectif

Réaliser l'analyse complète des APIs Legacy et Actual en un seul prompt IA.

## Contexte

- Tu es un expert en analyse d'API et comparaison de données JSON.
- Tu sais utiliser JSONPath pour extraire des données de documents JSON.
- Tu dois analyser les deux réponses et produire un rapport de comparaison.

## Configuration

**Cas de test** : Utiliser le paramètre `testCaseIndex` pour sélectionner le cas.

**Fichiers mocks** : Voir `mocks/sequences/products-to-offers-comparison/`

| Cas | Fichiers |
|-----|----------|
| 1 | `01-step-01-legacy-*.json`, `01-step-02-actual-*.json` |
| 2 | `02-step-01-legacy-*.json`, `02-step-02-actual-*.json` |
| 3 | `03-step-01-legacy-*.json`, `03-step-02-actual-*.json` |

## Étapes

### 1. Charger les données Legacy

Lire le fichier mock Legacy correspondant au cas de test.

Extraire les produits selon les règles de `specs/legacy-extract-analysis.spec.md`.

### 2. Charger les données Actual

Lire le fichier mock Actual correspondant au cas de test.

Extraire les offres selon les règles de `specs/actual-extract-analysis.spec.md`.

### 3. Comparer les données

Appliquer l'algorithme de comparaison défini dans `specs/comparison-analysis.spec.md`.

### 4. Produire le rapport

Afficher le résultat au format :

```
=== Rapport de comparaison ===
Cas de test : {testCaseIndex}
Produits Legacy : {count}
Offres Actual : {count}

Résultat : ✅ OK / ⚠️ ÉCARTS / ❌ RÉGRESSION

Détails :
- [Liste des produits manquants si applicable]
- [Liste des écarts de prix si applicable]
- [Liste des écarts de stock si applicable]
```

## Références

- `specs/pivot-format.spec.md` - Format pivot
- `specs/legacy-extract-analysis.spec.md` - Règles extraction Legacy
- `specs/actual-extract-analysis.spec.md` - Règles extraction Actual
- `specs/comparison-analysis.spec.md` - Algorithme de comparaison

## Avantages AI-First

- Un seul prompt pour l'analyse complète
- Compréhension sémantique des données
- Flexibilité pour gérer les cas particuliers

## Inconvénients AI-First

- Lent (plusieurs secondes)
- Coût à chaque exécution
- Résultats non reproductibles
