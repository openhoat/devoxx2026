import type { Logger } from 'pino'
import type { HttpMethod, JsonRecord } from '../util/types'

// Réexporter JsonRecord pour utilisation dans le module
export type { JsonRecord } from '../util/types'

// ApiRequest et ApiResponse locaux pour le module http-sequencer
export type ApiRequest = {
  method: HttpMethod
  path: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  payload?: unknown
  timeout?: number
}

export type ApiResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  data: unknown
}

export type HttpInterceptor = {
  intercept: (request: ApiRequest) => Promise<ApiResponse>
}

export type HttpSequencePlugin = {
  name: string
  type?: string
  args?: string[]
}

export type HttpSequenceStepRequest = {
  method: HttpMethod
  endpoint: string
  basicAuth?: {
    username: string
    password: string
  }
  bearerToken?: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  payload?: unknown
  timeout?: number
  proxy?: {
    host: string
    port: number
    auth?: {
      username: string
      password: string
    }
  }
}

export type HttpSequenceStep = {
  name: string
  request?: HttpSequenceStepRequest
  plugins?: HttpSequencePlugin[]
}

export type HttpSequence = {
  name: string
  baseUrl?: string
  steps: HttpSequenceStep[]
}

export type ConversationStep = {
  request: ApiRequest | null
  response?: ApiResponse
  stepIndex?: number
}

export type Conversation = Record<string, ConversationStep>

export type HttpSequenceState<T extends JsonRecord> = {
  result?: T
} & JsonRecord

export type SequenceParameters = Record<string, string | number | boolean>

export type HttpSequenceResult<T extends JsonRecord = JsonRecord> = {
  conversation: Conversation
  state: HttpSequenceState<T>
  sequenceName?: string
}

export type HealthCheckConfig = {
  enabled: boolean
  timeout?: number
  cacheTTL?: number
  endpoints?: {
    [baseUrl: string]: string | string[]
  }
  defaultEndpoint?: string | string[]
}

export type SequenceOptions<T extends JsonRecord> = Partial<{
  conversation: Conversation
  state: HttpSequenceState<T>
  plugins: Plugins
  parameters: SequenceParameters
  healthCheck: HealthCheckConfig
  testCaseIndex: number
  httpInterceptor: HttpInterceptor
}>

export type SequenceStepOptions<T extends JsonRecord> = Partial<{
  baseUrl: string
  stepIndex: number
  testCaseIndex: number
  sequenceName: string
}> &
  SequenceOptions<T>

export type Plugin = (
  config: { store: JsonRecord; logger: Logger },
  ...args: unknown[]
) => void | Promise<void>

export type Plugins = Record<string, Plugin>

export type JsonPathResult = Record<string, unknown>[]

export type OptionalJsonPathResult = JsonPathResult | undefined

export type SequenceErrorContext = {
  testCaseIndex?: number
  testCaseDescription?: string
  sequenceName?: string
  stepName?: string
  stepIndex?: number
  pluginName?: string
  pluginType?: string
  originalError?: Error
}

export class SequenceError extends Error {
  public readonly context: SequenceErrorContext
  public readonly originalMessage: string

  constructor(message: string, context: SequenceErrorContext = {}) {
    const contextInfo = SequenceError.formatContext(context)
    const fullMessage = contextInfo ? `${contextInfo} - ${message}` : message

    super(fullMessage)
    this.name = 'SequenceError'
    this.originalMessage = message
    this.context = context

    if (context.originalError) {
      this.cause = context.originalError
      this.stack = context.originalError.stack
    }
  }

  private static formatContext(context: SequenceErrorContext): string {
    const parts: string[] = []

    if (context.testCaseIndex !== undefined) {
      parts.push(`Test #${context.testCaseIndex}`)
    }

    if (context.testCaseDescription) {
      parts.push(`(${context.testCaseDescription})`)
    }

    if (context.sequenceName) {
      parts.push(`Séquence "${context.sequenceName}"`)
    }

    if (context.stepName) {
      parts.push(`Étape "${context.stepName}"`)
      if (context.stepIndex !== undefined) {
        parts.push(`[${context.stepIndex}]`)
      }
    }

    if (context.pluginName && context.pluginType) {
      parts.push(`Plugin "${context.pluginName}" (${context.pluginType})`)
    } else if (context.pluginName) {
      parts.push(`Plugin "${context.pluginName}"`)
    } else if (context.pluginType) {
      parts.push(`Plugin type "${context.pluginType}"`)
    }

    return parts.join(' ')
  }

  public static fromError(
    error: Error,
    context: SequenceErrorContext = {},
  ): SequenceError {
    if (error instanceof SequenceError) {
      // Fusionner les contextes
      const mergedContext = { ...error.context, ...context }
      return new SequenceError(error.originalMessage, mergedContext)
    }

    return new SequenceError(error.message, {
      ...context,
      originalError: error,
    })
  }
}
