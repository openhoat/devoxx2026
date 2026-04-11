# Mise à jour des dépendances NPM

- Utiliser le bon package manager pour le projet (`npm`, …).

  Il est normalement déclaré dans `package.json`.
- Vérifier que les versions des dépendances sont bien les dernières.

  Exemple :

  ```shell
  npm outdated
  ```

- Si des dépendances ne sont pas à jour, pour chacune d'entre elles :
  - Installer la nouvelle version.
  - Vérifier que le projet n'a pas régressé : `npm run validate`.
  - Si c'est ok, passer à la dépendance suivante.
  - Sinon, revenir à la version actuelle, ignorer cette dépendance, la signaler, et passer à la suivante.
