import type { Logger } from 'pino'
import { createLogger } from '../util/logger'
import type { MockableRequest } from './mock-manager'
import type {
  ApiRequest,
  ApiResponse,
  Conversation,
  HttpSequence,
  HttpSequenceState,
  HttpSequenceStep,
  JsonRecord,
  Plugin,
  Plugins,
} from './types'

/**
 * Result of a single step execution
 */
export interface StepResult<T extends JsonRecord = JsonRecord> {
  stepName: string
  stepIndex: number
  conversation: Conversation
  state: HttpSequenceState<T>
}

/**
 * Options for creating a SequenceRunner
 */
export interface SequenceRunnerOptions<T extends JsonRecord = JsonRecord> {
  plugins: Plugins
  parameters?: Record<string, string | number | boolean>
  testCaseIndex?: number
  baseUrl?: string
  initialConversation?: Conversation
  initialState?: HttpSequenceState<T>
  httpInterceptor?: { intercept: (request: unknown) => Promise<unknown> }
}

/**
 * SequenceRunner allows step-by-step execution of a sequence
 * while maintaining state between steps.
 *
 * @example
 * ```typescript
 * const runner = new SequenceRunner(sequence, { plugins, parameters })
 *
 * // Execute step by step
 * await runner.executeStep('legacy-products')
 * expect(runner.state.legacyProducts).toHaveLength(3)
 *
 * await runner.executeStep('actual-offers')
 * expect(runner.state.actualOffers).toHaveLength(3)
 *
 * await runner.executeStep('comparison')
 * expect(runner.state.comparisonResult.matched).toBe(true)
 * ```
 */
export class SequenceRunner<T extends JsonRecord = JsonRecord> {
  #sequence: HttpSequence
  #conversation: Conversation
  #state: HttpSequenceState<T>
  #plugins: Plugins
  #parameters: Record<string, string | number | boolean>
  #testCaseIndex: number
  #baseUrl?: string
  #httpInterceptor?: { intercept: (request: unknown) => Promise<unknown> }
  #logger: Logger
  #currentStepIndex = 0
  #executedSteps: string[] = []

  constructor(sequence: HttpSequence, options: SequenceRunnerOptions<T>) {
    this.#sequence = sequence
    this.#conversation = options.initialConversation ?? {}
    this.#state = options.initialState ?? {}
    this.#plugins = options.plugins
    this.#parameters = options.parameters ?? {}
    this.#testCaseIndex = options.testCaseIndex ?? 0
    this.#baseUrl = options.baseUrl ?? sequence.baseUrl
    this.#httpInterceptor = options.httpInterceptor
    this.#logger = createLogger(`runner:${sequence.name}`)
  }

  /**
   * Get the current state
   */
  get state(): HttpSequenceState<T> {
    return this.#state
  }

  /**
   * Get the current conversation
   */
  get conversation(): Conversation {
    return this.#conversation
  }

  /**
   * Get the list of executed step names
   */
  get executedSteps(): string[] {
    return [...this.#executedSteps]
  }

  /**
   * Get the current step index
   */
  get currentStepIndex(): number {
    return this.#currentStepIndex
  }

  /**
   * Get total number of steps
   */
  get totalSteps(): number {
    return this.#sequence.steps.length
  }

  /**
   * Check if all steps have been executed
   */
  get isComplete(): boolean {
    return this.#currentStepIndex >= this.#sequence.steps.length
  }

  /**
   * Execute a specific step by name or index
   *
   * @param step - Step name or index (0-based)
   * @returns Step execution result
   */
  async executeStep(step: string | number): Promise<StepResult<T>> {
    const stepIndex =
      typeof step === 'number'
        ? step
        : this.#sequence.steps.findIndex((s) => s.name === step)

    if (stepIndex < 0 || stepIndex >= this.#sequence.steps.length) {
      throw new Error(`Step not found: ${step}`)
    }

    const stepConfig = this.#sequence.steps[stepIndex]
    this.#logger.info(
      `📍 Executing step ${stepIndex + 1}/${this.#sequence.steps.length}: ${stepConfig.name}`,
    )

    // Build store for template evaluation
    const store = {
      conversation: this.#conversation,
      state: this.#state,
      parameters: this.#parameters,
    } as JsonRecord

    // Execute the step (reuse existing logic)
    await this.#executeStepInternal(stepConfig, stepIndex, store)

    // Update state
    this.#currentStepIndex = stepIndex + 1
    this.#executedSteps.push(stepConfig.name)

    this.#logger.debug(`✅ Step ${stepConfig.name} completed`)

    return {
      stepName: stepConfig.name,
      stepIndex,
      conversation: this.#conversation,
      state: this.#state,
    }
  }

