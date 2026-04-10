import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API type for TypeScript
type AgentEvent =
  | { type: 'stream_delta'; delta: { type: 'text'; text?: string } }
  | { type: 'turn_complete'; message: unknown }
  | { type: 'tool_call_start'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolName: string; toolId: string; result: unknown }
  | { type: 'tool_call_progress'; toolName: string; toolId: string; message: string }
  | { type: 'tool_results_complete'; message: unknown }
  | { type: 'permission_request'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'permission_granted'; toolId: string }
  | { type: 'permission_denied'; toolId: string }
  | { type: 'file_change'; messageId: string; toolCallId: string; fileChanges: unknown[] }
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'error'; error: { message: string } }
  | { type: 'orchestration_task_start'; taskId: string; capability: string; description: string }
  | { type: 'orchestration_task_end'; taskId: string; success: boolean; durationMs: number }
  | { type: 'orchestration_complete'; summary: string }
  | { type: 'user_message'; message: { id: string; role: string; content: string | unknown[]; timestamp: number } };

// Extended agent event with conversation ID for multi-tab support
type ConversationAgentEvent = AgentEvent & { conversationId: string };

// Agent API - now conversation-scoped for multi-tab chat support
// Supports per-conversation model selection
type AgentAPI = {
  createConversation: (conversationId: string, model?: string, provider?: string) => Promise<boolean>;
  closeConversation: (conversationId: string) => Promise<boolean>;
  hasConversation: (conversationId: string) => Promise<boolean>;
  sendMessage: (conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>, images?: Array<{ mediaType: string; data: string }>) => Promise<void>;
  abort: (conversationId: string) => Promise<void>;
  switchModel: (conversationId: string, model: string, provider: string) => Promise<boolean>;
  onEvent: (callback: (event: ConversationAgentEvent) => void) => () => void;
  clearConversation: (conversationId: string) => Promise<void>;
  getTokenCount: (conversationId: string) => Promise<number>;
  restoreHistory: (conversationId: string, messages: unknown[]) => Promise<boolean>;
  setMode: (conversationId: string, mode: string) => Promise<{ success: boolean; mode: string }>;
  respondPermission: (toolId: string, decision: 'allow' | 'deny' | 'allowAlways') => Promise<{ success: boolean }>;
  respondUserInput: (requestId: string, response: string, cancelled: boolean) => Promise<{ success: boolean }>;
  setPermissionMode: (autoRunMode: string) => Promise<void>;
  setChangeReviewEnabled: (enabled: boolean) => Promise<void>;
  respondToChangeReview: (conversationId: string, messageId: string, toolCallId: string, decision: 'accept' | 'reject') => Promise<{ success: boolean }>;
  acceptAllChanges: (conversationId: string) => Promise<{ success: boolean; accepted: string[]; failed: Array<{ toolCallId: string; error: string }> }>;
  rejectAllChanges: (conversationId: string, messageId: string) => Promise<{ success: boolean; rejected: string[]; failed: Array<{ toolCallId: string; error: string }> }>;
};

// File change tracking interface for backup/restore
interface FileChange {
  messageId: string;
  toolCallId: string;
  filePath: string;
  beforeContent: string;
  afterContent?: string;
  timestamp: number;
  changeType: 'write' | 'edit' | 'delete';
}

// File API
type FileAPI = {
  read: (filePath: string) => Promise<{ content: string; error?: string }>;
  write: (filePath: string, content: string) => Promise<{
    success: boolean;
    error?: string;
    metadata?: {
      chunkCount: number;
      bytesWritten: number;
      verified: boolean;
      usedChunking: boolean;
    };
  }>;
  edit: (filePath: string, oldString: string, newString: string) => Promise<{ success: boolean; error?: string }>;
  list: (dirPath: string) => Promise<{ files: Array<{ name: string; isDirectory: boolean; path: string }>; error?: string }>;
  mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  delete: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  revealInFinder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  copyPath: (filePath: string, type: 'full' | 'relative', workspacePath: string) => Promise<{ success: boolean; error?: string }>;
  watch: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  unwatch: (dirPath: string) => Promise<void>;
  onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => () => void;
  backup: (conversationId: string, messageId: string, toolCallId: string, filePath: string, changeType: 'write' | 'edit' | 'delete') => Promise<{ success: boolean }>;
  restore: (conversationId: string, messageId: string) => Promise<{ success: boolean; restoredFiles: string[]; failedFiles: string[] }>;
  reapply: (conversationId: string, messageId: string) => Promise<{ success: boolean; restoredFiles: string[]; failedFiles: string[] }>;
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
  hasChanges: (conversationId: string, messageId: string) => Promise<{ hasChanges: boolean }>;
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
  searchContent: (projectPath: string, searchTerm: string) => Promise<{
    results: Array<{
      path: string;
      lineNumber: number;
      preview: string;
    }>;
    error?: string;
  }>;
};

// Tool API
type ToolAPI = {
  execute: (toolName: string, input: Record<string, unknown>) => Promise<{ result: unknown; error?: string }>;
  list: () => Promise<Array<{ name: string; description: string; category: string; permissionLevel: string }>>;
  getMetadata: (toolName: string) => Promise<{ name: string; description: string; category: string; permissionLevel: string } | null>;
};

