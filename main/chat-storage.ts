import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import type { Conversation, Message, ToolCall } from '../renderer/stores/appStore.js';
import type { Workspace } from '../src/types/workspace.js';

// Optional sync callback — set by remote-server after initialization to avoid circular imports
let syncNotifier: ((event: { type: 'conversation_created' | 'conversation_updated' | 'conversation_deleted'; conversationId: string; title?: string; messageCount?: number; updatedAt?: number }) => void) | null = null;

export function setSyncNotifier(fn: typeof syncNotifier): void {
  syncNotifier = fn;
}

// Storage format version for future migrations
const STORAGE_VERSION = '1.0.0';
const CHATS_DIR = '.omnicode/chats';
const WORKSPACE_CHATS_DIR = 'chats';
const MAX_CHATS_PER_WORKSPACE = 50;

/**
 * Storage context for routing to correct location
 */
export interface StorageContext {
  /** Type of storage context */
  type: 'project' | 'workspace';
  /** Project path (for project context) */
  projectPath?: string;
  /** Workspace (for workspace context) */
  workspace?: Workspace;
}

// Serializable conversation data (without runtime state like isProcessing)
interface SerializedConversation {
  version: string;
  id: string;
  title: string;
  messages: Message[];
  toolCalls: ToolCall[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  model?: string; // Per-conversation model selection
  provider?: string; // Per-conversation provider selection
  contextTokens?: number; // Token usage count
  maxContextTokens?: number; // Max context limit
}

/**
 * ChatStorage handles persisting conversations to disk.
 * Conversations are stored:
 * - For projects: in `.omnicode/chats/{conversationId}.json`
 * - For workspaces: in app data `workspaces/{workspaceId}/chats/{conversationId}.json`
 */
export class ChatStorage {
  private workspacesBaseDir: string | null = null;

  /**
   * Get the base directory for workspace storage in app data
   */
  private async getWorkspacesBaseDir(): Promise<string> {
    if (this.workspacesBaseDir) return this.workspacesBaseDir;
    this.workspacesBaseDir = path.join(app.getPath('userData'), 'workspaces');
    return this.workspacesBaseDir;
  }

  /**
   * Get the chats directory path based on storage context
   */
  private async getChatsDir(context: StorageContext): Promise<string> {
    if (context.type === 'workspace' && context.workspace) {
      const workspacesDir = await this.getWorkspacesBaseDir();
      const workspaceDir = path.join(workspacesDir, context.workspace.id);
      return path.join(workspaceDir, WORKSPACE_CHATS_DIR);
    } else if (context.type === 'project' && context.projectPath) {
      return path.join(context.projectPath, CHATS_DIR);
    }
    throw new Error('Invalid storage context');
  }

  /**
   * Save a conversation to disk
   */
  async saveConversation(context: StorageContext, conversation: Conversation): Promise<{ success: boolean; error?: string }> {
    try {
      if (!context || (context.type === 'project' && !context.projectPath) || (context.type === 'workspace' && !context.workspace)) {
        return { success: false, error: 'Invalid storage context provided' };
      }

      const chatsDir = await this.getChatsDir(context);

      // Ensure directory exists
      await fs.mkdir(chatsDir, { recursive: true });

      // Serialize conversation (exclude runtime state)
      const serialized: SerializedConversation = {
        version: STORAGE_VERSION,
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        toolCalls: conversation.toolCalls,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
        model: conversation.model,
        provider: conversation.provider,
        contextTokens: conversation.contextTokens,
        maxContextTokens: conversation.maxContextTokens,
      };

      // Write to temp file first, then rename for atomic operation
      const filePath = path.join(chatsDir, `${conversation.id}.json`);
      const tempPath = `${filePath}.tmp`;

      await fs.writeFile(tempPath, JSON.stringify(serialized, null, 2), 'utf-8');

      // Check if this is a new conversation (file didn't exist before)
      let isNew = false;
      try { await fs.access(filePath); } catch { isNew = true; }

      await fs.rename(tempPath, filePath);

      // Notify sync listeners
      syncNotifier?.({
        type: isNew ? 'conversation_created' : 'conversation_updated',
        conversationId: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages.length,
        updatedAt: conversation.updatedAt,
      });

      return { success: true };
    } catch (error) {
      console.error('[ChatStorage] Failed to save conversation:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Load all conversations from storage
   */
  async loadConversations(context: StorageContext): Promise<{ conversations: Partial<Conversation>[]; error?: string }> {
    try {
      if (!context || (context.type === 'project' && !context.projectPath) || (context.type === 'workspace' && !context.workspace)) {
        return { conversations: [] };
      }

      const chatsDir = await this.getChatsDir(context);

      // Check if directory exists
      try {
        await fs.access(chatsDir);
      } catch {
        // No chats directory yet, return empty
        return { conversations: [] };
      }

      // List all JSON files
      const entries = await fs.readdir(chatsDir, { withFileTypes: true });
      const chatFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));

      // Load each conversation
      const conversations: Partial<Conversation>[] = [];

      for (const file of chatFiles) {
        try {
          const filePath = path.join(chatsDir, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          const serialized = JSON.parse(content) as SerializedConversation;

          // Handle version migration if needed
          const migrated = this.migrateIfNeeded(serialized);

          const loadedConv = {
            id: migrated.id,
            title: migrated.title,
            messages: migrated.messages,
            toolCalls: migrated.toolCalls,
            createdAt: migrated.createdAt,
            updatedAt: migrated.updatedAt,
            contextTokens: migrated.contextTokens,
            maxContextTokens: migrated.maxContextTokens,
            // Reset runtime state
            isProcessing: false,
            streamingContent: '',
            orchestrationStatus: null,
          };
          conversations.push(loadedConv);
        } catch (error) {
          console.error(`[ChatStorage] Failed to load conversation ${file.name}:`, error);
          // Continue loading other conversations
        }
      }

      // Sort by updatedAt descending (most recent first)
      conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      return { conversations };
    } catch (error) {
      console.error('[ChatStorage] Failed to load conversations:', error);
      return { conversations: [], error: (error as Error).message };
    }
  }

  /**
   * Delete a conversation from disk
   */
  async deleteConversation(context: StorageContext, conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!context || (context.type === 'project' && !context.projectPath) || (context.type === 'workspace' && !context.workspace)) {
        return { success: false, error: 'Invalid storage context provided' };
      }

      const chatsDir = await this.getChatsDir(context);
      const filePath = path.join(chatsDir, `${conversationId}.json`);

      await fs.unlink(filePath);
      syncNotifier?.({ type: 'conversation_deleted', conversationId });
      return { success: true };
    } catch (error) {
      // File might not exist, that's okay
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { success: true };
      }
      console.error('[ChatStorage] Failed to delete conversation:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List all saved conversation IDs and metadata
   */
  async listConversations(context: StorageContext): Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }> {
    try {
      if (!context || (context.type === 'project' && !context.projectPath) || (context.type === 'workspace' && !context.workspace)) {
        return { conversations: [] };
      }

      const chatsDir = await this.getChatsDir(context);

      try {
        await fs.access(chatsDir);
      } catch {
        return { conversations: [] };
      }

      const entries = await fs.readdir(chatsDir, { withFileTypes: true });
      const chatFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));

      const conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }> = [];

