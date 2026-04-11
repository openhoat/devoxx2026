// Jest setup file
// Set test environment for proper logging
process.env.NODE_ENV = 'test'

// Increase max listeners to avoid warning with multiple test files
// Jest and its dependencies can add multiple listeners to the process
process.setMaxListeners(20)
