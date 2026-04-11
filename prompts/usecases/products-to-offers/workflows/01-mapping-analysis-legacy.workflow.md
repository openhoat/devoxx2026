# Mapping Analysis Legacy Workflow

## 🎯 Objectif

Analyser les mocks Legacy pour découvrir automatiquement les chemins JSONPath nécessaires à l'extraction des données.

## 📁 Fichiers Sources

Les mocks Legacy se trouvent dans :

- `mocks/sequences/products-to-offers-comparison/*-legacy-*.json`

## 🚀 Instructions pour l'IA

Peux-tu :

1. **Analyser les mocks Legacy** avec l'outil MCP `mcp_json_query`
   - Prendre le premier fichier `*-legacy-*.json` trouvé
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
# Spécifications d'extraction de données Legacy - API Products

## Objectif

Extraire les données de l'API Legacy vers le format pivot défini dans `specs/pivot-format.spec.md`.

## Source des données

- Fichier JSON : `mocks/sequences/products-to-offers-comparison/{TEST_CASE_INDEX}-step-{STEP_NUMBER}-legacy-*.json`
- Chemin racine : `$.response.data`

## Mappings

| Champ Pivot | JSONPath Legacy | Transformation |
|-------------|-----------------|----------------|
| id | ... | ... |
| name | ... | ... |
| price | ... | ... |
| stock | ... | ... |

## Cas particuliers

- [Documenter les cas particuliers identifiés]
```

## 📤 Résultat Attendu

- Fichier généré : `prompts/usecases/products-to-offers/specs/legacy-extract-analysis.spec.md`
- Le fichier doit contenir tous les mappings JSONPath nécessaires
