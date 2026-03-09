// Agent Bridge - Wraps the omni-code Agent for Electron IPC
import { BrowserWindow } from 'electron';
import { getFileHistoryManager } from './file-history.js';

// Import types from the core
// Note: These will be resolved at runtime by the built dist-electron files
type AgentEvent =
  | { type: 'stream_delta'; delta: { type: 'text'; text?: string } }
  | { type: 'turn_complete'; message: unknown }
  | { type: 'tool_call_start'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolName: string; toolId: string; result: { content: string; isError?: boolean } }
  | { type: 'tool_call_progress'; toolName: string; toolId: string; message: string }
  | { type: 'permission_request'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'permission_granted'; toolId: string }
  | { type: 'permission_denied'; toolId: string }
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'error'; error: { message: string } }
  | { type: 'orchestration_task_start'; taskId: string; capability: string; description: string }
  | { type: 'orchestration_task_end'; taskId: string; success: boolean; durationMs: number }
  | { type: 'orchestration_complete'; summary: string }
  | { type: 'file_change'; conversationId: string; messageId: string; toolCallId: string; fileChanges: Array<{ filePath: string; changeType: string; hasBeforeContent: boolean; hasAfterContent: boolean }> };

// Extended agent event with conversation ID for routing
export type ConversationAgentEvent = AgentEvent & { conversationId: string };

interface LLMProvider {
  name: string;
  displayName: string;
  streamComplete: (request: unknown) => AsyncGenerator<unknown>;
  countTokens: (messages: unknown[], model: string) => Promise<number>;
  getModelInfo: (model: string) => { capabilities: { extendedThinking: boolean } } | null;
  isAvailable: () => boolean;
}

interface AgentConfig {
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    enabled: boolean;
    tool: {
      name: string;
      description: string;
      availableInPlanMode: boolean;
    };
  }>;
  temperature?: number;
  maxContextTokens?: number;
  planMode?: boolean;
  cwd?: string;
  thinking?: { enabled: boolean; budgetTokens: number };
}

interface ProviderRegistry {
  getProvider: (name: string) => LLMProvider | undefined;
}

// Factory function type - can accept optional conversationId, model, and provider
type AgentFactory = (conversationId?: string, model?: string, provider?: string) => AgentInstance;

interface UnifiedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | unknown[];
  timestamp: number;
  metadata?: {
    model?: string;
    provider?: string;
    inputTokens?: number;
    outputTokens?: number;
    stopReason?: string;
  };
}

interface AgentInstance {
  id: string;
  config: AgentConfig;
  messages: UnifiedMessage[];
  run: (userMessage: string) => AsyncGenerator<AgentEvent>;
  updateConfig: (updates: Partial<AgentConfig>) => void;
  clearMessages: () => void;
}

interface ConversationState {
  agent: AgentInstance;
  isRunning: boolean;
  abortController: AbortController | null;
  currentAssistantMessageId?: string;
  pendingFileChanges: Map<string, string[]>; // toolCallId -> filePaths
}

// File-modifying tool names (using actual registered tool names, not class names)
const FILE_MODIFYING_TOOLS = ['Write', 'Edit', 'MultiFileEdit', 'DiffEdit'];

// Helper to extract file paths from tool input
function getFilePathsFromToolInput(toolName: string, input: Record<string, unknown>): string[] {
  const paths: string[] = [];

  switch (toolName) {
    case 'Write':
    case 'Edit':
    case 'DiffEdit':
      if (typeof input.file_path === 'string') {
        paths.push(input.file_path);
      }
      break;
    case 'MultiFileEdit':
      if (Array.isArray(input.edits)) {
        for (const edit of input.edits) {
          if (
            typeof edit === 'object'
            && edit
            && typeof (edit as { file_path?: string }).file_path === 'string'
          ) {
            paths.push((edit as { file_path: string }).file_path);
          }
        }
      }
      break;
  }

  return paths;
}

// Helper to determine change type from tool name
function getChangeType(toolName: string): 'write' | 'edit' | 'delete' {
  switch (toolName) {
    case 'Write':
      return 'write';
    case 'Edit':
    case 'MultiFileEdit':
    case 'DiffEdit':
      return 'edit';
    default:
      return 'write';
  }
}

