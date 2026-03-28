import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';
import type { ImageBlock } from '../../core/message-types.js';

const VALID_ACTIONS = ['navigate', 'reload', 'back', 'forward', 'screenshot', 'close'] as const;
type Action = typeof VALID_ACTIONS[number];

/**
 * BrowserControlTool - Allows the AI to control opened browser tabs
 * 
 * This tool provides actions to navigate, reload, go back/forward, take screenshots,
 * and close browser tabs that were previously opened by the OpenBrowser tool.
 */
export class BrowserControlTool implements Tool {
  readonly name = 'BrowserControl';
  readonly description = `Control a browser tab that was previously opened with OpenBrowser. Use this to navigate to different pages, reload, go back/forward, take screenshots, or close the tab.

Actions:
- navigate: Navigate to a new URL (requires 'url' parameter)
- reload: Reload the current page
- back: Go back to the previous page in history
- forward: Go forward to the next page in history  
- screenshot: Capture a screenshot of the current page (returns image)
- close: Close the browser tab

Examples:
- "Go to the API docs" -> BrowserControl with action: "navigate", url: "https://api.example.com"
- "Reload the page" -> BrowserControl with action: "reload"
- "Take a screenshot" -> BrowserControl with action: "screenshot"
- "Close this tab" -> BrowserControl with action: "close"

Note: Screenshots are captured from the visible browser tab and returned as images you can analyze.`;

  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.NETWORK;

  readonly inputSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The action to perform: navigate, reload, back, forward, screenshot, close',
        enum: VALID_ACTIONS,
      },
      url: {
        type: 'string',
        description: 'The URL to navigate to (required for "navigate" action)',
      },
      tabId: {
        type: 'string',
        description: 'The URL of the tab to control (acts as the tab identifier). If not provided, controls the most recently opened browser tab.',
      },
    },
    required: ['action'],
  };

  validate(input: Record<string, unknown>): string | null {
    const action = input.action as string;
    
    if (!VALID_ACTIONS.includes(action as Action)) {
      return `action must be one of: ${VALID_ACTIONS.join(', ')}`;
    }
    
    if (action === 'navigate' && !input.url) {
      return 'url is required for navigate action';
    }
    
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const action = input.action as Action;
    const tabId = input.tabId as string | undefined;
    const url = input.url as string | undefined;

    try {
      const { BrowserWindow } = await import('electron');
      const windows = BrowserWindow.getAllWindows();
      
      if (windows.length === 0) {
        return {
          content: 'No browser window available',
          isError: true,
        };
      }

      const mainWindow = windows[0];

      switch (action) {
        case 'navigate': {
          const fullUrl = url!.startsWith('http://') || url!.startsWith('https://')
            ? url!
            : `https://${url}`;
          
          // Send navigate command to renderer
          mainWindow.webContents.send('browser:navigate', { 
            tabId: tabId || url, 
            url: fullUrl 
          });
          
          return {
            content: `Navigated to ${fullUrl}`,
            metadata: { url: fullUrl, previousUrl: tabId },
          };
        }

        case 'reload': {
          // For reload, we can't directly control the webview from main process
          // We would need to track active webviews and send reload commands
          // For now, inform the user to use manual refresh
          return {
            content: 'Reload requested. Please click the refresh button in the browser tab, or navigate to the same URL again.',
            metadata: { action: 'reload' },
          };
        }

        case 'back': {
          return {
            content: 'Going back is not yet fully supported. Please use the back button in the browser tab.',
            metadata: { action: 'back' },
          };
        }

        case 'forward': {
          return {
            content: 'Going forward is not yet fully supported. Please use the forward button in the browser tab.',
            metadata: { action: 'forward' },
          };
        }

        case 'screenshot': {
          // Request screenshot from the browser tab via IPC
          const targetTabId = tabId || 'current';

          // Import the screenshot helper from ipc-handlers
          const { requestScreenshot } = await import('../../../main/ipc-handlers.js');
          const result = await requestScreenshot(targetTabId);

          if (result.error || !result.dataUrl) {
            return {
              content: `Screenshot failed: ${result.error || 'Unknown error'}`,
              isError: true,
              metadata: { action: 'screenshot', tabId: targetTabId },
            };
          }

          // Extract base64 data from data URL (remove the data:image/png;base64, prefix)
          const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');

          // Create an ImageBlock to return the screenshot as an image the AI can analyze
          const imageBlock: ImageBlock = {
            type: 'image',
            source: {
              type: 'base64',
              mediaType: 'image/png',
              data: base64Data,
            },
          };

          // Calculate approximate size for display
          const sizeKB = (base64Data.length * 0.75 / 1024).toFixed(1);

          return {
            content: `Screenshot captured successfully (${sizeKB}KB). The image is attached for analysis.`,
            contentBlocks: [imageBlock],
            metadata: { action: 'screenshot', tabId: targetTabId, sizeKB },
          };
        }

        case 'close': {
          // Send close command to renderer
          mainWindow.webContents.send('browser:close', { 
            tabId: tabId || 'current' 
          });
          
          return {
            content: 'Browser tab close requested',
            metadata: { action: 'close', tabId },
          };
        }

        default:
          return {
            content: `Unknown action: ${action}`,
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: `Browser control error: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) {
      return `BrowserControl: ${result.content}`;
    }
    return `Browser ${input.action}${input.url ? ` to ${input.url}` : ''}`;
  }
}