// Config API
type ConfigAPI = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  getModels: () => Promise<Array<{ id: string; name: string; provider: string; available: boolean }>>;
  getProviders: () => Promise<Array<{ name: string; available: boolean; models: string[] }>>;
  setCwd: (cwd: string) => Promise<void>;
  getCwd: () => Promise<{ cwd: string }>;
};

// Window API
type WindowAPI = {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
};

// Dialog API
type DialogAPI = {
  openFolder: () => Promise<{ canceled: boolean; path: string | null }>;
  createFolder: () => Promise<{ canceled: boolean; path: string | null; error?: string }>;
};

// App API
type AppAPI = {
  platform: () => Promise<NodeJS.Platform>;
  version: () => Promise<string>;
  onBeforeQuit: (callback: (replyChannel: string) => Promise<void> | void) => () => void;
  onMenuAction: (callback: (action: string) => void) => () => void;
  onOpenRecent: (callback: (path: string) => void) => () => void;
  notifySaveComplete: (replyChannel?: string) => void;
  checkForUpdates: () => Promise<unknown>;
  installUpdate: () => Promise<void>;
  onUpdateAvailable: (callback: (info: { version: string }) => void) => () => void;
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void;
  newWindow: () => Promise<{ success: boolean }>;
};

// Settings API
type SettingsAPI = {
  get: (path: string) => Promise<{ value: any; error: string | null }>;
  getAll: () => Promise<{ value: any; error: string | null }>;
  set: (path: string, value: any) => Promise<{ success: boolean; error: string | null }>;
  reset: (path?: string) => Promise<{ success: boolean; error: string | null }>;
  addRecentFolder: (folderPath: string) => Promise<{ success: boolean; error: string | null }>;
  getRecentFolders: () => Promise<{ value: string[]; error: string | null }>;
  addRecentWorkspace: (workspacePath: string) => Promise<{ success: boolean; error: string | null }>;
  getRecentWorkspaces: () => Promise<{ value: string[]; error: string | null }>;
  getSystemSounds: () => Promise<{ value: { sounds: Array<{ value: string; label: string }>; os: string } | null; error: string | null }>;
  playTestSound: (soundId: string) => Promise<{ success: boolean; error: string | null }>;
};

// Chat Storage API
type ChatStorageAPI = {
  saveConversation: (workspacePath: string, conversation: unknown) => Promise<{ success: boolean; error?: string }>;
  loadConversations: (workspacePath: string) => Promise<{ conversations: unknown[]; error?: string }>;
  deleteConversation: (workspacePath: string, conversationId: string) => Promise<{ success: boolean; error?: string }>;
  listConversations: (workspacePath: string) => Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }>;
};

// Usage Tracking API
type UsageAPI = {
  get: (month?: string, workspacePath?: string) => Promise<{ usage?: unknown; error?: string }>;
  getSummary: (month?: string, workspacePath?: string) => Promise<{
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    byModel: Record<string, { cost: number; tokens: number }>;
    byProvider: Record<string, { cost: number; tokens: number }>;
    error?: string;
  }>;
  getAvailableMonths: (workspacePath?: string) => Promise<string[]>;
  setLimit: (month: string, limit: number) => Promise<{ success: boolean; error?: string }>;
  getLimits: () => Promise<Record<string, number>>;
  cleanup: (monthsToKeep?: number) => Promise<{ deleted: number; error?: string }>;
  export: (workspacePath?: string) => Promise<{ csv?: string; error?: string }>;
};

// Indexing API
type IndexingState = {
  status: 'idle' | 'indexing' | 'complete' | 'error' | 'paused';
  progress: number;
  totalFiles: number;
  processedFiles: number;
  indexedChunks: number;
  lastSyncAt: number | null;
  lastError: string | null;
  isSemanticSearchReady: boolean;
};

type IndexChunk = {
  id: string;
  content: string;
  metadata: {
    file: string;
    startLine: number;
    endLine: number;
    type: string;
    name?: string;
    signature?: string;
    language: string;
    lastModified: number;
  };
  timestamp: string;
  type: string;
};

type IndexingAPI = {
  start: (projectPath: string) => Promise<{ success: boolean; error: string | null }>;
  reindex: (projectPath: string) => Promise<{ success: boolean; error: string | null }>;
  stop: (projectPath: string) => Promise<{ success: boolean; error: string | null }>;
  getState: (projectPath: string) => Promise<{ state: IndexingState | null; error: string | null }>;
  query: (projectPath: string, query: string, topK?: number) => Promise<{ results: IndexChunk[]; error: string | null }>;
  clear: (projectPath: string) => Promise<{ success: boolean; error: string | null }>;
  close: (projectPath: string) => Promise<{ success: boolean; error: string | null }>;
  closeAll: () => Promise<{ success: boolean; error: string | null }>;
};

// Notifications API
type NotificationsAPI = {
  requestSound: (type: 'user_input' | 'response_complete') => Promise<void>;
};

