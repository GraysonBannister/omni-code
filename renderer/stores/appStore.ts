import { create } from 'zustand';
import type { ContentBlock, MessageMetadata } from '../../src/core/message-types.js';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isLoading?: boolean;
  type?: 'file' | 'settings';
}

interface AppState {
  // UI State
  sidebarVisible: boolean;
  chatVisible: boolean;
  activePanel: 'chat' | 'terminal' | 'settings';
  theme: 'dark' | 'light';
  
  // Agent State
  messages: Message[];
  isProcessing: boolean;
  streamingContent: string;
  currentModel: string;
  currentProvider: string;
  availableModels: Array<{ id: string; name: string; provider: string; available: boolean }>;
  availableProviders: Array<{ name: string; available: boolean; models: string[] }>;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  toolCalls: ToolCall[];
  orchestrationStatus: string | null;
  
  // File State
  openFiles: OpenFile[];
  activeFilePath: string | null;
  projectPath: string;
  files: Array<{ name: string; isDirectory: boolean; path: string }>;
  expandedDirs: Set<string>;
  
  // Actions
  toggleSidebar: () => void;
  toggleChat: () => void;
  setActivePanel: (panel: 'chat' | 'terminal' | 'settings') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setIsProcessing: (processing: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  setModel: (model: string, provider: string) => void;
  setAvailableModels: (models: Array<{ id: string; name: string; provider: string; available: boolean }>) => void;
  setAvailableProviders: (providers: Array<{ name: string; available: boolean; models: string[] }>) => void;
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void;
  setOrchestrationStatus: (status: string | null) => void;
  setCost: (totalCost: number, inputTokens: number, outputTokens: number) => void;
  
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  openSettings: () => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  setProjectPath: (path: string) => void;
  setFiles: (files: Array<{ name: string; isDirectory: boolean; path: string }>) => void;
  toggleDir: (path: string) => void;
  loadDirectory: (path: string) => Promise<void>;
  openFolder: () => Promise<void>;
  openRecentWorkspace: (path: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial UI State
  sidebarVisible: true,
  chatVisible: true,
  activePanel: 'chat',
  theme: 'dark',
  
  // Initial Agent State
  messages: [],
  isProcessing: false,
  streamingContent: '',
  currentModel: 'claude-sonnet-4-5',
  currentProvider: 'anthropic',
  availableModels: [],
  availableProviders: [],
  totalCost: 0,
  inputTokens: 0,
  outputTokens: 0,
  toolCalls: [],
  orchestrationStatus: null,
  
  // Initial File State
  openFiles: [],
  activeFilePath: null,
  projectPath: '',
  files: [],
  expandedDirs: new Set(),
  
  // UI Actions
  toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
  toggleChat: () => set(state => ({ chatVisible: !state.chatVisible })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setTheme: (theme) => set({ theme }),
  
  // Agent Actions
  addMessage: (message) => set(state => ({ 
    messages: [...state.messages, message],
    streamingContent: '',
  })),
  
  updateMessage: (id, updates) => set(state => ({
    messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m),
  })),
  
  clearMessages: () => set({ messages: [], toolCalls: [] }),
  
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  
  setStreamingContent: (content) => set({ streamingContent: content }),
  
  appendStreamingContent: (content) => set(state => ({ 
    streamingContent: state.streamingContent + content,
  })),
  
  setModel: (model, provider) => set({ currentModel: model, currentProvider: provider }),
  
  setAvailableModels: (models) => set({ availableModels: models }),
  
  setAvailableProviders: (providers) => set({ availableProviders: providers }),
  
  addToolCall: (toolCall) => set(state => ({
    toolCalls: [...state.toolCalls, toolCall],
  })),
  
  updateToolCall: (id, updates) => set(state => ({
    toolCalls: state.toolCalls.map(t => t.id === id ? { ...t, ...updates } : t),
  })),
  
  setOrchestrationStatus: (status) => set({ orchestrationStatus: status }),
  
  setCost: (totalCost, inputTokens, outputTokens) => set({
    totalCost,
    inputTokens,
    outputTokens,
  }),
  
  // File Actions
  openFile: async (filePath) => {
    const state = get();
    
    // Check if already open
    const existingFile = state.openFiles.find(f => f.path === filePath);
    if (existingFile) {
      set({ activeFilePath: filePath });
      return;
    }
    
    // Add loading state
    const loadingFile: OpenFile = {
      path: filePath,
      content: '',
      originalContent: '',
      isDirty: false,
      isLoading: true,
    };
    
    set(state => ({
      openFiles: [...state.openFiles, loadingFile],
      activeFilePath: filePath,
    }));
    
    try {
      const result = await window.electronAPI.file.read(filePath);
      
      if (result.error) {
        // Remove loading file on error
        set(state => ({
          openFiles: state.openFiles.filter(f => f.path !== filePath),
          activeFilePath: state.activeFilePath === filePath ? null : state.activeFilePath,
        }));
        console.error('Failed to open file:', result.error);
        return;
      }
      
      set(state => ({
        openFiles: state.openFiles.map(f => 
          f.path === filePath 
            ? { ...f, content: result.content, originalContent: result.content, isLoading: false }
            : f
        ),
      }));
    } catch (error) {
      console.error('Failed to open file:', error);
      set(state => ({
        openFiles: state.openFiles.filter(f => f.path !== filePath),
      }));
    }
  },
  
  closeFile: (filePath) => set(state => {
    const newOpenFiles = state.openFiles.filter(f => f.path !== filePath);
    const newActiveFile = state.activeFilePath === filePath
      ? newOpenFiles[newOpenFiles.length - 1]?.path || null
      : state.activeFilePath;
    
    return {
      openFiles: newOpenFiles,
      activeFilePath: newActiveFile,
    };
  }),
  
  setActiveFile: (path) => set({ activeFilePath: path }),
  
  openSettings: () => {
    const state = get();
    const settingsPath = 'omni-code://settings';
    
    // Check if settings already open
    const existingSettings = state.openFiles.find(f => f.path === settingsPath);
    if (existingSettings) {
      set({ activeFilePath: settingsPath });
      return;
    }
    
    // Add settings as a virtual file
    const settingsFile: OpenFile = {
      path: settingsPath,
      content: '',
      originalContent: '',
      isDirty: false,
      type: 'settings',
    };
    
    set(state => ({
      openFiles: [...state.openFiles, settingsFile],
      activeFilePath: settingsPath,
    }));
  },
  
  updateFileContent: (path, content) => set(state => ({
    openFiles: state.openFiles.map(f => 
      f.path === path 
        ? { ...f, content, isDirty: content !== f.originalContent }
        : f
    ),
  })),
  
  saveFile: async (path) => {
    const state = get();
    const file = state.openFiles.find(f => f.path === path);
    if (!file || !file.isDirty) return;
    
    try {
      const result = await window.electronAPI.file.write(path, file.content);
      
      if (result.success) {
        set(state => ({
          openFiles: state.openFiles.map(f => 
            f.path === path 
              ? { ...f, originalContent: file.content, isDirty: false }
              : f
          ),
        }));
      } else {
        console.error('Failed to save file:', result.error);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  },
  
  setProjectPath: (path) => set({ projectPath: path }),
  
  setFiles: (files) => set({ files }),
  
  toggleDir: (dirPath) => set(state => {
    const newExpanded = new Set(state.expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    return { expandedDirs: newExpanded };
  }),
  
  loadDirectory: async (dirPath) => {
    try {
      const result = await window.electronAPI.file.list(dirPath);
      
      if (result.error) {
        console.error('Failed to load directory:', result.error);
        return;
      }
      
      set(state => ({
        files: [...state.files.filter(f => !f.path.startsWith(dirPath + '/')), ...result.files],
        projectPath: state.projectPath || dirPath,
      }));
      
      // Start watching the directory
      await window.electronAPI.file.watch(dirPath);
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  },

  openFolder: async () => {
    try {
      const result = await window.electronAPI.dialog.openFolder();

      if (result.canceled || !result.path) {
        return;
      }

      // Update working directory in main process
      await window.electronAPI.config.setCwd(result.path);

      // Clear existing files and expanded dirs
      set({
        files: [],
        expandedDirs: new Set(),
        projectPath: result.path,
      });

      // Add to recent workspaces
      await window.electronAPI.settings.addRecentWorkspace(result.path);

      // Load the new directory
      await get().loadDirectory(result.path);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  },

  openRecentWorkspace: async (path: string) => {
    try {
      // Update working directory in main process
      await window.electronAPI.config.setCwd(path);

      // Clear existing state
      set({
        files: [],
        expandedDirs: new Set(),
        projectPath: path,
        openFiles: [],
        activeFilePath: null,
        messages: [],
        toolCalls: [],
      });

      // Add to recent workspaces (moves to top)
      await window.electronAPI.settings.addRecentWorkspace(path);

      // Load the directory
      await get().loadDirectory(path);
    } catch (error) {
      console.error('Failed to open recent workspace:', error);
    }
  },
}));
