"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main/file-history.ts
var file_history_exports = {};
__export(file_history_exports, {
  FileHistoryManager: () => FileHistoryManager,
  clearFileHistoryManager: () => clearFileHistoryManager,
  getFileHistoryManager: () => getFileHistoryManager
});
module.exports = __toCommonJS(file_history_exports);
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_diff = require("diff");
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
function generateUnifiedDiff(beforeContent, afterContent, filePath, contextLines = 3) {
  const chunks = (0, import_diff.diffLines)(beforeContent, afterContent);
  const lines = [];
  for (const chunk of chunks) {
    const chunkLines = chunk.value.split("\n");
    if (chunkLines[chunkLines.length - 1] === "")
      chunkLines.pop();
    const type = chunk.added ? "added" : chunk.removed ? "removed" : "unchanged";
    for (const line of chunkLines) {
      lines.push({ type, content: line });
    }
  }
  let diff = `--- ${filePath}
+++ ${filePath}
`;
  let oldLine = 1;
  let newLine = 1;
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "unchanged") {
      oldLine++;
      newLine++;
      i++;
      continue;
    }
    const hunkStart = Math.max(0, i - contextLines);
    const hunkOldStart = oldLine - (i - hunkStart);
    const hunkNewStart = newLine - (i - hunkStart);
    const hunkLines = [];
    for (let k = hunkStart; k < i; k++) {
      hunkLines.push(lines[k]);
    }
    let lastChangeIdx = i;
    while (i < lines.length) {
      hunkLines.push(lines[i]);
      if (lines[i].type !== "unchanged") {
        lastChangeIdx = i;
      }
      if (lines[i].type === "unchanged" && i - lastChangeIdx >= contextLines) {
        i++;
        break;
      }
      i++;
    }
    const trailingUnchanged = hunkLines.reduceRight((count, l) => {
      if (count === -1)
        return -1;
      return l.type === "unchanged" ? count + 1 : -1;
    }, 0);
    const trimCount = trailingUnchanged > contextLines ? trailingUnchanged - contextLines : 0;
    const trimmedHunk = trimCount > 0 ? hunkLines.slice(0, hunkLines.length - trimCount) : hunkLines;
    const oldCount = trimmedHunk.filter((l) => l.type !== "added").length;
    const newCount = trimmedHunk.filter((l) => l.type !== "removed").length;
    diff += `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@
`;
    for (const l of trimmedHunk) {
      if (l.type === "added")
        diff += `+${l.content}
`;
      else if (l.type === "removed")
        diff += `-${l.content}
`;
      else
        diff += ` ${l.content}
`;
    }
    for (const l of trimmedHunk) {
      if (l.type !== "added")
        oldLine++;
      if (l.type !== "removed")
        newLine++;
    }
  }
  return diff;
}
function findChangeLocation(beforeContent, afterContent, toolName, toolInput) {
  const beforeLines = beforeContent.split("\n");
  const afterLines = afterContent.split("\n");
  let startLine = 1;
  let endLine = afterLines.length;
  let lineCount = afterLines.length;
  if (toolName === "Edit" && typeof toolInput.old_string === "string") {
    const oldString = toolInput.old_string;
    const oldLines = oldString.split("\n");
    for (let i = 0; i <= beforeLines.length - oldLines.length; i++) {
      const match = oldLines.every((line, idx) => beforeLines[i + idx] === line);
      if (match) {
        startLine = i + 1;
        endLine = startLine + oldLines.length - 1;
        break;
      }
    }
    if (typeof toolInput.new_string === "string") {
      const newLines = toolInput.new_string.split("\n");
      lineCount = newLines.length;
      endLine = startLine + newLines.length - 1;
    }
  } else if (toolName === "Write") {
    startLine = 1;
    endLine = afterLines.length;
    lineCount = afterLines.length;
  }
  return { startLine, endLine, lineCount };
}
function generateSnippet(content, startLine, endLine, contextLines = 3) {
  const lines = content.split("\n");
  const snippetStart = Math.max(0, startLine - 1 - contextLines);
  const snippetEnd = Math.min(lines.length, endLine + contextLines);
  return lines.slice(snippetStart, snippetEnd).join("\n");
}
function getFileExtension(filePath) {
  const ext = (0, import_node_path.extname)(filePath).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}
