"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/modes.ts
var modes_exports = {};
__export(modes_exports, {
  BUILTIN_MODES: () => BUILTIN_MODES
});
var BUILTIN_MODES;
var init_modes = __esm({
  "src/config/modes.ts"() {
    "use strict";
    BUILTIN_MODES = {
      architect: {
        systemPromptAppend: `You are in architect mode. Focus on high-level design, planning, and code review. Prefer reading and analysis over writing code. Suggest implementation strategies without modifying files directly.

PLAN MANAGEMENT:
When creating a plan:
1. Use CreatePlan tool to generate PLAN.md with markdown checkboxes for all tasks
2. Structure tasks in logical phases/sections (e.g., "Phase 1: Setup", "Phase 2: Implementation")
3. Each task should be specific and actionable
4. Include an Overview section explaining the approach

When reviewing/updating:
1. Use ReadPlan to check current status
2. Use UpdatePlan to mark items complete or add new tasks
3. Keep the plan current with implementation progress

The PLAN.md serves as the single source of truth for the project roadmap.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      code: {
        systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code. Test when possible.

PLAN REFERENCE:
When working on a task:
1. Check if PLAN.md exists using ReadPlan tool
2. Reference the plan for context on current task and overall progress
3. After completing work, use UpdatePlan to check off relevant items
4. Add implementation notes to the plan if decisions were made

Do NOT create new plans in code mode - only reference or update existing plans.`,
        temperature: 0.3
      },
      review: {
        systemPromptAppend: "You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      security: {
        systemPromptAppend: "You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"],
        planMode: true
      },
      debug: {
        systemPromptAppend: "You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.",
        temperature: 0.2
      }
    };
  }
});

// main/agent-bridge.ts
var agent_bridge_exports = {};
__export(agent_bridge_exports, {
  AgentBridge: () => AgentBridge,
  agentBridge: () => agentBridge,
  default: () => agent_bridge_default
});
module.exports = __toCommonJS(agent_bridge_exports);
var import_electron = require("electron");

// main/file-history.ts
var import_node_fs = require("fs");
var import_node_path = require("path");
function calculateLineDiff(beforeContent, afterContent) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let additions = 0;
  let deletions = 0;
  if (!beforeContent && afterContent) {
    additions = afterLines.length;
    return { additions, deletions };
  }
  if (beforeContent && !afterContent) {
    deletions = beforeLines.length;
    return { additions, deletions };
  }
  const lineDiff = afterLines.length - beforeLines.length;
  if (lineDiff > 0) {
    additions = lineDiff;
    deletions = Math.max(0, Math.floor(beforeLines.length * 0.05));
  } else if (lineDiff < 0) {
    deletions = Math.abs(lineDiff);
    additions = Math.max(0, Math.floor(afterLines.length * 0.05));
  } else {
    additions = Math.max(1, Math.floor(afterLines.length * 0.05));
    deletions = Math.max(1, Math.floor(beforeLines.length * 0.05));
  }
  return { additions, deletions };
}
function getFileExtension(filePath) {
  const ext = (0, import_node_path.extname)(filePath).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}