      for (const file of chatFiles) {
        try {
          const filePath = path.join(chatsDir, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          const serialized = JSON.parse(content) as SerializedConversation;

          conversations.push({
            id: serialized.id,
            title: serialized.title,
            updatedAt: serialized.updatedAt,
            messageCount: serialized.messageCount,
          });
        } catch {
          // Skip corrupted files
        }
      }

      // Sort by updatedAt descending
      conversations.sort((a, b) => b.updatedAt - a.updatedAt);

      return { conversations };
    } catch (error) {
      console.error('[ChatStorage] Failed to list conversations:', error);
      return { conversations: [], error: (error as Error).message };
    }
  }

  /**
   * Clean up old conversations if exceeding the limit
   */
  async cleanupOldConversations(context: StorageContext, maxChats: number = MAX_CHATS_PER_WORKSPACE): Promise<{ deleted: number; error?: string }> {
    try {
      const { conversations } = await this.listConversations(context);

      if (conversations.length <= maxChats) {
        return { deleted: 0 };
      }

      // Delete oldest conversations beyond the limit
      const toDelete = conversations.slice(maxChats);
      let deleted = 0;

      for (const conv of toDelete) {
        const result = await this.deleteConversation(context, conv.id);
        if (result.success) {
          deleted++;
        }
      }

      return { deleted };
    } catch (error) {
      console.error('[ChatStorage] Failed to cleanup conversations:', error);
      return { deleted: 0, error: (error as Error).message };
    }
  }

  /**
   * Handle version migration of stored conversations
   */
  private migrateIfNeeded(serialized: SerializedConversation): SerializedConversation {
    const currentVersion = serialized.version || '0.0.0';

    // Future migrations go here
    // if (semver.lt(currentVersion, '1.1.0')) { ... }

    return serialized;
  }

  /**
   * Backward compatibility: Save conversation using project path directly
   */
  async saveConversationForProject(projectPath: string, conversation: Conversation): Promise<{ success: boolean; error?: string }> {
    return this.saveConversation({ type: 'project', projectPath }, conversation);
  }

  /**
   * Backward compatibility: Load conversations using project path directly
   */
  async loadConversationsForProject(projectPath: string): Promise<{ conversations: Partial<Conversation>[]; error?: string }> {
    return this.loadConversations({ type: 'project', projectPath });
  }

  /**
   * Backward compatibility: Delete conversation using project path directly
   */
  async deleteConversationForProject(projectPath: string, conversationId: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteConversation({ type: 'project', projectPath }, conversationId);
  }

  /**
   * Backward compatibility: List conversations using project path directly
   */
  async listConversationsForProject(projectPath: string): Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }> {
    return this.listConversations({ type: 'project', projectPath });
  }

  /**
   * Save conversation for a workspace
   */
  async saveConversationForWorkspace(workspace: Workspace, conversation: Conversation): Promise<{ success: boolean; error?: string }> {
    return this.saveConversation({ type: 'workspace', workspace }, conversation);
  }

  /**
   * Load conversations for a workspace
   */
  async loadConversationsForWorkspace(workspace: Workspace): Promise<{ conversations: Partial<Conversation>[]; error?: string }> {
    return this.loadConversations({ type: 'workspace', workspace });
  }

  /**
   * Delete conversation for a workspace
   */
  async deleteConversationForWorkspace(workspace: Workspace, conversationId: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteConversation({ type: 'workspace', workspace }, conversationId);
  }

  /**
   * List conversations for a workspace
   */
  async listConversationsForWorkspace(workspace: Workspace): Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }> {
    return this.listConversations({ type: 'workspace', workspace });
  }
}

// Singleton instance
let chatStorage: ChatStorage | null = null;

export function getChatStorage(): ChatStorage {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}

export function resetChatStorage(): void {
  chatStorage = null;
}