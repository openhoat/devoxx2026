import { existsSync, readdirSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Logger } from 'pino'
import { getBaseDir } from '../util/base-dir'
import { parseJsonFile } from '../util/file-reader'
import { hashObject, sortObjectKeys } from '../util/object.helper'
import { toKebabCase } from '../util/string.helper'

export type MockableRequest = {
  method: string
  endpoint: string
  queryParams?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}

export type MockResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  data: unknown
}

export type MockEntry = {
  response: MockResponse
  capturedAt: string
  mockId: string
}

const MOCKS_DIR = 'mocks'
const SEQUENCES_DIR = 'sequences'

// Headers to exclude from mock ID generation
const EXCLUDED_HEADERS = new Set([
  'x-correlationid',
  'x-requestid',
  'x-correlation-id',
  'x-request-id',
  'date',
  'x-timestamp',
  'authorization',
  'cookie',
  'set-cookie',
  'user-agent',
  'accept-encoding',
  'connection',
  'content-length',
  'host',
])

/**
 * Filter headers for mock ID generation
 */
const filterSignificantHeaders = (
  headers?: Record<string, string>,
): Record<string, string> => {
  if (!headers) return {}

  const result: Record<string, string> = {}
  Object.keys(headers)
    .filter((key) => !EXCLUDED_HEADERS.has(key.toLowerCase()))
    .sort()
    .forEach((key) => {
      result[key.toLowerCase()] = headers[key]
    })
  return result
}

/**
 * Generate a mock ID based on the request
 */
export const generateMockId = (
  request: MockableRequest,
  logger: Logger,
): string => {
  const normalizedRequest = {
    method: request.method.toUpperCase(),
    endpoint: request.endpoint,
    queryParams: sortObjectKeys(request.queryParams || {}),
    headers: filterSignificantHeaders(request.headers),
    body: sortObjectKeys(request.body),
  }

  const mockId = hashObject(normalizedRequest)

  logger.trace(`🔍 generateMockId - Endpoint: ${request.endpoint}`)
  logger.trace(`🔍 generateMockId - Hash: ${mockId}`)

  return mockId
}

/**
 * Generate a descriptive filename for the mock
 */
export const generateDescriptiveMockFilename = (
  mockId: string,
  stepName: string,
  stepIndex: number,
  testCaseIndex: number,
): string => {
  const cleanStepName = stepName
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  const formattedTestIndex = testCaseIndex.toString().padStart(2, '0')
  const formattedStepIndex = (stepIndex + 1).toString().padStart(2, '0')

  return `${formattedTestIndex}-step-${formattedStepIndex}-${cleanStepName}-${mockId}.json`
}

/**
 * Save a mock to disk
 */
export const saveMock = async (
  mockEntry: MockEntry,
  logger: Logger,
  stepName?: string,
  stepIndex?: number,
  testCaseIndex?: number,
  sequenceName?: string,
): Promise<void> => {
  let targetDir: string

  if (sequenceName) {
    const sequenceKebab = toKebabCase(sequenceName)
    targetDir = join(getBaseDir(), MOCKS_DIR, SEQUENCES_DIR, sequenceKebab)
  } else {
    targetDir = join(getBaseDir(), MOCKS_DIR)
  }

  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true })
  }

  const filename =
    stepName && stepIndex !== undefined && testCaseIndex !== undefined
      ? generateDescriptiveMockFilename(
          mockEntry.mockId,
          stepName,
          stepIndex,
          testCaseIndex,
        )
      : `${stepName || 'mock'}-${mockEntry.mockId}.json`

  const filePath = join(targetDir, filename)

  await writeFile(filePath, JSON.stringify(mockEntry, null, 2))

  logger.debug(`Mock saved: ${filename}`)
}

/**
 * Find mock file by pattern (test case index + step index + step name)
 */
const findMockFileByPattern = (
  sequenceMocksDir: string,
  testCaseIndex: number,
  stepIndex: number,
  stepName: string,
  logger: Logger,
): string | null => {
  const formattedTestIndex = testCaseIndex.toString().padStart(2, '0')
  const formattedStepIndex = (stepIndex + 1).toString().padStart(2, '0')
  const cleanStepName = stepName
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  const pattern = `${formattedTestIndex}-step-${formattedStepIndex}-${cleanStepName}-`

  try {
    const files = readdirSync(sequenceMocksDir)
    const matchingFile = files.find(
      (file) => file.startsWith(pattern) && file.endsWith('.json'),
    )

    if (matchingFile) {
      logger.trace(`🔍 Found mock by pattern: ${matchingFile}`)
      return matchingFile
    }
  } catch {
    // Ignore errors
  }

  return null
}

/**
 * Load a mock from disk
 */
export const loadMock = async (
  testCaseIndex: number,
  stepIndex: number,
  stepName: string,
  sequenceName: string,
  request: MockableRequest,
  logger: Logger,
): Promise<MockEntry> => {
  const sequenceKebab = toKebabCase(sequenceName)
  const sequenceMocksDir = join(
    getBaseDir(),
    MOCKS_DIR,
    SEQUENCES_DIR,
    sequenceKebab,
  )

  if (!existsSync(sequenceMocksDir)) {
    throw new Error(
      `❌ Mock directory for sequence '${sequenceName}' not found: ${sequenceMocksDir}`,
    )
  }

  // First, try to find by pattern (for demo with different test cases)
  const foundFile = findMockFileByPattern(
    sequenceMocksDir,
    testCaseIndex,
    stepIndex,
    stepName,
    logger,
  )

  if (foundFile) {
    try {
      const mockData = await parseJsonFile<MockEntry>(
        join(MOCKS_DIR, SEQUENCES_DIR, sequenceKebab),
        foundFile,
      )

      logger.debug(`✅ Mock loaded: ${foundFile}`)
      return mockData
    } catch (error) {
      throw new Error(
        `❌ Error loading mock ${foundFile}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Fallback to hash-based lookup
  const mockId = generateMockId(request, logger)

  const formattedTestIndex = testCaseIndex.toString().padStart(2, '0')
  const formattedStepIndex = (stepIndex + 1).toString().padStart(2, '0')
  const cleanStepName = stepName
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  const filename = `${formattedTestIndex}-step-${formattedStepIndex}-${cleanStepName}-${mockId}.json`
  const filePath = join(sequenceMocksDir, filename)

  logger.trace(`🔍 Looking for mock: ${filename}`)

  if (!existsSync(filePath)) {
    throw new Error(
      `❌ Mock not found: ${filename}\nDirectory: ${sequenceMocksDir}\nCalculated hash: ${mockId}`,
    )
  }

  try {
    const mockData = await parseJsonFile<MockEntry>(
      join(MOCKS_DIR, SEQUENCES_DIR, sequenceKebab),
      filename,
    )

    logger.debug(`✅ Mock loaded: ${filename}`)
    return mockData
  } catch (error) {
    throw new Error(
      `❌ Error loading mock ${filename}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