function getFileName(filePath) {
  return (0, import_node_path.basename)(filePath);
}
function applyInversePatch(beforeContent, afterContent, currentContent) {
  const inversePatch = (0, import_diff.createPatch)("file", afterContent, beforeContent, "", "", { context: 4 });
  const result = (0, import_diff.applyPatch)(currentContent, inversePatch, { fuzzFactor: 2 });
  return result === false ? null : result;
}
var MAX_INMEMORY_SNAPSHOTS = 50;
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
   * Get all file changes for a specific message.
   * Loads from disk if the snapshot was evicted from memory.
   */
  async getMessageChanges(conversationId, messageId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    return snapshot?.changes.filter((change) => change.afterContent !== void 0) || [];
  }
  /**
   * Check if a message has any file changes
   */
  async hasChanges(conversationId, messageId) {
    const changes = await this.getMessageChanges(conversationId, messageId);
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
   * Get aggregated file changes for an entire conversation.
   * Loads evicted snapshots from disk as needed.
   */
  async getAllConversationChanges(conversationId) {
    await this.ensureConversationLoaded(conversationId);
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
   * Get file changes for a specific message with line statistics.
   * Loads from disk if the snapshot was evicted from memory.
   */
  async getMessageChangesWithStats(conversationId, messageId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
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
    const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
    if (!targetSnapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
      return { success: false, restoredFiles, failedFiles };
    }
    for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
      const absolutePath = this.resolveFilePath(change.filePath);
      try {
        await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
        let currentContent;
        try {
          currentContent = await import_node_fs.promises.readFile(absolutePath, "utf8");
        } catch {
          currentContent = null;
        }
        if (change.changeType === "delete") {
          if (change.beforeContent) {
            await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
          }
          restoredFiles.push(change.filePath);
        } else if (change.changeType === "write" && !change.beforeContent) {
          if (currentContent === null || currentContent === change.afterContent) {
            try {
              await import_node_fs.promises.unlink(absolutePath);
            } catch {
            }
            restoredFiles.push(change.filePath);
          } else {
            const reverted = applyInversePatch("", change.afterContent, currentContent);
            if (reverted !== null) {
              if (reverted.trim() === "") {
                try {
                  await import_node_fs.promises.unlink(absolutePath);
                } catch {
                }
              } else {
                await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
              }
            } else {
              console.warn(`[FileHistoryManager] Could not cleanly revert ${change.filePath} without affecting concurrent changes from another chat. Deleting the file.`);
              try {
                await import_node_fs.promises.unlink(absolutePath);
              } catch {
              }
            }
            restoredFiles.push(change.filePath);
          }
        } else {
          if (currentContent === null) {
            if (change.beforeContent) {
              await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
            }
            restoredFiles.push(change.filePath);
          } else if (currentContent === change.afterContent) {
            await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
            restoredFiles.push(change.filePath);
          } else {
            const reverted = applyInversePatch(change.beforeContent, change.afterContent, currentContent);
            if (reverted !== null) {
              await import_node_fs.promises.writeFile(absolutePath, reverted, "utf8");
            } else {
              console.warn(`[FileHistoryManager] Could not cleanly revert ${change.filePath} without affecting concurrent changes from another chat. Restoring to pre-change state.`);
              await import_node_fs.promises.writeFile(absolutePath, change.beforeContent, "utf8");
            }
            restoredFiles.push(change.filePath);
          }
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
   * Re-apply the changes from a specific message (undo a previous rollback).
   * Writes afterContent for each file change captured in the snapshot.
   */
  async reapplyMessage(conversationId, messageId) {
    const restoredFiles = [];
    const failedFiles = [];
    const targetKey = `${conversationId}/${messageId}`;
    const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);
    if (!targetSnapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for message ${messageId} (reapply)`);
      return { success: false, restoredFiles, failedFiles };
    }
    for (const change of targetSnapshot.changes.filter((entry) => entry.afterContent !== void 0)) {
      const absolutePath = this.resolveFilePath(change.filePath);
      try {
        await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
        if (change.changeType === "delete") {
          try {
            await import_node_fs.promises.unlink(absolutePath);
          } catch {
          }
          restoredFiles.push(change.filePath);
        } else {
          await import_node_fs.promises.writeFile(absolutePath, change.afterContent, "utf8");
          restoredFiles.push(change.filePath);
        }
      } catch (error) {
        console.error(`[FileHistoryManager] Failed to reapply ${change.filePath}:`, error);
        failedFiles.push(change.filePath);
      }
    }
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
   * Persist a snapshot to disk for safety, then evict old entries from memory.
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
      return;
    }
    this.evictOldSnapshots();
  }
  /**
   * Remove the oldest snapshots from memory when exceeding the cap.
   * Evicted snapshots are safe to remove because they were already persisted to disk.
   */
  evictOldSnapshots() {
    if (this.snapshots.size <= MAX_INMEMORY_SNAPSHOTS)
      return;
    const entries = Array.from(this.snapshots.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toEvict = entries.length - MAX_INMEMORY_SNAPSHOTS;
    for (let i = 0; i < toEvict; i++) {
      this.snapshots.delete(entries[i][0]);
    }
  }
  /**
   * Load a single snapshot from disk into memory if it isn't already present.
   */
  async ensureSnapshotLoaded(key) {
    const existing = this.snapshots.get(key);
    if (existing)
      return existing;
    const [conversationId, messageId] = key.split("/");
    if (!conversationId || !messageId)
      return void 0;
    const messageDir = (0, import_node_path.join)(this.backupDir, conversationId, messageId);
    try {
      const stat = await import_node_fs.promises.stat(messageDir);
      if (!stat.isDirectory())
        return void 0;
      const files = await import_node_fs.promises.readdir(messageDir);
      const changes = [];
      for (const file of files) {
        if (!file.endsWith(".json"))
          continue;
        const filePath = (0, import_node_path.join)(messageDir, file);
        try {
          const content = await import_node_fs.promises.readFile(filePath, "utf8");
          changes.push(JSON.parse(content));
        } catch {
        }
      }
      if (changes.length > 0) {
        const snapshot = {
          messageId,
          conversationId,
          changes,
          timestamp: changes[0]?.timestamp || Date.now()
        };
        this.snapshots.set(key, snapshot);
        return snapshot;
      }
    } catch {
    }
    return void 0;
  }
  /**
   * Ensure all snapshots for a conversation are loaded into memory.
   * Re-reads any that were evicted since initial load.
   */
  async ensureConversationLoaded(conversationId) {
    const conversationBackupDir = (0, import_node_path.join)(this.backupDir, conversationId);
    try {
      const messageDirs = await import_node_fs.promises.readdir(conversationBackupDir);
      for (const messageId of messageDirs) {
        const key = `${conversationId}/${messageId}`;
        if (this.snapshots.has(key))
          continue;
        await this.ensureSnapshotLoaded(key);
      }
    } catch {
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
  /**
   * Get detailed change preview for a specific tool call
   * Includes diff content and line location information
   */
  async getChangePreview(conversationId, messageId, toolCallId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    if (!snapshot)
      return null;
    const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
    if (!change || !change.afterContent)
      return null;
    let changeType;
    if (change.changeType === "delete") {
      changeType = "deleted";
    } else if (!change.beforeContent && change.afterContent) {
      changeType = "added";
    } else {
      changeType = "modified";
    }
    const diffContent = generateUnifiedDiff(
      change.beforeContent,
      change.afterContent || "",
      change.filePath
    );
    const additions = (diffContent.match(/^\+(?!\+\+)/gm) || []).length;
    const deletions = (diffContent.match(/^-(?!--)/gm) || []).length;
    const { startLine, endLine, lineCount } = findChangeLocation(
      change.beforeContent,
      change.afterContent || "",
      change.changeType === "write" ? "Write" : "Edit",
      {}
    );
    const beforeSnippet = generateSnippet(change.beforeContent, startLine, endLine);
    const afterSnippet = generateSnippet(change.afterContent || "", startLine, endLine);
    return {
      toolCallId: change.toolCallId,
      messageId: change.messageId,
      filePath: change.filePath,
      fileName: getFileName(change.filePath),
      toolName: change.changeType === "write" ? "Write" : "Edit",
      changeType,
      startLine,
      endLine,
      lineCount,
      diffContent,
      beforeSnippet,
      afterSnippet,
      additions,
      deletions,
      timestamp: change.timestamp
    };
  }
  /**
   * Get all tool call changes for a message
   */
  async getToolCallChanges(conversationId, messageId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    if (!snapshot)
      return [];
    const previews = [];
    for (const change of snapshot.changes.filter((c) => c.afterContent !== void 0)) {
      const preview = await this.getChangePreview(conversationId, messageId, change.toolCallId);
      if (preview)
        previews.push(preview);
    }
    return previews;
  }
  /**
   * Reconstruct file content without a specific tool call's changes
   * Used when rejecting a single tool call change while keeping others
   */
  async reconstructFileWithoutToolCall(conversationId, messageId, toolCallIdToExclude) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    if (!snapshot) {
      return { success: false, content: "", error: "Snapshot not found" };
    }
    const targetChange = snapshot.changes.find((c) => c.toolCallId === toolCallIdToExclude);
    if (!targetChange) {
      return { success: false, content: "", error: "Tool call change not found" };
    }
    let reconstructedContent = targetChange.beforeContent;
    const otherChanges = snapshot.changes.filter(
      (c) => c.filePath === targetChange.filePath && c.toolCallId !== toolCallIdToExclude && c.afterContent !== void 0
    );
    otherChanges.sort((a, b) => a.timestamp - b.timestamp);
    for (const change of otherChanges) {
      if (change.timestamp > targetChange.timestamp) {
        reconstructedContent = change.afterContent || reconstructedContent;
      }
    }
    return { success: true, content: reconstructedContent };
  }
  /**
   * Revert a specific tool call change
   */
  async revertToolCallChange(conversationId, messageId, toolCallId) {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    if (!snapshot) {
      return { success: false, error: "Snapshot not found" };
    }
    const change = snapshot.changes.find((c) => c.toolCallId === toolCallId);
    if (!change) {
      return { success: false, error: "Tool call change not found" };
    }
    const absolutePath = this.resolveFilePath(change.filePath);
    try {
      const result = await this.reconstructFileWithoutToolCall(conversationId, messageId, toolCallId);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      await import_node_fs.promises.mkdir((0, import_node_path.dirname)(absolutePath), { recursive: true });
      await import_node_fs.promises.writeFile(absolutePath, result.content, "utf8");
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to revert change: ${errorMsg}` };
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
function clearFileHistoryManager() {
  fileHistoryManager = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileHistoryManager,
  clearFileHistoryManager,
  getFileHistoryManager
});
//# sourceMappingURL=file-history.cjs.map