import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import type { ImageBlock } from '../../core/message-types.js';

const VALID_ACTIONS = ['navigate', 'screenshot', 'evaluate', 'click', 'type', 'select', 'content'] as const;
type Action = typeof VALID_ACTIONS[number];

let browserInstance: any = null;

export class BrowserAutomationTool implements Tool {
  readonly name = 'Browser';
  readonly description = `Automate a headless browser for web testing, scraping, or UI verification. Actions: navigate (go to URL), screenshot (capture page), evaluate (run JS), click (click selector), type (type into input), select (select option), content (get page text/HTML).`;
  readonly permissionLevel = PermissionLevel.DANGEROUS;
  readonly category = ToolCategory.NETWORK;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform: navigate, screenshot, evaluate, click, type, select, content',
      },
      url: {
        type: 'string',
        description: 'URL to navigate to (for navigate action)',
      },
      selector: {
        type: 'string',
        description: 'CSS selector for click/type/select actions',
      },
      text: {
        type: 'string',
        description: 'Text to type (for type action) or option value (for select action)',
      },
      code: {
        type: 'string',
        description: 'JavaScript code to evaluate in the page context (for evaluate action)',
      },
      fullPage: {
        type: 'boolean',
        description: 'Capture full page screenshot (default: true)',
      },
      waitFor: {
        type: 'string',
        description: 'CSS selector to wait for before action',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in ms (default: 30000)',
      },
      format: {
        type: 'string',
        description: 'For content action: "text" or "html" (default: "text")',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    if (action === 'navigate' && !input.url) return 'url is required for navigate action';
    if (action === 'evaluate' && !input.code) return 'code is required for evaluate action';
    if ((action === 'click' || action === 'type' || action === 'select') && !input.selector) {
      return `selector is required for ${action} action`;
    }
    if (action === 'type' && !input.text) return 'text is required for type action';
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;
    const timeout = (input.timeout as number) || 30000;

    try {
      const { page, isNew } = await this.getPage();

      if (input.waitFor) {
        await page.waitForSelector(input.waitFor as string, { timeout });
      }

      switch (action) {
        case 'navigate': {
          const url = input.url as string;
          const response = await page.goto(url, { waitUntil: 'networkidle2', timeout });
          const status = response?.status() || 'unknown';
          const title = await page.title();
          return { content: `Navigated to ${url}\nStatus: ${status}\nTitle: ${title}` };
        }

        case 'screenshot': {
          const fullPage = input.fullPage !== false;
          const buffer = await page.screenshot({ fullPage, type: 'png' });
          const base64 = Buffer.from(buffer).toString('base64');
          const imageBlock: ImageBlock = {
            type: 'image',
            source: { type: 'base64', mediaType: 'image/png', data: base64 },
          };
          const title = await page.title();
          const url = page.url();
          return {
            content: `Screenshot captured: ${title} (${url}), ${(buffer.length / 1024).toFixed(1)}KB`,
            contentBlocks: [imageBlock],
          };
        }

        case 'evaluate': {
          const code = input.code as string;
          const result = await page.evaluate(code);
          const serialized = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
          return { content: `Evaluation result:\n${serialized}` };
        }

        case 'click': {
          const selector = input.selector as string;
          await page.click(selector);
          return { content: `Clicked element: ${selector}` };
        }

        case 'type': {
          const selector = input.selector as string;
          const text = input.text as string;
          await page.type(selector, text);
          return { content: `Typed "${text}" into ${selector}` };
        }

        case 'select': {
          const selector = input.selector as string;
          const value = input.text as string;
          await page.select(selector, value);
          return { content: `Selected "${value}" in ${selector}` };
        }

        case 'content': {
          const format = (input.format as string) || 'text';
          let content: string;
          if (format === 'html') {
            content = await page.content();
          } else {
            // eslint-disable-next-line no-eval
            content = await page.evaluate('document.body.innerText');
          }
          // Truncate very long content
          if (content.length > 50000) {
            content = content.substring(0, 50000) + '\n\n[...truncated]';
          }
          return { content };
        }
      }
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('Cannot find module') || msg.includes('puppeteer')) {
        return {
          content: 'Puppeteer is not installed. Install it with: npm install puppeteer\n\nPuppeteer is an optional dependency for browser automation.',
          isError: true,
        };
      }
      return { content: `Browser error: ${msg}`, isError: true };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) return result.content;
    return `Browser: ${input.action}${input.url ? ` ${input.url}` : ''}${input.selector ? ` ${input.selector}` : ''}`;
  }

  private async getPage(): Promise<{ page: any; isNew: boolean }> {
    if (browserInstance) {
      const pages = await browserInstance.pages();
      return { page: pages[0] || await browserInstance.newPage(), isNew: false };
    }

    // Lazy-load puppeteer (optional dependency)
    const puppeteer = await (import('puppeteer').catch(() => null) as Promise<any>);
    browserInstance = await (puppeteer.default || puppeteer).launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    // Clean up on process exit
    const cleanup = () => {
      if (browserInstance) {
        browserInstance.close().catch(() => {});
        browserInstance = null;
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);

    const page = await browserInstance.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    return { page, isNew: true };
  }
}