// Tray API for notification badge and navigation
type TrayAPI = {
  onNavigateToChat: (callback: (conversationId: string) => void) => () => void;
  onClearAll: (callback: () => void) => () => void;
  onNotificationCleared: (callback: (conversationId: string) => void) => () => void;
  onAllNotificationsCleared: (callback: () => void) => () => void;
  updateActiveConversation: (conversationId: string | null) => Promise<void>;
  updateRecentChats: (chats: Array<{ conversationId: string; title: string; lastActivity: number; messageCount: number; workspaceId?: string; projectPath?: string }>) => Promise<void>;
  updateOpenProject: (project: { workspaceId?: string; projectPath?: string; isWorkspaceMode: boolean } | null) => Promise<void>;
  clearNotification: (conversationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
};

// Dialogs API for file selection
type DialogsAPI = {
  selectSoundFile: () => Promise<{ filePath: string | null; error?: string }>;
};

// Terminal API
type TerminalAPI = {
  create: (id: string, cwd: string, cols: number, rows: number) => Promise<{ success: boolean; error?: string }>;
  write: (id: string, data: string) => Promise<void>;
  resize: (id: string, cols: number, rows: number) => Promise<void>;
  destroy: (id: string) => Promise<void>;
  onData: (callback: (event: { id: string; data: string }) => void) => () => void;
  onExit: (callback: (event: { id: string }) => void) => () => void;
};

// Browser API for AI-controlled browser tabs
type BrowserAPI = {
  open: (url: string, title?: string) => Promise<{ success: boolean; url: string; error?: string }>;
  navigate: (tabId: string, url: string) => Promise<{ success: boolean; tabId: string; url: string; error?: string }>;
  close: (tabId: string) => Promise<{ success: boolean; tabId: string; error?: string }>;
  onOpen: (callback: (event: { url: string; title?: string }) => void) => () => void;
  onNavigate: (callback: (event: { tabId: string; url: string }) => void) => () => void;
  onClose: (callback: (event: { tabId: string }) => void) => () => void;
  onScreenshotRequest: (callback: (event: { tabId: string }) => void) => () => void;
  sendScreenshotResponse: (tabId: string, dataUrl?: string, error?: string) => Promise<void>;
};

// Project Discovery API
type ProjectAPI = {
  scan: (dirs: string[]) => Promise<{ projects: string[] }>;
};

// Plan Creation API
type PlanFileData = {
  version: number;
  id: string;
  conversationId: string;
  title: string;
  goal: string;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  files: Array<{ path: string; action: 'create' | 'modify' | 'delete'; reason: string }>;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    files?: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt: string | null;
    completedAt: string | null;
  }>;
  risks: string[];
  questions: string[];
};

