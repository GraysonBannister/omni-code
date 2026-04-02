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
  | { type: 'tool_results_complete'; message: unknown }
  | { type: 'permission_request'; toolName: string; toolId: string; input: Record<string, unknown> }
  | { type: 'permission_granted'; toolId: string }
  | { type: 'permission_denied'; toolId: string }
  | { type: 'cost_update'; totalCost: number; turnCost: number }
  | { type: 'error'; error: { message: string } }
  | { type: 'orchestration_task_start'; taskId: string; capability: string; description: string }
  | { type: 'orchestration_task_end'; taskId: string; success: boolean; durationMs: number }
  | { type: 'orchestration_complete'; summary: string }
  | { type: 'file_change'; conversationId: string; messageId: string; toolCallId: string; fileChanges: Array<{ filePath: string; changeType: string; hasBeforeContent: boolean; hasAfterContent: boolean }> }
  | { type: 'user_input_request'; requestId: string; prompt: string; terminalCommand?: string; waitForInput: boolean; placeholder?: string }
  | { type: 'user_input_responded'; requestId: string; response: string }
  | { type: 'user_input_cancelled'; requestId: string }
  | { type: 'user_message'; message: { id: string; role: 'user'; content: string | unknown[]; timestamp: number } };

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
    };
  }>;
  temperature?: number;
  maxContextTokens?: number;
  maxTurns?: number | null;
  cwd?: string;
  thinking?: { enabled: boolean; budgetTokens: number };
}

interface ProviderRegistry {
  getProvider: (name: string) => LLMProvider | undefined;
}

// Factory function type - can accept optional conversationId, model, and provider
type AgentFactory = (conversationId?: string, model?: string, provider?: string) => AgentInstance;