// Agent Bridge class that wraps the omni-code Agent for Electron
// Now supports multiple concurrent conversations
export class AgentBridge {
  // Store conversation instances
  private conversations = new Map<string, ConversationState>();
  private pendingPermissionRequests = new Map<string, {
    conversationId: string;
    onAllow: () => void;
    onDeny: () => void;
    onAllowAlways: () => void;
  }>();

  // Factory function to create new agent instances
  private agentFactory: AgentFactory | null = null;

  // Provider registry for resolving providers when switching models
  private providerRegistry: ProviderRegistry | null = null;

  private eventListeners: Set<(event: ConversationAgentEvent) => void> = new Set();

  // Workspace path for file history
  private workspacePath: string = '';

  // Initialize the bridge with agent factory
  initialize(agentFactory: AgentFactory): void {
    this.agentFactory = agentFactory;
  }

  // Set the workspace path for file history tracking
  setWorkspacePath(workspacePath: string): void {
    this.workspacePath = workspacePath;
  }

  updateWorkspaceContext(workspacePath: string, systemPrompt: string): void {
    this.workspacePath = workspacePath;

    for (const state of this.conversations.values()) {
      state.agent.updateConfig({
        cwd: workspacePath,
        systemPrompt,
      });
    }
  }

  // Set the provider registry for model switching
  setProviderRegistry(registry: ProviderRegistry): void {
    this.providerRegistry = registry;
  }

