# Exigences de qualité du code JavaScript

## Exigences de qualité du code

Le code source généré doit respecter les règles suivantes :

- Compiler
- Respecter les règles de linting et de formattage configurées dans **biome**.

### Validation

**OBLIGATOIRE** : Toujours vérifier la qualité du code avant de considérer le code comme complet.

**Qualité du code** :

Le processus de vérification est exposé via les scripts **npm** `build` et `qa`.

```shell
npm run build
npm run qa
```

**Processus obligatoire** :

1. **Vérifier qu'il n'y a pas d'erreurs** :
    - Vérifier la compilation
    - Vérifier le linting
    - Vérifier le formattage
2. **Si des erreurs apparaissent** :
    - Essayer d'abord la correction automatique avec `npm run qa:biome:fix`
    - Si des erreurs subsistent, les corriger manuellement
    - **Obligatoirement** revérifier avant de livrer le code en reprenant au point 1
3. **AUCUN code ne doit être considéré comme terminé** sans validation biome réussie

**Correction automatique disponible** :

```shell
npm run qa:biome:fix
npm run qa:markdown:fix
```

**Note importante** : Cette étape de validation est **NON NÉGOCIABLE** et doit être exécutée pour chaque modification de
code JavaScript/TypeScript.
