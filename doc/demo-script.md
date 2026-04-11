# Script de Démo - Devoxx 2026

**Durée totale : ~12 minutes**

---

## 🎯 Scénario de Démonstration

Ce script illustre comment l'IA peut adapter un harnais de test lors d'une évolution d'API.

### Histoire racontée (via Git)

1. **État initial** : Harnais valide sur APIs v1 (branche `main`) ✅
2. **Erreur de prix** : Le harnais détecte un écart de prix (branche `matching-error`) ❌
3. **Évolution API** : Les APIs évoluent en v2, le harnais casse (branche `api-evolution`) ❌
4. **Correction IA** : L'IA analyse et corrige les plugins (branche `api-evolution-fix`) ✅
5. **Erreur de prix v2** : Le harnais détecte un changement de prix en v2 (branche `api-evolution-matching-error`) ❌

---

## 📋 Préparation (5 min avant)

### Vérifications

```bash
cd /home/openhoat/work/devoxx2026

# Vérifier qu'on est sur main
git branch
# Doit afficher: * main

# Lancer les tests
npm run test:e2e:step-by-step
```

**Résultat attendu :** Tests passent ✅

### Terminal et IDE prêts

- Terminal ouvert sur `/home/openhoat/work/devoxx2026`
- IDE ouvert avec les fichiers :
  - `src/test/e2e/plugins/comparison.plugin.ts`
  - `src/test/e2e/plugins/legacy-extract.plugin.ts`
  - `src/test/e2e/plugins/actual-extract.plugin.ts`

---

## 🎬 Déroulé de la Démo

### Partie 1 : Introduction (1 min)

**Dire :**
> "Nous allons voir comment l'IA peut maintenir un harnais de test de régression lors d'évolutions d'API. L'approche est basée sur Git pour garantir la reproductibilité."

**Montrer :** Le mapping des champs Legacy vs New

---

### Partie 2 : État Initial - Harnais v1 (2 min)

#### Montrer l'historique Git

```bash
# Montrer les branches disponibles
git branch -a
```

**Dire :**
> "Voici nos 5 branches : `main` pour l'état initial, `matching-error` pour un écart de prix, `api-evolution` pour les APIs v2, `api-evolution-fix` pour les corrections, et `api-evolution-matching-error` pour un changement de prix en v2."

#### Exécuter les tests sur main

```bash
# S'assurer d'être sur main
git checkout main

# Lancer les tests
npm run test:e2e:step-by-step
```

**Résultat attendu :**

```
✓ should execute sequence step by step
✅ Comparison passed: 3/3 products matched
```

**Dire :**
> "Le harnais fonctionne sur l'état initial. Les deux APIs retournent des données équivalentes."

---

### Partie 2b : Détection d'Erreur de Prix (1 min)

#### Basculer sur matching-error

```bash
git checkout matching-error
```

#### Exécuter les tests

```bash
npm run test:e2e:step-by-step
```

**Résultat attendu :**

```
✕ should execute sequence step by step
❌ Product/Offer comparison failed: 0 missing, 1 mismatches
```

**Dire :**
> "Le harnais détecte un écart de prix ! Même sans évolution de format, le harnais est capable de repérer une différence de prix entre les deux APIs."

---

### Partie 3 : Évolution des APIs (1 min)

#### Basculer sur api-evolution

```bash
git checkout api-evolution
```

#### Montrer les changements

```bash
# Voir ce qui a changé
git log main..api-evolution --oneline

# Montrer les mocks v2
cat mocks/sequences/products-to-offers-comparison/01-step-01-legacy-products-*.json | jq '.response.data.items[0] | {productId, title, category}'
```

**Dire :**
> "Les APIs ont évolué : nouveaux champs, structures différentes. La catégorie est maintenant un objet au lieu d'une string."

---

### Partie 4 : Échec du Harnais (1 min)

#### Exécuter les tests

```bash
npm run test:e2e:step-by-step
```

**Résultat attendu :**

```
✕ should execute sequence step by step
❌ Product/Offer comparison failed: 0 missing, 3 mismatches
```

**Dire :**
> "Le test échoue ! Le plugin ne trouve plus les catégories car le format a changé."

---

### Partie 5 : Correction par l'IA (4 min)

#### Montrer l'historique des corrections

```bash
# Voir les commits de correction
git log api-evolution..api-evolution-fix --oneline
```

**Ce que montre l'historique :**

```
ae8e098 fix: comparison plugin
187ce62 fix: actual extract plugin
98d99f1 fix: legacy extract plugin
95659fd fix: actual extract analysis
d72b672 fix: legacy extract analysis
```

