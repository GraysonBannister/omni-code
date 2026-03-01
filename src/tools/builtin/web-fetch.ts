import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

export class WebFetchTool implements Tool {
  readonly name = 'WebFetch';
  readonly description = 'Fetch a URL and return its content as readable text. Handles HTML (strips tags), JSON (pretty-prints), and plain text.';
  readonly permissionLevel = PermissionLevel.MODERATE;
  readonly category = ToolCategory.NETWORK;
  readonly availableInPlanMode = true;

  readonly inputSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must start with http:// or https://)',
      },
      maxLength: {
        type: 'number',
        description: 'Maximum content length in characters (default: 50000)',
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
    if (input.maxLength !== undefined && (typeof input.maxLength !== 'number' || input.maxLength < 1)) {
      return 'maxLength must be a positive number';
    }
    return null;
  }

  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const url = input.url as string;
    const maxLength = (input.maxLength as number) || 50_000;

    try {
      const timeoutSignal = AbortSignal.timeout(30_000);
      const combinedSignal = AbortSignal.any([timeoutSignal, context.abortSignal]);

      const response = await fetch(url, {
        signal: combinedSignal,
        headers: {
          'User-Agent': 'omni-code/0.1.0',
          'Accept': 'text/html,application/json,text/plain,*/*',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          content: `HTTP ${response.status} ${response.statusText} for ${url}`,
          isError: true,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();

      let content: string;

      if (contentType.includes('application/json')) {
        try {
          content = JSON.stringify(JSON.parse(rawBody), null, 2);
        } catch {
          content = rawBody;
        }
      } else if (contentType.includes('text/html')) {
        content = this.stripHtml(rawBody);
      } else {
        content = rawBody;
      }

      // Truncate
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + `\n\n[Truncated at ${maxLength} characters]`;
      }

      return {
        content: `Fetched ${url} (${contentType}):\n\n${content}`,
        metadata: { statusCode: response.status, contentType, length: content.length },
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        return { content: `Request timed out or was cancelled for ${url}`, isError: true };
      }
      return { content: `Error fetching ${url}: ${err.message}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    const len = (result.metadata?.length as number) || 0;
    return `Fetched ${input.url} (${len} chars)`;
  }

  private stripHtml(html: string): string {
    let text = html;
    // Remove script and style blocks entirely
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    // Convert common block elements to newlines
    text = text.replace(/<\/?(?:div|p|br|hr|h[1-6]|li|tr|blockquote|pre|section|article|header|footer|nav|main|aside)\b[^>]*\/?>/gi, '\n');
    // Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
    // Collapse whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    return text.trim();
  }
}
