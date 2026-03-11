import { create } from 'zustand';
import type { ContentBlock, MessageMetadata } from '../../src/core/message-types.js';

// Indexing State Types
export type IndexingStatus = 'idle' | 'indexing' | 'complete' | 'error' | 'paused';

export interface IndexingState {
  status: IndexingStatus;
  progress: number; // 0-100
  totalFiles: number;
  processedFiles: number;
  indexedChunks: number;
  lastSyncAt: number | null;
  lastError: string | null;
  isSemanticSearchReady: boolean;
}

// Types
export interface FileChange {
  messageId: string;
  toolCallId: string;
  filePath: string;
  beforeContent: string;
  afterContent?: string;
  timestamp: number;
  changeType: 'write' | 'edit' | 'delete';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp: number;
  metadata?: MessageMetadata;
  fileChanges?: FileChange[]; // Track file changes for this message
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  phase?: string;
  detail?: string;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  permissionLevel?: string;
  category?: string;
}

export interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isLoading?: boolean;
  type?: 'file' | 'settings' | 'browser';
  url?: string; // For browser tabs
}

// Multi-tab conversation support - each conversation is isolated
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  isProcessing: boolean;
  streamingContent: string;
  toolCalls: ToolCall[];
  orchestrationStatus: string | null;
  createdAt: number;
  updatedAt: number;
  isDirty?: boolean; // Track if conversation has unsaved changes
  model?: string; // Per-conversation model selection
  provider?: string; // Per-conversation provider selection
  mode?: 'code' | 'architect' | 'review' | 'security' | 'debug'; // AI operating mode
  contextTokens?: number; // Current context token count
  maxContextTokens?: number; // Maximum allowed context tokens
}

interface AppState {
  // UI State
  sidebarVisible: boolean;
  chatVisible: boolean;
  activePanel: 'chat' | 'terminal' | 'settings';
  theme: 'dark' | 'light';
  isAppInitialized: boolean; // Track if app has finished initial setup (settings loaded, etc.)
  
  // Multi-Conversation State (replaces single conversation state)
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Past Chats State (for on-demand loading)
  pastChats: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>;
  pastChatsLoaded: boolean;
  
  // Global Agent State (shared across conversations)
  currentModel: string;
  currentProvider: string;
  availableModels: Array<{ id: string; name: string; provider: string; available: boolean }>;
  availableProviders: Array<{ name: string; available: boolean; models: string[] }>;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  maxContextTokens: number; // Global default for max context tokens
  
  // File State
  openFiles: OpenFile[];
  activeFilePath: string | null;
  projectPath: string;
  files: Array<{ name: string; isDirectory: boolean; path: string }>;
  expandedDirs: Set<string>;
  
  // File History Popup State
  fileHistoryPopupVisible: boolean;
  fileHistoryPopupPinned: boolean;

  // Indexing State
  indexingState: IndexingState;
  indexingPollInterval: number | null;

  // Indexing Actions
  startIndexing: () => Promise<void>;
  stopIndexing: () => Promise<void>;
  reindexProject: () => Promise<void>;
  clearIndex: () => Promise<void>;
  refreshIndexingState: () => Promise<void>;
  setIndexingPollInterval: (interval: number | null) => void;

  // UI Actions
  toggleSidebar: () => void;
  toggleChat: () => void;
  setActivePanel: (panel: 'chat' | 'terminal' | 'settings') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAppInitialized: (initialized: boolean) => void;
  
  // File History Popup Actions
  showFileHistoryPopup: () => void;
  hideFileHistoryPopup: () => void;
  toggleFileHistoryPopup: () => void;
  pinFileHistoryPopup: (pinned: boolean) => void;
  
