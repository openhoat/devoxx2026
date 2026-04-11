# Règles à appliquer pour la génération et la validation de fichiers markdown

## Règle principale : Espacement des listes

Les listes à puces (-, *, +) et numérotées (1., 2., etc.) doivent **TOUJOURS** être précédées d'une ligne vide.

### ✅ Format correct - Listes

```markdown
Texte descriptif précédant la liste.

- Premier élément
- Deuxième élément
```

### ❌ Format incorrect - Listes

```markdown
Texte descriptif précédant la liste.

- Premier élément
- Deuxième élément
```

## Méthode de vérification - Listes

Pour analyser un fichier markdown :

1. **Scanner les lignes** commençant par `-`, `*`, `+` ou des chiffres suivis de `.` ou `)`
2. **Vérifier la ligne précédente** : doit être vide
3. **Si la ligne précédente contient du texte → VIOLATION**

## Action requise - Listes

**Pour l'analyse de fichiers existants :**

- Signaler TOUTES les violations avec numéro de ligne
- Proposer le format correct
- Ne jamais considérer l'analyse terminée si des violations existent

**Pour la génération de contenu :**

- Insérer TOUJOURS une ligne vide avant chaque liste

## Cas particuliers - Listes

- Listes après titres, paragraphes, code, tableaux : même règle
- Listes imbriquées : seule la liste parente nécessite une ligne vide

---

## Règle secondaire : Espacement des entêtes

Les entêtes Markdown (`#`, `##`, `###`, etc.) doivent **TOUJOURS** être suivies d'une ligne vide.

### ✅ Format correct - Entêtes

```markdown
# Titre principal

Contenu du titre principal.

## Sous-titre

Contenu du sous-titre.

### Titre de niveau 3

Contenu du niveau 3.
```

### ❌ Format incorrect - Entêtes

```markdown
# Titre principal

Contenu du titre principal.

## Sous-titre

Contenu du sous-titre.

### Titre de niveau 3

Contenu du niveau 3.
```

## Méthode de vérification - Entêtes

Pour analyser un fichier markdown :

1. **Scanner les lignes** commençant par `#` (un ou plusieurs # suivi d'un espace)
2. **Vérifier la ligne suivante** : doit être vide
3. **Si la ligne suivante contient du texte → VIOLATION**

## Action requise - Entêtes

**Pour l'analyse de fichiers existants :**

- Signaler TOUTES les violations avec numéro de ligne
- Proposer le format correct
- Ne jamais considérer l'analyse terminée si des violations existent

**Pour la génération de contenu :**

- Insérer TOUJOURS une ligne vide après chaque entête

## Cas particuliers - Entêtes

- Entêtes suivies de listes : la règle des listes (ligne vide avant) s'applique également
- Blocs de code : la règle s'applique également après les entêtes qui introduisent du code
- Entêtes consécutifs : chaque entête doit être suivie d'une ligne vide

---

## 📏 **Validation et Correction Automatique**

### Scripts de validation markdown

Le projet intègre `markdownlint-cli2` pour valider et corriger automatiquement le formatage des fichiers markdown selon les règles du projet.

#### Scripts disponibles

- **`npm run qa:markdown`** : Valide tous les fichiers markdown selon les règles configurées
- **`npm run qa:markdown:fix`** : Corrige automatiquement les violations détectées

#### Fichiers analysés

- `doc/**/*.md` : Documentation technique et guides
- `prompts/**/*.md` : Règles, workflows et templates
- `README.md` : Documentation principale du projet

#### Intégration avec les règles d'espacement

La configuration markdownlint (`MD022`) applique automatiquement nos règles :

- ✅ **MD022** : Exige une ligne vide avant et après les headers (`#`, `##`, `###`, etc.)
- ✅ **Correspondance parfaite** avec nos règles manuelles d'espacement des entêtes et listes

### Workflow recommandé

1. **Création** : Appliquer manuellement les règles d'espacement (listes et entêtes)
2. **Validation** : `npm run qa:markdown` pour vérifier la conformité
3. **Correction** : `npm run qa:markdown:fix` pour corriger automatiquement les violations
4. **Re-validation** : Confirmer que toutes les violations sont résolues

### Exemples d'utilisation

```bash
# Valider tous les fichiers markdown du projet
npm run qa:markdown

# Corriger automatiquement les violations détectées
npm run qa:markdown:fix

# Intégré dans le workflow de qualité global
npm run qa      # Inclut qa:markdown automatiquement
npm run qa:fix    # Inclut qa:markdown:fix automatiquement
```

### Avantages des scripts markdown

- ✅ **Validation automatisée** : Détecte rapidement toutes les violations de formatage
- ✅ **Correction automatique** : Résout la plupart des problèmes d'espacement sans effort manuel
- ✅ **Cohérence garantie** : Assure que tous les fichiers suivent les mêmes règles
- ✅ **Intégration continue** : Peut être utilisé dans les workflows CI/CD

### Commandes utiles pour le développement

```bash
# Pendant l'écriture de markdown
npm run qa:markdown && npm run qa:markdown:fix

# Validation avant commit
npm run qa

# Correction complète du projet
npm run qa:fix
```

**Note** : Les scripts `qa:markdown` et `qa:markdown:fix` sont vos meilleurs alliés pour maintenir une documentation markdown propre et cohérente dans tout le projet.
