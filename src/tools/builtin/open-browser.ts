import type { Tool, ToolResult, ToolContext } from '../tool-types.js';
import { PermissionLevel, ToolCategory } from '../tool-types.js';

/**
 * OpenBrowserTool - Allows the AI to open browser tabs in the editor
 * 
 * This tool sends an IPC message to the renderer process to open a browser tab,
 * allowing the AI to share visual content, documentation, or web pages with the user.
 */
export class OpenBrowserTool implements Tool {
  readonly name = 'OpenBrowser';
  readonly description = `Open a browser tab in the editor to show the user a website. Use this when you want to share visual content, documentation, tutorials, or any web page with the user. The browser tab will appear alongside their code files in the editor.

Examples:
- "Let me show you the React documentation" -> OpenBrowser with url: "https://react.dev"
- "Here's the API reference" -> OpenBrowser with url: "https://api.example.com/docs"
- "Check out this demo" -> OpenBrowser with url: "https://demo.example.com"

The tab will open automatically without requiring user permission.`;

  // Safe permission level - opens automatically without user confirmation
  readonly permissionLevel = PermissionLevel.SAFE;
  readonly category = ToolCategory.NETWORK;
  readonly availableInPlanMode = false;

  readonly inputSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to open in the browser tab. Must be a valid HTTP or HTTPS URL.',
      },
      title: {
        type: 'string',
        description: 'Optional title for the browser tab (shown in the tab label). If not provided, the domain will be used.',
      },
    },
    required: ['url'],
  };

  validate(input: Record<string, unknown>): string | null {
    const url = input.url as string;
    if (!url) {
      return 'url is required';
    }
    
    // Basic URL validation
    if (!url.match(/^https?:\/\/.+/i) && !url.match(/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]+/i)) {
      return 'url must be a valid HTTP/HTTPS URL or domain';
    }
    
    return null;
  }

  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const url = input.url as string;
    const title = input.title as string | undefined;

    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;

      // Send IPC to renderer to open browser tab
      // Note: This uses the electronAPI which is available in the main process
      // through the preload script
      const result = await this.sendOpenBrowserCommand(fullUrl, title);

      if (result.success) {
        return {
          content: `Opened browser tab: ${fullUrl}${title ? ` (${title})` : ''}`,
          metadata: { url: fullUrl, title },
        };
      } else {
        return {
          content: `Failed to open browser tab: ${result.error || 'Unknown error'}`,
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: `Error opening browser tab: ${(error as Error).message}`,
        isError: true,
      };
    }
  }

  formatForDisplay(result: ToolResult, input: Record<string, unknown>): string {
    if (result.isError) {
      return `OpenBrowser: ${result.content}`;
    }
    return `Opened browser: ${input.url}${input.title ? ` (${input.title})` : ''}`;
  }

  private async sendOpenBrowserCommand(url: string, title?: string): Promise<{ success: boolean; error?: string }> {
    // In the main process, we need to access the ipcMain handlers directly
    // The ipc-handlers.ts has a handler for 'browser:open'
    const { ipcMain } = await import('electron');
    
    // We need to get the main window reference from ipc-handlers
    // Since we can't easily import it, we'll use the ipcMain to emit the event
    // This is a workaround - in a real implementation we'd have proper dependency injection
    
    // Actually, the better approach is to use the window.electronAPI in the renderer
    // But since we're in the main process context for tools, we need to emit to all webContents
    const { BrowserWindow } = await import('electron');
    const windows = BrowserWindow.getAllWindows();
    
    if (windows.length === 0) {
      return { success: false, error: 'No browser window available' };
    }
    
    // Send to the first main window
    windows[0].webContents.send('browser:open', { url, title });
    
    return { success: true };
  }
}