type PlanAPI = {
  startCreation: (conversationId: string, userRequest: string) => Promise<{ success: boolean; error?: string }>;
  submitAnswers: (conversationId: string, answers: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  approve: (conversationId: string, planFile: string) => Promise<{ success: boolean; error?: string }>;
  modify: (conversationId: string, planFile: string, modifications: string) => Promise<{ success: boolean; error?: string }>;
  reject: (conversationId: string) => Promise<{ success: boolean; error?: string }>;
  pauseExecution: (conversationId: string) => Promise<{ success: boolean; paused?: boolean; error?: string }>;
  resumeExecution: (conversationId: string) => Promise<{ success: boolean; error?: string }>;
  abortExecution: (conversationId: string) => Promise<{ success: boolean; error?: string }>;
  // Plan file methods
  createFile: (workspaceRoot: string, plan: { title: string; goal: string; files?: Array<{ path: string; action: string; reason: string }>; steps: Array<{ id: string; title: string; description: string; files?: string[] }>; risks?: string[]; questions?: string[] }, conversationId: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  updateStep: (filePath: string, stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed') => Promise<{ success: boolean; error?: string }>;
  markApproved: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: PlanFileData; error?: string }>;
  stopWatching: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  onFileChanged: (callback: (data: { conversationId: string; plan: PlanFileData }) => void) => () => void;
};

// Rules API
type RuleData = {
  id: string;
  filePath: string;
  frontmatter: {
    description?: string;
    globs?: string | string[];
    alwaysApply?: boolean;
  };
  content: string;
  enabled: boolean;
};

type RulesAPI = {
  list: () => Promise<{ rules: RuleData[]; error: string | null }>;
  save: (id: string, fullContent: string) => Promise<{ success: boolean; error: string | null }>;
  delete: (id: string) => Promise<{ success: boolean; error: string | null }>;
  toggle: (id: string, enabled: boolean) => Promise<{ success: boolean; error: string | null }>;
};

// Skills API
type SkillData = {
  id: string;
  dirPath: string;
  filePath: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
};

type SkillsAPI = {
  list: () => Promise<{ skills: SkillData[]; error: string | null }>;
  get: (id: string) => Promise<{ skill: SkillData | null; error: string | null }>;
  save: (id: string, content: string) => Promise<{ success: boolean; error: string | null }>;
  delete: (id: string) => Promise<{ success: boolean; error: string | null }>;
};

// Git API
type GitStatusResult = {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  not_added: string[];
  conflicted: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  created: string[];
};

type GitAPI = {
  isRepo: (cwd: string) => Promise<{ isRepo: boolean; error?: string }>;
  status: (cwd: string) => Promise<{ status: GitStatusResult | null; error?: string }>;
  stage: (cwd: string, files: string[]) => Promise<{ success: boolean; error?: string }>;
  stageAll: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  unstage: (cwd: string, files: string[]) => Promise<{ success: boolean; error?: string }>;
  commit: (cwd: string, message: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  push: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  pull: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  fetch: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  diffFile: (cwd: string, filePath: string, staged?: boolean) => Promise<{ diff: string; error?: string }>;
  discard: (cwd: string, files: string[]) => Promise<{ success: boolean; error?: string }>;
  branchList: (cwd: string) => Promise<{ branches: string[]; current: string; error?: string }>;
  checkout: (cwd: string, branch: string) => Promise<{ success: boolean; error?: string }>;
  createBranch: (cwd: string, name: string) => Promise<{ success: boolean; error?: string }>;
  log: (cwd: string, maxCount?: number) => Promise<{ commits: Array<{ hash: string; message: string; author: string; date: string }>; error?: string }>;
  init: (cwd: string) => Promise<{ success: boolean; error?: string }>;
};

// Remote Access API (hosting)
type RemoteServerStatus = {
  running: boolean;
  url: string | null;
  apiKey: string | null;
  port: number;
  connections: {
    totalConversations: number;
    totalConnections: number;
    conversations: string[];
  };
};

type RemoteAPI = {
  start: () => Promise<{ success: boolean; url?: string; apiKey?: string; error?: string }>;
  stop: () => Promise<{ success: boolean; error?: string }>;
  status: () => Promise<RemoteServerStatus>;
  regenerateApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string }>;
  generateQR: () => Promise<{ success: boolean; qrCodeDataUrl?: string; url?: string; error?: string }>;
};

// Remote Client API (connecting to a remote host)
type RemoteClientServerInfo = {
  version?: string;
  name?: string;
  workspacePath?: string;
};

type RemoteClientStatus = {
  connected: boolean;
  url: string | null;
  serverInfo: RemoteClientServerInfo | null;
  error: string | null;
};

type RemoteClientConnectResult = {
  success: boolean;
  error?: string;
  serverInfo?: RemoteClientServerInfo;
};

type RemoteClientTestResult = {
  success: boolean;
  error?: string;
  serverInfo?: RemoteClientServerInfo;
};

type RemoteClientAPI = {
  connect: (url: string, apiKey: string) => Promise<RemoteClientConnectResult>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  status: () => Promise<RemoteClientStatus>;
  testConnection: (url: string, apiKey: string) => Promise<RemoteClientTestResult>;
  onStatusChanged: (callback: (status: RemoteClientStatus) => void) => () => void;
};

// Custom Models API
type CustomModelsAPI = {
  testConnection: (config: { baseUrl: string; apiKey?: string }) => Promise<{ 
    success: boolean; 
    models?: string[]; 
    error?: string 
  }>;
};

// Main Electron API
type ElectronAPI = {
  agent: AgentAPI;
  file: FileAPI;
  tool: ToolAPI;
  config: ConfigAPI;
  dialog: DialogAPI;
  window: WindowAPI;
  app: AppAPI;
  settings: SettingsAPI;
  chatStorage: ChatStorageAPI;
  usage: UsageAPI;
  indexing: IndexingAPI;
  notifications: NotificationsAPI;
  tray: TrayAPI;
  dialogs: DialogsAPI;
  terminal: TerminalAPI;
  browser: BrowserAPI;
  remote: RemoteAPI;
  remoteClient: RemoteClientAPI;
  project: ProjectAPI;
  customModels: CustomModelsAPI;
  plan: PlanAPI;
  git: GitAPI;
  rules: RulesAPI;
  skills: SkillsAPI;
  addons: AddonsAPI;
};

interface AddonManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  download: string;
  entrypoint: string;
  tags?: string[];
  platforms?: string[];
  minOmniCodeVersion?: string;
  repo?: string;
}

interface AddonsAPI {
  list: () => Promise<{ manifests: AddonManifest[]; error: string | null }>;
  install: (manifest: AddonManifest) => Promise<{ success: boolean; error: string | null }>;
  uninstall: (id: string) => Promise<{ success: boolean; error: string | null }>;
}

// Expose APIs via contextBridge
const api: ElectronAPI = {
  agent: {
    createConversation: (conversationId: string, model?: string, provider?: string) =>
      ipcRenderer.invoke('agent:create-conversation', conversationId, model, provider),
    closeConversation: (conversationId: string) => ipcRenderer.invoke('agent:close-conversation', conversationId),
    hasConversation: (conversationId: string) => ipcRenderer.invoke('agent:has-conversation', conversationId),
    sendMessage: (conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>, images?: Array<{ mediaType: string; data: string }>) =>
      ipcRenderer.invoke('agent:send-message', conversationId, message, workingDirectory, fileReferences, images),
    abort: (conversationId: string) => ipcRenderer.invoke('agent:abort', conversationId),
    switchModel: (conversationId: string, model: string, provider: string) =>
      ipcRenderer.invoke('agent:switch-model', conversationId, model, provider),
    clearConversation: (conversationId: string) => ipcRenderer.invoke('agent:clear-conversation', conversationId),
    getTokenCount: (conversationId: string) => ipcRenderer.invoke('agent:get-token-count', conversationId),
    restoreHistory: (conversationId: string, messages: unknown[]) =>
      ipcRenderer.invoke('agent:restore-history', conversationId, messages),
    setMode: (conversationId, mode) => ipcRenderer.invoke('agent:set-mode', conversationId, mode),
    respondPermission: (toolId, decision) => ipcRenderer.invoke('agent:respond-permission', toolId, decision),
    respondUserInput: (requestId, response, cancelled) => ipcRenderer.invoke('agent:respond-user-input', requestId, response, cancelled),
    setPermissionMode: (autoRunMode) => ipcRenderer.invoke('agent:set-permission-mode', autoRunMode),
    setChangeReviewEnabled: (enabled: boolean) => ipcRenderer.invoke('agent:set-change-review-enabled', enabled),
    respondToChangeReview: (conversationId: string, messageId: string, toolCallId: string, decision: 'accept' | 'reject') =>
      ipcRenderer.invoke('changes:respond', conversationId, messageId, toolCallId, decision),
    acceptAllChanges: (conversationId: string) =>
      ipcRenderer.invoke('changes:accept-all', conversationId),
    rejectAllChanges: (conversationId: string, messageId: string) =>
      ipcRenderer.invoke('changes:reject-all', conversationId, messageId),
    onEvent: (callback: (event: ConversationAgentEvent) => void) => {
      const handler = (_: IpcRendererEvent, event: ConversationAgentEvent) => callback(event);
      ipcRenderer.on('agent:event', handler);
      return () => ipcRenderer.off('agent:event', handler);
    },
  },

  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    readBinary: (filePath: string) => ipcRenderer.invoke('file:readBinary', filePath),
    write: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
    edit: (filePath: string, oldString: string, newString: string) =>
      ipcRenderer.invoke('file:edit', filePath, oldString, newString),
    list: (dirPath: string) => ipcRenderer.invoke('file:list', dirPath),
    mkdir: (dirPath: string) => ipcRenderer.invoke('file:mkdir', dirPath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
    delete: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
    revealInFinder: (filePath: string) => ipcRenderer.invoke('file:revealInFinder', filePath),
    copyPath: (filePath: string, type: 'full' | 'relative', workspacePath: string) =>
      ipcRenderer.invoke('file:copyPath', filePath, type, workspacePath),
    watch: (dirPath: string) => ipcRenderer.invoke('file:watch', dirPath),
    unwatch: (dirPath: string) => ipcRenderer.invoke('file:unwatch', dirPath),
    onChange: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { type: 'add' | 'change' | 'unlink'; path: string }) => callback(event);
      ipcRenderer.on('file:change', handler);
      return () => ipcRenderer.off('file:change', handler);
    },
    backup: (conversationId, messageId, toolCallId, filePath, changeType) =>
      ipcRenderer.invoke('file:backup', conversationId, messageId, toolCallId, filePath, changeType),
    restore: (conversationId, messageId) =>
      ipcRenderer.invoke('file:restore', conversationId, messageId),
    reapply: (conversationId, messageId) =>
      ipcRenderer.invoke('file:reapply', conversationId, messageId),
    getChanges: (conversationId, messageId) =>
      ipcRenderer.invoke('file:getChanges', conversationId, messageId),
    getAllChanges: (conversationId) =>
      ipcRenderer.invoke('file:getAllChanges', conversationId),
    hasChanges: (conversationId, messageId) =>
      ipcRenderer.invoke('file:hasChanges', conversationId, messageId),
    getDiff: (conversationId, messageId, filePath) =>
      ipcRenderer.invoke('file:getDiff', conversationId, messageId, filePath),
    searchContent: (projectPath, searchTerm) =>
      ipcRenderer.invoke('file:searchContent', projectPath, searchTerm),
  },

  tool: {
    execute: (toolName: string, input: Record<string, unknown>) =>
      ipcRenderer.invoke('tool:execute', toolName, input),
    list: () => ipcRenderer.invoke('tool:list'),
    getMetadata: (toolName: string) => ipcRenderer.invoke('tools:get-metadata', toolName),
  },

  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    getModels: () => ipcRenderer.invoke('config:get-models'),
    getProviders: () => ipcRenderer.invoke('config:get-providers'),
    setCwd: (cwd: string) => ipcRenderer.invoke('config:set-cwd', cwd),
    getCwd: () => ipcRenderer.invoke('config:get-cwd'),
  },

  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
    createFolder: () => ipcRenderer.invoke('dialog:create-folder'),
  },

  settings: {
    get: (path: string) => ipcRenderer.invoke('settings:get', path),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (path: string, value: any) => ipcRenderer.invoke('settings:set', path, value),
    reset: (path?: string) => ipcRenderer.invoke('settings:reset', path),
    addRecentFolder: (folderPath: string) => ipcRenderer.invoke('settings:addRecentFolder', folderPath),
    getRecentFolders: () => ipcRenderer.invoke('settings:getRecentFolders'),
    addRecentWorkspace: (workspacePath: string) => ipcRenderer.invoke('settings:addRecentWorkspace', workspacePath),
    getRecentWorkspaces: () => ipcRenderer.invoke('settings:getRecentWorkspaces'),
    getSystemSounds: () => ipcRenderer.invoke('settings:getSystemSounds'),
    playTestSound: (soundId: string) => ipcRenderer.invoke('settings:playTestSound', soundId),
  },

  chatStorage: {
    saveConversation: (workspacePath: string, conversation: unknown) => ipcRenderer.invoke('chat:save', workspacePath, conversation),
    loadConversations: (workspacePath: string) => ipcRenderer.invoke('chat:load', workspacePath),
    deleteConversation: (workspacePath: string, conversationId: string) => ipcRenderer.invoke('chat:delete', workspacePath, conversationId),
    listConversations: (workspacePath: string) => ipcRenderer.invoke('chat:list', workspacePath),
  },

  usage: {
    get: (month?: string, workspacePath?: string) => ipcRenderer.invoke('usage:get', month, workspacePath),
    getSummary: (month?: string, workspacePath?: string) => ipcRenderer.invoke('usage:getSummary', month, workspacePath),
    getAvailableMonths: (workspacePath?: string) => ipcRenderer.invoke('usage:getAvailableMonths', workspacePath),
    setLimit: (month: string, limit: number) => ipcRenderer.invoke('usage:setLimit', month, limit),
    getLimits: () => ipcRenderer.invoke('usage:getLimits'),
    cleanup: (monthsToKeep?: number) => ipcRenderer.invoke('usage:cleanup', monthsToKeep),
    export: (workspacePath?: string) => ipcRenderer.invoke('usage:export', workspacePath),
  },

  customModels: {
    testConnection: (config: { baseUrl: string; apiKey?: string }) => 
      ipcRenderer.invoke('custom-models:test-connection', config),
  },

  indexing: {
    start: (projectPath: string) => ipcRenderer.invoke('indexing:start', projectPath),
    reindex: (projectPath: string) => ipcRenderer.invoke('indexing:reindex', projectPath),
    stop: (projectPath: string) => ipcRenderer.invoke('indexing:stop', projectPath),
    getState: (projectPath: string) => ipcRenderer.invoke('indexing:getState', projectPath),
    query: (projectPath: string, query: string, topK?: number) => ipcRenderer.invoke('indexing:query', projectPath, query, topK),
    clear: (projectPath: string) => ipcRenderer.invoke('indexing:clear', projectPath),
    close: (projectPath: string) => ipcRenderer.invoke('indexing:close', projectPath),
    closeAll: () => ipcRenderer.invoke('indexing:closeAll'),
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  app: {
    platform: () => ipcRenderer.invoke('app:platform'),
    version: () => ipcRenderer.invoke('app:version'),
    onBeforeQuit: (callback: (replyChannel: string) => void) => {
      const handler = (_: IpcRendererEvent, payload?: { replyChannel?: string }) => {
        callback(payload?.replyChannel ?? 'app:save-complete');
      };
      ipcRenderer.on('app:before-quit', handler);
      return () => ipcRenderer.off('app:before-quit', handler);
    },
    notifySaveComplete: (replyChannel?: string) => {
      ipcRenderer.invoke(replyChannel ?? 'app:save-complete');
    },
    checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
    newWindow: () => ipcRenderer.invoke('window:new'),
    onUpdateAvailable: (callback: (info: { version: string }) => void) => {
      const handler = (_: IpcRendererEvent, info: { version: string }) => callback(info);
      ipcRenderer.on('app:update-available', handler);
      return () => ipcRenderer.off('app:update-available', handler);
    },
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
      const handler = (_: IpcRendererEvent, info: { version: string }) => callback(info);
      ipcRenderer.on('app:update-downloaded', handler);
      return () => ipcRenderer.off('app:update-downloaded', handler);
    },
    onMenuAction: (callback: (action: string) => void) => {
      const handler = (_: IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on('menu:action', handler);
      // Listen to specific menu channels
      const menuChannels = [
        'menu:new-file', 'menu:open-folder', 'menu:close-folder', 'menu:close-workspace',
        'menu:save', 'menu:open-settings',
        'menu:toggle-sidebar', 'menu:toggle-chat',
        'menu:send-message', 'menu:abort', 'menu:clear-chat'
      ];
      menuChannels.forEach(channel => {
        ipcRenderer.on(channel, (_, ...args) => handler(_, channel.replace('menu:', '')));
      });
      return () => {
        ipcRenderer.off('menu:action', handler);
        menuChannels.forEach(channel => ipcRenderer.removeAllListeners(channel));
      };
    },
    onOpenRecent: (callback: (path: string) => void) => {
      const handler = (_: IpcRendererEvent, path: string) => callback(path);
      ipcRenderer.on('menu:open-recent', handler);
      return () => ipcRenderer.off('menu:open-recent', handler);
    },
  },

  notifications: {
    requestSound: (type: 'user_input' | 'response_complete') =>
      ipcRenderer.invoke('notification:request-sound', type),
  },

  dialogs: {
    selectSoundFile: () =>
      ipcRenderer.invoke('dialogs:select-sound-file'),
  },

  terminal: {
    create: (id: string, cwd: string, cols: number, rows: number) =>
      ipcRenderer.invoke('terminal:create', id, cwd, cols, rows),
    write: (id: string, data: string) =>
      ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.invoke('terminal:resize', id, cols, rows),
    destroy: (id: string) =>
      ipcRenderer.invoke('terminal:destroy', id),
    onData: (callback: (event: { id: string; data: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { id: string; data: string }) => callback(event);
      ipcRenderer.on('terminal:data', handler);
      return () => ipcRenderer.off('terminal:data', handler);
    },
    onExit: (callback: (event: { id: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { id: string }) => callback(event);
      ipcRenderer.on('terminal:exit', handler);
      return () => ipcRenderer.off('terminal:exit', handler);
    },
  },

  browser: {
    open: (url: string, title?: string) =>
      ipcRenderer.invoke('browser:open', url, title),
    navigate: (tabId: string, url: string) =>
      ipcRenderer.invoke('browser:navigate', tabId, url),
    close: (tabId: string) =>
      ipcRenderer.invoke('browser:close', tabId),
    onOpen: (callback: (event: { url: string; title?: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { url: string; title?: string }) => callback(event);
      ipcRenderer.on('browser:open', handler);
      return () => ipcRenderer.off('browser:open', handler);
    },
    onNavigate: (callback: (event: { tabId: string; url: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { tabId: string; url: string }) => callback(event);
      ipcRenderer.on('browser:navigate', handler);
      return () => ipcRenderer.off('browser:navigate', handler);
    },
    onClose: (callback: (event: { tabId: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { tabId: string }) => callback(event);
      ipcRenderer.on('browser:close', handler);
      return () => ipcRenderer.off('browser:close', handler);
    },
    onScreenshotRequest: (callback: (event: { tabId: string }) => void) => {
      const handler = (_: IpcRendererEvent, event: { tabId: string }) => callback(event);
      ipcRenderer.on('browser:request-screenshot', handler);
      return () => ipcRenderer.off('browser:request-screenshot', handler);
    },
    sendScreenshotResponse: (tabId: string, dataUrl?: string, error?: string) =>
      ipcRenderer.invoke('browser:screenshot-response', { tabId, dataUrl, error }),
  },

  remote: {
    start: () => ipcRenderer.invoke('remote:start'),
    stop: () => ipcRenderer.invoke('remote:stop'),
    status: () => ipcRenderer.invoke('remote:status'),
    regenerateApiKey: () => ipcRenderer.invoke('remote:regenerate-api-key'),
    generateQR: () => ipcRenderer.invoke('remote:generate-qr'),
  },

  remoteClient: {
    connect: (url: string, apiKey: string) =>
      ipcRenderer.invoke('remote-client:connect', url, apiKey),
    disconnect: () =>
      ipcRenderer.invoke('remote-client:disconnect'),
    status: () =>
      ipcRenderer.invoke('remote-client:status'),
    testConnection: (url: string, apiKey: string) =>
      ipcRenderer.invoke('remote-client:test-connection', url, apiKey),
    onStatusChanged: (callback: (status: RemoteClientStatus) => void) => {
      const handler = (_: IpcRendererEvent, status: RemoteClientStatus) => callback(status);
      ipcRenderer.on('remote-client:status-changed', handler);
      return () => ipcRenderer.off('remote-client:status-changed', handler);
    },
  },

  project: {
    scan: (dirs: string[]) => ipcRenderer.invoke('project:scan', dirs),
  },

  plan: {
    startCreation: (conversationId, userRequest) =>
      ipcRenderer.invoke('plan:start-creation', conversationId, userRequest),
    submitAnswers: (conversationId, answers) =>
      ipcRenderer.invoke('plan:submit-answers', conversationId, answers),
    approve: (conversationId, planFile) =>
      ipcRenderer.invoke('plan:approve', conversationId, planFile),
    modify: (conversationId, planFile, modifications) =>
      ipcRenderer.invoke('plan:modify', conversationId, planFile, modifications),
    reject: (conversationId) =>
      ipcRenderer.invoke('plan:reject', conversationId),
    pauseExecution: (conversationId) =>
      ipcRenderer.invoke('plan:pause-execution', conversationId),
    resumeExecution: (conversationId) =>
      ipcRenderer.invoke('plan:resume-execution', conversationId),
    abortExecution: (conversationId) =>
      ipcRenderer.invoke('plan:abort-execution', conversationId),
    // Plan file methods
    createFile: (workspaceRoot, plan, conversationId) =>
      ipcRenderer.invoke('plan:create-file', workspaceRoot, plan, conversationId),
    updateStep: (filePath, stepId, status) =>
      ipcRenderer.invoke('plan:update-step', filePath, stepId, status),
    markApproved: (filePath) =>
      ipcRenderer.invoke('plan:mark-approved', filePath),
    openFile: (filePath) =>
      ipcRenderer.invoke('plan:open-file', filePath),
    readFile: (filePath) =>
      ipcRenderer.invoke('plan:read-file', filePath),
    stopWatching: (filePath) =>
      ipcRenderer.invoke('plan:stop-watching', filePath),
    onFileChanged: (callback) => {
      const handler = (_: IpcRendererEvent, data: { conversationId: string; plan: PlanFileData }) => callback(data);
      ipcRenderer.on('plan:file-changed', handler);
      return () => ipcRenderer.off('plan:file-changed', handler);
    },
  },

  rules: {
    list: () => ipcRenderer.invoke('rules:list'),
    save: (id: string, fullContent: string) => ipcRenderer.invoke('rules:save', id, fullContent),
    delete: (id: string) => ipcRenderer.invoke('rules:delete', id),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('rules:toggle', id, enabled),
  },

  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    get: (id: string) => ipcRenderer.invoke('skills:get', id),
    save: (id: string, content: string) => ipcRenderer.invoke('skills:save', id, content),
    delete: (id: string) => ipcRenderer.invoke('skills:delete', id),
  },

  git: {
    isRepo: (cwd: string) => ipcRenderer.invoke('git:is-repo', cwd),
    status: (cwd: string) => ipcRenderer.invoke('git:status', cwd),
    stage: (cwd: string, files: string[]) => ipcRenderer.invoke('git:stage', cwd, files),
    stageAll: (cwd: string) => ipcRenderer.invoke('git:stage-all', cwd),
    unstage: (cwd: string, files: string[]) => ipcRenderer.invoke('git:unstage', cwd, files),
    commit: (cwd: string, message: string) => ipcRenderer.invoke('git:commit', cwd, message),
    push: (cwd: string) => ipcRenderer.invoke('git:push', cwd),
    pull: (cwd: string) => ipcRenderer.invoke('git:pull', cwd),
    fetch: (cwd: string) => ipcRenderer.invoke('git:fetch', cwd),
    diffFile: (cwd: string, filePath: string, staged?: boolean) =>
      ipcRenderer.invoke('git:diff-file', cwd, filePath, staged),
    discard: (cwd: string, files: string[]) => ipcRenderer.invoke('git:discard', cwd, files),
    branchList: (cwd: string) => ipcRenderer.invoke('git:branch-list', cwd),
    checkout: (cwd: string, branch: string) => ipcRenderer.invoke('git:checkout', cwd, branch),
    createBranch: (cwd: string, name: string) => ipcRenderer.invoke('git:create-branch', cwd, name),
    log: (cwd: string, maxCount?: number) => ipcRenderer.invoke('git:log', cwd, maxCount),
    init: (cwd: string) => ipcRenderer.invoke('git:init', cwd),
  },
  addons: {
    list: () => ipcRenderer.invoke('addons:list'),
    install: (manifest: AddonManifest) => ipcRenderer.invoke('addons:install', manifest),
    uninstall: (id: string) => ipcRenderer.invoke('addons:uninstall', id),
  },

  tray: {
    onNavigateToChat: (callback: (conversationId: string) => void) => {
      const handler = (_: IpcRendererEvent, conversationId: string) => callback(conversationId);
      ipcRenderer.on('tray:navigate-to-chat', handler);
      return () => ipcRenderer.off('tray:navigate-to-chat', handler);
    },
    onClearAll: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('tray:clear-all', handler);
      return () => ipcRenderer.off('tray:clear-all', handler);
    },
    onNotificationCleared: (callback: (conversationId: string) => void) => {
      const handler = (_: IpcRendererEvent, conversationId: string) => callback(conversationId);
      ipcRenderer.on('tray:notification-cleared', handler);
      return () => ipcRenderer.off('tray:notification-cleared', handler);
    },
    onAllNotificationsCleared: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('tray:all-notifications-cleared', handler);
      return () => ipcRenderer.off('tray:all-notifications-cleared', handler);
    },
    updateActiveConversation: (conversationId: string | null) =>
      ipcRenderer.invoke('tray:update-active', conversationId),
    updateRecentChats: (chats: Array<{ conversationId: string; title: string; lastActivity: number; messageCount: number; workspaceId?: string; projectPath?: string }>) =>
      ipcRenderer.invoke('tray:update-recent-chats', chats),
    updateOpenProject: (project: { workspaceId?: string; projectPath?: string; isWorkspaceMode: boolean } | null) =>
      ipcRenderer.invoke('tray:update-open-project', project),
    clearNotification: (conversationId: string) =>
      ipcRenderer.invoke('tray:clear-notification', conversationId),
    clearAllNotifications: () =>
      ipcRenderer.invoke('tray:clear-all-notifications'),
  },
};

// Expose to window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', api);

// Also expose a simpler API for direct access
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: {
      platform: NodeJS.Platform;
      versions: {
        node: string;
        electron: string;
        chrome: string;
      };
    };
  }
}

export type {
  ElectronAPI, AgentAPI, FileAPI, ToolAPI, ConfigAPI, DialogAPI, AppAPI,
  SettingsAPI, ChatStorageAPI, UsageAPI, IndexingAPI, NotificationsAPI, TrayAPI, TerminalAPI, BrowserAPI, RemoteAPI, RemoteClientAPI, ProjectAPI, PlanAPI, PlanFileData, GitAPI, GitStatusResult,
  IndexingState, IndexChunk, AgentEvent, ConversationAgentEvent, RemoteServerStatus,
  RemoteClientStatus, RemoteClientConnectResult, RemoteClientTestResult, RemoteClientServerInfo,
  RulesAPI, SkillsAPI, RuleData, SkillData,
};
