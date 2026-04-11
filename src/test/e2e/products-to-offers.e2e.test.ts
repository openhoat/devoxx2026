import { resolve } from 'node:path'
import { beforeAll, describe, expect, test } from '@jest/globals'
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

describe('E2E test', () => {
  let sequence: HttpSequence
  let runner: SequenceRunner

  beforeAll(async () => {
    // Load sequence
    const sequencePath = resolve(__dirname, 'products-to-offers.sequence.yml')
    sequence = await loadSequence(sequencePath)
  })

  test('should execute full sequence', async () => {
    // Create runner with test case 1 (nominal case)
    runner = new SequenceRunner(sequence, {
      plugins,
      parameters,
      testCaseIndex: 1,
    })

    // Execute all steps
    await runner.executeAll()

    // Verify comparison result
    expect(runner.state).toHaveProperty('comparisonResult')
    const comparisonResult = runner.state.comparisonResult as {
      matched: boolean
    }
    expect(comparisonResult.matched).toBe(true)
  })
})
