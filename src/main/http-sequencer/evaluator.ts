import { JSONPath } from 'jsonpath-plus'
import type { Logger } from 'pino'
import type { SequenceParameters } from './types'

export const evaluateValue = (
  value: string,
  store: Record<string, unknown>,
  defaultValue: unknown = undefined,
  options?: { logger?: Logger },
) => {
  const { logger } = options ?? {}
  if (!value.startsWith('$')) {
    return defaultValue
  }
  const refValue = JSONPath({ path: value, json: store, wrap: false })
  logger?.trace(`Found value from ${value}: ${refValue}`)
  return refValue
}

export const evaluateTemplate = (
  template: string,
  store: Record<string, unknown>,
  parameters: SequenceParameters = {},
  logger?: Logger,
): unknown => {
  // Si c'est juste un JSONPath, utiliser la fonction existante
  if (template.startsWith('$.') && !template.includes('{{')) {
    const result = evaluateValue(template, store, template, { logger })
    return String(result)
  }

  // Si c'est juste un paramètre simple
  if (template.match(/^\{\{[^}]+}}$/)) {
    const paramName = template.slice(2, -2)
    const paramValue = parameters[paramName]
    if (paramValue !== undefined) {
      logger?.trace(`🔧 Parameter ${paramName} resolved to: ${paramValue}`)
      const stringValue = String(paramValue)

      // Détecter et parser les strings JSON
      if (stringValue.startsWith('[') || stringValue.startsWith('{')) {
        try {
          const parsed = JSON.parse(stringValue)
          logger?.trace(
            `🔧 Parameter ${paramName} parsed as JSON: ${JSON.stringify(parsed)}`,
          )
          return parsed
        } catch {
          // Si le parsing échoue, retourner la string telle quelle
          logger?.trace(
            `🔧 Parameter ${paramName} is not valid JSON, keeping as string`,
          )
        }
      }

      return stringValue
    }
    logger?.warn(`❌ Parameter ${paramName} not found, using original template`)
    return template
  }

  // Traitement des templates complexes avec combinaison de paramètres et JSONPath
  let result = template

  // Remplacer les paramètres {{paramName}}
  result = result.replace(/\{\{([^}]+)}}/g, (match, paramName) => {
    const paramValue = parameters[paramName]
    if (paramValue !== undefined) {
      logger?.trace(`Replacing ${match} with ${paramValue}`)
      return String(paramValue)
    }
    logger?.warn(`Parameter ${paramName} not found, keeping ${match}`)
    return match
  })

  // Remplacer les expressions JSONPath $.path
  result = result.replace(/\$\.\S+/g, (match) => {
    const jsonPathValue = JSONPath({ path: match, json: store, wrap: false })
    if (jsonPathValue !== undefined) {
      logger?.trace(`JSONPath ${match} resolved to: ${jsonPathValue}`)
      return String(jsonPathValue)
    }
    logger?.warn(`JSONPath ${match} not found, keeping original`)
    return match
  })

  return result
}