  // Conversation Actions (multi-tab support)
  createConversation: (options?: { model?: string; provider?: string }) => string;
  switchConversationModel: (conversationId: string, model: string, provider: string) => void;
  setActiveConversation: (id: string) => void;
  closeConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessageToConversation: (conversationId: string, message: Message) => void;
  updateMessageInConversation: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  setConversationProcessing: (conversationId: string, processing: boolean) => void;
  setConversationStreaming: (conversationId: string, content: string) => void;
  appendConversationStreaming: (conversationId: string, content: string) => void;
  addToolCallToConversation: (conversationId: string, toolCall: ToolCall) => void;
  updateToolCallInConversation: (conversationId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
  setConversationOrchestrationStatus: (conversationId: string, status: string | null) => void;
  clearConversationMessages: (conversationId: string) => void;
  updateConversationContext: (conversationId: string, contextTokens: number, maxContextTokens?: number) => void;
  saveConversation: (conversationId: string) => Promise<boolean>;
  saveAllConversations: () => Promise<void>;
  loadSavedConversations: (workspacePath: string) => Promise<void>;
  setConversationMode: (conversationId: string, mode: 'code' | 'architect' | 'review' | 'security' | 'debug') => void;
  
  // Past Chats Actions
  listSavedConversations: () => Promise<void>;
  openPastChat: (conversationId: string) => Promise<boolean>;
  clearPastChats: () => void;
  
  // Legacy actions (deprecated - kept for backwards compatibility during migration)
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setIsProcessing: (processing: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void;
  setOrchestrationStatus: (status: string | null) => void;
  
  // Global Agent Actions
  setModel: (model: string, provider: string) => void;
  setAvailableModels: (models: Array<{ id: string; name: string; provider: string; available: boolean }>) => void;
  setAvailableProviders: (providers: Array<{ name: string; available: boolean; models: string[] }>) => void;
  setCost: (totalCost: number, inputTokens: number, outputTokens: number) => void;
  
  // File Actions
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  openSettings: () => void;
  openBrowser: (url: string, title?: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  setProjectPath: (path: string) => void;
  setFiles: (files: Array<{ name: string; isDirectory: boolean; path: string }>) => void;
  toggleDir: (path: string) => void;
  loadDirectory: (path: string) => Promise<void>;
  openFolder: () => Promise<void>;
  createFolder: () => Promise<void>;
  openRecentWorkspace: (path: string) => Promise<void>;

  // Rollback Actions
  rollbackToMessage: (conversationId: string, messageId: string) => Promise<{ success: boolean; restoredFiles: string[]; failedFiles: string[] }>;
  getMessageFileChanges: (conversationId: string, messageId: string) => Promise<FileChange[]>;
  hasMessageFileChanges: (conversationId: string, messageId: string) => Promise<boolean>;
}

// Helper to generate auto-title from first user message
function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/);
  const titleWords = words.slice(0, 4);
  let title = titleWords.join(' ');
  if (words.length > 4 || firstMessage.length > 30) {
    title = title.substring(0, 30);
    if (title.length === 30) title += '...';
  }
  return title || 'New Chat';
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial UI State
  sidebarVisible: true,
  chatVisible: true,
  activePanel: 'chat',
  theme: 'dark',
  isAppInitialized: false,
  
  // Initial Multi-Conversation State
  conversations: [],
  activeConversationId: null,
  
  // Initial Past Chats State
  pastChats: [],
  pastChatsLoaded: false,
  
  // Initial Global Agent State
  currentModel: 'claude-sonnet-4-5',
  currentProvider: 'anthropic',
  availableModels: [],
  availableProviders: [],
  totalCost: 0,
  inputTokens: 0,
  outputTokens: 0,
  maxContextTokens: 128000, // Default to 128k tokens
  
  // Initial File State
  openFiles: [],
  activeFilePath: null,
  projectPath: '',
  files: [],
  expandedDirs: new Set(),
  
  // Initial File History Popup State
  fileHistoryPopupVisible: false,
  fileHistoryPopupPinned: false,

  // Initial Indexing State
  indexingState: {
    status: 'idle',
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    indexedChunks: 0,
    lastSyncAt: null,
    lastError: null,
    isSemanticSearchReady: false,
  },
  indexingPollInterval: null,

  // UI Actions
  toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
  toggleChat: () => set(state => ({ chatVisible: !state.chatVisible })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setTheme: (theme) => set({ theme }),
  setAppInitialized: (initialized) => set({ isAppInitialized: initialized }),
  
  // File History Popup Actions
  showFileHistoryPopup: () => set({ fileHistoryPopupVisible: true }),
  hideFileHistoryPopup: () => set({ fileHistoryPopupVisible: false }),
  toggleFileHistoryPopup: () => set(state => ({ fileHistoryPopupVisible: !state.fileHistoryPopupVisible })),
  pinFileHistoryPopup: (pinned) => set({ fileHistoryPopupPinned: pinned }),

  // Indexing Actions
  startIndexing: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      await window.electronAPI.indexing.start(state.projectPath);
      // Start polling for updates
      get().setIndexingPollInterval(window.setInterval(() => {
        get().refreshIndexingState();
      }, 1000));
    } catch (error) {
      console.error('Failed to start indexing:', error);
    }
  },

