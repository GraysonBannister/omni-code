import { create } from 'zustand';
import type { ContentBlock, MessageMetadata } from '../../src/core/message-types.js';
import type { Workspace, WorkspaceSummary, CreateWorkspaceOptions } from '../../src/types/workspace.js';
import type { ChangePreviewData } from '../types/changeReview';

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
  reasoning?: string; // AI thinking/reasoning content
  timestamp: number;
  metadata?: MessageMetadata;
  fileChanges?: FileChange[];
  fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; extension?: string }>;
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
  messageId?: string;
}

export interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isLoading?: boolean;
  type?: 'file' | 'settings' | 'browser';
  url?: string; // For browser tabs
  viewMode?: 'code' | 'preview' | 'split'; // For HTML files - toggle between code, preview, and split
  splitConfig?: {
    ratio: number; // 0.0 to 1.0, default 0.5
    orientation: 'horizontal' | 'vertical'; // horizontal = left/right, vertical = top/bottom
  };
}

// Planning mode types
export type PlanningApproach = 'one-shot' | 'iterative';

export interface PendingPlanFile {
  path: string;
  action: 'create' | 'modify' | 'delete';
  reason: string;
}

export interface PendingPlanStep {
  id: string;
  title: string;
  description: string;
  files?: string[];
}

export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface PendingPlan {
  title: string;
  goal: string;
  files: PendingPlanFile[];
  steps: PendingPlanStep[];
  risks?: string[];
  questions?: string[];
  stepStatuses?: Record<string, PlanStepStatus>;
}

// Multi-tab conversation support - each conversation is isolated
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  isProcessing: boolean;
  streamingContent: string;
  streamingReasoning?: string; // Live thinking content during streaming (for -thinking models)
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
  planningApproach?: PlanningApproach; // Planning strategy when in architect mode
  pendingPlan?: PendingPlan | null; // Plan awaiting approval in architect mode
  planSourceMessageId?: string | null; // ID of the assistant message that produced the plan
  planFilePath?: string | null; // Absolute path to the .omnicode/plan.json file on disk
  pendingChangePreviews?: Map<string, ChangePreviewData[]>; // Pending change review previews keyed by message ID
  revertedAtUserMessageId?: string; // Set when the user has reverted a turn; messages after this ID are grayed out
}

// Terminal Session for multi-terminal support
export interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  createdAt: number;
}

export type SidebarTab = 'files' | 'git' | 'addons';

interface AppState {
  // UI State
  sidebarVisible: boolean;
  activeSidebarTab: SidebarTab;
  chatVisible: boolean;
  terminalVisible: boolean;
  activePanel: 'chat' | 'terminal' | 'settings';
  theme: 'dark' | 'light';
  isAppInitialized: boolean; // Track if app has finished initial setup (settings loaded, etc.)

  // Multi-Terminal State
  terminals: TerminalSession[];
  activeTerminalId: string | null;

  // Multi-Conversation State (replaces single conversation state)
  conversations: Conversation[];
  activeConversationId: string | null;

  // Past Chats State (for on-demand loading)
  pastChats: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>;
  pastChatsLoaded: boolean;

  // Workspace State (NEW - multi-project support)
  currentWorkspace: Workspace | null; // Current multi-project workspace
  activeFolderId: string | null; // Currently active folder within workspace
  recentFolders: string[]; // Recent single folders (backward compat)
  recentWorkspaces: string[]; // Recent workspace files
  workspaceList: WorkspaceSummary[]; // All saved workspaces
  isWorkspaceMode: boolean; // Whether we're in workspace mode vs single folder mode

  // Global Agent State (shared across conversations)
  currentModel: string;
  currentProvider: string;
  allModels: Array<{ id: string; name: string; provider: string; available: boolean; maxContextWindow?: number }>; // full unfiltered list
  availableModels: Array<{ id: string; name: string; provider: string; available: boolean; maxContextWindow?: number }>;
  availableProviders: Array<{ name: string; available: boolean; models: string[] }>;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  maxContextTokens: number; // Global default for max context tokens

  // File State
  openFiles: OpenFile[];
  activeFilePath: string | null;
  projectPath: string; // Kept for backward compatibility - will be derived from workspace
  files: Array<{ name: string; isDirectory: boolean; path: string }>;
  expandedDirs: Set<string>;

  // File History Popup State
  fileHistoryPopupVisible: boolean;
  fileHistoryPopupPinned: boolean;

  // Pending Change Review State (keyed by absolute filePath)
  pendingFilePreviews: Map<string, ChangePreviewData>;
  setFilePendingPreview: (filePath: string, preview: ChangePreviewData) => void;
  clearFilePendingPreview: (filePath: string) => void;
  clearAllFilePendingPreviews: () => void;

