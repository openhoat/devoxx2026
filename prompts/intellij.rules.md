# Intégration de l'IDE IntelliJ

L'IDE IntelliJ propose des fonctionnalités avancées accessibles via l'outil MCP `intellij`.

Utiliser TOUJOURS cet outil pour maximiser l'efficacité des analyses et modifications du projet.

## 🏃‍♂️ __Exécution__

- __`get_run_configurations`__ : Liste toutes les configurations d'exécution (Jest, Node.js, npm scripts)
- __`execute_run_configuration`__ : Exécute une configuration spécifique avec timeout
- __`execute_terminal_command`__ : Exécute des commandes shell dans le terminal IntelliJ

## 🔍 __Recherche et Navigation__

- __`find_files_by_name_keyword`__ : Recherche ultra-rapide par nom de fichier (préférer aux outils CLI)
- __`find_files_by_glob`__ : Recherche par patterns (ex: `**/*.ts`, `*.test.js`)
- __`search_in_files_by_text`__ : Recherche textuelle dans tout le projet
- __`search_in_files_by_regex`__ : Recherche par expressions régulières
- __`list_directory_tree`__ : Affichage arborescence (équivalent `tree`)

## 🧠 __Analyse de Code__

- __`get_symbol_info`__ : Documentation détaillée d'un symbole (équivalent Quick Documentation)
- __`get_file_problems`__ : Analyse erreurs/warnings via inspections IntelliJ
  - __Paramètres__ :
    - `filePath` : Chemin du fichier à analyser
    - `projectPath` : Chemin du projet
    - `errorsOnly` : `true` pour erreurs uniquement, `false` pour erreurs + warnings
  - __Limitation connue__ : `errorsOnly: false` peut échouer si des warnings n'ont pas de description
  - __Usage recommandé__ : Utiliser `errorsOnly: true` pour détecter les erreurs bloquantes, puis vérifier les warnings dans l'IDE si nécessaire
- __`get_project_dependencies`__ : Liste des dépendances du projet
- __`get_project_modules`__ : Liste des modules avec leurs types
- __`build_project`__ : Compile le projet et retourne les erreurs de build

## 📝 __Édition et Refactoring__

- __`get_file_text_by_path`__ : Lecture de fichier avec options de troncature
- __`replace_text_in_file`__ : Remplacement ciblé (support regex)
- __`rename_refactoring`__ : Renommage intelligent dans tout le projet (OBLIGATOIRE pour les symboles)
- __`reformat_file`__ : Application du formatage selon les règles du projet
- __`create_new_file`__ : Création de fichiers avec contenu
- __`open_file_in_editor`__ : Ouverture dans l'éditeur

## ✨ __Avantages Critiques__

- __Performance__ : Utilise les index IntelliJ (1000x plus rapide que grep/find)
- __Intelligence__ : Comprend la sémantique du code et les dépendances
- __Sécurité__ : Le refactoring évite les erreurs de casse/scope
- __Intégration__ : Synchronisé avec l'état réel du projet dans l'IDE

## 🔄 __Workflow de Correction des Erreurs__

### Workflow en 4 étapes

1. __Build initial__ : Utiliser `build_project` pour identifier les fichiers en erreur
2. __Analyse détaillée__ : Utiliser `get_file_problems` pour chaque fichier problématique
3. __Correction ciblée__ : Corriger les erreurs dans l'ordre de priorité (erreurs > warnings)
4. __Validation finale__ : Relancer `build_project` pour confirmer

### Ordre de priorité des corrections

1. __Erreurs de compilation__ : Bloquantes, à corriger en premier
2. __Erreurs de type__ : TypeScript/JavaScript strict
3. __Warnings de linting__ : Qualité du code
4. __Warnings de formatage__ : Style et cohérence

### Exemple de workflow

```markdown
1. build_project → 3 fichiers en erreur
2. get_file_problems(file1.ts) → 5 erreurs, 2 warnings
3. Corriger les 5 erreurs dans file1.ts
4. get_file_problems(file1.ts) → 0 erreurs, 2 warnings
5. get_file_problems(file2.ts) → 2 erreurs, 0 warnings
6. Corriger les 2 erreurs dans file2.ts
7. build_project → 0 erreurs
```

## 📋 __Règles d'Usage__

### Pour le développement

1. __OBLIGATOIRE__ : Utiliser `rename_refactoring` pour renommer des symboles (jamais de simple replace).
2. __OBLIGATOIRE__ : Utiliser `get_file_problems` APRÈS chaque modification de fichier TypeScript.
3. __OBLIGATOIRE__ : Utiliser `build_project` APRÈS les modifications structurales (nouveaux fichiers, refactoring).
4. __RECOMMANDÉ__ : Utiliser `find_files_by_name_keyword` pour la recherche de fichiers (plus rapide que CLI).
5. __RECOMMANDÉ__ : Utiliser `get_project_dependencies` pour vérifier les versions des packages.

### Pour la qualité du code

1. __AVANT__ de considérer une tâche terminée :
   - Exécuter `build_project` pour valider la compilation
   - Exécuter `get_file_problems` sur chaque fichier modifié
   - Vérifier qu'il n'y a que des warnings (pas d'erreurs)

2. __APRÈS__ une modification de code :
   - `reformat_file` si le formatage n'est pas appliqué automatiquement
   - `get_file_problems` pour détecter les nouveaux problèmes

3. __PENDANT__ le refactoring :
   - Toujours utiliser `rename_refactoring` pour les symboles
   - Utiliser `get_symbol_info` pour comprendre les dépendances
   - Valider avec `build_project` avant de continuer

## 🛠️ __Outils Sous-utilisés à Exploiter__

### `get_all_open_file_paths`

Retourne les fichiers actuellement ouverts dans l'éditeur. Utile pour :

- Savoir quels fichiers sont en cours d'édition
- Éviter de modifier un fichier non pertinent

### `get_project_dependencies`

Liste toutes les dépendances du projet. Utile pour :

- Vérifier les versions installées
- Identifier les packages obsolètes
- Valider les dépendances de développement

### `create_new_file`

Crée un fichier avec contenu initial. Utile pour :

- Créer des fichiers de configuration
- Générer des templates
- Initialiser des modules

## 📊 __Exemples d'Utilisation__

### Corriger une erreur de type

```markdown
1. get_file_problems("src/main/types.ts", { errorsOnly: true })
   → Error: Property 'id' is missing in type 'User'
2. Lire le fichier et identifier le problème
3. Corriger en ajoutant la propriété manquante
4. get_file_problems("src/main/types.ts")
   → 0 errors, 0 warnings
```

### Refactoring de nom

```markdown
1. rename_refactoring("src/main/types.ts", "OldName", "NewName")
   → Renomme le symbole dans tout le projet
2. build_project()
   → Valide que le refactoring n'a pas cassé le build
```

### Ajout d'une nouvelle fonctionnalité

```markdown
1. create_new_file("src/main/new-feature.ts", content)
2. get_file_problems("src/main/new-feature.ts")
   → Détecte les erreurs de type ou import
3. Corriger les problèmes détectés
4. build_project()
   → Valide l'intégration dans le projet
```

## ⚠️ __Pièges à Éviter__

1. __NE PAS__ utiliser de simples remplacements de texte pour renommer des symboles
2. __NE PAS__ ignorer les warnings de `get_file_problems` sans raison valable
3. __NE PAS__ modifier plusieurs fichiers sans valider avec `build_project`
4. __NE PAS__ oublier de passer le paramètre `projectPath` aux outils IntelliJ