  stopIndexing: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      await window.electronAPI.indexing.stop(state.projectPath);
      // Clear poll interval
      if (state.indexingPollInterval) {
        clearInterval(state.indexingPollInterval);
        set({ indexingPollInterval: null });
      }
    } catch (error) {
      console.error('Failed to stop indexing:', error);
    }
  },

  reindexProject: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      await window.electronAPI.indexing.reindex(state.projectPath);
      // Start polling for updates
      get().setIndexingPollInterval(window.setInterval(() => {
        get().refreshIndexingState();
      }, 1000));
    } catch (error) {
      console.error('Failed to reindex project:', error);
    }
  },

  clearIndex: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      await window.electronAPI.indexing.clear(state.projectPath);
      set(state => ({
        indexingState: {
          ...state.indexingState,
          status: 'idle',
          progress: 0,
          isSemanticSearchReady: false,
        },
      }));
    } catch (error) {
      console.error('Failed to clear index:', error);
    }
  },

  refreshIndexingState: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      const result = await window.electronAPI.indexing.getState(state.projectPath);
      if (result.state) {
        const newState = result.state;
        set({ indexingState: newState });

        // If indexing is complete or errored, stop polling
        if (newState.status === 'complete' || newState.status === 'error') {
          if (state.indexingPollInterval) {
            clearInterval(state.indexingPollInterval);
            set({ indexingPollInterval: null });
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh indexing state:', error);
    }
  },

  setIndexingPollInterval: (interval) => set({ indexingPollInterval: interval }),

  // Multi-Conversation Actions
  createConversation: (options) => {
    const state = get();
    const id = crypto.randomUUID();
    const newConversation: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      isProcessing: false,
      streamingContent: '',
      toolCalls: [],
      orchestrationStatus: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDirty: false,
      // Use provided model/provider or fall back to global defaults
      model: options?.model || state.currentModel,
      provider: options?.provider || state.currentProvider,
      mode: options?.mode || 'code', // Default to code mode
      maxContextTokens: state.maxContextTokens || 128000, // Default to 128k if not set
    };

    set(state => ({
      conversations: [...state.conversations, newConversation],
      activeConversationId: id,
    }));

    // Create the conversation in the main process with model info
    window.electronAPI?.agent.createConversation(id, newConversation.model, newConversation.provider).catch(console.error);

    return id;
  },

  setConversationMode: (conversationId, mode) => {
    // Update the conversation's mode in the store
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, mode, updatedAt: Date.now(), isDirty: true }
          : c
      ),
    }));

    // Notify the main process to set the mode for this conversation
    window.electronAPI?.agent.setMode?.(conversationId, mode).catch(console.error);
  },

  switchConversationModel: (conversationId, model, provider) => {
    // Update the conversation's model in the store
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, model, provider, updatedAt: Date.now(), isDirty: true }
          : c
      ),
    }));

    // Also update the global current model for new conversations
    set({ currentModel: model, currentProvider: provider });

    // Notify the main process to switch the model for this conversation
    window.electronAPI?.agent.switchModel(conversationId, model, provider).catch(console.error);
  },

  setActiveConversation: (id) => {
    const state = get();
    const conversation = state.conversations.find(c => c.id === id);

    set({
      activeConversationId: id,
      // Sync global model to match the selected conversation's model
      ...(conversation && {
        currentModel: conversation.model || state.currentModel,
        currentProvider: conversation.provider || state.currentProvider,
      }),
    });

    // Also notify the main process to switch the model for this conversation
    if (conversation?.model && conversation?.provider) {
      window.electronAPI?.agent.switchModel(id, conversation.model, conversation.provider)
        .catch(console.error);
    }
  },
  
  closeConversation: (id) => {
    const state = get();
    const newConversations = state.conversations.filter(c => c.id !== id);

    // If we closed the active conversation, switch to another one
    let newActiveId = state.activeConversationId;
    if (state.activeConversationId === id) {
      newActiveId = newConversations.length > 0
        ? newConversations[newConversations.length - 1].id
        : null;
    }

    // Update state immediately (synchronous)
    set({
      conversations: newConversations,
      activeConversationId: newActiveId,
    });

    // Close the conversation in the main process (async, non-blocking)
    window.electronAPI?.agent.closeConversation(id).catch(console.error);

    // Delete the saved chat file from disk (this chat was manually closed and should not reappear)
    if (state.projectPath) {
      window.electronAPI?.chatStorage?.deleteConversation(state.projectPath, id)
        .then(() => {
          console.log(`[closeConversation] Deleted saved chat file and file history for ${id}`);
        })
        .catch((error) => {
          console.error('[closeConversation] Failed to delete saved chat:', error);
        });
    }
  },
  
  renameConversation: (id, title) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    ),
  })),
  
  addMessageToConversation: (conversationId, message) => set(state => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) return state;

    // Auto-generate title from first user message
    let title = conversation.title;
    if (title === 'New Chat' && message.role === 'user' && conversation.messages.length === 0) {
      title = generateConversationTitle(typeof message.content === 'string'
        ? message.content
        : '');
    }

    return {
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], title, streamingContent: '', updatedAt: Date.now(), isDirty: true }
          : c
      ),
    };
  }),
  
  updateMessageInConversation: (conversationId, messageId, updates) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId 
        ? { ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, ...updates } : m), updatedAt: Date.now() }
        : c
    ),
  })),
  
  setConversationProcessing: (conversationId, processing) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId ? { ...c, isProcessing: processing, updatedAt: Date.now() } : c
    ),
  })),
  
  setConversationStreaming: (conversationId, content) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId ? { ...c, streamingContent: content, updatedAt: Date.now() } : c
    ),
  })),
  
  appendConversationStreaming: (conversationId, content) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId 
        ? { ...c, streamingContent: c.streamingContent + content, updatedAt: Date.now() } 
        : c
    ),
  })),
  
  addToolCallToConversation: (conversationId, toolCall) => set(state => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, toolCalls: [...c.toolCalls, toolCall], updatedAt: Date.now(), isDirty: true }
        : c
    ),
  })),
  
  updateToolCallInConversation: (conversationId, toolCallId, updates) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId 
        ? { ...c, toolCalls: c.toolCalls.map(t => t.id === toolCallId ? { ...t, ...updates } : t), updatedAt: Date.now() }
        : c
    ),
  })),
  
  setConversationOrchestrationStatus: (conversationId, status) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId ? { ...c, orchestrationStatus: status, updatedAt: Date.now() } : c
    ),
  })),
  
  clearConversationMessages: (conversationId) => set(state => ({
    conversations: state.conversations.map(c => 
      c.id === conversationId 
        ? { ...c, messages: [], toolCalls: [], streamingContent: '', orchestrationStatus: null, updatedAt: Date.now(), isDirty: true }
        : c
    ),
  })),

  updateConversationContext: (conversationId, contextTokens, maxContextTokens) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, contextTokens, maxContextTokens: maxContextTokens ?? c.maxContextTokens, updatedAt: Date.now() }
          : c
      ),
    }));
  },

  saveConversation: async (conversationId: string) => {
    const state = get();
    const conversation = state.conversations.find(c => c.id === conversationId);
    const workspacePath = state.projectPath;

    if (!conversation || !workspacePath || !window.electronAPI?.chatStorage) {
      return false;
    }

    try {
      const result = await window.electronAPI.chatStorage.saveConversation(workspacePath, conversation);
      if (result.success) {
        // Mark as saved (not dirty)
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, isDirty: false } : c
          ),
        }));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      return false;
    }
  },

  saveAllConversations: async () => {
    const state = get();
    const workspacePath = state.projectPath;

    if (!workspacePath || !window.electronAPI?.chatStorage) {
      return;
    }

    // Save all dirty conversations
    const dirtyConversations = state.conversations.filter(c => c.isDirty);
    for (const conv of dirtyConversations) {
      try {
        await window.electronAPI.chatStorage.saveConversation(workspacePath, conv);
      } catch (error) {
        console.error(`Failed to save conversation ${conv.id}:`, error);
      }
    }

    // Mark all as saved
    set(state => ({
      conversations: state.conversations.map(c => ({ ...c, isDirty: false })),
    }));
  },

  loadSavedConversations: async (workspacePath: string) => {
    if (!workspacePath || !window.electronAPI?.chatStorage) {
      return;
    }

    try {
      const result = await window.electronAPI.chatStorage.loadConversations(workspacePath);
      if (result.error) {
        console.error('Failed to load conversations:', result.error);
        return;
      }

      if (result.conversations.length > 0) {
        const currentState = get();
        // Convert loaded conversations to full Conversation objects
        const loadedConversations: Conversation[] = result.conversations.map((saved: any) => ({
          id: saved.id,
          title: saved.title || 'New Chat',
          messages: saved.messages || [],
          toolCalls: saved.toolCalls || [],
          createdAt: saved.createdAt || Date.now(),
          updatedAt: saved.updatedAt || Date.now(),
          isProcessing: false,
          streamingContent: '',
          orchestrationStatus: null,
          isDirty: false,
          // Restore model/provider if saved, otherwise use global defaults
          model: saved.model || currentState.currentModel,
          provider: saved.provider || currentState.currentProvider,
          // Restore mode if saved, otherwise default to 'code'
          mode: saved.mode || 'code',
          // Restore context tokens if saved, otherwise set from current settings
          contextTokens: saved.contextTokens,
          maxContextTokens: saved.maxContextTokens || currentState.maxContextTokens || 128000,
        }));

        // Set the loaded conversations
        set({
          conversations: loadedConversations,
          activeConversationId: loadedConversations[0]?.id || null,
        });

        // Create conversations in the main process with their specific models and modes
        for (const conv of loadedConversations) {
          await window.electronAPI.agent.createConversation(conv.id, conv.model, conv.provider).catch(console.error);
          // Restore the mode for this conversation
          if (conv.mode && conv.mode !== 'code') {
            await window.electronAPI.agent.setMode(conv.id, conv.mode).catch(console.error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved conversations:', error);
    }
  },

  // Past Chats Actions
  listSavedConversations: async () => {
    const state = get();
    const workspacePath = state.projectPath;

    if (!workspacePath || !window.electronAPI?.chatStorage?.listConversations) {
      set({ pastChats: [], pastChatsLoaded: true });
      return;
    }

    try {
      const result = await window.electronAPI.chatStorage.listConversations(workspacePath);
      if (result.error) {
        console.error('Failed to list conversations:', result.error);
        set({ pastChats: [], pastChatsLoaded: true });
        return;
      }

      set({
        pastChats: result.conversations || [],
        pastChatsLoaded: true,
      });
    } catch (error) {
      console.error('Failed to list saved conversations:', error);
      set({ pastChats: [], pastChatsLoaded: true });
    }
  },

  openPastChat: async (conversationId: string) => {
    const state = get();
    const workspacePath = state.projectPath;

    if (!workspacePath || !window.electronAPI?.chatStorage?.loadConversations) {
      return false;
    }

    // Check if already open
    if (state.conversations.some(c => c.id === conversationId)) {
      set({ activeConversationId: conversationId });
      return true;
    }

    try {
      // Load all conversations and find the one we want
      const result = await window.electronAPI.chatStorage.loadConversations(workspacePath);
      if (result.error) {
        console.error('Failed to load conversation:', result.error);
        return false;
      }

      const saved = result.conversations.find((c: any) => c.id === conversationId);
      if (!saved) {
        console.error('Conversation not found:', conversationId);
        return false;
      }

      // Convert to full Conversation object
      const loadedConversation: Conversation = {
        id: saved.id,
        title: saved.title || 'New Chat',
        messages: saved.messages || [],
        toolCalls: saved.toolCalls || [],
        createdAt: saved.createdAt || Date.now(),
        updatedAt: saved.updatedAt || Date.now(),
        isProcessing: false,
        streamingContent: '',
        orchestrationStatus: null,
        isDirty: false,
        model: saved.model || state.currentModel,
        provider: saved.provider || state.currentProvider,
        mode: saved.mode || 'code',
        maxContextTokens: saved.maxContextTokens || state.maxContextTokens || 128000,
      };

      // Add to conversations and activate
      set({
        conversations: [...state.conversations, loadedConversation],
        activeConversationId: conversationId,
      });

      // Create in main process and restore mode
      await window.electronAPI.agent.createConversation(
        conversationId,
        loadedConversation.model,
        loadedConversation.provider
      ).catch(console.error);

      // Restore the mode for this conversation
      if (loadedConversation.mode && loadedConversation.mode !== 'code') {
        await window.electronAPI.agent.setMode(conversationId, loadedConversation.mode).catch(console.error);
      }

      return true;
    } catch (error) {
      console.error('Failed to open past chat:', error);
      return false;
    }
  },

  clearPastChats: () => {
    set({ pastChats: [], pastChatsLoaded: false });
  },
  
  // Legacy Actions (deprecated - delegate to active conversation for backwards compatibility)
  addMessage: (message) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().addMessageToConversation(activeId, message);
    }
  },
  
  updateMessage: (id, updates) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().updateMessageInConversation(activeId, id, updates);
    }
  },
  
  clearMessages: () => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().clearConversationMessages(activeId);
    }
  },
  
  setIsProcessing: (processing) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().setConversationProcessing(activeId, processing);
    }
  },
  
  setStreamingContent: (content) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().setConversationStreaming(activeId, content);
    }
  },
  
  appendStreamingContent: (content) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().appendConversationStreaming(activeId, content);
    }
  },
  
  addToolCall: (toolCall) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().addToolCallToConversation(activeId, toolCall);
    }
  },
  
  updateToolCall: (id, updates) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().updateToolCallInConversation(activeId, id, updates);
    }
  },
  
  setOrchestrationStatus: (status) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().setConversationOrchestrationStatus(activeId, status);
    }
  },
  
  // Global Agent Actions
  setModel: (model, provider) => set({ currentModel: model, currentProvider: provider }),
  
  setAvailableModels: (models) => set({ availableModels: models }),
  
  setAvailableProviders: (providers) => set({ availableProviders: providers }),
  
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

  openBrowser: (url: string, title?: string) => {
    const state = get();

    // Check if this URL is already open
    const existingBrowser = state.openFiles.find(f => f.type === 'browser' && f.path === url);
    if (existingBrowser) {
      set({ activeFilePath: url });
      return;
    }

    // Create browser tab entry
    const browserFile: OpenFile = {
      path: url,
      content: '',
      originalContent: '',
      isDirty: false,
      type: 'browser',
      url: url,
    };

    set(state => ({
      openFiles: [...state.openFiles, browserFile],
      activeFilePath: url,
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

      // Start automatic indexing after directory is loaded
      setTimeout(() => {
        const state = get();
        if (state.projectPath === dirPath) {
          state.startIndexing();
        }
      }, 1000); // Small delay to let UI settle
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

      // Close all existing conversations
      const { conversations } = get();
      for (const conv of conversations) {
        await window.electronAPI.agent.closeConversation(conv.id).catch(console.error);
      }

      // Clear existing state
      set({
        files: [],
        expandedDirs: new Set(),
        projectPath: result.path,
        conversations: [],
        activeConversationId: null,
        openFiles: [],
        activeFilePath: null,
      });

      // Add to recent workspaces
      await window.electronAPI.settings.addRecentWorkspace(result.path);

      // Load the new directory
      await get().loadDirectory(result.path);

      // Load saved conversations for this workspace
      await get().loadSavedConversations(result.path);

      // If no conversations were loaded, create a new one
      const state = get();
      if (state.conversations.length === 0) {
        const initialId = crypto.randomUUID();
        const initialConversation: Conversation = {
          id: initialId,
          title: 'New Chat',
          messages: [],
          isProcessing: false,
          streamingContent: '',
          toolCalls: [],
          orchestrationStatus: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDirty: false,
          model: state.currentModel,
          provider: state.currentProvider,
          maxContextTokens: state.maxContextTokens || 128000,
        };

        set({
          conversations: [initialConversation],
          activeConversationId: initialId,
        });

        await window.electronAPI.agent.createConversation(initialId, initialConversation.model, initialConversation.provider).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  },

  createFolder: async () => {
    try {
      const result = await window.electronAPI.dialog.createFolder();

      if (result.canceled || !result.path) {
        if (result.error) {
          console.error('Failed to create folder:', result.error);
        }
        return;
      }

      // Update working directory in main process
      await window.electronAPI.config.setCwd(result.path);

      // Close all existing conversations
      const { conversations } = get();
      for (const conv of conversations) {
        await window.electronAPI.agent.closeConversation(conv.id).catch(console.error);
      }

      // Clear existing state
      set({
        files: [],
        expandedDirs: new Set(),
        projectPath: result.path,
        conversations: [],
        activeConversationId: null,
        openFiles: [],
        activeFilePath: null,
      });

      // Add to recent workspaces
      await window.electronAPI.settings.addRecentWorkspace(result.path);

      // Load the new directory
      await get().loadDirectory(result.path);

      // Load saved conversations for this workspace
      await get().loadSavedConversations(result.path);

      // If no conversations were loaded, create a new one
      const state = get();
      if (state.conversations.length === 0) {
        const initialId = crypto.randomUUID();
        const initialConversation: Conversation = {
          id: initialId,
          title: 'New Chat',
          messages: [],
          isProcessing: false,
          streamingContent: '',
          toolCalls: [],
          orchestrationStatus: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDirty: false,
          model: state.currentModel,
          provider: state.currentProvider,
          maxContextTokens: state.maxContextTokens || 128000,
        };

        set({
          conversations: [initialConversation],
          activeConversationId: initialId,
        });

        await window.electronAPI.agent.createConversation(initialId, initialConversation.model, initialConversation.provider).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  },

  openRecentWorkspace: async (path: string) => {
    try {
      // Update working directory in main process
      await window.electronAPI.config.setCwd(path);

      // Close all existing conversations
      const { conversations } = get();
      for (const conv of conversations) {
        await window.electronAPI.agent.closeConversation(conv.id).catch(console.error);
      }

      // Clear existing state first
      set({
        files: [],
        expandedDirs: new Set(),
        projectPath: path,
        openFiles: [],
        activeFilePath: null,
        conversations: [],
        activeConversationId: null,
        pastChats: [],
        pastChatsLoaded: false,
      });

      // Add to recent workspaces (moves to top)
      await window.electronAPI.settings.addRecentWorkspace(path);

      // Load the directory
      await get().loadDirectory(path);

      // Load saved conversations for this workspace
      await get().loadSavedConversations(path);

      // If no conversations were loaded, create a new one
      const state = get();
      if (state.conversations.length === 0) {
        const initialId = crypto.randomUUID();
        const initialConversation: Conversation = {
          id: initialId,
          title: 'New Chat',
          messages: [],
          isProcessing: false,
          streamingContent: '',
          toolCalls: [],
          orchestrationStatus: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDirty: false,
          model: state.currentModel,
          provider: state.currentProvider,
          maxContextTokens: state.maxContextTokens || 128000,
        };

        set({
          conversations: [initialConversation],
          activeConversationId: initialId,
        });

        await window.electronAPI.agent.createConversation(initialId, initialConversation.model, initialConversation.provider).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to open recent workspace:', error);
    }
  },

  // Rollback Actions
  rollbackToMessage: async (conversationId, messageId) => {
    try {
      const result = await window.electronAPI!.file.restore(conversationId, messageId);
      if (result.success) {
        // Refresh the file explorer to show restored files
        const { projectPath, loadDirectory } = get();
        if (projectPath) {
          await loadDirectory(projectPath);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to rollback:', error);
      return { success: false, restoredFiles: [], failedFiles: [] };
    }
  },

  getMessageFileChanges: async (conversationId, messageId) => {
    try {
      const result = await window.electronAPI!.file.getChanges(conversationId, messageId);
      return result.changes || [];
    } catch (error) {
      console.error('Failed to get file changes:', error);
      return [];
    }
  },

  hasMessageFileChanges: async (conversationId, messageId) => {
    try {
      const result = await window.electronAPI!.file.hasChanges(conversationId, messageId);
      return result.hasChanges;
    } catch (error) {
      console.error('Failed to check file changes:', error);
      return false;
    }
  },
}));
