import axios from 'axios'
import type { Logger } from 'pino'
import { normalizeEndpoint } from './url'

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

export interface ApiRequest {
  method: HttpMethod
  path: string
  basicAuth?: {
    username: string
    password: string
  }
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, unknown>
  timeout?: number
  proxy?: {
    host: string
    port: number
    auth?: {
      username: string
      password: string
    }
  }
  suppressErrorLogging?: boolean
}

export interface ApiResponse<T = unknown> {
  status: number
  data: T
}

/**
 * Interface pour l'intercepteur HTTP
 */
export interface HttpInterceptor {
  /**
   * Active l'intercepteur HTTP
   */
  enable(): void

  /**
   * Désactive l'intercepteur HTTP
   */
  disable(): void

  /**
   * Vérifie si l'intercepteur est activé
   */
  isActive(): boolean

  /**
   * Intercepte une requête et retourne un mock si disponible
   */
  interceptRequest(
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
  } | null>
}

export const sendRequest = async <T = unknown>(
  req: ApiRequest,
  logger: Logger,
  options?: {
    baseUrl?: string
    interceptor?: HttpInterceptor
    store?: unknown
  },
): Promise<ApiResponse<T>> => {
  const startTime = Date.now()
  // Normaliser l'URL pour éviter les doubles slashes
  const baseUrl = options?.baseUrl || ''
  const normalizedPath = normalizeEndpoint(req.path)
  const fullUrl = `${baseUrl}${normalizedPath}`

  logger.debug(`🔄 HTTP ${req.method} ${fullUrl}`)
  logger.trace(
    {
      method: req.method,
      url: fullUrl,
      headers: req.headers,
      params: req.params,
      body: req.body,
      timeout: req.timeout ?? 30 * 1000,
    },
    'HTTP Request details',
  )

  // Tentative d'interception avec un mock si intercepteur fourni
  const interceptor = options?.interceptor
  if (interceptor) {
    logger.trace(`🔍 Tentative d'interception pour ${req.method} ${fullUrl}`)

    if (interceptor.isActive()) {
      const interceptConfig = {
        method: req.method,
        url: fullUrl, // URL complète pour l'interception
        params: req.params,
        headers: req.headers || {},
        data: req.body || null,
      }

      const interceptedResponse = await interceptor.interceptRequest(
        interceptConfig,
        options?.store,
      )
      logger.debug(
        `🔍 Résultat interception: ${interceptedResponse ? 'TROUVÉ' : 'NON TROUVÉ'}`,
      )
      if (interceptedResponse) {
        const duration = Date.now() - startTime
        logger.debug(
          `📁 HTTP ${req.method} ${fullUrl} → ${interceptedResponse.status} (${duration}ms) [MOCK]`,
        )
        return {
          status: interceptedResponse.status,
          data: interceptedResponse.data as T,
        }
      }
    }
  }

  // Configuration axios pour l'appel réel
  const axiosConfig = {
    auth: req.basicAuth,
    baseURL: options?.baseUrl,
    method: req.method,
    params: req.params,
    url: req.path, // URL relative pour axios
    headers: req.headers || {},
    data: req.body || null,
    validateStatus: () => true,
    timeout: req.timeout ?? 30 * 1000,
    proxy: req.proxy,
  }

  try {
    const { data, status } = await axios(axiosConfig)

    const duration = Date.now() - startTime
    const statusIcon =
      status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️'

    logger.debug(
      `${statusIcon} HTTP ${req.method} ${fullUrl} → ${status} (${duration}ms)`,
    )

    // Log des erreurs HTTP avec détails (sauf si supprimé)
    if (status >= 400 && !req.suppressErrorLogging) {
      logger.error(
        {
          method: req.method,
          url: fullUrl,
          status,
          statusText: getStatusText(status),
          responseBody: data,
          duration,
        },
        `HTTP Error ${status}: ${getStatusText(status)}`,
      )
    } else {
      logger.debug(
        {
          status,
          responseBody: data,
          duration,
        },
        'HTTP Response details',
      )
    }

    return { status, data }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(
      {
        method: req.method,
        url: fullUrl,
        error: error instanceof Error ? error.message : String(error),
        duration,
      },
      `HTTP Request failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}

const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  return statusTexts[status] || `HTTP ${status}`
}

// Re-export the old function name for backward compatibility
export const sendHttpRequest = sendRequest

// Legacy types for backward compatibility
export type { ApiRequest as LegacyApiRequest, ApiResponse as LegacyApiResponse }
