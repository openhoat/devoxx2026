import { inspect } from 'node:util'
import pino, { type Logger } from 'pino'

// Log level from environment variable (silent in test by default)
const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info')

// Check if we should use pretty output (always in dev/test, or when explicitly enabled)
const USE_PRETTY =
  process.env.LOG_PRETTY !== 'false' &&
  (process.env.NODE_ENV !== 'production' ||
    LOG_LEVEL === 'debug' ||
    LOG_LEVEL === 'trace')

/**
 * Creates a logger with the specified name
 */
export function createLogger(name: string): Logger {
  return pino({
    name,
    level: LOG_LEVEL,
    transport: USE_PRETTY
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  })
}

/**
 * Pretty prints an object for debugging
 */
export function prettyPrint(obj: unknown): string {
  return inspect(obj, { depth: 10, colors: true })
}

// Default logger
export const logger = createLogger('api-regression-demo')
