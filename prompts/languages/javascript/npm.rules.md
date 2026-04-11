# NPM et Wireit

Ce document définit les règles pour la gestion des dépendances npm et la configuration de Wireit.

## Gestion du package.json

### Structure du package.json

Le fichier `package.json` doit être organisé de manière cohérente et triée alphabétiquement.

#### Ordre des propriétés principales

```json
{
  "name": "mon-projet",
  "version": "1.0.0",
  "description": "Description du projet",
  "license": "MIT",
  "type": "commonjs",
  "engines": {
    "node": ">=22",
    "npm": ">=10"
  },
  "volta": { ... },
  "scripts": { ... },
  "dependencies": { ... },
  "devDependencies": { ... },
  "wireit": { ... }
}
```

#### Tri alphabétique

**OBLIGATOIRE** : Toutes les sections de type objet doivent être triées alphabétiquement :

- `scripts` : tri alphabétique par nom de script
- `dependencies` : tri alphabétique par nom de package
- `devDependencies` : tri alphabétique par nom de package
- `wireit` : tri alphabétique par nom de script Wireit

### Convention de nommage des scripts

#### Format recommandé

Utiliser le format `catégorie:action` pour les scripts :

```
build                → Script principal
build:clinerules    → Étape spécifique
build:transpile      → Étape spécifique
qa                   → Script principal
qa:biome            → Étape spécifique
qa:markdown          → Étape spécifique
test                 → Script principal
test:unit            → Étape spécifique
test:e2e             → Étape spécifique
```

#### Scripts standards recommandés

```json
{
  "scripts": {
    "build": "wireit",
    "clean": "wireit",
    "qa": "wireit",
    "qa:fix": "wireit",
    "test": "wireit",
    "validate": "wireit"
  }
}
```

## Configuration Wireit

Wireit permet de mettre en cache les résultats des scripts npm et de gérer les dépendances entre scripts.

### Structure d'une configuration Wireit

```json
{
  "wireit": {
    "nom-du-script": {
      "command": "commande à exécuter",
      "dependencies": ["autres-scripts"],
      "files": ["fichiers-entrée"],
      "output": ["fichiers-sortie"],
      "clean": "if-file-deleted"
    }
  }
}
```

### Propriétés Wireit

#### `command`

Commande à exécuter. Si absent, le script est un agrégateur de dépendances.

```json
{
  "build:transpile": {
    "command": "tsc",
    "files": ["src/**/*.ts", "tsconfig.json"],
    "output": ["lib/**"]
  }
}
```

#### `dependencies`

Liste des scripts Wireit qui doivent s'exécuter avant celui-ci.

```json
{
  "build": {
    "dependencies": [
      "build:clinerules",
      "build:transpile"
    ]
  }
}
```

#### `files`

Liste des fichiers d'entrée (observés pour l'invalidation du cache).

```json
{
  "qa:biome": {
    "command": "biome check .",
    "files": ["src/**", "*.json", "*.ts", "*.js"],
    "output": []
  }
}
```

#### `output`

Liste des fichiers de sortie (mis en cache).

```json
{
  "build:clinerules": {
    "command": "node scripts/build-clinerules.mjs",
    "files": ["prompts/**/*"],
    "output": [".clinerules/**/*"]
  }
}
```

#### `clean`

Stratégie de nettoyage :

- `"if-file-deleted"` : Supprime les fichiers de sortie si un fichier d'entrée est supprimé
- `true` : Nettoie toujours avant l'exécution

```json
{
  "build:transpile": {
    "command": "tsc",
    "files": ["src/**/*.ts"],
    "output": ["lib/**"],
    "clean": "if-file-deleted"
  }
}
```

#### `env`

Variables d'environnement pour le script.

```json
{
  "test:quiet": {
    "command": "jest",
    "env": {
      "VERBOSE": "false"
    },
    "files": ["src/**", "*.json"]
  }
}
```

### Scripts Wireit vs Scripts npm classiques

| Critère | Script npm classique | Script Wireit |
|---------|---------------------|---------------|
| Mise en cache | ❌ Non | ✅ Oui |
| Dépendances | ❌ Chaînées manuellement | ✅ Graphe automatique |
| Invalidations | ❌ Non | ✅ Par fichiers |
| Parallélisation | ❌ Manuelle | ✅ Automatique |

**Règle** : Utiliser Wireit pour les scripts de build, test, et validation.

### Exemple complet de configuration Wireit

```json
{
  "wireit": {
    "build": {
      "dependencies": ["build:clinerules", "build:transpile"]
    },
    "build:clinerules": {
      "command": "node scripts/build-clinerules.mjs",
      "files": ["prompts/**/*"],
      "output": [".clinerules/**/*"]
    },
    "build:transpile": {
      "command": "tsc",
      "files": ["src/**/*.ts", "*.json"],
      "output": ["lib/**"],
      "clean": "if-file-deleted"
    },
    "qa": {
      "dependencies": ["qa:biome", "qa:markdown"]
    },
    "qa:biome": {
      "command": "biome check .",
      "files": ["src/**", "*.json", "*.ts", "*.js"],
      "output": []
    },
    "qa:markdown": {
      "command": "markdownlint-cli2",
      "files": [".markdownlint-cli2.jsonc", "doc/**/*.md"],
      "output": []
    },
    "test": {
      "command": "jest",
      "files": ["src/**", "*.json", "*.ts", "*.yaml"]
    },
    "validate": {
      "dependencies": ["build", "qa", "test"]
    }
  }
}
```

## Scripts de nettoyage

### Scripts standards

```json
{
  "scripts": {
    "clean": "wireit",
    "clean:dist": "wireit",
    "clean:all": "wireit",
    "clean:npm": "wireit",
    "clean:wireit": "rimraf -v .wireit"
  },
  "wireit": {
    "clean": {
      "dependencies": ["clean:dist", "clean:ts"]
    },
    "clean:dist": {
      "command": "rimraf -v dist"
    },
    "clean:all": {
      "dependencies": ["clean", "clean:npm", "clean:wireit"]
    },
    "clean:npm": {
      "command": "rimraf -v node_modules package-lock.json",
      "dependencies": ["clean:npm:cache"]
    },
    "clean:npm:cache": {
      "command": "rimraf -v -g '**/.npm'"
    }
  }
}
```

## Bonnes pratiques

### Gestion des versions

**OBLIGATOIRE** : Utiliser des versions exactes (sans `^` ou `~`).

```json
{
  "dependencies": {
    "axios": "1.15.0",
    "yaml": "2.8.1"
  }
}
```

### Volta

Recommander l'utilisation de Volta pour fixer les versions de Node et npm :

```json
{
  "volta": {
    "node": "22.15.0",
    "npm": "11.3.0"
  }
}
```

### Organisation des dépendances

- `dependencies` : Dépendances de production
- `devDependencies` : Dépendances de développement (test, build, lint)

## Validation

Avant de considérer les modifications de `package.json` comme terminées :

1. Vérifier que `npm run build` passe
2. Vérifier que `npm run qa` passe
3. Vérifier que `npm test` passe
4. Vérifier le tri alphabétique des propriétés