  // Reviewed tool call IDs — updated immediately when the user accepts/rejects
  // from either the editor or the chat panel, so both surfaces stay in sync.
  reviewedToolCallIds: Map<string, 'accepted' | 'rejected'>;
  markToolCallReviewed: (toolCallId: string, status: 'accepted' | 'rejected') => void;
  clearReviewedToolCallIds: () => void;

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
  setActiveSidebarTab: (tab: SidebarTab) => void;
  toggleChat: () => void;
  toggleTerminal: () => void;
  setActivePanel: (panel: 'chat' | 'terminal' | 'settings') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAppInitialized: (initialized: boolean) => void;
  
  // Terminal Actions (multi-tab support)
  createTerminal: (cwd?: string) => string;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  updateTerminalTitle: (id: string, title: string) => void;
  
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
  setConversationStreamingReasoning: (conversationId: string, reasoning: string) => void;
  appendConversationStreamingReasoning: (conversationId: string, delta: string) => void;
  clearConversationStreamingReasoning: (conversationId: string) => void;
  addToolCallToConversation: (conversationId: string, toolCall: ToolCall) => void;
  updateToolCallInConversation: (conversationId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
  setConversationOrchestrationStatus: (conversationId: string, status: string | null) => void;
  clearConversationMessages: (conversationId: string) => void;
  updateConversationContext: (conversationId: string, contextTokens: number, maxContextTokens?: number) => void;
  saveConversation: (conversationId: string) => Promise<boolean>;
  saveAllConversations: () => Promise<void>;
  loadSavedConversations: (workspacePath: string) => Promise<void>;
  setConversationMode: (conversationId: string, mode: 'code' | 'architect' | 'review' | 'security' | 'debug') => void;
  setPlanningApproach: (conversationId: string, approach: PlanningApproach) => void;
  setPendingPlan: (conversationId: string, plan: PendingPlan | null, sourceMessageId?: string | null) => void;
  setPlanFilePath: (conversationId: string, filePath: string | null) => void;
  updatePendingPlanStepStatus: (conversationId: string, stepId: string, status: PlanStepStatus) => void;
  setPendingChangePreviews: (conversationId: string, previews: Map<string, ChangePreviewData[]>) => void;
  setConversationRevertedAt: (conversationId: string, userMessageId: string | undefined) => void;
  truncateMessagesAfter: (conversationId: string, userMessageId: string) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

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
  setStreamingReasoning: (reasoning: string) => void;
  appendStreamingReasoning: (delta: string) => void;
  clearStreamingReasoning: () => void;
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void;
  setOrchestrationStatus: (status: string | null) => void;
  
  // Global Agent Actions
  setModel: (model: string, provider: string) => void;
  setAllModels: (models: Array<{ id: string; name: string; provider: string; available: boolean; maxContextWindow?: number }>) => void;
  setAvailableModels: (models: Array<{ id: string; name: string; provider: string; available: boolean; maxContextWindow?: number }>) => void;
  setAvailableProviders: (providers: Array<{ name: string; available: boolean; models: string[] }>) => void;
  setCost: (totalCost: number, inputTokens: number, outputTokens: number) => void;
  
  // File Actions
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  openSettings: () => void;
  openBrowser: (url: string, title?: string) => void;
  updateBrowserUrl: (path: string, newUrl: string) => void;
  closeBrowserTab: (url: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  setProjectPath: (path: string) => void;
  setFiles: (files: Array<{ name: string; isDirectory: boolean; path: string }>) => void;
  toggleDir: (path: string) => void;
  loadDirectory: (path: string) => Promise<void>;
  openFolder: () => Promise<void>;
  createFolder: () => Promise<void>;
  openRecentWorkspace: (path: string) => Promise<void>;
  setFileViewMode: (path: string, mode: 'code' | 'preview' | 'split') => void;
  setSplitRatio: (path: string, ratio: number) => void;
  setSplitOrientation: (path: string, orientation: 'horizontal' | 'vertical') => void;

  // Workspace Actions (NEW - multi-project support)
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setActiveFolder: (folderId: string | null) => void;
  createWorkspace: (options: CreateWorkspaceOptions) => Promise<Workspace | null>;
  openWorkspace: (filePath: string) => Promise<boolean>;
  saveWorkspace: () => Promise<boolean>;
  closeWorkspace: () => Promise<void>;
  returnToMenu: () => Promise<void>;
  addFolderToWorkspace: (folderPath: string, folderName?: string) => Promise<boolean>;
  removeFolderFromWorkspace: (folderId: string) => Promise<boolean>;
  renameWorkspace: (newName: string) => Promise<boolean>;
  exportWorkspace: (targetDir: string) => Promise<boolean>;
  importWorkspace: (sourceDir: string) => Promise<Workspace | null>;
  loadSavedWorkspaces: () => Promise<void>;
  setWorkspaceMode: (isWorkspaceMode: boolean) => void;
  setRecentWorkspaces: (workspaces: string[]) => void;
  setRecentFolders: (folders: string[]) => void;
  loadWorkspaceConversations: (workspace: Workspace) => Promise<void>;
  saveWorkspaceConversation: (conversationId: string) => Promise<boolean>;

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
  activeSidebarTab: 'files' as SidebarTab,
  chatVisible: true,
  terminalVisible: false,
  activePanel: 'chat',
  theme: 'dark',
  isAppInitialized: false,
  
  // Initial Multi-Conversation State
  conversations: [],
  activeConversationId: null,
  
  // Initial Multi-Terminal State
  terminals: [],
  activeTerminalId: null,
  
  // Initial Past Chats State
  pastChats: [],
  pastChatsLoaded: false,
  
  // Initial Global Agent State (will be set dynamically after loading models)
  currentModel: '',
  currentProvider: '',
  allModels: [],
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

  // Initial Pending Change Review State
  pendingFilePreviews: new Map(),
  reviewedToolCallIds: new Map(),

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

  // Initial Workspace State (NEW)
  currentWorkspace: null,
  activeFolderId: null,
  recentFolders: [],
  recentWorkspaces: [],
  workspaceList: [],
  isWorkspaceMode: false,

  // UI Actions
  toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  toggleChat: () => set(state => ({ chatVisible: !state.chatVisible })),
  toggleTerminal: () => set(state => ({ terminalVisible: !state.terminalVisible })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setTheme: (theme) => set({ theme }),
  setAppInitialized: (initialized) => set({ isAppInitialized: initialized }),

  // Workspace Actions (NEW - multi-project support)
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace, isWorkspaceMode: !!workspace }),
  setActiveFolder: (folderId) => {
    const state = get();
    const folder = state.currentWorkspace?.folders.find(f => f.id === folderId);
    if (folder) {
      const workspace = state.currentWorkspace!;
      // Update workspace context so AI knows the new active folder (while keeping all folders visible)
      window.electronAPI?.config?.setWorkspaceContext(
        folder.path,
        workspace.name,
        workspace.folders
      ).catch(err => {
        console.error('[setActiveFolder] Failed to set workspace context:', err);
      });
      set({
        activeFolderId: folderId,
        projectPath: folder.path,
      });
    } else {
      set({ activeFolderId: folderId });
    }
  },
  setWorkspaceMode: (isWorkspaceMode) => set({ isWorkspaceMode }),
  setRecentWorkspaces: (workspaces) => set({ recentWorkspaces: workspaces }),
  setRecentFolders: (folders) => set({ recentFolders: folders }),

  createWorkspace: async (options) => {
    try {
      const result = await window.electronAPI?.workspace?.create(options);
      if (result?.success && result.workspace) {
        const firstFolder = result.workspace.folders[0];
        const firstFolderPath = firstFolder?.path || '';
        set({
          currentWorkspace: result.workspace,
          isWorkspaceMode: true,
          activeFolderId: firstFolder?.id || null,
          projectPath: firstFolderPath,
        });

        // Track the workspace file path in recents so it appears on the welcome screen
        // result.filePath is the user-chosen save path returned by the IPC handler
        if (result.filePath) {
          await window.electronAPI?.settings?.addRecentWorkspace(result.filePath);
          const prev = get().recentWorkspaces;
          set({ recentWorkspaces: [result.filePath, ...prev.filter(w => w !== result.filePath)] });
        }

        // Tell the AI about the full workspace — all folders, not just the first
        if (firstFolderPath && result.workspace.folders.length > 0) {
          console.log('[createWorkspace] Setting workspace context:', result.workspace.name, result.workspace.folders.length, 'folders');
          await window.electronAPI?.config?.setWorkspaceContext(
            firstFolderPath,
            result.workspace.name,
            result.workspace.folders
          );
        }

        // Create initial conversation for workspace
        const convId = get().createConversation();
        set({ activeConversationId: convId });

        return result.workspace;
      }
      return null;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      return null;
    }
  },

  openWorkspace: async (filePath) => {
    try {
      const result = await window.electronAPI?.workspace?.loadFromFile(filePath);
      if (result?.success && result.workspace) {
        // Close current conversations
        get().conversations.forEach(c => {
          if (window.electronAPI?.agent) {
            window.electronAPI.agent.closeConversation(c.id);
          }
        });

        const firstFolderPath = result.workspace.folders[0]?.path || '';
        set({
          currentWorkspace: result.workspace,
          isWorkspaceMode: true,
          activeFolderId: result.workspace.folders[0]?.id || null,
          projectPath: firstFolderPath,
          conversations: [],
          pastChats: [],
        });

        // Tell the AI about the full workspace — all folders, not just the first
        if (firstFolderPath && result.workspace.folders.length > 0) {
          console.log('[openWorkspace] Setting workspace context:', result.workspace.name, result.workspace.folders.length, 'folders');
          await window.electronAPI?.config?.setWorkspaceContext(
            firstFolderPath,
            result.workspace.name,
            result.workspace.folders
          );
        }

        // Load workspace conversations
        await get().loadWorkspaceConversations(result.workspace);

        // Add to recent workspaces
        await window.electronAPI?.settings?.addRecentWorkspace(filePath);
        const prev = get().recentWorkspaces;
        set({ recentWorkspaces: [filePath, ...prev.filter(w => w !== filePath)] });

        // If no conversations were loaded, create a new one
        const state = get();
        if (state.conversations.length === 0) {
          const convId = get().createConversation();
          set({ activeConversationId: convId });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to open workspace:', error);
      return false;
    }
  },

  saveWorkspace: async () => {
    const state = get();
    if (!state.currentWorkspace) return false;

    try {
      const result = await window.electronAPI?.workspace?.update(state.currentWorkspace);
      return result?.success || false;
    } catch (error) {
      console.error('Failed to save workspace:', error);
      return false;
    }
  },

  closeWorkspace: async () => {
    const state = get();
    if (!state.currentWorkspace) return;

    try {
      // Save all conversations before closing
      await get().saveAllConversations();

      // Close workspace indexer
      await window.electronAPI?.workspace?.indexing?.close(state.currentWorkspace.id);

      // Clear workspace context from AI
      await window.electronAPI?.config?.clearWorkspaceContext();

      // Clear workspace state
      set({
        currentWorkspace: null,
        isWorkspaceMode: false,
        activeFolderId: null,
        conversations: [],
        activeConversationId: null,
        projectPath: '',
        files: [],
      });
    } catch (error) {
      console.error('Failed to close workspace:', error);
    }
  },

  returnToMenu: async () => {
    const state = get();

    try {
      // Save all conversations before returning to menu
      await state.saveAllConversations();

      // Close workspace if active
      if (state.currentWorkspace) {
        await window.electronAPI?.workspace?.indexing?.close(state.currentWorkspace.id);
      }

      // Clear all project-related state and return to welcome screen
      set({
        projectPath: null,
        currentWorkspace: null,
        isWorkspaceMode: false,
        activeFolderId: null,
        openFiles: [],
        activeFilePath: null,
        files: [],
        expandedDirs: new Set(),
        fileSearchResults: [],
        fileSearchQuery: '',
        conversations: [],
        activeConversationId: null,
        gitStatus: {
          current: null,
          tracking: null,
          ahead: 0,
          behind: 0,
          staged: [],
          modified: [],
          not_added: [],
          conflicted: [],
          deleted: [],
          renamed: [],
          created: [],
        },
        browserTabs: [],
        activeBrowserTab: null,
        // Reset visibility to defaults
        sidebarVisible: true,
        chatVisible: true,
        terminalVisible: false,
        activeSidebarTab: 'files',
        // Reset other state
        contextPanelOpen: false,
        contextFileInput: '',
        selectedContextFiles: [],
        mentionQuery: null,
        mentionSearchResults: [],
        selectedMentionIndex: -1,
        fileHistory: {},
        currentChangePreview: null,
        changeReviewPanelOpen: false,
        changeReviewPanelMode: 'all',
        orchestrationStatus: {
          isRunning: false,
          currentStep: null,
          totalSteps: null,
          completedSteps: [],
          failedSteps: [],
          paused: false,
        },
        pendingPlan: null,
        isPlanningMode: false,
        planningApproach: 'iterative',
        isGeneratingPlan: false,
        pendingUserInputRequest: null,
        fileChangeSinceLastVisit: {},
      });

      // Close all indexers
      await window.electronAPI?.indexing?.closeAll?.();
    } catch (error) {
      console.error('Failed to return to menu:', error);
    }
  },

  addFolderToWorkspace: async (folderPath, folderName) => {
    const state = get();
    if (!state.currentWorkspace) return false;

    try {
      const result = await window.electronAPI?.workspace?.addFolder(
        state.currentWorkspace.id,
        folderPath,
        folderName
      );
      if (result?.success && result.workspace) {
        // If this was the first folder added, set it as active and update working directory
        const wasFirstFolder = state.currentWorkspace.folders.length === 0;
        set({ currentWorkspace: result.workspace });
        if (wasFirstFolder && result.workspace.folders.length > 0) {
          const firstFolder = result.workspace.folders[0];
          set({
            activeFolderId: firstFolder.id,
            projectPath: firstFolder.path,
          });
          await window.electronAPI?.config?.setCwd(firstFolder.path);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add folder to workspace:', error);
      return false;
    }
  },

  removeFolderFromWorkspace: async (folderId) => {
    const state = get();
    if (!state.currentWorkspace) return false;

    try {
      const result = await window.electronAPI?.workspace?.removeFolder(
        state.currentWorkspace.id,
        folderId
      );
      if (result?.success && result.workspace) {
        set({ currentWorkspace: result.workspace });
        // If we removed the active folder, switch to another one
        if (state.activeFolderId === folderId) {
          const newActiveFolder = result.workspace.folders[0] || null;
          set({
            activeFolderId: newActiveFolder?.id || null,
            projectPath: newActiveFolder?.path || '',
          });
          // Update working directory to the new active folder
          if (newActiveFolder?.path) {
            await window.electronAPI?.config?.setCwd(newActiveFolder.path);
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove folder from workspace:', error);
      return false;
    }
  },

  renameWorkspace: async (newName) => {
    const state = get();
    if (!state.currentWorkspace) return false;

    try {
      const result = await window.electronAPI?.workspace?.rename(
        state.currentWorkspace.id,
        newName
      );
      if (result?.success && result.workspace) {
        set({ currentWorkspace: result.workspace });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to rename workspace:', error);
      return false;
    }
  },

  exportWorkspace: async (targetDir) => {
    const state = get();
    if (!state.currentWorkspace) return false;

    try {
      const result = await window.electronAPI?.workspace?.export(
        state.currentWorkspace.id,
        targetDir
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to export workspace:', error);
      return false;
    }
  },

  importWorkspace: async (sourceDir) => {
    try {
      const result = await window.electronAPI?.workspace?.import(sourceDir);
      if (result?.success && result.workspace) {
        await get().openWorkspace(result.workspace.filePath || '');
        return result.workspace;
      }
      return null;
    } catch (error) {
      console.error('Failed to import workspace:', error);
      return null;
    }
  },

  loadSavedWorkspaces: async () => {
    try {
      const result = await window.electronAPI?.workspace?.list();
      if (result?.workspaces) {
        set({ workspaceList: result.workspaces });
      }
    } catch (error) {
      console.error('Failed to load saved workspaces:', error);
    }
  },

  loadWorkspaceConversations: async (workspace) => {
    try {
      const result = await window.electronAPI?.workspace?.chat?.load(workspace);
      if (result?.conversations) {
        const loadedConversations: Conversation[] = result.conversations.map((saved: any) => ({
          id: saved.id,
          title: saved.title || 'New Chat',
          messages: saved.messages || [],
          toolCalls: saved.toolCalls || [],
          createdAt: saved.createdAt || Date.now(),
          updatedAt: saved.updatedAt || Date.now(),
          model: saved.model,
          provider: saved.provider,
          contextTokens: saved.contextTokens,
          maxContextTokens: saved.maxContextTokens,
          mode: saved.mode,
          planningApproach: saved.planningApproach,
          pendingPlan: saved.pendingPlan ?? null,
          planSourceMessageId: saved.planSourceMessageId ?? null,
          // Reset runtime state
          isProcessing: false,
          streamingContent: '',
          orchestrationStatus: null,
        }));

        set({ conversations: loadedConversations });

        // Activate the most recent conversation
        if (loadedConversations.length > 0) {
          const mostRecent = loadedConversations.reduce((a, b) =>
            (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a
          );
          set({ activeConversationId: mostRecent.id });

          // Initialize agent for all loaded conversations and restore their history
          if (window.electronAPI?.agent) {
            for (const conv of loadedConversations) {
              await window.electronAPI.agent.createConversation(conv.id, conv.model, conv.provider);
              if (conv.messages.length > 0) {
                await window.electronAPI.agent.restoreHistory(conv.id, conv.messages).catch(console.error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workspace conversations:', error);
    }
  },

  saveWorkspaceConversation: async (conversationId) => {
    const state = get();
    if (!state.currentWorkspace) return false;

    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) return false;

    try {
      // Save via workspace chat API
      const result = await window.electronAPI?.workspace?.chat?.save(
        state.currentWorkspace,
        conversation
      );
      return result?.success || false;
    } catch (error) {
      console.error('Failed to save workspace conversation:', error);
      return false;
    }
  },

  // Terminal Actions (multi-tab support)
  createTerminal: (cwd) => {
    const id = crypto.randomUUID();
    const state = get();
    const title = cwd ? cwd.split('/').pop() || 'Terminal' : 'Terminal';
    const session: TerminalSession = { id, title, cwd: cwd || state.projectPath || '/', createdAt: Date.now() };
    set(state => ({ 
      terminals: [...state.terminals, session],
      activeTerminalId: id 
    }));
    return id;
  },
  closeTerminal: (id) => set(state => {
    const newTerminals = state.terminals.filter(t => t.id !== id);
    // Also destroy the PTY session
    if (window.electronAPI?.terminal) {
      window.electronAPI.terminal.destroy(id);
    }
    return {
      terminals: newTerminals,
      activeTerminalId: state.activeTerminalId === id 
        ? newTerminals[newTerminals.length - 1]?.id || null 
        : state.activeTerminalId
    };
  }),
  setActiveTerminal: (id) => set({ activeTerminalId: id }),
  updateTerminalTitle: (id, title) => set(state => ({
    terminals: state.terminals.map(t => t.id === id ? { ...t, title } : t)
  })),
  
  // File History Popup Actions
  showFileHistoryPopup: () => set({ fileHistoryPopupVisible: true }),
  hideFileHistoryPopup: () => set({ fileHistoryPopupVisible: false }),
  toggleFileHistoryPopup: () => set(state => ({ fileHistoryPopupVisible: !state.fileHistoryPopupVisible })),
  pinFileHistoryPopup: (pinned) => set({ fileHistoryPopupPinned: pinned }),

  // Pending Change Review Actions
  setFilePendingPreview: (filePath, preview) => set(state => {
    const next = new Map(state.pendingFilePreviews);
    next.set(filePath, preview);
    return { pendingFilePreviews: next };
  }),
  clearFilePendingPreview: (filePath) => set(state => {
    const next = new Map(state.pendingFilePreviews);
    next.delete(filePath);
    return { pendingFilePreviews: next };
  }),
  clearAllFilePendingPreviews: () => set({ pendingFilePreviews: new Map() }),

  // Reviewed Tool Call Actions
  markToolCallReviewed: (toolCallId, status) => set(state => {
    const next = new Map(state.reviewedToolCallIds);
    next.set(toolCallId, status);
    return { reviewedToolCallIds: next };
  }),
  clearReviewedToolCallIds: () => set({ reviewedToolCallIds: new Map() }),

  // Indexing Actions
  startIndexing: async () => {
    const state = get();
    if (!state.projectPath || !window.electronAPI?.indexing) return;

    try {
      await window.electronAPI.indexing.start(state.projectPath);
      const existing = get().indexingPollInterval;
      if (existing) clearInterval(existing);
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
      const existing = get().indexingPollInterval;
      if (existing) clearInterval(existing);
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

  setIndexingPollInterval: (interval) => {
    const existing = get().indexingPollInterval;
    if (existing) clearInterval(existing);
    set({ indexingPollInterval: interval });
  },

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

  setPlanningApproach: (conversationId, approach) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, planningApproach: approach, updatedAt: Date.now() }
          : c
      ),
    }));
  },

  setPendingPlan: (conversationId, plan, sourceMessageId) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? {
              ...c,
              pendingPlan: plan,
              planSourceMessageId: plan === null ? null : (sourceMessageId ?? c.planSourceMessageId),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
  },

  setPlanFilePath: (conversationId, filePath) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, planFilePath: filePath, updatedAt: Date.now() }
          : c
      ),
    }));
  },

  updatePendingPlanStepStatus: (conversationId, stepId, status) => {
    set(state => ({
      conversations: state.conversations.map(c => {
        if (c.id !== conversationId || !c.pendingPlan) return c;
        return {
          ...c,
          pendingPlan: {
            ...c.pendingPlan,
            stepStatuses: {
              ...(c.pendingPlan.stepStatuses ?? {}),
              [stepId]: status,
            },
          },
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  setPendingChangePreviews: (conversationId, previews) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, pendingChangePreviews: previews, updatedAt: Date.now(), isDirty: true }
          : c
      ),
    }));
  },

  setConversationRevertedAt: (conversationId, userMessageId) => set(state => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, revertedAtUserMessageId: userMessageId, updatedAt: Date.now(), isDirty: true }
        : c
    ),
  })),

  truncateMessagesAfter: (conversationId, userMessageId) => set(state => ({
    conversations: state.conversations.map(c => {
      if (c.id !== conversationId) return c;
      const idx = c.messages.findIndex(m => m.id === userMessageId);
      if (idx < 0) return c;
      return { ...c, messages: c.messages.slice(0, idx + 1), revertedAtUserMessageId: undefined, updatedAt: Date.now(), isDirty: true };
    }),
  })),

  removeMessage: (conversationId, messageId) => set(state => ({
    conversations: state.conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now(), isDirty: true };
    }),
  })),

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
    if (state.isWorkspaceMode && state.currentWorkspace) {
      window.electronAPI?.workspace?.chat?.delete(state.currentWorkspace, id)
        .then(() => {
          console.log(`[closeConversation] Deleted workspace chat file for ${id}`);
        })
        .catch((error) => {
          console.error('[closeConversation] Failed to delete workspace chat:', error);
        });
    } else if (state.projectPath) {
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
    if (!conversation) {
      console.warn(`[AppStore] addMessageToConversation: conversation ${conversationId} not found in store (${state.conversations.length} conversations: [${state.conversations.map(c => c.id).join(', ')}])`);
      return state;
    }

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

  setConversationStreamingReasoning: (conversationId, reasoning) => set(state => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, streamingReasoning: reasoning, updatedAt: Date.now() }
        : c
    ),
  })),

  appendConversationStreamingReasoning: (conversationId, delta) => set(state => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, streamingReasoning: (c.streamingReasoning || '') + delta, updatedAt: Date.now() }
        : c
    ),
  })),

  clearConversationStreamingReasoning: (conversationId) => set(state => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, streamingReasoning: undefined, updatedAt: Date.now() }
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

    // Handle workspace mode
    if (state.isWorkspaceMode && state.currentWorkspace) {
      return state.saveWorkspaceConversation(conversationId);
    }

    // Handle project mode (backward compatibility)
    const projectPath = state.projectPath;
    if (!conversation || !projectPath || !window.electronAPI?.chatStorage) {
      return false;
    }

    try {
      const result = await window.electronAPI.chatStorage.saveConversation(projectPath, conversation);
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

    // Handle workspace mode
    if (state.isWorkspaceMode && state.currentWorkspace) {
      const dirtyConversations = state.conversations.filter(c => c.isDirty);
      for (const conv of dirtyConversations) {
        await state.saveWorkspaceConversation(conv.id);
      }
      // Mark all as saved
      set(state => ({
        conversations: state.conversations.map(c => ({ ...c, isDirty: false })),
      }));
      return;
    }

    // Handle project mode (backward compatibility)
    const projectPath = state.projectPath;
    if (!projectPath || !window.electronAPI?.chatStorage) {
      return;
    }

    // Save all dirty conversations
    const dirtyConversations = state.conversations.filter(c => c.isDirty);
    for (const conv of dirtyConversations) {
      try {
        await window.electronAPI.chatStorage.saveConversation(projectPath, conv);
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
          // Restore planning state
          planningApproach: saved.planningApproach,
          pendingPlan: saved.pendingPlan ?? null,
          planSourceMessageId: saved.planSourceMessageId ?? null,
          pendingChangePreviews: saved.pendingChangePreviews instanceof Map
            ? saved.pendingChangePreviews
            : new Map(saved.pendingChangePreviews ?? []),
        }));

        // Set the loaded conversations
        set({
          conversations: loadedConversations,
          activeConversationId: loadedConversations[0]?.id || null,
        });

        // Create conversations in the main process with their specific models and modes
        for (const conv of loadedConversations) {
          await window.electronAPI.agent.createConversation(conv.id, conv.model, conv.provider).catch(console.error);
          // Restore message history into agent context so AI has full conversation awareness
          if (conv.messages.length > 0) {
            await window.electronAPI.agent.restoreHistory(conv.id, conv.messages).catch(console.error);
          }
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
        // Restore planning state
        planningApproach: saved.planningApproach,
        pendingPlan: saved.pendingPlan ?? null,
        planSourceMessageId: saved.planSourceMessageId ?? null,
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

      // Restore message history into agent context so AI has full conversation awareness
      if (loadedConversation.messages.length > 0) {
        await window.electronAPI.agent.restoreHistory(conversationId, loadedConversation.messages).catch(console.error);
      }

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

  setStreamingReasoning: (reasoning) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().setConversationStreamingReasoning(activeId, reasoning);
    }
  },

  appendStreamingReasoning: (delta) => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().appendConversationStreamingReasoning(activeId, delta);
    }
  },

  clearStreamingReasoning: () => {
    const state = get();
    const activeId = state.activeConversationId;
    if (activeId) {
      get().clearConversationStreamingReasoning(activeId);
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

  setAllModels: (models) => set({ allModels: models }),

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

  updateBrowserUrl: (path, newUrl) => set(state => {
    // Update the URL of an existing browser tab
    const updatedFiles = state.openFiles.map(f => {
      if (f.path === path && f.type === 'browser') {
        return { ...f, path: newUrl, url: newUrl };
      }
      return f;
    });
    
    // If the active file was the one being updated, update activeFilePath too
    const newActivePath = state.activeFilePath === path ? newUrl : state.activeFilePath;
    
    return { openFiles: updatedFiles, activeFilePath: newActivePath };
  }),

  closeBrowserTab: (url) => set(state => ({
    openFiles: state.openFiles.filter(f => !(f.type === 'browser' && f.path === url)),
    activeFilePath: state.activeFilePath === url ? null : state.activeFilePath,
  })),

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

  setFileViewMode: (path, mode) => set(state => ({
    openFiles: state.openFiles.map(f =>
      f.path === path
        ? { ...f, viewMode: mode, splitConfig: f.splitConfig || { ratio: 0.5, orientation: 'horizontal' } }
        : f
    ),
  })),

  setSplitRatio: (path, ratio) => set(state => ({
    openFiles: state.openFiles.map(f =>
      f.path === path
        ? { ...f, splitConfig: { ...f.splitConfig, ratio: Math.max(0.1, Math.min(0.9, ratio)) } }
        : f
    ),
  })),

  setSplitOrientation: (path, orientation) => set(state => ({
    openFiles: state.openFiles.map(f =>
      f.path === path
        ? { ...f, splitConfig: { ...f.splitConfig, orientation } }
        : f
    ),
  })),

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

      // Unwatch previous directory before watching new one
      const prevPath = get().projectPath;
      if (prevPath && prevPath !== dirPath) {
        await window.electronAPI.file.unwatch(prevPath).catch(() => {});
      }

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

      // Add to recent folders and update store
      await window.electronAPI.settings.addRecentFolder(result.path);
      const updatedFolders = await window.electronAPI.settings.getRecentFolders();
      set({ recentFolders: updatedFolders.value || [] });

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

      // Add to recent folders and update store
      await window.electronAPI.settings.addRecentFolder(result.path);
      const updatedFolders = await window.electronAPI.settings.getRecentFolders();
      set({ recentFolders: updatedFolders.value || [] });

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
      // Check if this is a workspace file or a regular folder
      const isWorkspaceFile = path.endsWith('.omnicode-workspace');

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

      // Add to appropriate recent list and update store
      if (isWorkspaceFile) {
        await window.electronAPI.settings.addRecentWorkspace(path);
        const updatedWorkspaces = await window.electronAPI.settings.getRecentWorkspaces();
        set({ recentWorkspaces: updatedWorkspaces.value || [] });
      } else {
        await window.electronAPI.settings.addRecentFolder(path);
        const updatedFolders = await window.electronAPI.settings.getRecentFolders();
        set({ recentFolders: updatedFolders.value || [] });
      }

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

// Subscribe to browser IPC events from the main process
// This should be called once when the app initializes
export function subscribeToBrowserEvents(): () => void {
  const { openBrowser, updateBrowserUrl, closeBrowserTab, closeFile } = useAppStore.getState();
  
  // Listen for browser open events from AI
  const unsubscribeOpen = window.electronAPI.browser.onOpen((event) => {
    console.log('[Browser] AI requested to open:', event.url);
    openBrowser(event.url, event.title);
  });
  
  // Listen for browser navigate events from AI
  const unsubscribeNavigate = window.electronAPI.browser.onNavigate((event) => {
    console.log('[Browser] AI requested navigate:', event.tabId, '->', event.url);
    // Close the old tab and open a new one (or update URL if we want to preserve state)
    // For now, we'll update the URL
    const state = useAppStore.getState();
    const existingTab = state.openFiles.find(f => f.type === 'browser' && f.path === event.tabId);
    if (existingTab) {
      // Close old tab and open new one with new URL
      closeBrowserTab(event.tabId);
      openBrowser(event.url);
    } else {
      // Just open the new URL
      openBrowser(event.url);
    }
  });
  
  // Listen for browser close events from AI
  const unsubscribeClose = window.electronAPI.browser.onClose((event) => {
    console.log('[Browser] AI requested close:', event.tabId);
    closeBrowserTab(event.tabId);
  });
  
  // Return cleanup function
  return () => {
    unsubscribeOpen();
    unsubscribeNavigate();
    unsubscribeClose();
  };
}
