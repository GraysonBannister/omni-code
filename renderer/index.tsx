import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/theme.css';

// TypeScript declaration for the electron API
declare global {
  interface Window {
    electronAPI?: {
      agent: {
        sendMessage: (conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>) => Promise<void>;
        abort: (conversationId: string) => Promise<void>;
        switchModel: (conversationId: string, model: string, provider: string) => Promise<boolean>;
        onEvent: (callback: (event: unknown) => void) => () => void;
        clearConversation: (conversationId: string) => Promise<void>;
        getTokenCount: (conversationId: string) => Promise<number>;
        setMode: (conversationId: string, mode: string) => Promise<{ success: boolean; mode: string }>;
        respondPermission: (toolId: string, decision: 'allow' | 'deny' | 'allowAlways') => Promise<{ success: boolean }>;
      };
      file: {
        read: (filePath: string) => Promise<{ content: string; error?: string }>;
        write: (filePath: string, content: string) => Promise<{
          success: boolean;
          error?: string;
          bytesWritten?: number;
          chunked?: boolean;
          chunkCount?: number;
        }>;
        edit: (filePath: string, oldString: string, newString: string) => Promise<{ success: boolean; error?: string }>;
        list: (dirPath: string) => Promise<{ files: Array<{ name: string; isDirectory: boolean; path: string }>; error?: string }>;
        watch: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
        unwatch: (dirPath: string) => Promise<void>;
        onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => () => void;
        getChanges: (conversationId: string, messageId: string) => Promise<{ changes: Array<{
          filePath: string;
          fileName: string;
          extension: string;
          changeType: 'added' | 'modified' | 'deleted';
          additions: number;
          deletions: number;
          messageId: string;
          timestamp: number;
        }> }>;
        getAllChanges: (conversationId: string) => Promise<{ changes: Array<{
          filePath: string;
          fileName: string;
          extension: string;
          changeType: 'added' | 'modified' | 'deleted';
          lastMessageId: string;
          lastTimestamp: number;
          changeCount: number;
          additions: number;
          deletions: number;
        }>, error?: string }>;
        getDiff: (conversationId: string, messageId: string, filePath: string) => Promise<{
          before: string;
          after: string;
          changeType?: string;
          error?: string;
        }>;
        restore: (conversationId: string, messageId: string) => Promise<{ success: boolean; restoredFiles: string[]; error?: string }>;
        reapply: (conversationId: string, messageId: string) => Promise<{ success: boolean; restoredFiles: string[]; error?: string }>;
      };
      tool: {
        execute: (toolName: string, input: Record<string, unknown>) => Promise<{ result: unknown; error?: string }>;
        list: () => Promise<Array<{ name: string; description: string; category: string }>>;
      };
      config: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        setCwd: (cwd: string) => Promise<void>;
        getModels: () => Promise<Array<{ id: string; name: string; provider: string; available: boolean }>>;
        getProviders: () => Promise<Array<{ name: string; available: boolean; models: string[] }>>;
      };
      dialog: {
        openFolder: () => Promise<{ canceled: boolean; path?: string }>;
      };
      app: {
        platform: () => Promise<NodeJS.Platform>;
        version: () => Promise<string>;
        onBeforeQuit: (callback: () => Promise<void> | void) => () => void;
        onMenuAction: (callback: (action: string) => void) => () => void;
        onOpenRecent: (callback: (path: string) => void) => () => void;
      };
      settings: {
        get: (path: string) => Promise<{ value: any; error: string | null }>;
        getAll: () => Promise<{ value: any; error: string | null }>;
        set: (path: string, value: any) => Promise<{ success: boolean; error: string | null }>;
        reset: (path?: string) => Promise<{ success: boolean; error: string | null }>;
        addRecentWorkspace: (workspacePath: string) => Promise<{ success: boolean; error: string | null }>;
        getRecentWorkspaces: () => Promise<{ value: string[]; error: string | null }>;
      };
      chatStorage: {
        saveConversation: (workspacePath: string, conversation: unknown) => Promise<{ success: boolean; error?: string }>;
        loadConversations: (workspacePath: string) => Promise<{ conversations: unknown[]; error?: string }>;
        deleteConversation: (workspacePath: string, conversationId: string) => Promise<{ success: boolean; error?: string }>;
        listConversations: (workspacePath: string) => Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }>;
        openPastChat: (workspacePath: string, conversationId: string) => Promise<{ success: boolean; conversation?: unknown; error?: string }>;
      };
      usage: {
        record: (model: string, provider: string, inputTokens: number, outputTokens: number, cost: number) => Promise<{ success: boolean }>;
        getStats: (days?: number) => Promise<{ stats: unknown; error?: string }>;
        getMonthlyCost: () => Promise<{ cost: number; error?: string }>;
        cleanup: (monthsToKeep?: number) => Promise<{ success: boolean; error?: string }>;
        export: (workspacePath?: string) => Promise<{ success: boolean; csvContent?: string; error?: string }>;
      };
      sharedWorkspaces: {
        list: () => Promise<{ success: boolean; workspaces: Array<{
          sharedId: string;
          workspaceId: string;
          filePath: string;
          name: string;
          folderCount: number;
          isActive: boolean;
          addedAt: number;
          isSingleFolder: boolean;
        }>; error?: string }>;
        addWorkspace: (filePath: string) => Promise<{ success: boolean; workspace?: any; error?: string }>;
        addFolder: (folderPath: string) => Promise<{ success: boolean; workspace?: any; error?: string }>;
        remove: (sharedId: string) => Promise<{ success: boolean; error?: string }>;
        setActive: (sharedId: string) => Promise<{ success: boolean; error?: string }>;
        getActive: () => Promise<{ success: boolean; workspace?: any; error?: string }>;
      };
    };
    electron?: {
      platform: NodeJS.Platform;
      versions: {
        node: string;
        electron: string;
        chrome: string;
      };
    };
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Failed to mount React app:', error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Failed to load: ${error}</div>`;
  }
}