  // Create a new conversation with optional model and provider
  createConversation(conversationId: string, model?: string, provider?: string): boolean {
    if (!this.agentFactory) {
      console.error('AgentBridge not initialized - no agent factory');
      return false;
    }

    if (this.conversations.has(conversationId)) {
      console.warn(`Conversation ${conversationId} already exists`);
      return false;
    }

    // Pass conversationId, model, and provider to factory for per-conversation model selection
    const agent = this.agentFactory(conversationId, model, provider);
    this.conversations.set(conversationId, {
      agent,
      isRunning: false,
      abortController: null,
      pendingFileChanges: new Map(),
    });

    console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || 'default'}, provider: ${provider || 'default'})`);
    return true;
  }

  // Close a conversation and cleanup
  closeConversation(conversationId: string): boolean {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found`);
      return false;
    }

    // Abort any running operations
    if (state.abortController) {
      state.abortController.abort();
    }

    for (const [toolId, pending] of this.pendingPermissionRequests.entries()) {
      if (pending.conversationId === conversationId) {
        pending.onDeny();
        this.pendingPermissionRequests.delete(toolId);
      }
    }

    this.conversations.delete(conversationId);
    console.log(`[AgentBridge] Closed conversation: ${conversationId}`);
    return true;
  }

  // Check if conversation exists
  hasConversation(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }

  // Get list of active conversation IDs
  getActiveConversations(): string[] {
    return Array.from(this.conversations.keys());
  }

  private getConversationIdForSession(sessionId: string): string | undefined {
    for (const [conversationId, state] of this.conversations.entries()) {
      if (state.agent.id === sessionId) {
        return conversationId;
      }
    }
    return undefined;
  }

  async sendMessage(conversationId: string, message: string, workingDirectory?: string): Promise<void> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`Conversation ${conversationId} not found`);
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (state.isRunning) {
      console.warn(`Conversation ${conversationId} is already processing`);
      return;
    }

    state.isRunning = true;
    state.abortController = new AbortController();

    state.currentAssistantMessageId = undefined;
    state.pendingFileChanges.clear();

    // Use provided working directory or fall back to workspace path
    const workingDir = workingDirectory || this.workspacePath;

    if (workingDir) {
      this.workspacePath = workingDir;
      if (state.agent.config.cwd !== workingDir) {
        state.agent.updateConfig({ cwd: workingDir });
      }
    }

    try {
      for await (const event of state.agent.run(message)) {
        // Check if aborted
        if (state.abortController.signal.aborted) {
          break;
        }

        const agentEvent = event as AgentEvent;

        if (agentEvent.type === 'turn_complete') {
          const stopReason = (agentEvent.message as UnifiedMessage).metadata?.stopReason;
          const assistantMessageId = (agentEvent.message as UnifiedMessage).id;

          if (stopReason === 'tool_use') {
            state.currentAssistantMessageId = assistantMessageId;
          } else {
            state.isRunning = false;
            state.currentAssistantMessageId = undefined;
            state.pendingFileChanges.clear();
          }
        }

        // Handle tool_call_start for file-modifying tools
        if (agentEvent.type === 'tool_call_start') {
          const { toolName, toolId, input } = agentEvent;

          if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
            try {
              const filePaths = getFilePathsFromToolInput(toolName, input);
              const changeType = getChangeType(toolName);

              // Store pending changes for this tool call
              state.pendingFileChanges.set(toolId, filePaths);

              // Capture before state for each file
              const fileHistoryManager = getFileHistoryManager(workingDir);
              for (const filePath of filePaths) {
                await fileHistoryManager.captureBeforeChange(
                  conversationId,
                  state.currentAssistantMessageId,
                  toolId,
                  filePath,
                  changeType
                );
              }
            } catch (error) {
              console.error('[AgentBridge] Failed to capture before-change state:', error);
            }
          }
        }

        // Handle tool_call_end for file-modifying tools
        if (agentEvent.type === 'tool_call_end') {
          const { toolName, toolId, result } = agentEvent;

          if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
            try {
              const filePaths = state.pendingFileChanges.get(toolId) || [];
              const fileHistoryManager = getFileHistoryManager(workingDir);

              if (!result.isError) {
                // Capture after state for each file only when the tool succeeded.
                for (const filePath of filePaths) {
                  await fileHistoryManager.captureAfterChange(
                    conversationId,
                    state.currentAssistantMessageId,
                    toolId,
                    filePath
                  );
                }

                const changes = fileHistoryManager.getMessageChanges(
                  conversationId,
                  state.currentAssistantMessageId
                );

                if (changes.length > 0) {
                  this.emit('file_change', {
                    conversationId,
                    messageId: state.currentAssistantMessageId,
                    toolCallId: toolId,
                    fileChanges: changes.map(c => ({
                      filePath: c.filePath,
                      changeType: c.changeType,
                      hasBeforeContent: !!c.beforeContent,
                      hasAfterContent: !!c.afterContent,
                    })),
                  });
                }
              }
            } catch (error) {
              console.error('[AgentBridge] Failed to capture after-change state:', error);
            } finally {
              // Clear pending changes for this tool even if bookkeeping fails.
              state.pendingFileChanges.delete(toolId);
            }
          }
        }

        // Emit event with conversation ID
        this.emitEvent(conversationId, agentEvent);

        // Handle error
        if (agentEvent.type === 'error') {
          state.isRunning = false;
          state.currentAssistantMessageId = undefined;
          state.pendingFileChanges.clear();
        }
      }
    } catch (error) {
      console.error(`Agent error in conversation ${conversationId}:`, error);
      this.emitEvent(conversationId, {
        type: 'error',
        error: { message: (error as Error).message },
      } as AgentEvent);
      state.isRunning = false;
      state.currentAssistantMessageId = undefined;
      state.pendingFileChanges.clear();
    }
  }

  abort(conversationId: string): void {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found for abort`);
      return;
    }

    if (state.abortController) {
      state.abortController.abort();
    }
    state.isRunning = false;
  }

  /**
   * Rollback all file changes from a specific message onwards
   * This restores files to their state before the specified message was processed
   */
  async rollbackToMessage(conversationId: string, messageId: string): Promise<{
    success: boolean;
    restoredFiles: string[];
    failedFiles: string[];
  }> {
    if (!this.workspacePath) {
      console.error('[AgentBridge] No workspace path set for rollback');
      return { success: false, restoredFiles: [], failedFiles: [] };
    }

    const fileHistoryManager = getFileHistoryManager(this.workspacePath);
    return await fileHistoryManager.rollbackToMessage(conversationId, messageId);
  }

  requestPermission(
    sessionId: string,
    toolName: string,
    toolId: string,
    input: Record<string, unknown>,
    callbacks: {
      onAllow: () => void;
      onDeny: () => void;
      onAllowAlways: () => void;
    },
  ): void {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId) {
      callbacks.onDeny();
      return;
    }

    this.pendingPermissionRequests.set(toolId, {
      conversationId,
      ...callbacks,
    });

    this.emitEvent(conversationId, {
      type: 'permission_request',
      toolName,
      toolId,
      input,
    });
  }

  respondPermission(toolId: string, decision: 'allow' | 'deny' | 'allowAlways'): boolean {
    const pending = this.pendingPermissionRequests.get(toolId);
    if (!pending) {
      return false;
    }

    this.pendingPermissionRequests.delete(toolId);

    if (decision === 'deny') {
      pending.onDeny();
      this.emitEvent(pending.conversationId, { type: 'permission_denied', toolId });
      return true;
    }

    if (decision === 'allowAlways') {
      pending.onAllowAlways();
    } else {
      pending.onAllow();
    }

    this.emitEvent(pending.conversationId, { type: 'permission_granted', toolId });
    return true;
  }

  emitToolProgress(
    sessionId: string,
    toolName: string,
    toolId: string,
    message: string,
  ): void {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId) return;

    this.emitEvent(conversationId, {
      type: 'tool_call_progress',
      toolName,
      toolId,
      message,
    });
  }

  async switchModel(conversationId: string, model: string, providerName: string): Promise<boolean> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`Conversation ${conversationId} not found`);
      return false;
    }

    try {
      // Resolve the new provider if different from current
      let newProvider = state.agent.config.provider;
      if (providerName && providerName !== state.agent.config.provider.name) {
        if (this.providerRegistry) {
          const resolved = this.providerRegistry.getProvider(providerName);
          if (resolved && resolved.isAvailable()) {
            newProvider = resolved;
            console.log(`[AgentBridge] Switched provider to ${providerName} for conversation ${conversationId}`);
          } else {
            console.warn(`[AgentBridge] Provider ${providerName} not available, keeping current provider`);
          }
        } else {
          console.warn(`[AgentBridge] No provider registry set, cannot switch provider`);
        }
      }

      // Update both model and provider
      state.agent.updateConfig({
        model,
        provider: newProvider,
      });

      console.log(`[AgentBridge] Switched model to ${model} for conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error(`Failed to switch model for conversation ${conversationId}:`, error);
      return false;
    }
  }

  clearConversation(conversationId: string): void {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found for clear`);
      return;
    }
    state.agent.clearMessages();
  }

  onEvent(callback: (event: ConversationAgentEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private emitEvent(conversationId: string, event: AgentEvent): void {
    const eventWithId: ConversationAgentEvent = { ...event, conversationId };

    // Send to all renderer windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('agent:event', eventWithId);
    });

    // Call local listeners
    this.eventListeners.forEach(listener => listener(eventWithId));
  }

  // General event emitter for non-agent events (like file_change)
  private emit(eventName: 'file_change', data: {
    conversationId: string;
    messageId: string;
    toolCallId: string;
    fileChanges: Array<{ filePath: string; changeType: string; hasBeforeContent: boolean; hasAfterContent: boolean }>;
  }): void {
    const event: AgentEvent = {
      type: 'file_change',
      ...data,
    };

    const eventWithId: ConversationAgentEvent = { ...event, conversationId: data.conversationId };

    // Send to all renderer windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('agent:event', eventWithId);
    });

    // Call local listeners
    this.eventListeners.forEach(listener => listener(eventWithId));
  }

  isProcessing(conversationId: string): boolean {
    const state = this.conversations.get(conversationId);
    return state ? state.isRunning : false;
  }

  async getTokenCount(conversationId: string): Promise<number> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found for getTokenCount`);
      return 0;
    }

    // Check if agent has getTokenCount method
    const agent = state.agent as AgentInstance & { getTokenCount?: () => Promise<number> };
    if (typeof agent.getTokenCount === 'function') {
      return await agent.getTokenCount();
    }

    return 0;
  }
}

// Create singleton instance
export const agentBridge = new AgentBridge();

// Export for use in main process
export default agentBridge;
