/**
 * Policy-aware AI guardrails
 * These functions help ensure AI responses comply with security policies
 */

/**
 * Checks if content contains potentially sensitive information patterns
 */
export function containsSensitivePatterns(content: string): boolean {
  const sensitivePatterns = [
    // Credit card patterns
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
    // SSN patterns
    /\b\d{3}-\d{2}-\d{4}\b/,
    // Email patterns (basic check)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  ]

  return sensitivePatterns.some((pattern) => pattern.test(content))
}

/**
 * Sanitizes content by removing or masking sensitive information
 */
export function sanitizeContent(content: string): string {
  let sanitized = content

  // Mask credit card numbers
  sanitized = sanitized.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    '****-****-****-****'
  )

  // Mask SSN
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****')

  return sanitized
}

/**
 * Validates AI response before returning to user
 */
export function validateResponse(content: string): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (containsSensitivePatterns(content)) {
    warnings.push('Response may contain sensitive information')
  }

  // Check for potentially harmful content
  const harmfulPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ]

  const hasHarmfulContent = harmfulPatterns.some((pattern) => pattern.test(content))
  if (hasHarmfulContent) {
    warnings.push('Response contains potentially harmful content')
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}

/**
 * Applies guardrails to AI response
 */
export function applyGuardrails(content: string, strict: boolean = false): string {
  if (strict) {
    // In strict mode, sanitize sensitive information
    return sanitizeContent(content)
  }

  // In normal mode, just validate
  const validation = validateResponse(content)
  if (!validation.isValid) {
    console.warn('AI response validation warnings:', validation.warnings)
  }

  return content
}


