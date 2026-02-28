export interface RetryOptions {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: Error) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs = 1000, maxDelayMs = 30000, shouldRetry } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) break;
      if (shouldRetry && !shouldRetry(lastError)) break;

      // Check for rate limit errors with retry-after headers
      const retryAfter = extractRetryAfter(lastError);
      const delay = retryAfter
        ? retryAfter * 1000
        : Math.min(baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000, maxDelayMs);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function extractRetryAfter(error: any): number | null {
  const headers = error?.response?.headers || error?.headers;
  if (headers) {
    const retryAfter = headers['retry-after'] || headers.get?.('retry-after');
    if (retryAfter) {
      const seconds = parseFloat(retryAfter);
      if (!isNaN(seconds)) return seconds;
    }
  }
  return null;
}

export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const status = (error as any)?.status || (error as any)?.statusCode;

  // Rate limits, server errors, timeouts
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  if (message.includes('timeout') || message.includes('econnreset') || message.includes('econnrefused')) {
    return true;
  }
  return false;
}
