import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, test } from '@jest/globals'
import {
  type HttpSequence,
  loadSequence,
  type Plugins,
  SequenceRunner,
} from '../../main/http-sequencer'
import { setBaseDir } from '../../main/util/base-dir'
import {
  actualExtractPlugin,
  legacyExtractPlugin,
  productOfferComparisonPlugin,
} from './plugins'

// Set base directory for mock resolution
const projectRoot = resolve(__dirname, '../../..')
setBaseDir(projectRoot)

// Load plugins
const plugins: Plugins = {
  legacyExtractPlugin,
  actualExtractPlugin,
  productOfferComparisonPlugin,
}

// Parameters
const parameters = {
  legacyBaseUrl: 'https://api.legacy.example.com',
  actualBaseUrl: 'https://api.new.example.com',
}

describe('E2E test - step by step', () => {
  let sequence: HttpSequence
  let runner: SequenceRunner

  beforeAll(async () => {
    // Set mock mode
    process.env.MOCK = 'true'
    // Load sequence
    const sequencePath = resolve(__dirname, 'products-to-offers.sequence.yml')
    sequence = await loadSequence(sequencePath)
  })

  beforeEach(() => {
    // Create a fresh runner for each test
    runner = new SequenceRunner(sequence, {
      plugins,
      parameters,
      testCaseIndex: 1,
    })
  })

  const step1 = async () => {
    try {
      const result = await runner.executeStep('legacy-products')
      expect(result.stepName).toBe('legacy-products')
      expect(result.stepIndex).toBe(0)
      expect(runner.currentStepIndex).toBeGreaterThan(0)
      expect(runner.executedSteps).toContain('legacy-products')
      const legacyProducts = runner.state.legacyProducts as Array<
        Record<string, unknown>
      >
      expect(legacyProducts).toBeDefined()
      expect(legacyProducts.length).toBeGreaterThan(0)
      // Verify structure, not specific values
      expect(legacyProducts[0]).toHaveProperty('id')
      expect(legacyProducts[0]).toHaveProperty('name')
      expect(legacyProducts[0]).toHaveProperty('price')
      // Should store result in runner conversation
      expect(runner.conversation['legacy-products']).toBeDefined()
      expect(runner.conversation['legacy-products'].response?.status).toBe(200)
    } catch (err) {
      const error = err as Error
      error.message = `Step1 failed!\n${error.message}`
      throw error
    }
  }

  const step2 = async () => {
    try {
      const result = await runner.executeStep('actual-offers')
      expect(result.stepName).toBe('actual-offers')
      expect(result.stepIndex).toBe(1)
      expect(runner.executedSteps).toContain('actual-offers')
      expect(runner.currentStepIndex).toBeGreaterThan(1)
      const actualOffers = runner.state.actualOffers as Array<
        Record<string, unknown>
      >
      expect(actualOffers).toBeDefined()
      expect(actualOffers.length).toBeGreaterThan(0)
      // Verify structure, not specific values
      expect(actualOffers[0]).toHaveProperty('id')
      expect(actualOffers[0]).toHaveProperty('name')
      expect(actualOffers[0]).toHaveProperty('price')
    } catch (err) {
      const error = err as Error
      error.message = `Step2 failed!\n${error.message}`
      throw error
    }
  }

  const step3 = async () => {
    try {
      const result = await runner.executeStep('comparison')
      expect(result.stepName).toBe('comparison')
      expect(result.stepIndex).toBe(2)
      expect(runner.executedSteps).toContain('comparison')
      expect(runner.currentStepIndex).toBeGreaterThan(2)
      expect(runner.isComplete).toBe(true)
      const comparisonResult = runner.state.comparisonResult as Record<
        string,
        unknown
      >
      expect(comparisonResult).toBeDefined()
      // Verify structure, not specific values
      expect(comparisonResult).toHaveProperty('matched')
      expect(typeof comparisonResult.matched).toBe('boolean')
      expect(runner.isComplete).toBe(true)
    } catch (err) {
      const error = err as Error
      error.message = `Step3 failed!\n${error.message}`
      throw error
    }
  }

  test('should execute sequence step by step', async () => {
    await step1()
    await step2()
    await step3()
  })
})