function getFileName(filePath) {
  return (0, import_node_path.basename)(filePath);
}
var FileHistoryManager = class {
  snapshots = /* @__PURE__ */ new Map();
  // key: `${conversationId}/${messageId}`
  workspacePath;
  backupDir;
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.backupDir = (0, import_node_path.join)(workspacePath, ".omnicode", "backups");
  }
  resolveFilePath(filePath) {
    return (0, import_node_path.isAbsolute)(filePath) ? filePath : (0, import_node_path.resolve)(this.workspacePath, filePath);
  }
  /**
   * Initialize the backup directory
   */
  async initialize() {
    try {
      await import_node_fs.promises.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error("[FileHistoryManager] Failed to create backup directory:", error);
    }
  }
  /**
   * Create a snapshot of a file before it's modified
   * Call this before executing file-modifying tools
   */
  async captureBeforeChange(conversationId, messageId, toolCallId, filePath, changeType) {
    const absolutePath = this.resolveFilePath(filePath);
    let beforeContent = "";
    try {
      beforeContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
    } catch (error) {
      beforeContent = "";
    }
    const key = `${conversationId}/${messageId}`;
    let snapshot = this.snapshots.get(key);
    if (!snapshot) {
      snapshot = {
        messageId,
        conversationId,
        changes: [],
        timestamp: Date.now()
      };
      this.snapshots.set(key, snapshot);
    }
    const existingChange = snapshot.changes.find((c) => c.filePath === filePath);
    if (existingChange) {
      return;
    }
    const change = {
      messageId,
      toolCallId,
      filePath,
      beforeContent,
      timestamp: Date.now(),
      changeType
    };
    snapshot.changes.push(change);
    await this.persistSnapshot(snapshot);
  }
  /**
   * Update the afterContent of a change after tool execution completes
   */
  async captureAfterChange(conversationId, messageId, toolCallId, filePath) {
    const absolutePath = this.resolveFilePath(filePath);
    let afterContent = "";
    try {
      afterContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
    } catch (error) {
      afterContent = "";
    }
    const key = `${conversationId}/${messageId}`;
    const snapshot = this.snapshots.get(key);
    if (!snapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for ${key}`);
      return;
    }
    const change = snapshot.changes.find(
      (c) => c.filePath === filePath && c.toolCallId === toolCallId
    );
    if (change) {
      change.afterContent = afterContent;
      await this.persistSnapshot(snapshot);
    }
  }
  /**
   * Get all file changes for a specific message
   */
  getMessageChanges(conversationId, messageId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = this.snapshots.get(key);
    return snapshot?.changes.filter((change) => change.afterContent !== void 0) || [];
  }
  /**
   * Check if a message has any file changes
   */
  hasChanges(conversationId, messageId) {
    const changes = this.getMessageChanges(conversationId, messageId);
    return changes.length > 0;
  }
  /**
   * Get all messages that have file changes in a conversation
   */
  getMessagesWithChanges(conversationId) {
    const messages = [];
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId && snapshot.changes.length > 0) {
        messages.push(snapshot.messageId);
      }
    }
    return messages;
  }
  /**
   * Get aggregated file changes for an entire conversation
   * Groups by file path showing the final state of each file with line statistics
   */
  getAllConversationChanges(conversationId) {
    const fileMap = /* @__PURE__ */ new Map();
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId !== conversationId)
        continue;
      for (const change of snapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
        const existing = fileMap.get(change.filePath);
        let effectiveType;
        if (change.changeType === "delete") {
          effectiveType = "deleted";
        } else if (!change.beforeContent && change.afterContent) {
          effectiveType = "added";
        } else {
          effectiveType = "modified";
        }
        const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
        if (existing) {
          if (snapshot.timestamp > existing.lastTimestamp) {
            if (existing.changeType === "deleted" && effectiveType === "added") {
              effectiveType = "added";
            } else if (effectiveType === "deleted") {
              effectiveType = "deleted";
            } else if (existing.changeType === "added") {
              effectiveType = "added";
            } else {
              effectiveType = "modified";
            }
            existing.changeType = effectiveType;
            existing.lastMessageId = snapshot.messageId;
            existing.lastTimestamp = snapshot.timestamp;
            existing.lastBeforeContent = change.beforeContent;
            existing.lastAfterContent = change.afterContent || "";
          }
          existing.changeCount++;
          existing.additions += lineDiff.additions;
          existing.deletions += lineDiff.deletions;
        } else {
          fileMap.set(change.filePath, {
            filePath: change.filePath,
            fileName: getFileName(change.filePath),
            extension: getFileExtension(change.filePath),
            changeType: effectiveType,
            lastMessageId: snapshot.messageId,
            lastTimestamp: snapshot.timestamp,
            changeCount: 1,
            additions: lineDiff.additions,
            deletions: lineDiff.deletions,
            lastBeforeContent: change.beforeContent,
            lastAfterContent: change.afterContent || ""
          });
        }
      }
    }
    return Array.from(fileMap.values()).map(({ lastBeforeContent, lastAfterContent, ...summary }) => summary).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }
  /**
   * Get file changes for a specific message with line statistics
   */
  getMessageChangesWithStats(conversationId, messageId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = this.snapshots.get(key);
    if (!snapshot) {
      return [];
    }
    return snapshot.changes.filter((change) => change.afterContent !== void 0).map((change) => {
      const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || "");
      let changeType;
      if (change.changeType === "delete") {
        changeType = "deleted";
      } else if (!change.beforeContent && change.afterContent) {
        changeType = "added";
      } else {
        changeType = "modified";
      }
      return {
        filePath: change.filePath,
        fileName: getFileName(change.filePath),
        extension: getFileExtension(change.filePath),
        changeType,
        lastMessageId: messageId,
        lastTimestamp: change.timestamp,
        changeCount: 1,
        additions: lineDiff.additions,
        deletions: lineDiff.deletions
      };
    });
  }
  /**
   * Rollback all changes from a specific message onwards
   * This restores files to their state before the specified message was processed
   */
  async rollbackToMessage(conversationId, messageId) {
    const restoredFiles = [];
    const failedFiles = [];
    const targetKey = `${conversationId}/${messageId}`;
    const targetSnapshot = this.snapshots.get(targetKey);
    if (!targetSnapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
      return { success: false, restoredFiles, failedFiles };
    }
    for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
      const absolutePath = this.resolveFilePath(change.filePath);
      try {
        await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
        if (change.changeType === "delete") {
          if (change.beforeContent) {
            await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
            restoredFiles.push(change.filePath);
          }
        } else if (change.changeType === "write" && !change.beforeContent) {
          try {
            await import_node_fs.promises.unlink(absolutePath);
            restoredFiles.push(change.filePath);
          } catch (error) {
            restoredFiles.push(change.filePath);
          }
        } else {
          await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
          restoredFiles.push(change.filePath);
        }
      } catch (error) {
        console.error(`[FileHistoryManager] Failed to restore ${change.filePath}:`, error);
        failedFiles.push(change.filePath);
      }
    }
    this.clearSnapshotsFromMessage(conversationId, targetSnapshot.timestamp);
    return {
      success: failedFiles.length === 0,
      restoredFiles,
      failedFiles
    };
  }
  /**
   * Clear all snapshots for a conversation (when conversation is deleted)
   */
  async clearConversation(conversationId) {
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId) {
        this.snapshots.delete(key);
      }
    }
    const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
    try {
      await import_node_fs.promises.rmdir(conversationBackupDir, { recursive: true });
    } catch (error) {
    }
  }
  /**
   * Clear snapshots from a specific message onwards (after rollback)
   */
  clearSnapshotsFromMessage(conversationId, fromTimestamp) {
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId && snapshot.timestamp >= fromTimestamp) {
        this.snapshots.delete(key);
      }
    }
  }
  /**
   * Persist a snapshot to disk for safety
   */
  async persistSnapshot(snapshot) {
    const snapshotDir = (0, import_node_path.join)(this.backupDir, snapshot.conversationId, snapshot.messageId);
    try {
      await import_node_fs.promises.mkdir(snapshotDir, { recursive: true });
      for (const change of snapshot.changes) {
        const safeFileName = change.filePath.replace(/[/\\]/g, "_");
        const backupPath = (0, import_node_path.join)(snapshotDir, `${safeFileName}.json`);
        await import_node_fs.promises.writeFile(backupPath, JSON.stringify(change, null, 2), "utf8");
      }
    } catch (error) {
      console.error("[FileHistoryManager] Failed to persist snapshot:", error);
    }
  }
  /**
   * Load snapshots from disk for a conversation
   */
  async loadSnapshots(conversationId) {
    const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
    try {
      const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
      for (const messageId of messageDirs) {
        const messageDir = (0, import_node_path.join)(conversationBackupDir, messageId);
        const stat = await import_node_fs.promises.stat(messageDir);
        if (!stat.isDirectory())
          continue;
        const files = await import_node_fs.promises.readdir(messageDir);
        const changes = [];
        for (const file of files) {
          if (!file.endsWith(".json"))
            continue;
          const filePath = (0, import_node_path.join)(messageDir, file);
          try {
            const content = await import_node_fs.promises.readFile(filePath, "utf8");
            const change = JSON.parse(content);
            changes.push(change);
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to load change from ${filePath}:`, error);
          }
        }
        if (changes.length > 0) {
          const snapshot = {
            messageId,
            conversationId,
            changes,
            timestamp: changes[0]?.timestamp || Date.now()
          };
          this.snapshots.set(`${conversationId}/${messageId}`, snapshot);
        }
      }
    } catch (error) {
    }
  }
};
var fileHistoryManager = null;
function getFileHistoryManager(workspacePath) {
  if (!fileHistoryManager || fileHistoryManager["workspacePath"] !== workspacePath) {
    fileHistoryManager = new FileHistoryManager(workspacePath);
    fileHistoryManager.initialize().catch(console.error);
  }
  return fileHistoryManager;
}

