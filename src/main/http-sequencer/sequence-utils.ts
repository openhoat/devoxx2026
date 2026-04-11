import type { HttpSequence, HttpSequenceStep } from './types'

/**
 * Configuration de filtrage pour les séquences
 */
export type SequenceFilterConfig = {
  [filterKey: string]: {
    includeSteps: string[] | ((stepName: string) => boolean)
    description?: string
  }
}

/**
 * Interface pour les étapes avec index original préservé
 */
export type StepWithOriginalIndex = HttpSequenceStep & { originalIndex: number }

/**
 * Filtre une séquence HTTP selon un mode de filtrage et une configuration
 * IMPORTANT: Préserve les indices originaux des étapes pour maintenir la cohérence avec les noms de fichiers mocks
 *
 * @param sequence - La séquence HTTP à filtrer
 * @param filterMode - Le mode de filtrage (clé dans filterConfig)
 * @param filterConfig - Configuration des règles de filtrage
 * @returns Séquence filtrée avec indices originaux préservés
 */
export const filterSequenceByMode = (
  sequence: HttpSequence,
  filterMode?: string,
  filterConfig: SequenceFilterConfig = {},
): HttpSequence => {
  if (!filterMode) {
    return sequence
  }

  const config = filterConfig[filterMode.toLowerCase()]
  if (!config) {
    // Mode non configuré : retourner la séquence complète
    return sequence
  }

  // Créer un tableau avec des slots vides pour préserver les indices originaux
  const filteredSteps = sequence.steps
    .map((step, originalIndex) => {
      const shouldInclude = (() => {
        if (Array.isArray(config.includeSteps)) {
          return config.includeSteps.includes(step.name)
        }
        if (typeof config.includeSteps === 'function') {
          return config.includeSteps(step.name)
        }
        return false
      })()

      // Préserver l'étape avec son index original ou retourner null pour les étapes filtrées
      return shouldInclude ? { ...step, originalIndex } : null
    })
    .filter((step): step is StepWithOriginalIndex => step !== null)

  return {
    ...sequence,
    steps: filteredSteps,
  }
}

/**
 * Configuration des noms d'étapes pour les validations
 */
export type ValidationStepNames = {
  legacy: string
  actual: string
}

/**
 * Détermine les validations à effectuer selon le mode de filtrage
 *
 * @param filterConfig - Configuration des règles de filtrage
 * @param validationStepNames - Noms des étapes à valider (obligatoire)
 * @param filterMode - Le mode de filtrage (optionnel)
 * @returns Configuration des validations à effectuer
 */
export const getExpectedValidationsByMode = (
  filterConfig: SequenceFilterConfig,
  validationStepNames: ValidationStepNames,
  filterMode?: string,
) => {
  const stepNames = {
    legacy: validationStepNames.legacy,
    actual: validationStepNames.actual,
  }

  if (!filterMode) {
    return {
      shouldValidateLegacy: true,
      shouldValidateActual: true,
      description: 'séquence complète',
    }
  }

  const config = filterConfig[filterMode.toLowerCase()]
  if (!config) {
    return {
      shouldValidateLegacy: true,
      shouldValidateActual: true,
      description: 'séquence complète',
    }
  }

  // Déduction des validations basée sur les étapes incluses
  const includeSteps = Array.isArray(config.includeSteps)
    ? config.includeSteps
    : [] // Pour les fonctions, on ne peut pas déduire facilement

  const shouldValidateLegacy = includeSteps.includes(stepNames.legacy)
  const shouldValidateActual = includeSteps.includes(stepNames.actual)

  return {
    shouldValidateLegacy,
    shouldValidateActual,
    description: config.description || filterMode,
  }
}
