import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

const formatErrors = (errors: ErrorObject[]): string => {
  return errors
    .map((error) => {
      const path = error.instancePath || 'root'
      return `  - at ${path}: ${error.message}`
    })
    .join('\n')
}

export const validateWithSchema = async (data: unknown): Promise<void> => {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('$schema' in data) ||
    typeof data.$schema !== 'string'
  ) {
    // For now, we only validate data that has a $schema property
    return
  }
  const schemaPath = join(__dirname, data.$schema)
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
  const validate = ajv.compile(schema)
  if (!validate(data)) {
    const formattedErrors = formatErrors(validate.errors || [])
    throw new Error(`Schema validation failed:\n${formattedErrors}`)
  }
}
