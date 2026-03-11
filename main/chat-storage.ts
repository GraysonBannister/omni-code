import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Conversation, Message, ToolCall } from '../renderer/stores/appStore.js';

// Storage format version for future migrations
const STORAGE_VERSION = '1.0.0';
const CHATS_DIR = '.omnicode/chats';
const MAX_CHATS_PER_WORKSPACE = 50;

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
 * ChatStorage handles persisting conversations to disk in the workspace folder.
 * Conversations are stored as JSON files in `.omnicode/chats/{conversationId}.json`
 */
export class ChatStorage {
  private ensureChatsDir(workspacePath: string): Promise<string> {
    const chatsDir = path.join(workspacePath, CHATS_DIR);
    return chatsDir;
  }

  /**
   * Save a conversation to disk
   */
  async saveConversation(workspacePath: string, conversation: Conversation): Promise<{ success: boolean; error?: string }> {
    try {
      if (!workspacePath) {
        return { success: false, error: 'No workspace path provided' };
      }

      const chatsDir = await this.ensureChatsDir(workspacePath);

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
      await fs.rename(tempPath, filePath);

      return { success: true };
    } catch (error) {
      console.error('[ChatStorage] Failed to save conversation:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Load all conversations from a workspace
   */
  async loadConversations(workspacePath: string): Promise<{ conversations: Partial<Conversation>[]; error?: string }> {
    try {
      if (!workspacePath) {
        return { conversations: [] };
      }

      const chatsDir = path.join(workspacePath, CHATS_DIR);

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
  async deleteConversation(workspacePath: string, conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!workspacePath) {
        return { success: false, error: 'No workspace path provided' };
      }

      const chatsDir = path.join(workspacePath, CHATS_DIR);
      const filePath = path.join(chatsDir, `${conversationId}.json`);

      await fs.unlink(filePath);
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
  async listConversations(workspacePath: string): Promise<{ conversations: Array<{ id: string; title: string; updatedAt: number; messageCount: number }>; error?: string }> {
    try {
      if (!workspacePath) {
        return { conversations: [] };
      }

      const chatsDir = path.join(workspacePath, CHATS_DIR);

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
  async cleanupOldConversations(workspacePath: string, maxChats: number = MAX_CHATS_PER_WORKSPACE): Promise<{ deleted: number; error?: string }> {
    try {
      const { conversations } = await this.listConversations(workspacePath);

      if (conversations.length <= maxChats) {
        return { deleted: 0 };
      }

      // Delete oldest conversations beyond the limit
      const toDelete = conversations.slice(maxChats);
      let deleted = 0;

      for (const conv of toDelete) {
        const result = await this.deleteConversation(workspacePath, conv.id);
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
