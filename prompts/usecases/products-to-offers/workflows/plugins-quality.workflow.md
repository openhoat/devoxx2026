# Workflow de validation de qualité des plugins

## Objectif

Valider la qualité des plugins générés avant intégration.

## Contexte

- Tu es un expert en qualité de code TypeScript.
- Tu dois valider que les plugins respectent les spécifications.
- Tu dois vérifier que le code est maintenable et robuste.

## Critères de validation

### 1. Compilation TypeScript

```bash
npm run build
```

- Pas d'erreurs de compilation
- Pas de warnings de type

### 2. Linting

```bash
npm run qa:biome
```

- Code formaté correctement
- Pas de violations de règles

### 3. Tests unitaires

```bash
npm test
```

- Tous les tests passent
- Couverture de code suffisante

### 4. Validation fonctionnelle

Pour chaque plugin :

#### Plugin d'extraction Legacy

- [ ] Extrait correctement les produits du format Legacy
- [ ] Gère les champs optionnels avec valeurs par défaut
- [ ] Lance une erreur si données invalides

#### Plugin d'extraction Actual

- [ ] Extrait correctement les offres du format Actual
- [ ] Convertit les attributs tableau → objet
- [ ] Gère les champs optionnels avec valeurs par défaut
- [ ] Lance une erreur si données invalides

#### Plugin de comparaison

- [ ] Compare correctement les données pivot
- [ ] Détecte les produits manquants
- [ ] Détecte les écarts de prix
- [ ] Détecte les écarts de stock
- [ ] Produit un rapport de comparaison détaillé
- [ ] Lance une erreur si régression détectée

## Checklist de qualité

```markdown
### Plugin Legacy
- [ ] Type Plugin correctement utilisé
- [ ] JSONPath pour extraction
- [ ] Validation des données
- [ ] Transformation en format pivot
- [ ] Stockage dans store.state
- [ ] Logs informatifs

### Plugin Actual
- [ ] Type Plugin correctement utilisé
- [ ] JSONPath pour extraction
- [ ] Conversion attributes array → object
- [ ] Validation des données
- [ ] Transformation en format pivot
- [ ] Stockage dans store.state
- [ ] Logs informatifs

### Plugin Comparaison
- [ ] Type Plugin correctement utilisé
- [ ] Comparaison par ID
- [ ] Détection produits manquants
- [ ] Comparaison prix avec tolérance
- [ ] Comparaison stock stricte
- [ ] Rapport détaillé
- [ ] Gestion des erreurs
```

## Tests de régression

### Cas 1 : Match parfait

```bash
TEST_CASE=1 npm run test:e2e
```

Résultat attendu : ✅ OK

### Cas 2 : Écart de prix

```bash
TEST_CASE=2 npm run test:e2e
```

Résultat attendu : ⚠️ KO - Écart prix P001

### Cas 3 : Produit manquant

```bash
TEST_CASE=3 npm run test:e2e
```

Résultat attendu : ❌ KO - Produit P003 manquant

## Validation finale

Après validation :

1. Mettre à jour PLAN.md
2. Commiter les plugins
3. Marquer la tâche comme terminée

## Références

- `specs/comparison-analysis.spec.md` - Algorithme de comparaison
- `src/test/e2e/products-to-offers.e2e.test.ts` - Tests E2E