  /**
   * Execute the next step in sequence
   */
  async executeNext(): Promise<StepResult<T>> {
    if (this.isComplete) {
      throw new Error('All steps have been executed')
    }
    return this.executeStep(this.#currentStepIndex)
  }

  /**
   * Execute multiple steps in sequence
   *
   * @param fromStep - Starting step (name or index)
   * @param toStep - Ending step (name or index), inclusive
   */
  async executeSteps(
    fromStep?: string | number,
    toStep?: string | number,
  ): Promise<StepResult<T>[]> {
    const startIndex =
      fromStep !== undefined
        ? typeof fromStep === 'number'
          ? fromStep
          : this.#sequence.steps.findIndex((s) => s.name === fromStep)
        : this.#currentStepIndex

    const endIndex =
      toStep !== undefined
        ? typeof toStep === 'number'
          ? toStep
          : this.#sequence.steps.findIndex((s) => s.name === toStep)
        : this.#sequence.steps.length - 1

    if (startIndex < 0 || endIndex >= this.#sequence.steps.length) {
      throw new Error(`Invalid step range: ${fromStep} to ${toStep}`)
    }

    const results: StepResult<T>[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      results.push(await this.executeStep(i))
    }
    return results
  }

  /**
   * Execute all remaining steps
   */
  async executeAll(): Promise<StepResult<T>[]> {
    return this.executeSteps()
  }

  /**
   * Reset the runner to initial state
   */
  reset(options?: Partial<SequenceRunnerOptions<T>>): void {
    this.#conversation = options?.initialConversation ?? {}
    this.#state = options?.initialState ?? {}
    this.#currentStepIndex = 0
    this.#executedSteps = []

    if (options?.parameters) {
      this.#parameters = options.parameters
    }
    if (options?.testCaseIndex !== undefined) {
      this.#testCaseIndex = options.testCaseIndex
    }
  }

  /**
   * Internal step execution logic
   */
  async #executeStepInternal(
    step: HttpSequenceStep,
    stepIndex: number,
    store: JsonRecord,
  ): Promise<void> {
    // Import dynamically to avoid circular deps
    const { sendHttpRequest } = await import('../util/http.helper')
    const { evaluateTemplate } = await import('./evaluator')
    const { loadMock } = await import('./mock-manager')

    // Execute HTTP request if present
    if (step.request) {
      const evaluatedEndpoint = evaluateTemplate(
        step.request.endpoint,
        store,
        this.#parameters,
        this.#logger,
      ) as string

      const finalEndpoint = this.#baseUrl
        ? `${this.#baseUrl}${evaluatedEndpoint}`
        : evaluatedEndpoint

      const evaluatedHeaders: Record<string, string> = {}
      if (step.request.headers) {
        for (const [key, value] of Object.entries(step.request.headers)) {
          evaluatedHeaders[key] = evaluateTemplate(
            value,
            store,
            this.#parameters,
            this.#logger,
          ) as string
        }
      }

      let evaluatedPayload: unknown = step.request.payload
      if (step.request.payload) {
        evaluatedPayload = evaluateTemplate(
          JSON.stringify(step.request.payload),
          store,
          this.#parameters,
          this.#logger,
        )
        if (typeof evaluatedPayload === 'string') {
          try {
            evaluatedPayload = JSON.parse(evaluatedPayload)
          } catch {
            // Keep as string
          }
        }
      }

      const apiRequest: ApiRequest = {
        method: step.request.method,
        path: finalEndpoint,
        headers: evaluatedHeaders,
        queryParams: step.request.queryParams,
        payload: evaluatedPayload,
        timeout: step.request.timeout,
      }

      let response: ApiResponse

      const mockMode = process.env.MOCK === 'true'

      if (mockMode) {
        const mockableRequest: MockableRequest = {
          method: apiRequest.method,
          endpoint: apiRequest.path,
          queryParams: apiRequest.queryParams,
          headers: apiRequest.headers,
          body: apiRequest.payload,
        }

        const mockEntry = await loadMock(
          this.#testCaseIndex,
          stepIndex,
          step.name,
          this.#sequence.name,
          mockableRequest,
          this.#logger,
        )

        response = mockEntry.response
        this.#logger.info(`📦 Mock loaded for step ${step.name}`)
      } else if (this.#httpInterceptor) {
        response = (await this.#httpInterceptor.intercept(
          apiRequest,
        )) as ApiResponse
      } else {
        const httpResponse = await sendHttpRequest(apiRequest, this.#logger)
        // Convert to local ApiResponse format
        response = {
          status: httpResponse.status,
          statusText: '',
          headers: {},
          data: httpResponse.data,
        }
      }

      this.#conversation[step.name] = {
        request: apiRequest,
        response,
        stepIndex,
      }
    }

    // Execute plugins if present
    if (step.plugins && step.plugins.length > 0) {
      const pluginStore = {
        conversation: this.#conversation,
        state: this.#state,
        parameters: this.#parameters,
      } as JsonRecord

      for (const pluginConfig of step.plugins) {
        const pluginName = pluginConfig.name
        const pluginType = pluginConfig.type ?? pluginName
        const pluginArgs = pluginConfig.args ?? []

        this.#logger.debug(`🔌 Executing plugin: ${pluginName}`)

        const plugin: Plugin | undefined =
          this.#plugins[pluginType] ?? this.#plugins[pluginName]

        if (!plugin) {
          this.#logger.warn(
            `⚠️ Plugin not found: ${pluginName} (type: ${pluginType})`,
          )
          continue
        }

        await plugin(
          { store: pluginStore, logger: this.#logger },
          ...pluginArgs,
        )
      }
    }
  }
}

// Re-export
export type { Conversation, HttpSequence, HttpSequenceState, Plugins }
