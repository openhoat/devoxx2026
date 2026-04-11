# Plan de développement - Devoxx 2026

## Objectif

Préparer la démo pour la conférence Devoxx France 2026 : **"Tests end-to-end d'API générés par IA : un retour d'expérience en refonte legacy"**

## Contexte

Ce projet a pour vocation de servir de support à la démo Devoxx France 2026, avec :
- Un domaine e-commerce
- Un échantillon petit
- Une approche pédagogique pour la démo

---

## Cas de test

| Cas | Legacy API | New API | Résultat attendu | Objectif démo |
|-----|------------|---------|------------------|---------------|
| 1 | 3 produits | 3 offres correspondantes | ✅ Match parfait | Cas nominal |
| 2 | 3 produits | 3 offres (prix différent) | ⚠️ Écart prix | Détection incohérence |
| 3 | 3 produits | 2 offres (1 manquante) | ❌ Produit manquant | Détection régression |

---

## Tâches

### Phase 1 : Démonstration fonctionnelle

- [x] **Cas de test avec mocks**
  - [x] Cas 1 : Nominal (existe déjà)
  - [x] Cas 2 : Écart de prix
  - [x] Cas 3 : Produit manquant
  - [x] Fichiers mock JSON pour chaque cas

- [x] **Workflows IA**
  - [x] `specs/legacy-extract-analysis.spec.md`
  - [x] `specs/actual-extract-analysis.spec.md`
  - [x] `specs/comparison-analysis.spec.md`
  - [x] `specs/pivot-format.spec.md`
  - [x] `workflows/ai-first-full.workflow.md`
  - [x] `workflows/plugin-generation.workflow.md`
  - [x] `workflows/plugins-quality.workflow.md`

- [x] **Script de démo**
  - [x] Guide étape par étape
  - [x] Commandes à exécuter
  - [x] Points clés à montrer

### Phase 2 : Slides (après démo fonctionnelle)

- [x] **Diagrammes**
  - [x] Architecture double-run
  - [x] AI-First vs DSL-Based
  - [x] Workflow de génération

- [x] **Enrichissement slides**
  - [x] Diagrammes insérés
  - [x] Section "Live Demo"

### Phase 3 : Optionnel (si temps)

- [ ] Tests unitaires du moteur
- [ ] CI/CD basique

---

## Architecture du projet

```
devoxx2026/
├── slides/                    # Présentation Marp
│   ├── presentation.md
│   └── assets/
├── src/
│   ├── main/                  # Moteur de séquence
│   └── test/
│       └── e2e/               # Tests E2E
│           ├── plugins/
│           └── *.sequence.yml
├── mocks/
│   └── sequences/
│       └── products-to-offers-comparison/
├── prompts/
│   └── usecases/
│       └── products-to-offers/
│           ├── specs/
│           └── workflows/
└── doc/
    └── demo-script.md
```

---

## Domaine de démonstration

**E-commerce simplifié** : Migration d'une API produits legacy vers une API offres moderne.

### Mapping des champs

| Legacy Product | New Offer |
|----------------|-----------|
| `product.id` | `offer.productId` |
| `product.name` | `offer.title` |
| `product.price` | `offer.pricing.total` |
| `product.stock` | `offer.availability.quantity` |

---

## Notes

- Utiliser des mocks pour la démo live (pas d'appel réel aux APIs)
- Garder le code simple mais démonstratif
- Focus sur les défis relevés (mapping, comparaison, détection de régression)

---

*Dernière mise à jour : 11/04/2026*