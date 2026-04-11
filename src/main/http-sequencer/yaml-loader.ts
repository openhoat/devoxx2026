import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import type { HttpSequence } from './types'

/**
 * Load and parse a YAML sequence file
 */
export async function loadYamlFile<T = HttpSequence>(
  filePath: string,
): Promise<T> {
  const content = await readFile(filePath, 'utf-8')
  const data = parseYaml(content) as T
  return data
}

/**
 * Load a sequence from a YAML file
 */
export async function loadSequence(filePath: string): Promise<HttpSequence> {
  return loadYamlFile<HttpSequence>(filePath)
}
