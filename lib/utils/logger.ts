/**
 * Debug logger utility for production-ready logging
 * Only logs when NEXT_PUBLIC_DEBUG_MODE is set to 'true'
 */

const isDebugMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
  }
  return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
}

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

const createLogger = (level: LogLevel) => {
  return (...args: unknown[]) => {
    // Always show errors and warnings in production
    if (level === 'error' || level === 'warn') {
      console[level](...args)
      return
    }
    
    // Only show debug/log/info in debug mode
    if (isDebugMode()) {
      console[level](...args)
    }
  }
}

export const logger = {
  log: createLogger('log'),
  info: createLogger('info'),
  debug: createLogger('debug'),
  warn: createLogger('warn'),
  error: createLogger('error'),
}

export default logger