export interface UnifiedMessage {
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
  addMessage: (message: UnifiedMessage) => void;
  restoreHistory: (messages: UnifiedMessage[]) => void;
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
  private pendingUserInputRequests = new Map<string, {
    conversationId: string;
    onResponse: (response: string) => void;
    onCancel: () => void;
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

  // Create a new conversation with optional model, provider, and working directory
  createConversation(conversationId: string, model?: string, provider?: string, workingDirectory?: string): boolean {
    console.log(`[AgentBridge] createConversation: id=${conversationId}, model=${model || 'default'}, provider=${provider || 'default'}, workingDirectory=${workingDirectory || 'default'}`);
    if (!this.agentFactory) {
      console.error('[AgentBridge] Not initialized - no agent factory');
      return false;
    }

    if (this.conversations.has(conversationId)) {
      console.log(`[AgentBridge] Conversation ${conversationId} already exists, reusing`);
      // Update working directory if a new one is provided
      if (workingDirectory) {
        const existing = this.conversations.get(conversationId)!;
        existing.agent.updateConfig({ cwd: workingDirectory });
        this.workspacePath = workingDirectory;
      }
      return true;
    }

    // Pass conversationId, model, and provider to factory for per-conversation model selection
    const agent = this.agentFactory(conversationId, model, provider);

    // Apply the working directory immediately so the system prompt uses the correct workspace
    if (workingDirectory) {
      agent.updateConfig({ cwd: workingDirectory });
      this.workspacePath = workingDirectory;
      console.log(`[AgentBridge] Set cwd for conversation ${conversationId}: ${workingDirectory}`);
    }

    this.conversations.set(conversationId, {
      agent,
      isRunning: false,
      abortController: null,
      pendingFileChanges: new Map(),
    });

    console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || 'default'}, provider: ${provider || 'default'}, cwd: ${workingDirectory || 'default'})`);
    return true;
  }

  // Restore message history into an existing conversation's agent context
  restoreHistory(conversationId: string, messages: UnifiedMessage[]): boolean {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`[AgentBridge] restoreHistory: conversation ${conversationId} not found`);
      return false;
    }
    state.agent.restoreHistory(messages);
    console.log(`[AgentBridge] Restored ${messages.length} messages into conversation ${conversationId}`);
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

    // Cancel any pending user input requests for this conversation
    for (const [requestId, pending] of this.pendingUserInputRequests.entries()) {
      if (pending.conversationId === conversationId) {
        pending.onCancel();
        this.pendingUserInputRequests.delete(requestId);
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

  // Get a snapshot of a conversation's messages and model info for persistence
  getConversationSnapshot(conversationId: string): {
    messages: UnifiedMessage[];
    model: string;
    provider: string;
  } | null {
    const state = this.conversations.get(conversationId);
    if (!state) return null;
    return {
      messages: [...state.agent.messages],
      model: state.agent.config.model,
      provider: state.agent.config.provider.name,
    };
  }

  // Get available models from the provider registry
  getAvailableModels(): Array<{
    id: string;
    name: string;
    provider: string;
    description?: string;
    isAvailable: boolean;
    aliases?: string[];
  }> {
    if (!this.providerRegistry) {
      console.warn('[AgentBridge] No provider registry set, returning empty model list');
      return [];
    }

    try {
      // Get all available models from the provider registry
      const models: Array<{
        id: string;
        name: string;
        provider: string;
        description?: string;
        isAvailable: boolean;
        aliases?: string[];
      }> = [];

      // Access provider registry methods
      const registry = this.providerRegistry as unknown as {
        getAvailable?: () => Array<{ name: string; displayName: string; isAvailable: () => boolean; listModels: () => Array<{ id: string; name: string; description?: string; aliases?: string[] }> }>;
        providers?: Map<string, { name: string; displayName: string; isAvailable: () => boolean; listModels: () => Array<{ id: string; name: string; description?: string; aliases?: string[] }> }>;
      };

      // Try to get available providers
      let providers: Array<{ name: string; displayName: string; isAvailable: () => boolean; listModels: () => Array<{ id: string; name: string; description?: string; aliases?: string[] }> }> = [];

      if (typeof registry.getAvailable === 'function') {
        providers = registry.getAvailable();
      } else if (registry.providers) {
        providers = Array.from(registry.providers.values());
      }

      for (const provider of providers) {
        if (!provider.isAvailable()) continue;

        const providerModels = provider.listModels();
        for (const model of providerModels) {
          models.push({
            id: model.id,
            name: model.name || model.id,
            provider: provider.name,
            description: model.description,
            isAvailable: true,
            aliases: model.aliases,
          });
        }
      }

      console.log(`[AgentBridge] Returning ${models.length} available models`);
      return models;
    } catch (error) {
      console.error('[AgentBridge] Error getting available models:', error);
      return [];
    }
  }

  private getConversationIdForSession(sessionId: string): string | undefined {
    for (const [conversationId, state] of this.conversations.entries()) {
      if (state.agent.id === sessionId) {
        return conversationId;
      }
    }
    return undefined;
  }

  async sendMessage(conversationId: string, message: string, workingDirectory?: string, fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; content?: string }>, images?: Array<{ mediaType: string; data: string }>): Promise<void> {
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
    
    // Build message with file references if provided
    let messageWithContext = message;
    if (fileReferences && fileReferences.length > 0) {
      const fileContext = fileReferences
        .filter(ref => !ref.isDirectory && ref.content)
        .map(ref => `\n\n--- File: ${ref.path} ---\n${ref.content}`)
        .join('');
      
      if (fileContext) {
        messageWithContext = `${message}${fileContext}`;
      }
    }

    // Build content: if images are attached, send as ContentBlock[] so the LLM receives vision data
    type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; mediaType: string; data: string } };
    const messageContent: string | ContentBlock[] = images && images.length > 0
      ? [
          { type: 'text' as const, text: messageWithContext },
          ...images.map(img => ({
            type: 'image' as const,
            source: { type: 'base64' as const, mediaType: img.mediaType, data: img.data },
          })),
        ]
      : messageWithContext;

    // Emit user message event so all listeners (Electron renderer, remote clients) see it
    const userMsgId = `user-${Date.now()}`;
    console.log(`[AgentBridge] Emitting user_message event: conversationId=${conversationId}, id=${userMsgId}, contentType=${typeof messageContent}, isArray=${Array.isArray(messageContent)}`);
    this.emitEvent(conversationId, {
      type: 'user_message',
      message: {
        id: userMsgId,
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
      },
    });
    console.log(`[AgentBridge] user_message event emitted, listener count=${this.eventListeners.size}`);

    try {
      console.log(`[AgentBridge] Starting agent.run for conversation ${conversationId}${images?.length ? ` with ${images.length} image(s)` : ''}`);
      for await (const event of state.agent.run(messageContent)) {
        // Check if aborted
        if (state.abortController.signal.aborted) {
          break;
        }

        const agentEvent = event as AgentEvent;

        // Debug: Log all agent events
        if (agentEvent.type === 'error') {
          console.error('[AgentBridge] Agent error event:', agentEvent.error);
        }

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

        // Normalize error events so the message is always serializable
        if (agentEvent.type === 'error') {
          const rawErr = (agentEvent as any).error;
          const message = rawErr?.message
            || rawErr?.error?.message
            || (typeof rawErr === 'string' ? rawErr : JSON.stringify(rawErr));
          const status = rawErr?.status;
          this.emitEvent(conversationId, {
            type: 'error',
            error: { message, ...(status != null ? { status } : {}) },
          } as AgentEvent);
          state.isRunning = false;
          state.currentAssistantMessageId = undefined;
          state.pendingFileChanges.clear();
        } else {
          this.emitEvent(conversationId, agentEvent);
        }
      }
    } catch (error) {
      console.error(`[AgentBridge] Agent error in conversation ${conversationId}:`, error);
      console.error('[AgentBridge] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        status: (error as any).status,
        code: (error as any).code,
        type: (error as any).type,
        response: (error as any).response,
      });
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

  requestUserInput(
    sessionId: string,
    requestId: string,
    prompt: string,
    terminalCommand: string | undefined,
    waitForInput: boolean,
    placeholder: string | undefined,
    callbacks: {
      onResponse: (response: string) => void;
      onCancel: () => void;
    },
  ): void {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId) {
      callbacks.onCancel();
      return;
    }

    this.pendingUserInputRequests.set(requestId, {
      conversationId,
      ...callbacks,
    });

    this.emitEvent(conversationId, {
      type: 'user_input_request',
      requestId,
      prompt,
      terminalCommand,
      waitForInput,
      placeholder,
    });
  }

  respondUserInput(requestId: string, response: string, cancelled: boolean): boolean {
    const pending = this.pendingUserInputRequests.get(requestId);
    if (!pending) {
      return false;
    }

    this.pendingUserInputRequests.delete(requestId);

    if (cancelled) {
      pending.onCancel();
      this.emitEvent(pending.conversationId, { type: 'user_input_cancelled', requestId });
      return true;
    }

    pending.onResponse(response);
    this.emitEvent(pending.conversationId, { type: 'user_input_responded', requestId, response });
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
    console.log(`[AgentBridge] switchModel called: conversation=${conversationId}, model=${model}, provider=${providerName}`);
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`[AgentBridge] Conversation ${conversationId} not found`);
      return false;
    }

    try {
      // Resolve the new provider if different from current
      let newProvider = state.agent.config.provider;
      console.log(`[AgentBridge] Current provider: ${newProvider.name}, requested: ${providerName}`);

      if (providerName && providerName !== state.agent.config.provider.name) {
        if (this.providerRegistry) {
          console.log(`[AgentBridge] Looking up provider ${providerName} in registry`);
          const resolved = this.providerRegistry.getProvider(providerName);
          console.log(`[AgentBridge] Provider ${providerName} found:`, !!resolved);
          if (resolved) {
            console.log(`[AgentBridge] Provider ${providerName} isAvailable:`, resolved.isAvailable());
          }

          if (resolved && resolved.isAvailable()) {
            newProvider = resolved;
            console.log(`[AgentBridge] Switched provider to ${providerName} for conversation ${conversationId}`);
          } else {
            console.warn(`[AgentBridge] Provider ${providerName} not available, keeping current provider`);
            if (resolved && !resolved.isAvailable()) {
              console.warn(`[AgentBridge] Provider ${providerName} exists but is not available (check API key)`);
            }
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

  async setMode(conversationId: string, mode: string): Promise<{ success: boolean; mode: string }> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`Conversation ${conversationId} not found`);
      return { success: false, mode };
    }

    try {
      // Import mode configuration
      const { BUILTIN_MODES } = await import('../src/config/modes.js');
      const modeConfig = BUILTIN_MODES[mode];

      if (!modeConfig) {
        console.warn(`[AgentBridge] Unknown mode: ${mode}`);
        return { success: false, mode };
      }

      // Build config updates from mode
      const updates: Partial<AgentConfig> = {};

      if (modeConfig.temperature !== undefined) {
        updates.temperature = modeConfig.temperature;
      }

      // Update system prompt with mode-specific guidance
      const currentSystemPrompt = state.agent.config.systemPrompt || '';
      // Remove any previous mode append (simple approach: look for mode markers)
      const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug) mode\.?.*/s, '');
      updates.systemPrompt = basePrompt + '\n\n' + modeConfig.systemPromptAppend;

      // Apply config updates
      state.agent.updateConfig(updates);

      // Handle tool filtering if needed
      if (modeConfig.disabledTools || modeConfig.allowedTools) {
        const updatedTools = state.agent.config.tools.map(tool => {
          const shouldDisable = modeConfig.disabledTools?.includes(tool.name);
          const shouldEnable = modeConfig.allowedTools?.includes(tool.name);

          if (shouldDisable) {
            return { ...tool, enabled: false };
          }
          if (modeConfig.allowedTools && !shouldEnable) {
            return { ...tool, enabled: false };
          }
          return { ...tool, enabled: true };
        });

        state.agent.updateConfig({ tools: updatedTools });
      }

      console.log(`[AgentBridge] Set mode to ${mode} for conversation ${conversationId}`);
      return { success: true, mode };
    } catch (error) {
      console.error(`[AgentBridge] Failed to set mode for conversation ${conversationId}:`, error);
      return { success: false, mode };
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

  /**
   * Truncate conversation messages to a specific index
   * Keeps messages from 0 to messageIndex (inclusive)
   * @returns true if successful, false if conversation not found
   */
  truncateMessages(conversationId: string, messageIndex: number): boolean {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`[AgentBridge] Conversation ${conversationId} not found for truncate`);
      return false;
    }

    const currentMessages = state.agent.messages;
    if (messageIndex < 0 || messageIndex >= currentMessages.length) {
      console.warn(`[AgentBridge] Invalid message index ${messageIndex} for conversation with ${currentMessages.length} messages`);
      return false;
    }

    // Keep only messages up to and including messageIndex
    const truncatedMessages = currentMessages.slice(0, messageIndex + 1);

    // Clear messages and re-add using the agent's addMessage method
    state.agent.clearMessages();
    
    // Check if agent has addMessage method (AgentImpl does)
    const agentWithAddMessage = state.agent as AgentInstance & { addMessage?: (msg: UnifiedMessage) => void };
    if (typeof agentWithAddMessage.addMessage === 'function') {
      for (const msg of truncatedMessages) {
        agentWithAddMessage.addMessage(msg);
      }
    } else {
      // Fallback: Access internal _messages array if available
      const agentWithInternal = state.agent as AgentInstance & { _messages?: UnifiedMessage[] };
      if (agentWithInternal._messages) {
        agentWithInternal._messages.push(...truncatedMessages);
      } else {
        console.error('[AgentBridge] Cannot add messages - no addMessage method or _messages array available');
        return false;
      }
    }

    console.log(`[AgentBridge] Truncated conversation ${conversationId} to ${truncatedMessages.length} messages (removed ${currentMessages.length - truncatedMessages.length})`);
    return true;
  }

  onEvent(callback: (event: ConversationAgentEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private emitEvent(conversationId: string, event: AgentEvent): void {
    const eventWithId: ConversationAgentEvent = { ...event, conversationId };

    const windows = BrowserWindow.getAllWindows();
    if (event.type === 'user_message') {
      console.log(`[AgentBridge.emitEvent] user_message: broadcasting to ${windows.length} window(s), ${this.eventListeners.size} listener(s), conversationId=${conversationId}`);
    }

    // Send to all renderer windows
    windows.forEach(window => {
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