**Dire :**
> "Voici ce que l'IA a produit : 5 commits pour corriger l'ensemble du harnais. Chaque commit correspond à une étape du workflow."

#### Montrer un commit en détail

```bash
# Montrer les specs mises à jour
git show d72b672 --stat

# Montrer les changements de code
git show 98d99f1 --stat
```

**Dire :**
> "L'IA a d'abord mis à jour les spécifications, puis les plugins. Chaque étape a été validée avant de passer à la suivante."

---

### Partie 6 : Validation du Harnais Corrigé (2 min)

#### Basculer sur api-evolution-fix

```bash
git checkout api-evolution-fix
```

#### Exécuter les tests

```bash
npm run test:e2e:step-by-step
```

**Résultat attendu :**

```
✓ should execute sequence step by step
✅ Comparison passed: 3/3 products matched
```

**Dire :**
> "Le harnais fonctionne à nouveau ! L'IA a :"
>
> - Analysé les nouvelles structures JSON
> - Mis à jour les spécifications
> - Corrigé les plugins d'extraction
> - Corrigé le plugin de comparaison

---

### Partie 6b : Détection d'Erreur de Prix en v2 (1 min)

#### Basculer sur api-evolution-matching-error

```bash
git checkout api-evolution-matching-error
```

#### Exécuter les tests

```bash
npm run test:e2e:step-by-step
```

**Résultat attendu :**

```
✕ should execute sequence step by step
❌ Product/Offer comparison failed: 0 missing, 1 mismatches
```

**Dire :**
> "Même après correction de l'évolution de format, le harnais détecte un changement de prix ! Cela montre que le harnais ne valide pas seulement la structure, mais aussi la cohérence des données métier."

---

### Partie 7 : Conclusion (1 min)

**Dire :**
> "En résumé, l'approche DSL-Based avec workflows structurés nous permet de :"
>
> - ✅ Maintenir un harnais de test déterministe
> - ✅ Laisser l'IA gérer les évolutions d'API
> - ✅ Garantir la non-régression malgré les changements
> - ✅ Détecter aussi bien les erreurs de format que de prix
> - ✅ Tracer chaque correction via Git

**Points clés :**

| Avantage | Valeur |
|----------|--------|
| Traçabilité | Chaque correction versionnée |
| Reproductibilité | Pas de live coding risqué |
| Validation | Tests à chaque étape |
| CI/CD | Continue de fonctionner |

---

## 🆘 Backup : Si problème

### Les tests ne passent pas sur main

```bash
git checkout main
npm run build
npm run test:e2e:step-by-step
```

### Git en désordre

```bash
# Réinitialiser
git checkout main
git clean -fd
```

### Pas de temps pour la démo

Montrer les slides avec captures d'écran des résultats Git.

---

## 📁 Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `src/test/e2e/plugins/comparison.plugin.ts` | Plugin de comparaison |
| `src/test/e2e/plugins/legacy-extract.plugin.ts` | Plugin extraction Legacy |
| `src/test/e2e/plugins/actual-extract.plugin.ts` | Plugin extraction Actual |
| `mocks/sequences/products-to-offers-comparison/*.json` | Mocks v1 et v2 |
| `prompts/usecases/products-to-offers/specs/*.md` | Spécifications |

---

## ⏱️ Timing Détaillé

| Partie | Durée | Action |
|--------|-------|--------|
| Introduction | 1 min | Slides |
| État initial main | 2 min | `git checkout main`, tests passent ✅ |
| Erreur de prix matching-error | 1 min | `git checkout matching-error`, tests échouent ❌ |
| Évolution api-evolution | 1 min | `git checkout api-evolution`, voir changements |
| Échec | 1 min | Tests échouent ❌ |
| Correction IA | 4 min | `git log`, montrer commits |
| Validation api-evolution-fix | 2 min | Tests passent ✅ |
| Erreur prix v2 api-evolution-matching-error | 1 min | `git checkout api-evolution-matching-error`, tests échouent ❌ |
| Conclusion | 1 min | Slides |
| Questions | reste | - |

---

## 🎯 Points clés à mettre en avant

### Pulse-coding vs Vibe-coding

- **Pulse-coding** : Approche structurée avec checkpoints (notre workflow)
- **Vibe-coding** : Laisser l'IA improviser sans cadre

L'analogie Jazz illustre parfaitement cette approche.

### Analogie Jazz

- **Pulsation** : Les checkpoints du workflow (comme le batteur/contrebasse)
- **Improvisation** : La liberté surveillée dans les tâches de l'IA
- **Résultat** : L'IA peut créer tant qu'elle respecte la pulsation
