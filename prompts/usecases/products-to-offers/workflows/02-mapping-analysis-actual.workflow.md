# Mapping Analysis Actual Workflow

## 🎯 Objectif

Analyser les mocks Actual pour découvrir automatiquement les chemins JSONPath nécessaires à l'extraction des données.

## 📁 Fichiers Sources

Les mocks Actual se trouvent dans :

- `mocks/sequences/products-to-offers-comparison/*-actual-*.json`

## 🚀 Instructions pour l'IA

Peux-tu :

1. **Analyser les mocks Actual** avec l'outil MCP `mcp_json_query`
   - Prendre le premier fichier `*-actual-*.json` trouvé
   - Explorer la structure JSON pour identifier les données clés

2. **Identifier les champs à extraire** pour la comparaison :
   - Identifiants (ID produit, SKU, etc.)
   - Noms / titres
   - Prix
   - Stock / disponibilité
   - Catégorie
   - Autres attributs pertinents

3. **Documenter les chemins JSONPath** pour chaque champ identifié

4. **Générer la spécification** au format suivant :

```markdown
# Spécifications d'extraction de données Actual - API Offers

## Objectif

Extraire les données de l'API Actual vers le format pivot défini dans `specs/pivot-format.spec.md`.

## Source des données

- Fichier JSON : `mocks/sequences/products-to-offers-comparison/{TEST_CASE_INDEX}-step-{STEP_NUMBER}-actual-*.json`
- Chemin racine : `$.response.data`

## Mappings

| Champ Pivot | JSONPath Actual | Transformation |
|-------------|-----------------|----------------|
| id | ... | ... |
| name | ... | ... |
| price | ... | ... |
| stock | ... | ... |

## Cas particuliers

- [Documenter les cas particuliers identifiés]
```

## 📤 Résultat Attendu

- Fichier généré : `prompts/usecases/products-to-offers/specs/actual-extract-analysis.spec.md`
- Le fichier doit contenir tous les mappings JSONPath nécessaires
