import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/theme.css';

// TypeScript declaration for the electron API
declare global {
  interface Window {
    electronAPI?: {
      agent: {
        sendMessage: (message: string) => Promise<void>;
        abort: () => Promise<void>;
        switchModel: (model: string, provider: string) => Promise<boolean>;
        onEvent: (callback: (event: unknown) => void) => () => void;
        clearConversation: () => Promise<void>;
      };
      file: {
        read: (filePath: string) => Promise<{ content: string; error?: string }>;
        write: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        edit: (filePath: string, oldString: string, newString: string) => Promise<{ success: boolean; error?: string }>;
        list: (dirPath: string) => Promise<{ files: Array<{ name: string; isDirectory: boolean; path: string }>; error?: string }>;
        watch: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
        unwatch: (dirPath: string) => Promise<void>;
        onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => () => void;
      };
      tool: {
        execute: (toolName: string, input: Record<string, unknown>) => Promise<{ result: unknown; error?: string }>;
        list: () => Promise<Array<{ name: string; description: string; category: string }>>;
      };
      config: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        getModels: () => Promise<Array<{ id: string; name: string; provider: string; available: boolean }>>;
        getProviders: () => Promise<Array<{ name: string; available: boolean; models: string[] }>>;
      };
      app: {
        platform: () => Promise<NodeJS.Platform>;
        version: () => Promise<string>;
        onBeforeQuit: (callback: () => void) => () => void;
        onMenuAction: (callback: (action: string) => void) => () => void;
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
