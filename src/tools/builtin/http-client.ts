import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

export class HTTPClientTool implements Tool {
  readonly name = 'HTTPClient';
  readonly description = 'Make HTTP requests (GET, POST, PUT, DELETE, PATCH). Useful for testing APIs and debugging endpoints.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.NETWORK;

  readonly inputSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The request URL',
      },
      method: {
        type: 'string',
        description: 'HTTP method: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS (default: GET)',
      },
      headers: {
        type: 'object',
        description: 'Request headers as key-value pairs',
      },
      body: {
        type: 'string',
        description: 'Request body (string or JSON string)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
      },
    },
    required: ['url'],
  };

  validate(input: Record<string, unknown>): string | null {
    if (typeof input.url !== 'string' || !input.url) {
      return 'url must be a non-empty string';
    }
    if (!input.url.startsWith('http://') && !input.url.startsWith('https://')) {
      return 'url must start with http:// or https://';
    }
    if (input.method !== undefined) {
      const method = (input.method as string).toUpperCase();
      if (!ALLOWED_METHODS.includes(method as typeof ALLOWED_METHODS[number])) {
        return `method must be one of: ${ALLOWED_METHODS.join(', ')}`;
      }
    }
    if (input.timeout !== undefined && (typeof input.timeout !== 'number' || input.timeout < 1)) {
      return 'timeout must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const url = input.url as string;
    const method = ((input.method as string) || 'GET').toUpperCase();
    const headers = (input.headers as Record<string, string>) || {};
    const body = input.body as string | undefined;
    const timeout = (input.timeout as number) || 30_000;

    // Plan mode: only allow GET
    if (context.planMode && method !== 'GET') {
      return {
        content: `Cannot make ${method} requests in plan mode. Only GET is allowed.`,
        isError: true,
      };
    }

    try {
      const timeoutSignal = AbortSignal.timeout(timeout);
      const combinedSignal = AbortSignal.any([timeoutSignal, context.abortSignal]);

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'User-Agent': 'omni-code/0.1.0',
          ...headers,
        },
        signal: combinedSignal,
        redirect: 'follow',
      };

      if (body && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = body;
        if (!headers['content-type'] && !headers['Content-Type']) {
          // Auto-detect JSON
          try {
            JSON.parse(body);
            (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
          } catch {
            // Not JSON, leave as-is
          }
        }
      }

      const response = await fetch(url, fetchOptions);

      // Format response
      const statusLine = `HTTP ${response.status} ${response.statusText}`;

      const responseHeaders: string[] = [];
      response.headers.forEach((value, key) => {
        responseHeaders.push(`  ${key}: ${value}`);
      });

      let responseBody = await response.text();
      const contentType = response.headers.get('content-type') || '';

      // Pretty-print JSON responses
      if (contentType.includes('application/json')) {
        try {
          responseBody = JSON.stringify(JSON.parse(responseBody), null, 2);
        } catch { /* not valid JSON */ }
      }

      // Truncate large responses
      if (responseBody.length > 100_000) {
        responseBody = responseBody.substring(0, 100_000) + '\n\n[Truncated at 100000 characters]';
      }

      const output = [
        `${method} ${url}`,
        '',
        `Response: ${statusLine}`,
        '',
        'Headers:',
        ...responseHeaders,
        '',
        'Body:',
        responseBody || '(empty)',
      ].join('\n');

      return {
        content: output,
        isError: response.status >= 400,
        metadata: { statusCode: response.status, contentType },
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        return { content: `Request timed out after ${timeout}ms: ${method} ${url}`, isError: true };
      }
      return { content: `Request failed: ${err.message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    const method = ((input.method as string) || 'GET').toUpperCase();
    const status = result.metadata?.statusCode;
    return `HTTP ${method} ${input.url} -> ${status || 'error'}`;
  }
}
