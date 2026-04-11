// Base directory for resolving relative paths
// This resolves to the project root when running tests
let _baseDir: string | undefined

export function setBaseDir(dir: string): void {
  _baseDir = dir
}

export function getBaseDir(): string {
  if (_baseDir) {
    return _baseDir
  }
  // Default to process.cwd() or __dirname equivalent
  return process.cwd()
}

// Helper to get the project root
export function getProjectRoot(): string {
  return getBaseDir()
}
