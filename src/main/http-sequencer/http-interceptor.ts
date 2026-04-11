import type { Logger } from 'pino'
import type { HttpInterceptor } from '../util/http.helper'
import { generateMockId, loadMock, type MockableRequest } from './mock-manager'
import type { JsonRecord } from './types'

/**
 * Intercepteur HTTP pour les mocks
 */
export class MockHttpInterceptor implements HttpInterceptor {
  #isEnabled = false
  readonly #logger: Logger

  constructor(logger: Logger) {
    this.#logger = logger
  }

  /**
   * Active l'intercepteur HTTP
   */
  enable = (): void => {
    this.#isEnabled = true
    this.#logger.debug('🔄 Intercepteur HTTP activé')
  }

  /**
   * Désactive l'intercepteur HTTP
   */
  disable = (): void => {
    this.#isEnabled = false
    this.#logger.debug('⏸️ Intercepteur HTTP désactivé')
  }

  /**
   * Vérifie si l'intercepteur est activé
   */
  isActive = (): boolean => this.#isEnabled

  /**
   * Intercepte une requête et retourne un mock si disponible
   */
  async interceptRequest(
    config: {
      method?: string
      url?: string
      params?: unknown
      headers?: unknown
      data?: unknown
    },
    store?: unknown,
  ): Promise<{
    status: number
    statusText?: string
    headers: Record<string, string>
    data: unknown
  } | null> {
    this.#logger.trace(
      `🔍 Intercepteur: isEnabled=${this.#isEnabled}, url=${config.url}`,
    )

    if (!this.#isEnabled || !config.url) {
      return null
    }

    try {
      // Convertir la requête axios en format mockable
      const mockableRequest: MockableRequest = {
        method: (config.method || 'GET').toUpperCase(),
        endpoint: config.url,
        queryParams: Object.fromEntries(
          Object.entries((config.params as Record<string, unknown>) || {}).map(
            ([key, value]) => [key, String(value)],
          ),
        ),
        headers: (config.headers as Record<string, string>) || {},
        body: config.data,
      }

      // Générer l'identifiant de mock
      const mockId = generateMockId(mockableRequest, this.#logger)
      this.#logger.trace(
        `🔍 Recherche mock ID: ${mockId} pour ${config.method?.toUpperCase()} ${config.url}`,
      )

      // Récupérer les paramètres depuis le store de manière déterministe
      const testCaseIndex =
        store && typeof store === 'object'
          ? ((store as JsonRecord).testCaseIndex as number)
          : undefined

      const stepIndex =
        store && typeof store === 'object'
          ? ((store as JsonRecord).stepIndex as number)
          : undefined

      const stepName =
        store && typeof store === 'object'
          ? ((store as JsonRecord).currentStepName as string)
          : undefined

      const sequenceName =
        store && typeof store === 'object'
          ? ((store as JsonRecord).sequenceName as string)
          : undefined

      // Vérifier que tous les paramètres requis sont disponibles
      if (
        testCaseIndex === undefined ||
        stepIndex === undefined ||
        !stepName ||
        !sequenceName
      ) {
        this.#logger.debug(
          `🚫 Paramètres manquants pour le mock déterministe: testCaseIndex=${testCaseIndex}, stepIndex=${stepIndex}, stepName=${stepName}, sequenceName=${sequenceName}`,
        )
        return null
      }

      this.#logger.trace(
        `🔍 Recherche mock déterministe: testCaseIndex=${testCaseIndex}, stepIndex=${stepIndex}, stepName=${stepName}, sequenceName=${sequenceName}`,
      )

      const mockEntry = await loadMock(
        testCaseIndex,
        stepIndex,
        stepName,
        sequenceName,
        mockableRequest,
        this.#logger,
      )

      this.#logger.trace(
        `📁 Mock intercepté pour ${config.method?.toUpperCase()} ${config.url}: ${mockId}`,
      )

      // Retourner la réponse mockée selon l'interface
      return {
        data: mockEntry.response.data,
        status: mockEntry.response.status,
        statusText: mockEntry.response.statusText || 'OK',
        headers: mockEntry.response.headers || {},
      }
    } catch (error) {
      this.#logger.error(
        `Erreur lors de l'interception de ${config.method?.toUpperCase()} ${config.url}: ${error instanceof Error ? error.message : String(error)}`,
      )
      // En mode mock (intercepteur activé), une erreur de mock est critique et doit terminer le test
      if (this.#isEnabled) {
        throw error
      }
      // En mode live, continuer avec requête réelle
      return null
    }
  }
}
