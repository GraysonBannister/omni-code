"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/chat-storage.ts
var chat_storage_exports = {};
__export(chat_storage_exports, {
  ChatStorage: () => ChatStorage,
  getChatStorage: () => getChatStorage,
  resetChatStorage: () => resetChatStorage
});
module.exports = __toCommonJS(chat_storage_exports);
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);
var STORAGE_VERSION = "1.0.0";
var CHATS_DIR = ".omnicode/chats";
var MAX_CHATS_PER_WORKSPACE = 50;
var ChatStorage = class {
  ensureChatsDir(workspacePath) {
    const chatsDir = path.join(workspacePath, CHATS_DIR);
    return chatsDir;
  }
  /**
   * Save a conversation to disk
   */
  async saveConversation(workspacePath, conversation) {
    try {
      if (!workspacePath) {
        return { success: false, error: "No workspace path provided" };
      }
      const chatsDir = await this.ensureChatsDir(workspacePath);
      await fs.mkdir(chatsDir, { recursive: true });
      const pendingPreviews = conversation.pendingChangePreviews;
      const serializedPreviews = pendingPreviews instanceof Map ? Array.from(pendingPreviews.entries()) : pendingPreviews;
      const serialized = {
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
        mode: conversation.mode,
        planningApproach: conversation.planningApproach,
        pendingPlan: conversation.pendingPlan ?? void 0,
        planFilePath: conversation.planFilePath ?? void 0,
        pendingChangePreviews: serializedPreviews
      };
      const filePath = path.join(chatsDir, `${conversation.id}.json`);
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(serialized, null, 2), "utf-8");
      await fs.rename(tempPath, filePath);
      return { success: true };
    } catch (error) {
      console.error("[ChatStorage] Failed to save conversation:", error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Load all conversations from a workspace
   */
  async loadConversations(workspacePath) {
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
      const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
      const conversations = [];
      for (const file of chatFiles) {
        try {
          const filePath = path.join(chatsDir, file.name);
          const content = await fs.readFile(filePath, "utf-8");
          const serialized = JSON.parse(content);
          const migrated = this.migrateIfNeeded(serialized);
          const pendingChangePreviews = migrated.pendingChangePreviews ? new Map(migrated.pendingChangePreviews) : /* @__PURE__ */ new Map();
          const loadedConv = {
            id: migrated.id,
            title: migrated.title,
            messages: migrated.messages,
            toolCalls: migrated.toolCalls,
            createdAt: migrated.createdAt,
            updatedAt: migrated.updatedAt,
            model: migrated.model,
            provider: migrated.provider,
            contextTokens: migrated.contextTokens,
            maxContextTokens: migrated.maxContextTokens,
            mode: migrated.mode,
            planningApproach: migrated.planningApproach,
            pendingPlan: migrated.pendingPlan ?? null,
            planFilePath: migrated.planFilePath ?? null,
            pendingChangePreviews,
            // Reset runtime state
            isProcessing: false,
            streamingContent: "",
            orchestrationStatus: null
          };
          conversations.push(loadedConv);
        } catch (error) {
          console.error(`[ChatStorage] Failed to load conversation ${file.name}:`, error);
        }
      }
      conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return { conversations };
    } catch (error) {
      console.error("[ChatStorage] Failed to load conversations:", error);
      return { conversations: [], error: error.message };
    }
  }
  /**
   * Delete a conversation from disk
   */
  async deleteConversation(workspacePath, conversationId) {
    try {
      if (!workspacePath) {
        return { success: false, error: "No workspace path provided" };
      }
      const chatsDir = path.join(workspacePath, CHATS_DIR);
      const filePath = path.join(chatsDir, `${conversationId}.json`);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      if (error.code === "ENOENT") {
        return { success: true };
      }
      console.error("[ChatStorage] Failed to delete conversation:", error);
      return { success: false, error: error.message };
    }
  }
  /**
   * List all saved conversation IDs and metadata
   */
  async listConversations(workspacePath) {
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
      const chatFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
      const conversations = [];
      for (const file of chatFiles) {
        try {
          const filePath = path.join(chatsDir, file.name);
          const content = await fs.readFile(filePath, "utf-8");
          const serialized = JSON.parse(content);
          conversations.push({
            id: serialized.id,
            title: serialized.title,
            updatedAt: serialized.updatedAt,
            messageCount: serialized.messageCount
          });
        } catch {
        }
      }
      conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      return { conversations };
    } catch (error) {
      console.error("[ChatStorage] Failed to list conversations:", error);
      return { conversations: [], error: error.message };
    }
  }
  /**
   * Clean up old conversations if exceeding the limit
   */
  async cleanupOldConversations(workspacePath, maxChats = MAX_CHATS_PER_WORKSPACE) {
    try {
      const { conversations } = await this.listConversations(workspacePath);
      if (conversations.length <= maxChats) {
        return { deleted: 0 };
      }
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
      console.error("[ChatStorage] Failed to cleanup conversations:", error);
      return { deleted: 0, error: error.message };
    }
  }
  /**
   * Handle version migration of stored conversations
   */
  migrateIfNeeded(serialized) {
    const currentVersion = serialized.version || "0.0.0";
    return serialized;
  }
};
var chatStorage = null;
function getChatStorage() {
  if (!chatStorage) {
    chatStorage = new ChatStorage();
  }
  return chatStorage;
}
function resetChatStorage() {
  chatStorage = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatStorage,
  getChatStorage,
  resetChatStorage
});
//# sourceMappingURL=chat-storage.cjs.map