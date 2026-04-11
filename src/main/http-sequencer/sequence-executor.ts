import type { Logger } from 'pino'
import { createLogger } from '../util/logger'
import { evaluateTemplate } from './evaluator'
import { loadMock, type MockableRequest } from './mock-manager'
import type {
  ApiRequest,
  ApiResponse,
  Conversation,
  HttpInterceptor,
  HttpSequence,
  HttpSequenceResult,
  HttpSequenceState,
  HttpSequenceStep,
  JsonRecord,
  Plugin,
  Plugins,
  SequenceErrorContext,
  SequenceOptions,
} from './types'
import { SequenceError } from './types'

/**
 * Execute a sequence of HTTP steps
 */
export async function executeSequence<T extends JsonRecord = JsonRecord>(
  sequence: HttpSequence,
  options: SequenceOptions<T> = {},
): Promise<HttpSequenceResult<T>> {
  const logger = createLogger(`sequence:${sequence.name}`)

  logger.info(`🚀 Starting sequence: ${sequence.name}`)
  logger.debug(`Steps: ${sequence.steps.length}`)

  // Initialize state and conversation
  const conversation: Conversation = options.conversation ?? {}
  const state: HttpSequenceState<T> = options.state ?? {}
  const plugins: Plugins = options.plugins ?? {}
  const parameters = options.parameters ?? {}
  const testCaseIndex = options.testCaseIndex ?? 0

  // Execute each step
  for (let stepIndex = 0; stepIndex < sequence.steps.length; stepIndex++) {
    const step = sequence.steps[stepIndex]
    const stepName = step.name

    logger.info(
      `📍 Step ${stepIndex + 1}/${sequence.steps.length}: ${stepName}`,
    )

    try {
      await executeStep(
        step,
        {
          stepIndex,
          conversation,
          state,
          plugins,
          parameters,
          baseUrl: sequence.baseUrl,
          testCaseIndex,
          sequenceName: sequence.name,
          httpInterceptor: options.httpInterceptor,
        },
        logger,
      )

      logger.debug(`✅ Step ${stepName} completed`)
    } catch (error) {
      const context: SequenceErrorContext = {
        testCaseIndex,
        sequenceName: sequence.name,
        stepName,
        stepIndex,
        originalError:
          error instanceof Error ? error : new Error(String(error)),
      }

      throw SequenceError.fromError(
        error instanceof Error ? error : new Error(String(error)),
        context,
      )
    }
  }

  logger.info(`✅ Sequence ${sequence.name} completed successfully`)

  return {
    conversation,
    state,
    sequenceName: sequence.name,
  }
}

/**
 * Execute a single step
 */
async function executeStep<T extends JsonRecord>(
  step: HttpSequenceStep,
  options: {
    stepIndex: number
    conversation: Conversation
    state: HttpSequenceState<T>
    plugins: Plugins
    parameters: Record<string, string | number | boolean>
    baseUrl?: string
    testCaseIndex: number
    sequenceName: string
    httpInterceptor?: HttpInterceptor
  },
  logger: Logger,
): Promise<void> {
  const {
    stepIndex,
    conversation,
    state,
    plugins,
    parameters,
    baseUrl,
    testCaseIndex,
    sequenceName,
    httpInterceptor,
  } = options

  // Build store for template evaluation
  const store = { conversation, state, parameters } as JsonRecord

  // Execute HTTP request if present
  if (step.request) {
    // Evaluate endpoint
    const evaluatedEndpoint = evaluateTemplate(
      step.request.endpoint,
      store,
      parameters,
      logger,
    ) as string

    const finalEndpoint = baseUrl
      ? `${baseUrl}${evaluatedEndpoint}`
      : evaluatedEndpoint

    // Evaluate headers
    const evaluatedHeaders: Record<string, string> = {}
    if (step.request.headers) {
      for (const [key, value] of Object.entries(step.request.headers)) {
        evaluatedHeaders[key] = evaluateTemplate(
          value,
          store,
          parameters,
          logger,
        ) as string
      }
    }

    // Evaluate payload
    let evaluatedPayload: unknown = step.request.payload
    if (step.request.payload) {
      evaluatedPayload = evaluateTemplate(
        JSON.stringify(step.request.payload),
        store,
        parameters,
        logger,
      )
      // Parse back to object
      if (typeof evaluatedPayload === 'string') {
        try {
          evaluatedPayload = JSON.parse(evaluatedPayload)
        } catch {
          // Keep as string if not valid JSON
        }
      }
    }

    // Build API request
    const apiRequest: ApiRequest = {
      method: step.request.method,
      path: finalEndpoint,
      headers: evaluatedHeaders,
      queryParams: step.request.queryParams,
      payload: evaluatedPayload,
      timeout: step.request.timeout,
    }

    let response: ApiResponse

    // Check if mock mode is enabled
    const mockMode = process.env.MOCK === 'true'

    if (mockMode) {
      // Load mock from file
      const mockableRequest: MockableRequest = {
        method: apiRequest.method,
        endpoint: apiRequest.path,
        queryParams: apiRequest.queryParams,
        headers: apiRequest.headers,
        body: apiRequest.payload,
      }

      const mockEntry = await loadMock(
        testCaseIndex,
        stepIndex,
        step.name,
        sequenceName,
        mockableRequest,
        logger,
      )

      response = mockEntry.response
      logger.info(`📦 Mock loaded for step ${step.name}`)
    } else if (httpInterceptor) {
      // Use custom interceptor
      response = (await httpInterceptor.intercept(apiRequest)) as ApiResponse
    } else {
      // Import dynamically to avoid circular deps
      const { sendHttpRequest } = await import('../util/http.helper')
      // Make real HTTP request
      const httpResponse = await sendHttpRequest(apiRequest, logger)
      // Convert to local ApiResponse format
      response = {
        status: httpResponse.status,
        statusText: '',
        headers: {},
        data: httpResponse.data,
      }
    }

    // Store in conversation
    conversation[step.name] = {
      request: apiRequest,
      response,
      stepIndex,
    }
  }

  // Execute plugins if present
  if (step.plugins && step.plugins.length > 0) {
    const pluginStore = { conversation, state, parameters } as JsonRecord

    for (const pluginConfig of step.plugins) {
      const pluginName = pluginConfig.name
      const pluginType = pluginConfig.type ?? pluginName
      const pluginArgs = pluginConfig.args ?? []

      logger.debug(`🔌 Executing plugin: ${pluginName}`)

      // Find plugin by type or name
      const plugin: Plugin | undefined =
        plugins[pluginType] ?? plugins[pluginName]

      if (!plugin) {
        logger.warn(`⚠️ Plugin not found: ${pluginName} (type: ${pluginType})`)
        continue
      }

      try {
        await plugin({ store: pluginStore, logger }, ...pluginArgs)
      } catch (error) {
        throw SequenceError.fromError(
          error instanceof Error ? error : new Error(String(error)),
          {
            stepName: step.name,
            stepIndex,
            pluginName,
            pluginType,
          },
        )
      }
    }
  }
}

// Re-export types
export type { HttpSequence, HttpSequenceResult, SequenceOptions }