// main/agent-bridge.ts
var FILE_MODIFYING_TOOLS = ["Write", "Edit", "MultiFileEdit", "DiffEdit"];
function getFilePathsFromToolInput(toolName, input) {
  const paths = [];
  switch (toolName) {
    case "Write":
    case "Edit":
    case "DiffEdit":
      if (typeof input.file_path === "string") {
        paths.push(input.file_path);
      }
      break;
    case "MultiFileEdit":
      if (Array.isArray(input.edits)) {
        for (const edit of input.edits) {
          if (typeof edit === "object" && edit && typeof edit.file_path === "string") {
            paths.push(edit.file_path);
          }
        }
      }
      break;
  }
  return paths;
}
function getChangeType(toolName) {
  switch (toolName) {
    case "Write":
      return "write";
    case "Edit":
    case "MultiFileEdit":
    case "DiffEdit":
      return "edit";
    default:
      return "write";
  }
}
var AgentBridge = class {
  // Store conversation instances
  conversations = /* @__PURE__ */ new Map();
  pendingPermissionRequests = /* @__PURE__ */ new Map();
  pendingUserInputRequests = /* @__PURE__ */ new Map();
  // Factory function to create new agent instances
  agentFactory = null;
  // Provider registry for resolving providers when switching models
  providerRegistry = null;
  eventListeners = /* @__PURE__ */ new Set();
  // Workspace path for file history
  workspacePath = "";
  // Initialize the bridge with agent factory
  initialize(agentFactory) {
    this.agentFactory = agentFactory;
  }
  // Set the workspace path for file history tracking
  setWorkspacePath(workspacePath) {
    this.workspacePath = workspacePath;
  }
  updateWorkspaceContext(workspacePath, systemPrompt) {
    this.workspacePath = workspacePath;
    for (const state of this.conversations.values()) {
      state.agent.updateConfig({
        cwd: workspacePath,
        systemPrompt
      });
    }
  }
  // Set the provider registry for model switching
  setProviderRegistry(registry) {
    this.providerRegistry = registry;
  }
  // Create a new conversation with optional model and provider
  createConversation(conversationId, model, provider) {
    if (!this.agentFactory) {
      console.error("AgentBridge not initialized - no agent factory");
      return false;
    }
    if (this.conversations.has(conversationId)) {
      console.warn(`Conversation ${conversationId} already exists`);
      return false;
    }
    const agent = this.agentFactory(conversationId, model, provider);
    this.conversations.set(conversationId, {
      agent,
      isRunning: false,
      abortController: null,
      pendingFileChanges: /* @__PURE__ */ new Map()
    });
    console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || "default"}, provider: ${provider || "default"})`);
    return true;
  }
  // Close a conversation and cleanup
  closeConversation(conversationId) {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found`);
      return false;
    }
    if (state.abortController) {
      state.abortController.abort();
    }
    for (const [toolId, pending] of this.pendingPermissionRequests.entries()) {
      if (pending.conversationId === conversationId) {
        pending.onDeny();
        this.pendingPermissionRequests.delete(toolId);
      }
    }
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
  hasConversation(conversationId) {
    return this.conversations.has(conversationId);
  }
  // Get list of active conversation IDs
  getActiveConversations() {
    return Array.from(this.conversations.keys());
  }
  // Get available models from the provider registry
  getAvailableModels() {
    if (!this.providerRegistry) {
      console.warn("[AgentBridge] No provider registry set, returning empty model list");
      return [];
    }
    try {
      const models = [];
      const registry = this.providerRegistry;
      let providers = [];
      if (typeof registry.getAvailable === "function") {
        providers = registry.getAvailable();
      } else if (registry.providers) {
        providers = Array.from(registry.providers.values());
      }
      for (const provider of providers) {
        if (!provider.isAvailable())
          continue;
        const providerModels = provider.listModels();
        for (const model of providerModels) {
          models.push({
            id: model.id,
            name: model.name || model.id,
            provider: provider.name,
            description: model.description,
            isAvailable: true,
            aliases: model.aliases
          });
        }
      }
      console.log(`[AgentBridge] Returning ${models.length} available models`);
      return models;
    } catch (error) {
      console.error("[AgentBridge] Error getting available models:", error);
      return [];
    }
  }
  getConversationIdForSession(sessionId) {
    for (const [conversationId, state] of this.conversations.entries()) {
      if (state.agent.id === sessionId) {
        return conversationId;
      }
    }
    return void 0;
  }
  async sendMessage(conversationId, message, workingDirectory) {
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
    state.currentAssistantMessageId = void 0;
    state.pendingFileChanges.clear();
    const workingDir = workingDirectory || this.workspacePath;
    if (workingDir) {
      this.workspacePath = workingDir;
      if (state.agent.config.cwd !== workingDir) {
        state.agent.updateConfig({ cwd: workingDir });
      }
    }
    try {
      for await (const event of state.agent.run(message)) {
        if (state.abortController.signal.aborted) {
          break;
        }
        const agentEvent = event;
        if (agentEvent.type === "turn_complete") {
          const stopReason = agentEvent.message.metadata?.stopReason;
          const assistantMessageId = agentEvent.message.id;
          if (stopReason === "tool_use") {
            state.currentAssistantMessageId = assistantMessageId;
          } else {
            state.isRunning = false;
            state.currentAssistantMessageId = void 0;
            state.pendingFileChanges.clear();
          }
        }
        if (agentEvent.type === "tool_call_start") {
          const { toolName, toolId, input } = agentEvent;
          if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
            try {
              const filePaths = getFilePathsFromToolInput(toolName, input);
              const changeType = getChangeType(toolName);
              state.pendingFileChanges.set(toolId, filePaths);
              const fileHistoryManager2 = getFileHistoryManager(workingDir);
              for (const filePath of filePaths) {
                await fileHistoryManager2.captureBeforeChange(
                  conversationId,
                  state.currentAssistantMessageId,
                  toolId,
                  filePath,
                  changeType
                );
              }
            } catch (error) {
              console.error("[AgentBridge] Failed to capture before-change state:", error);
            }
          }
        }
        if (agentEvent.type === "tool_call_end") {
          const { toolName, toolId, result } = agentEvent;
          if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
            try {
              const filePaths = state.pendingFileChanges.get(toolId) || [];
              const fileHistoryManager2 = getFileHistoryManager(workingDir);
              if (!result.isError) {
                for (const filePath of filePaths) {
                  await fileHistoryManager2.captureAfterChange(
                    conversationId,
                    state.currentAssistantMessageId,
                    toolId,
                    filePath
                  );
                }
                const changes = fileHistoryManager2.getMessageChanges(
                  conversationId,
                  state.currentAssistantMessageId
                );
                if (changes.length > 0) {
                  this.emit("file_change", {
                    conversationId,
                    messageId: state.currentAssistantMessageId,
                    toolCallId: toolId,
                    fileChanges: changes.map((c) => ({
                      filePath: c.filePath,
                      changeType: c.changeType,
                      hasBeforeContent: !!c.beforeContent,
                      hasAfterContent: !!c.afterContent
                    }))
                  });
                }
              }
            } catch (error) {
              console.error("[AgentBridge] Failed to capture after-change state:", error);
            } finally {
              state.pendingFileChanges.delete(toolId);
            }
          }
        }
        this.emitEvent(conversationId, agentEvent);
        if (agentEvent.type === "error") {
          state.isRunning = false;
          state.currentAssistantMessageId = void 0;
          state.pendingFileChanges.clear();
        }
      }
    } catch (error) {
      console.error(`Agent error in conversation ${conversationId}:`, error);
      this.emitEvent(conversationId, {
        type: "error",
        error: { message: error.message }
      });
      state.isRunning = false;
      state.currentAssistantMessageId = void 0;
      state.pendingFileChanges.clear();
    }
  }
  abort(conversationId) {
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
  async rollbackToMessage(conversationId, messageId) {
    if (!this.workspacePath) {
      console.error("[AgentBridge] No workspace path set for rollback");
      return { success: false, restoredFiles: [], failedFiles: [] };
    }
    const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
    return await fileHistoryManager2.rollbackToMessage(conversationId, messageId);
  }
  requestPermission(sessionId, toolName, toolId, input, callbacks) {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId) {
      callbacks.onDeny();
      return;
    }
    this.pendingPermissionRequests.set(toolId, {
      conversationId,
      ...callbacks
    });
    this.emitEvent(conversationId, {
      type: "permission_request",
      toolName,
      toolId,
      input
    });
  }
  respondPermission(toolId, decision) {
    const pending = this.pendingPermissionRequests.get(toolId);
    if (!pending) {
      return false;
    }
    this.pendingPermissionRequests.delete(toolId);
    if (decision === "deny") {
      pending.onDeny();
      this.emitEvent(pending.conversationId, { type: "permission_denied", toolId });
      return true;
    }
    if (decision === "allowAlways") {
      pending.onAllowAlways();
    } else {
      pending.onAllow();
    }
    this.emitEvent(pending.conversationId, { type: "permission_granted", toolId });
    return true;
  }
  requestUserInput(sessionId, requestId, prompt, terminalCommand, waitForInput, placeholder, callbacks) {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId) {
      callbacks.onCancel();
      return;
    }
    this.pendingUserInputRequests.set(requestId, {
      conversationId,
      ...callbacks
    });
    this.emitEvent(conversationId, {
      type: "user_input_request",
      requestId,
      prompt,
      terminalCommand,
      waitForInput,
      placeholder
    });
  }
  respondUserInput(requestId, response, cancelled) {
    const pending = this.pendingUserInputRequests.get(requestId);
    if (!pending) {
      return false;
    }
    this.pendingUserInputRequests.delete(requestId);
    if (cancelled) {
      pending.onCancel();
      this.emitEvent(pending.conversationId, { type: "user_input_cancelled", requestId });
      return true;
    }
    pending.onResponse(response);
    this.emitEvent(pending.conversationId, { type: "user_input_responded", requestId, response });
    return true;
  }
  emitToolProgress(sessionId, toolName, toolId, message) {
    const conversationId = this.getConversationIdForSession(sessionId);
    if (!conversationId)
      return;
    this.emitEvent(conversationId, {
      type: "tool_call_progress",
      toolName,
      toolId,
      message
    });
  }
  async switchModel(conversationId, model, providerName) {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`Conversation ${conversationId} not found`);
      return false;
    }
    try {
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
      state.agent.updateConfig({
        model,
        provider: newProvider
      });
      console.log(`[AgentBridge] Switched model to ${model} for conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error(`Failed to switch model for conversation ${conversationId}:`, error);
      return false;
    }
  }
  async setMode(conversationId, mode) {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`Conversation ${conversationId} not found`);
      return { success: false, mode };
    }
    try {
      const { BUILTIN_MODES: BUILTIN_MODES2 } = await Promise.resolve().then(() => (init_modes(), modes_exports));
      const modeConfig = BUILTIN_MODES2[mode];
      if (!modeConfig) {
        console.warn(`[AgentBridge] Unknown mode: ${mode}`);
        return { success: false, mode };
      }
      const updates = {};
      if (modeConfig.temperature !== void 0) {
        updates.temperature = modeConfig.temperature;
      }
      if (modeConfig.planMode !== void 0) {
        updates.planMode = modeConfig.planMode;
      }
      const currentSystemPrompt = state.agent.config.systemPrompt || "";
      const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug) mode\.?.*/s, "");
      updates.systemPrompt = basePrompt + "\n\n" + modeConfig.systemPromptAppend;
      state.agent.updateConfig(updates);
      if (modeConfig.disabledTools || modeConfig.allowedTools) {
        const updatedTools = state.agent.config.tools.map((tool) => {
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
  clearConversation(conversationId) {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found for clear`);
      return;
    }
    state.agent.clearMessages();
  }
  onEvent(callback) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }
  emitEvent(conversationId, event) {
    const eventWithId = { ...event, conversationId };
    import_electron.BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("agent:event", eventWithId);
    });
    this.eventListeners.forEach((listener) => listener(eventWithId));
  }
  // General event emitter for non-agent events (like file_change)
  emit(eventName, data) {
    const event = {
      type: "file_change",
      ...data
    };
    const eventWithId = { ...event, conversationId: data.conversationId };
    import_electron.BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("agent:event", eventWithId);
    });
    this.eventListeners.forEach((listener) => listener(eventWithId));
  }
  isProcessing(conversationId) {
    const state = this.conversations.get(conversationId);
    return state ? state.isRunning : false;
  }
  async getTokenCount(conversationId) {
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.warn(`Conversation ${conversationId} not found for getTokenCount`);
      return 0;
    }
    const agent = state.agent;
    if (typeof agent.getTokenCount === "function") {
      return await agent.getTokenCount();
    }
    return 0;
  }
};
var agentBridge = new AgentBridge();
var agent_bridge_default = agentBridge;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentBridge,
  agentBridge
});
//# sourceMappingURL=agent-bridge.cjs.map