import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { getBaseDir } from './base-dir'

/**
 * Reads and parses a JSON file
 */
export async function parseJsonFile<T>(
  dir: string,
  filename: string,
): Promise<T> {
  const filePath = join(getBaseDir(), dir, filename)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content) as T
}

/**
 * Reads and parses a YAML file
 */
export async function parseYamlFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8')
  return parseYaml(content) as T
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
