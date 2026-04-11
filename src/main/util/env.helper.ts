import { join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { getBaseDir } from './base-dir'

export const loadDotenvFile = (envName?: string) => {
  const verbose = process.env.VERBOSE === 'true'
  const envFilename = envName ? `.env.${envName}` : '.env'
  dotenvConfig({ path: join(getBaseDir(), envFilename) })
  verbose && console.log(`Environment loaded from ${envFilename}`)
}

export const loadEnv = (envName?: string) => {
  loadDotenvFile('local')
  if (envName && envName !== 'local') {
    loadDotenvFile(envName)
  }
  loadDotenvFile()
}
