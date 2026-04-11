# Analyse de fichiers JSON

Tu disposes de l'outil MCP `json-tools` qui permet d'analyser efficacement les fichiers JSON en utilisant JSON Path.

## Règle fondamentale : Utiliser systématiquement json-tools

**OBLIGATOIRE** : Toujours utiliser l'outil MCP `json-tools` pour analyser les fichiers JSON, sauf dans les cas
explicitement mentionnés ci-dessous.

## Quand utiliser json-tools

### Cas obligatoires (toujours utiliser json-tools)

- Fichiers JSON de plus de 5 Ko
- Fichiers avec structures imbriquées profondes (> 3 niveaux)
- Recherche d'éléments spécifiques dans un grand fichier
- Analyse partielle de fichiers complexes
- Validation de structure sans lire tout le contenu

### Cas optionnels (préférer json-tools)

- Fichiers JSON de moins de 5 Ko
- Fichiers avec structures modérément complexes
- Quand seul quelques éléments sont nécessaires

### Cas où read_file est acceptable

- Fichiers JSON de moins de 5 Ko
- Fichiers avec structure simple et plate
- Quand l'intégralité du contenu est nécessaire

## Méthodologie décisionnelle

1. **Analyser la taille** : Vérifier la taille du fichier (utiliser `ls -lh` ou équivalent)
2. **Évaluer la structure** : Complexité et profondeur d'imbrication
3. **Définir l'objectif** : Recherche spécifique vs analyse complète
4. **Choisir l'outil** : json-tools vs read_file selon les critères

## Règles de validation strictes

### Règle 1 : Vérification obligatoire avant l'analyse

**AVANT TOUTE ANALYSE** : Vérifier la taille du fichier JSON :

- Si > 5 Ko → DOIT utiliser `json-tools`
- Si ≤ 5 Ko → Peut utiliser `json-tools` ou `read_file` (mais `json-tools` préférable pour cohérence)

### Règle 2 : Respect de l'outil sélectionné

❌ **INTERDIT** : Utiliser `read_file` pour des fichiers > 5 Ko
❌ **INTERDIT** : Ignorer `json-tools` par habitude
✅ **OBLIGATOIRE** : Appliquer la méthode décrite dans les cas obligatoires

## Exemples d'utilisation

### Recherche d'éléments spécifiques

```jsonpath
// Recherche de toutes les propositions dans un fichier complexe
$.proposals[*].price
```

### Analyse structurelle

```jsonpath
// Vérification de la structure racine
$.[*]
```

### Filtres conditionnels

```jsonpath
// Recherche d'éléments spécifiques
$.data[?(@.type == 'proposal' && @.price > 100)]
```

## Erreurs à éviter

❌ **NE PAS** utiliser read_file pour de grands fichiers JSON
❌ **NE PAS** essayer de parser manuellement le JSON
❌ **NE PAS** ignorer json-tools "par habitude"
❌ **NE PAS** analyser des fichiers > 5 Ko avec read_file

✅ **TOUJOURS** considérer json-tools en premier
✅ **UTILISER** JSON Path pour des requêtes ciblées
✅ **PRÉFÉRER** l'efficacité à la simplicité apparente
✅ **VALIDER** la taille du fichier avant l'analyse

## Bonnes pratiques

1. **Vérification préalable** : Toujours vérifier la taille avant d'analyser
2. **Documentation** : Indiquer l'outil utilisé et la raison du choix
3. **Audit** : Vérifier que tous les fichiers > 5 Ko utilisent `json-tools`
4. **Automatisation** : Intégrer la vérification dans les processus d'analyse
