"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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
        systemPromptAppend: `You are in architect mode. Your role is to deeply analyze the codebase and produce a structured execution plan \u2014 do NOT write or modify any code or files.

When given a task:
1. Read all relevant files using available read/search tools to fully understand the codebase
2. Think through the approach, trade-offs, and risks
3. Output your plan in EXACTLY this format (valid JSON inside the XML tags):

<plan>
{
  "title": "Brief descriptive title for the task",
  "goal": "What this plan accomplishes in 1-2 sentences",
  "files": [
    { "path": "relative/path/to/file.ts", "action": "create", "reason": "Why this file needs to be created" },
    { "path": "relative/path/to/other.ts", "action": "modify", "reason": "What changes are needed and why" }
  ],
  "steps": [
    { "id": "1", "title": "Step title", "description": "Detailed description of what to do and why", "files": ["relative/path/to/file.ts"] },
    { "id": "2", "title": "Next step", "description": "What this step does", "files": ["relative/path/to/other.ts"] }
  ],
  "risks": ["Potential breaking changes or gotchas to watch out for"],
  "questions": ["Any clarifications needed before executing \u2014 leave empty if none"]
}
</plan>

After outputting the plan, stop. Do not make any file changes. Wait for the user to approve, modify, or reject the plan.

Note: when the user approves the plan, it will be saved to \`.omnicode/plan.json\` in the workspace. During execution you can read that file to review the full plan context.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      code: {
        systemPromptAppend: `You are in coding mode. Focus on implementing changes efficiently. Write clean, well-structured code.

If a plan file exists at \`.omnicode/plan.json\`, you can read it with the Read tool to review the approved plan. As you complete each step, update that file by setting the step's \`status\` field to \`"in_progress"\` when you begin it and \`"completed"\` when you finish it. This keeps the plan progress visible to the user.`,
        temperature: 0.3
      },
      review: {
        systemPromptAppend: "You are in code review mode. Analyze code for bugs, security issues, performance problems, and style. Provide specific, actionable feedback. Do not make changes.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      security: {
        systemPromptAppend: "You are in security audit mode. Focus exclusively on identifying security vulnerabilities: injection flaws, authentication issues, data exposure, misconfigurations. Report findings with severity ratings.",
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
      },
      debug: {
        systemPromptAppend: "You are in debug mode. Focus on diagnosing issues: read logs, trace code paths, inspect state, run targeted tests. Be methodical and systematic.",
        temperature: 0.2
      },
      ask: {
        systemPromptAppend: `You are in ASK mode. Your ONLY purpose is to answer questions and provide information.

CRITICAL RULES:
1. You are in READ-ONLY mode - you CANNOT and MUST NOT make any changes to files, code, or the system
2. If the user asks you to make a change, fix something, edit code, create files, or run commands, you MUST REFUSE
3. When refusing, tell the user: "I can't make changes in Ask mode. Please switch to Code mode (\u2318I) if you'd like me to make this change."
4. You may use Read, Glob, Grep, SearchWeb, WebFetch, and other read/search tools to find information
5. NEVER use Write, Edit, MultiFileEdit, DiffEdit, Bash, GitCommit, or any tool that modifies files or executes commands
6. If you need to show code, copy it into your response - do not create or modify files

You are an assistant that provides information ONLY. Changes require switching to Code mode.`,
        disabledTools: ["Write", "Edit", "MultiFileEdit", "DiffEdit", "Bash", "GitCommit"]
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
var import_electron3 = require("electron");

// main/file-history.ts
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

// main/change-review-manager.ts
var ChangeReviewManager = class {
  // Key: `${conversationId}/${toolCallId}`
  pendingChanges = /* @__PURE__ */ new Map();
  fileHistoryManager;
  constructor(fileHistoryManager2) {
    this.fileHistoryManager = fileHistoryManager2;
  }
  /**
   * Stage a tool call change for review
   */
  stageToolCallChange(change) {
    const key = `${change.conversationId}/${change.toolCallId}`;
    this.pendingChanges.set(key, change);
    console.log(`[ChangeReviewManager] Staged change ${change.toolCallId} for ${change.filePath}`);
  }
  /**
   * Get all pending changes for a conversation
   */
  getPendingChanges(conversationId) {
    const changes = [];
    for (const [key, change] of this.pendingChanges.entries()) {
      if (key.startsWith(`${conversationId}/`) && change.status === "pending") {
        changes.push(change);
      }
    }
    return changes.sort((a, b) => a.timestamp - b.timestamp);
  }
  /**
   * Get pending changes for a specific file
   */
  getPendingForFile(conversationId, filePath) {
    return this.getPendingChanges(conversationId).filter(
      (c) => c.filePath === filePath
    );
  }
  /**
   * Get a specific pending change by tool call ID
   */
  getPendingChange(conversationId, toolCallId) {
    const key = `${conversationId}/${toolCallId}`;
    return this.pendingChanges.get(key);
  }
  /**
   * Check if a conversation has any pending changes
   */
  hasPendingChanges(conversationId) {
    return this.getPendingChanges(conversationId).length > 0;
  }
  /**
   * Get summary of changes for a conversation
   */
  getChangeSummary(conversationId) {
    const allChanges = [];
    const byFile = /* @__PURE__ */ new Map();
    for (const [key, change] of this.pendingChanges.entries()) {
      if (key.startsWith(`${conversationId}/`)) {
        allChanges.push(change);
        const fileChanges = byFile.get(change.filePath) || [];
        fileChanges.push(change);
        byFile.set(change.filePath, fileChanges);
      }
    }
    return {
      conversationId,
      totalPending: allChanges.filter((c) => c.status === "pending").length,
      totalAccepted: allChanges.filter((c) => c.status === "accepted").length,
      totalRejected: allChanges.filter((c) => c.status === "rejected").length,
      byFile
    };
  }
  /**
   * Accept a specific tool call change
   * Simply marks it as accepted - the change stays in the file
   */
  async acceptToolCallChange(conversationId, toolCallId) {
    const key = `${conversationId}/${toolCallId}`;
    const change = this.pendingChanges.get(key);
    if (!change) {
      return { success: false, error: "Change not found" };
    }
    if (change.status !== "pending") {
      return { success: false, error: `Change already ${change.status}` };
    }
    change.status = "accepted";
    change.reviewedAt = Date.now();
    this.pendingChanges.set(key, change);
    console.log(`[ChangeReviewManager] Accepted change ${toolCallId} for ${change.filePath}`);
    return { success: true };
  }
  /**
   * Reject a specific tool call change
   * Reconstructs the file without this change while keeping other changes
   */
  async rejectToolCallChange(conversationId, messageId, toolCallId) {
    const key = `${conversationId}/${toolCallId}`;
    const change = this.pendingChanges.get(key);
    if (!change) {
      return { success: false, error: "Change not found" };
    }
    if (change.status !== "pending") {
      return { success: false, error: `Change already ${change.status}` };
    }
    const absolutePath = this.fileHistoryManager["resolveFilePath"](change.filePath);
    const { promises: fs2 } = await import("fs");
    if (change.changeType === "added") {
      try {
        await fs2.unlink(absolutePath);
        console.log(`[ChangeReviewManager] Deleted newly created file ${change.filePath}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (error.code !== "ENOENT") {
          console.warn(`[ChangeReviewManager] Error deleting file ${change.filePath}: ${errorMsg}`);
        }
      }
    } else {
      const result = await this.fileHistoryManager.reconstructFileWithoutToolCall(
        conversationId,
        messageId,
        toolCallId
      );
      if (!result.success) {
        return { success: false, error: result.error };
      }
      const { dirname: dirname2 } = await import("path");
      try {
        await fs2.mkdir(dirname2(absolutePath), { recursive: true });
        await fs2.writeFile(absolutePath, result.content, "utf8");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Failed to write file: ${errorMsg}` };
      }
    }
    change.status = "rejected";
    change.reviewedAt = Date.now();
    this.pendingChanges.set(key, change);
    console.log(`[ChangeReviewManager] Rejected change ${toolCallId} for ${change.filePath}`);
    return { success: true };
  }
  /**
   * Accept all pending changes for a conversation
   */
  async acceptAllChanges(conversationId) {
    const pending = this.getPendingChanges(conversationId);
    const accepted = [];
    const failed = [];
    for (const change of pending) {
      const result = await this.acceptToolCallChange(conversationId, change.toolCallId);
      if (result.success) {
        accepted.push(change.toolCallId);
      } else {
        failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
      }
    }
    return {
      success: failed.length === 0,
      accepted,
      failed
    };
  }
  /**
   * Reject all pending changes for a conversation
   */
  async rejectAllChanges(conversationId, messageId) {
    const pending = this.getPendingChanges(conversationId);
    const rejected = [];
    const failed = [];
    for (const change of pending) {
      const result = await this.rejectToolCallChange(conversationId, messageId, change.toolCallId);
      if (result.success) {
        rejected.push(change.toolCallId);
      } else {
        failed.push({ toolCallId: change.toolCallId, error: result.error || "Unknown error" });
      }
    }
    return {
      success: failed.length === 0,
      rejected,
      failed
    };
  }
  /**
   * Clear all changes for a conversation
   */
  clearConversation(conversationId) {
    for (const [key, change] of this.pendingChanges.entries()) {
      if (key.startsWith(`${conversationId}/`)) {
        this.pendingChanges.delete(key);
      }
    }
    console.log(`[ChangeReviewManager] Cleared all changes for conversation ${conversationId}`);
  }
  /**
   * Convert a ChangePreview to PendingToolCallChange
   */
  static fromPreview(preview, beforeContent, afterContent) {
    return {
      toolCallId: preview.toolCallId,
      messageId: preview.messageId,
      conversationId: preview.conversationId || "",
      filePath: preview.filePath,
      fileName: preview.fileName,
      toolName: preview.toolName,
      changeType: preview.changeType,
      startLine: preview.startLine,
      endLine: preview.endLine,
      lineCount: preview.lineCount,
      beforeContent,
      afterContent,
      diffContent: preview.diffContent,
      beforeSnippet: preview.beforeSnippet,
      afterSnippet: preview.afterSnippet,
      additions: preview.additions,
      deletions: preview.deletions,
      status: "pending",
      timestamp: preview.timestamp
    };
  }
};
var changeReviewManager = null;
function getChangeReviewManager(fileHistoryManager2) {
  if (!changeReviewManager) {
    changeReviewManager = new ChangeReviewManager(fileHistoryManager2);
  }
  return changeReviewManager;
}

// main/settings.ts
var import_electron = require("electron");
var Store = null;
var storeImportError = null;
async function initializeStore() {
  if (Store)
    return Store;
  try {
    const storeModule = await import("electron-store");
    const StoreClass = storeModule.default || storeModule;
    if (typeof StoreClass !== "function") {
      throw new Error(`electron-store export is not a constructor. Got: ${typeof StoreClass}`);
    }
    Store = StoreClass;
    console.log("[Settings] electron-store initialized successfully");
    return Store;
  } catch (error) {
    storeImportError = error;
    console.error("[Settings] Failed to initialize electron-store:", error);
    throw error;
  }
}
var defaultSettings = {
  general: {
    theme: "dark",
    fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
    fontSize: 14,
    sidebarVisible: true,
    chatVisible: true,
    windowRestore: "last"
  },
  editor: {
    tabSize: 2,
    wordWrap: "on",
    minimap: true,
    lineNumbers: "on",
    formatOnSave: true,
    autoSave: "off",
    autoSaveDelay: 1e3,
    showWhitespace: false,
    smoothScrolling: true,
    cursorBlinking: "blink"
  },
  ai: {
    activeModels: [],
    // empty = all models available in chat panel
    temperature: 0.7,
    maxContextTokens: 128e3,
    autoRunMode: "always",
    showTokenCosts: true,
    showThinking: true,
    autoAcceptEdits: false,
    contextCompressionThreshold: 0.9,
    contextRecentMessagesToKeep: 6,
    maxTurns: null
  },
  chat: {
    autoSave: true,
    autoSaveIntervalMs: 3e3,
    maxSavedChatsPerWorkspace: 50
  },
  shortcuts: {
    openChat: "CmdOrCtrl+Shift+L",
    toggleSidebar: "CmdOrCtrl+B",
    toggleChat: "CmdOrCtrl+Shift+C",
    sendMessage: "CmdOrCtrl+Enter",
    abortAgent: "Escape",
    acceptAllEdits: "CmdOrCtrl+Shift+A",
    rejectAllEdits: "CmdOrCtrl+Shift+R",
    openSettings: "CmdOrCtrl+,",
    newFile: "CmdOrCtrl+N",
    openFolder: "CmdOrCtrl+O",
    saveFile: "CmdOrCtrl+S",
    formatDocument: "Shift+Alt+F",
    searchFiles: "CmdOrCtrl+Shift+F"
  },
  files: {
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      ".next/**",
      ".cache/**",
      "**/*.log",
      "**/Thumbs.db",
      "**/.DS_Store"
    ],
    defaultWorkspace: null,
    recentFolders: [],
    maxRecentFolders: 10,
    recentWorkspaces: [],
    maxRecentWorkspaces: 10,
    followSymlinks: false
  },
  indexing: {
    autoIndex: true,
    autoSync: true,
    syncIntervalMinutes: 5,
    useSemanticChunking: true,
    maxFilesToIndex: 500,
    maxFileSizeMB: 1,
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "**/*.min.js",
      "**/*.bundle.js",
      "**/package-lock.json",
      "**/yarn.lock"
    ]
  },
  privacy: {
    telemetryEnabled: false,
    crashReportsEnabled: false,
    analyticsEnabled: false
  },
  apiKeys: {},
  customModels: [],
  usage: {
    monthlyLimit: null,
    alertThresholds: [0.8, 0.95, 1],
    dataRetentionMonths: 12,
    showInStatusBar: true
  },
  notifications: {
    enabled: true,
    soundEnabled: true,
    sound: "default",
    playOnUserInput: true,
    playOnResponseComplete: true,
    showTrayBadge: true
  },
  remoteAccess: {
    enabled: false,
    tunnelProvider: "ngrok",
    ngrokAuthToken: "",
    cloudflaredToken: "",
    apiKey: null,
    port: 3e3,
    allowedOrigins: [],
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1e3,
    // 15 minutes
    proxyEnabled: true,
    proxyAllowedPorts: []
  },
  remoteClient: {
    url: "",
    apiKey: "",
    autoConnect: false
  },
  adb: {
    enabled: true,
    path: "adb"
  },
  changeReview: {
    enabled: true,
    mode: "all"
  }
};
var SettingsManager = class {
  store = null;
  listeners = /* @__PURE__ */ new Set();
  initialized = false;
  async initialize() {
    if (this.initialized)
      return;
    try {
      const StoreClass = await initializeStore();
      this.store = new StoreClass({
        projectName: "omni-code",
        defaults: defaultSettings,
        clearInvalidConfig: true
      });
      this.initialized = true;
      console.log("[Settings] SettingsManager initialized successfully");
    } catch (error) {
      console.error("[Settings] Failed to initialize SettingsManager:", error);
      throw error;
    }
  }
  ensureInitialized() {
    if (!this.store || !this.initialized) {
      throw new Error("SettingsManager not initialized. Call initialize() first.");
    }
    return this.store;
  }
  // Get a specific setting by path (e.g., 'general.theme')
  get(path2) {
    return this.ensureInitialized().get(path2);
  }
  // Get all settings
  getAll() {
    return this.ensureInitialized().store;
  }
  // Set a specific setting by path
  set(path2, value) {
    this.ensureInitialized().set(path2, value);
    this.notifyListeners(path2, value);
  }
  // Reset a setting to default (or all if no path provided)
  reset(path2) {
    const store = this.ensureInitialized();
    if (path2) {
      const defaultValue = this.getDefaultValue(path2);
      this.set(path2, defaultValue);
    } else {
      store.clear();
      Object.entries(defaultSettings).forEach(([key, value]) => {
        store.set(key, value);
      });
      this.notifyListeners("*", store.store);
    }
  }
  // Get default value for a path
  getDefaultValue(path2) {
    const parts = path2.split(".");
    let value = defaultSettings;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  }
  // Subscribe to changes
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  // Notify all listeners
  notifyListeners(key, value) {
    this.listeners.forEach((listener) => listener(key, value));
  }
  // Add a recent folder (plain directory, not a workspace file)
  addRecentFolder(folderPath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentFolders");
    const maxRecent = store.get("files.maxRecentFolders");
    const filtered = recent.filter((f) => f !== folderPath);
    filtered.unshift(folderPath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentFolders", limited);
    console.log("[Settings] Added recent folder:", folderPath);
  }
  // Add a recent workspace
  addRecentWorkspace(workspacePath) {
    const store = this.ensureInitialized();
    const recent = store.get("files.recentWorkspaces");
    const maxRecent = store.get("files.maxRecentWorkspaces");
    const filtered = recent.filter((w) => w !== workspacePath);
    filtered.unshift(workspacePath);
    const limited = filtered.slice(0, maxRecent);
    store.set("files.recentWorkspaces", limited);
    console.log("[Settings] Added recent workspace:", workspacePath);
  }
  // Get recent workspaces (with migration to filter out non-workspace files)
  getRecentWorkspaces() {
    const store = this.ensureInitialized();
    const workspaces = store.get("files.recentWorkspaces");
    const validWorkspaces = workspaces.filter((w) => w.endsWith(".omnicode-workspace"));
    if (validWorkspaces.length !== workspaces.length) {
      store.set("files.recentWorkspaces", validWorkspaces);
      console.log("[Settings] Cleaned up recent workspaces, removed:", workspaces.length - validWorkspaces.length, "invalid entries");
    }
    return validWorkspaces;
  }
  // Get recent folders (with migration to filter out any workspace files that were incorrectly stored)
  getRecentFolders() {
    const store = this.ensureInitialized();
    const folders = store.get("files.recentFolders");
    const validFolders = folders.filter((f) => !f.endsWith(".omnicode-workspace"));
    if (validFolders.length !== folders.length) {
      store.set("files.recentFolders", validFolders);
      console.log("[Settings] Cleaned up recent folders, removed:", folders.length - validFolders.length, "invalid entries");
    }
    return validFolders;
  }
};
var settingsManagerInstance = null;
var initializationPromise = null;
async function getSettingsManager() {
  if (settingsManagerInstance) {
    return settingsManagerInstance;
  }
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const manager = new SettingsManager();
      await manager.initialize();
      settingsManagerInstance = manager;
      return manager;
    })();
  }
  return initializationPromise;
}
var syncManagerProxy = {
  get: (path2) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.get(path2);
  },
  getAll: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getAll();
  },
  set: (path2, value) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.set(path2, value);
  },
  reset: (path2) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.reset(path2);
  },
  addRecentFolder: (folderPath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentFolder(folderPath);
  },
  getRecentFolders: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentFolders();
  },
  addRecentWorkspace: (workspacePath) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.addRecentWorkspace(workspacePath);
  },
  getRecentWorkspaces: () => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.getRecentWorkspaces();
  },
  onChange: (callback) => {
    if (!settingsManagerInstance) {
      throw new Error("SettingsManager not initialized");
    }
    return settingsManagerInstance.onChange(callback);
  }
};
var settingsManager = syncManagerProxy;

// main/tray-notifications.ts
var import_electron2 = require("electron");
var path = __toESM(require("path"), 1);
function resolveIconPaths() {
  const appRoot = import_electron2.app.getAppPath();
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return {
      png: path.join(appRoot, "logo.png"),
      icns: path.join(appRoot, "logo.icns")
    };
  }
  return {
    png: path.join(process.resourcesPath || appRoot, "logo.png"),
    icns: path.join(process.resourcesPath || appRoot, "logo.icns")
  };
}
var MAX_MENU_ITEMS = 10;
var TrayNotificationManager = class {
  tray = null;
  mainWindow = null;
  notifications = /* @__PURE__ */ new Map();
  recentChats = /* @__PURE__ */ new Map();
  activeConversationId = null;
  isWindowFocused = false;
  isChatVisible = true;
  baseIcon = null;
  navigateCallback = null;
  clearAllCallback = null;
  openProject = null;
  /**
   * Initialize the tray icon
   * Call this when the main window is created
   */
  initialize(mainWindow) {
    if (this.tray) {
      console.log("[TrayNotifications] Already initialized, destroying previous tray");
      this.tray.destroy();
    }
    this.mainWindow = mainWindow;
    this.loadBaseIcon();
    this.createTray();
    this.setupWindowTracking();
    this.setupIpcHandlers();
    console.log("[TrayNotifications] Tray manager initialized");
  }
  /**
   * Load the base app icon
   */
  loadBaseIcon() {
    try {
      const iconPaths = resolveIconPaths();
      const iconPath = process.platform === "darwin" ? iconPaths.icns : iconPaths.png;
      this.baseIcon = import_electron2.nativeImage.createFromPath(iconPath);
      if (this.baseIcon.isEmpty() && process.platform === "darwin") {
        this.baseIcon = import_electron2.nativeImage.createFromPath(iconPaths.png);
      }
      const traySize = process.platform === "darwin" ? 16 : 24;
      if (!this.baseIcon.isEmpty()) {
        this.baseIcon = this.baseIcon.resize({ width: traySize, height: traySize });
        if (process.platform === "darwin") {
          this.baseIcon.setTemplateImage(true);
        }
        console.log("[TrayNotifications] Base icon loaded successfully from:", iconPath);
      } else {
        console.warn("[TrayNotifications] Could not load icon from:", iconPath);
        this.baseIcon = import_electron2.nativeImage.createEmpty();
      }
    } catch (error) {
      console.error("[TrayNotifications] Failed to load base icon:", error);
      this.baseIcon = import_electron2.nativeImage.createEmpty();
    }
  }
  /**
   * Create the tray icon with context menu
   */
  createTray() {
    if (!this.baseIcon) {
      console.error("[TrayNotifications] Cannot create tray: base icon not loaded");
      return;
    }
    this.tray = new import_electron2.Tray(this.baseIcon);
    this.tray.setToolTip("Omni Code");
    this.tray.on("click", (_event, bounds) => {
      this.updateContextMenu();
      this.tray?.popUpContextMenu(bounds);
    });
    this.tray.on("right-click", (_event, bounds) => {
      this.updateContextMenu();
      this.tray?.popUpContextMenu(bounds);
    });
    this.updateContextMenu();
  }
  /**
   * Set up tracking for window focus and visibility state
   */
  setupWindowTracking() {
    if (!this.mainWindow)
      return;
    this.mainWindow.on("focus", () => {
      this.isWindowFocused = true;
    });
    this.mainWindow.on("blur", () => {
      this.isWindowFocused = false;
    });
    this.isWindowFocused = this.mainWindow.isFocused();
  }
  /**
   * Set up IPC handlers for renderer communication
   */
  setupIpcHandlers() {
    import_electron2.ipcMain.handle("tray:update-active", (_event, conversationId) => {
      this.activeConversationId = conversationId;
      if (conversationId) {
        this.clearNotification(conversationId);
      }
    });
    import_electron2.ipcMain.handle("tray:clear-notification", (_event, conversationId) => {
      this.clearNotification(conversationId);
    });
    import_electron2.ipcMain.handle("tray:clear-all-notifications", () => {
      this.clearAllNotifications();
    });
    import_electron2.ipcMain.handle("tray:update-recent-chats", (_event, chats) => {
      this.recentChats.clear();
      for (const chat of chats) {
        this.recentChats.set(chat.conversationId, chat);
      }
      this.updateContextMenu();
    });
    import_electron2.ipcMain.handle("tray:update-open-project", (_event, project) => {
      this.openProject = project;
      this.updateContextMenu();
    });
  }
  /**
   * Update open project info
   */
  updateOpenProject(project) {
    this.openProject = project;
    this.updateContextMenu();
  }
  /**
   * Update recent chats list from renderer
   */
  updateRecentChats(chats) {
    this.recentChats.clear();
    for (const chat of chats) {
      this.recentChats.set(chat.conversationId, chat);
    }
    this.updateContextMenu();
  }
  /**
   * Generate icon with notification badge
   * Returns base icon - badge is shown via tooltip and context menu
   */
  generateBadgeIcon(count) {
    if (!this.baseIcon) {
      return import_electron2.nativeImage.createEmpty();
    }
    return this.baseIcon;
  }
  /**
   * Update the tray icon based on notification count
   */
  updateIcon() {
    if (!this.tray || !this.baseIcon)
      return;
    const count = this.notifications.size;
    const icon = this.generateBadgeIcon(count);
    this.tray.setImage(icon);
    if (count > 0) {
      const chatText = count === 1 ? "chat" : "chats";
      this.tray.setToolTip(`${count} ${chatText} with new responses - Omni Code`);
    } else {
      this.tray.setToolTip("Omni Code");
    }
    if (process.platform === "darwin") {
      import_electron2.app.setBadgeCount(count);
    }
  }
  /**
   * Update the context menu with recent chats and pending notifications
   */
  updateContextMenu() {
    if (!this.tray)
      return;
    const menuItems = [];
    const notificationCount = this.notifications.size;
    if (notificationCount > 0) {
      menuItems.push({
        label: `\u{1F514} ${notificationCount} new response${notificationCount > 1 ? "s" : ""} waiting`,
        enabled: false
      });
      menuItems.push({
        label: "Clear All Notifications",
        click: () => {
          this.clearAllNotifications();
        }
      });
      menuItems.push({ type: "separator" });
    }
    let recentChatsList = Array.from(this.recentChats.values());
    if (this.openProject) {
      recentChatsList = recentChatsList.filter((chat) => {
        if (this.openProject.isWorkspaceMode && chat.workspaceId) {
          return chat.workspaceId === this.openProject.workspaceId;
        } else if (!this.openProject.isWorkspaceMode && chat.projectPath) {
          return chat.projectPath === this.openProject.projectPath;
        }
        return true;
      });
    }
    recentChatsList = recentChatsList.sort((a, b) => b.lastActivity - a.lastActivity).slice(0, MAX_MENU_ITEMS);
    if (recentChatsList.length > 0) {
      if (this.openProject) {
        menuItems.push({
          label: this.openProject.isWorkspaceMode ? "Open Workspace Chats" : "Open Project Chats",
          enabled: false
        });
      } else {
        menuItems.push({
          label: "Recent Chats",
          enabled: false
        });
      }
      for (const chat of recentChatsList) {
        const hasNotification = this.notifications.has(chat.conversationId);
        const notification = this.notifications.get(chat.conversationId);
        const timeAgo = this.formatTimeAgo(chat.lastActivity);
        let label;
        if (hasNotification && notification) {
          const preview = notification.messagePreview.slice(0, 30) + (notification.messagePreview.length > 30 ? "..." : "");
          label = `\u{1F534} ${chat.title} - ${preview} (${timeAgo})`;
        } else {
          label = `   ${chat.title} (${timeAgo})`;
        }
        menuItems.push({
          label,
          click: () => {
            this.navigateToChat(chat.conversationId);
          }
        });
      }
      menuItems.push({ type: "separator" });
    }
    menuItems.push({
      label: "Open Omni Code",
      click: () => {
        this.showMainWindow();
      }
    });
    menuItems.push({ type: "separator" });
    menuItems.push({
      label: "Quit",
      role: "quit"
    });
    const contextMenu = import_electron2.Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }
  /**
   * Format timestamp to relative time string
   */
  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1e3);
    if (seconds < 60)
      return "just now";
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  /**
   * Show/focus the main window and navigate to a specific chat
   */
  navigateToChat(conversationId) {
    this.showMainWindow();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("tray:navigate-to-chat", conversationId);
    }
    this.clearNotification(conversationId);
  }
  /**
   * Show and focus the main window
   */
  showMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed())
      return;
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }
  /**
   * Notify of a completed chat response
   * Call this when a response completes and should show in tray
   */
  notifyResponseComplete(conversationId, conversationTitle, messagePreview, isConversationActive) {
    if (!settingsManager.get("notifications.enabled")) {
      return;
    }
    if (!settingsManager.get("notifications.showTrayBadge")) {
      return;
    }
    if (isConversationActive && this.isWindowFocused && this.isChatVisible) {
      return;
    }
    const existing = this.notifications.get(conversationId);
    const notification = {
      conversationId,
      title: conversationTitle,
      messagePreview,
      timestamp: Date.now(),
      count: existing ? existing.count + 1 : 1
    };
    this.notifications.set(conversationId, notification);
    this.updateIcon();
    this.updateContextMenu();
    console.log(`[TrayNotifications] Added notification for conversation: ${conversationTitle} (${conversationId})`);
  }
  /**
   * Update chat visibility state from renderer
   */
  updateChatVisibility(isVisible) {
    this.isChatVisible = isVisible;
  }
  /**
   * Clear notification for a specific conversation
   */
  clearNotification(conversationId) {
    const hadNotification = this.notifications.has(conversationId);
    this.notifications.delete(conversationId);
    if (hadNotification) {
      this.updateIcon();
      this.updateContextMenu();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("tray:notification-cleared", conversationId);
      }
    }
  }
  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    const count = this.notifications.size;
    this.notifications.clear();
    if (count > 0) {
      this.updateIcon();
      this.updateContextMenu();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("tray:all-notifications-cleared");
      }
      console.log("[TrayNotifications] All notifications cleared");
    }
  }
  /**
   * Get current notification count
   */
  getNotificationCount() {
    return this.notifications.size;
  }
  /**
   * Check if a conversation has pending notification
   */
  hasNotification(conversationId) {
    return this.notifications.has(conversationId);
  }
  /**
   * Clean up tray resources
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    this.notifications.clear();
    this.mainWindow = null;
    console.log("[TrayNotifications] Tray manager destroyed");
  }
};
var trayNotificationManager = new TrayNotificationManager();

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
  // Change review mode enabled (default: true)
  changeReviewEnabled = true;
  // Initialize the bridge with agent factory
  initialize(agentFactory) {
    this.agentFactory = agentFactory;
    this.initializeChangeReviewFromSettings().catch((err) => {
      console.error("[AgentBridge] Failed to initialize change review settings:", err);
    });
  }
  /**
   * Enable or disable change review mode
   */
  setChangeReviewEnabled(enabled) {
    this.changeReviewEnabled = enabled;
    console.log(`[AgentBridge] Change review mode ${enabled ? "enabled" : "disabled"}`);
    getSettingsManager().then((manager) => {
      manager.set("changeReview.enabled", enabled);
    }).catch((err) => console.error("[AgentBridge] Failed to save change review setting:", err));
  }
  /**
   * Check if change review mode is enabled
   */
  isChangeReviewEnabled() {
    return this.changeReviewEnabled;
  }
  /**
   * Get change review setting from settings manager
   */
  async getChangeReviewSetting() {
    try {
      const manager = await getSettingsManager();
      return {
        enabled: manager.get("changeReview.enabled") ?? true,
        mode: manager.get("changeReview.mode") ?? "all"
      };
    } catch (error) {
      console.error("[AgentBridge] Failed to get change review setting:", error);
      return { enabled: true, mode: "all" };
    }
  }
  /**
   * Set change review mode (all or dangerous only)
   */
  async setChangeReviewMode(mode) {
    try {
      const manager = await getSettingsManager();
      manager.set("changeReview.mode", mode);
      console.log(`[AgentBridge] Change review mode set to: ${mode}`);
    } catch (error) {
      console.error("[AgentBridge] Failed to set change review mode:", error);
    }
  }
  /**
   * Initialize change review settings from settings manager
   */
  async initializeChangeReviewFromSettings() {
    try {
      const manager = await getSettingsManager();
      const enabled = manager.get("changeReview.enabled");
      if (typeof enabled === "boolean") {
        this.changeReviewEnabled = enabled;
        console.log(`[AgentBridge] Loaded change review setting: ${enabled ? "enabled" : "disabled"}`);
      }
      manager.onChange((key, value) => {
        if (key === "changeReview.enabled" && typeof value === "boolean") {
          this.changeReviewEnabled = value;
          console.log(`[AgentBridge] Change review setting updated: ${value ? "enabled" : "disabled"}`);
        }
      });
    } catch (error) {
      console.error("[AgentBridge] Failed to initialize change review from settings:", error);
    }
  }
  // Set the workspace path for file history tracking
  setWorkspacePath(workspacePath) {
    this.workspacePath = workspacePath;
  }
  updateWorkspaceContext(workspacePath, systemPrompt, workspacePaths) {
    this.workspacePath = workspacePath;
    for (const state of this.conversations.values()) {
      state.agent.updateConfig({
        cwd: workspacePath,
        systemPrompt,
        workspacePaths: workspacePaths ?? [workspacePath]
      });
    }
  }
  // Targeted variant: only updates the specified conversations so that a folder
  // change in one window does not overwrite another window's agent context.
  updateWorkspaceContextForConversations(workspacePath, systemPrompt, conversationIds, workspacePaths) {
    for (const conversationId of conversationIds) {
      const state = this.conversations.get(conversationId);
      if (state) {
        state.agent.updateConfig({ cwd: workspacePath, systemPrompt, workspacePaths: workspacePaths ?? [workspacePath] });
      }
    }
  }
  // Get the working directory for a specific conversation (may differ from global path in multi-window)
  getWorkspacePathForConversation(conversationId) {
    const state = this.conversations.get(conversationId);
    return state?.agent.config.cwd || this.workspacePath;
  }
  // Set the provider registry for model switching
  setProviderRegistry(registry) {
    this.providerRegistry = registry;
  }
  // Create a new conversation with optional model, provider, and working directory
  createConversation(conversationId, model, provider, workingDirectory) {
    console.log(`[AgentBridge] createConversation: id=${conversationId}, model=${model || "default"}, provider=${provider || "default"}, workingDirectory=${workingDirectory || "default"}`);
    if (!this.agentFactory) {
      console.error("[AgentBridge] Not initialized - no agent factory");
      return false;
    }
    if (this.conversations.has(conversationId)) {
      console.log(`[AgentBridge] Conversation ${conversationId} already exists, reusing`);
      if (workingDirectory) {
        const existing = this.conversations.get(conversationId);
        existing.agent.updateConfig({ cwd: workingDirectory });
        this.workspacePath = workingDirectory;
      }
      return true;
    }
    const agent = this.agentFactory(conversationId, model, provider);
    if (workingDirectory) {
      agent.updateConfig({ cwd: workingDirectory });
      this.workspacePath = workingDirectory;
      console.log(`[AgentBridge] Set cwd for conversation ${conversationId}: ${workingDirectory}`);
    }
    this.conversations.set(conversationId, {
      agent,
      isRunning: false,
      abortController: null,
      pendingFileChanges: /* @__PURE__ */ new Map()
    });
    console.log(`[AgentBridge] Created conversation: ${conversationId} (model: ${model || "default"}, provider: ${provider || "default"}, cwd: ${workingDirectory || "default"})`);
    return true;
  }
  // Restore message history into an existing conversation's agent context
  restoreHistory(conversationId, messages) {
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
    if (this.workspacePath) {
      getFileHistoryManager(this.workspacePath).clearConversation(conversationId).catch((err) => {
        console.error(`[AgentBridge] Failed to clear file history for ${conversationId}:`, err);
      });
    }
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
  // Get a snapshot of a conversation's messages and model info for persistence
  getConversationSnapshot(conversationId) {
    const state = this.conversations.get(conversationId);
    if (!state)
      return null;
    return {
      messages: [...state.agent.messages],
      model: state.agent.config.model,
      provider: state.agent.config.provider.name
    };
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
  async sendMessage(conversationId, message, workingDirectory, fileReferences, images) {
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
    let messageWithContext = message;
    if (fileReferences && fileReferences.length > 0) {
      const fileContext = fileReferences.filter((ref) => !ref.isDirectory && ref.content).map((ref) => `

--- File: ${ref.path} ---
${ref.content}`).join("");
      if (fileContext) {
        messageWithContext = `${message}${fileContext}`;
      }
    }
    const messageContent = images && images.length > 0 ? [
      { type: "text", text: messageWithContext },
      ...images.map((img) => ({
        type: "image",
        source: { type: "base64", mediaType: img.mediaType, data: img.data }
      }))
    ] : messageWithContext;
    const userMsgId = `user-${Date.now()}`;
    console.log(`[AgentBridge] Emitting user_message event: conversationId=${conversationId}, id=${userMsgId}, contentType=${typeof messageContent}, isArray=${Array.isArray(messageContent)}`);
    const displayContent = images && images.length > 0 ? [
      { type: "text", text: message },
      ...images.map((img) => ({
        type: "image",
        source: { type: "base64", mediaType: img.mediaType, data: img.data }
      }))
    ] : message;
    this.emitEvent(conversationId, {
      type: "user_message",
      message: {
        id: userMsgId,
        role: "user",
        content: displayContent,
        timestamp: Date.now(),
        fileReferences: fileReferences?.map(({ path: path2, name, isDirectory, extension }) => ({ path: path2, name, isDirectory, extension }))
      }
    });
    console.log(`[AgentBridge] user_message event emitted, listener count=${this.eventListeners.size}`);
    try {
      console.log(`[AgentBridge] Starting agent.run for conversation ${conversationId}${images?.length ? ` with ${images.length} image(s)` : ""}`);
      for await (const event of state.agent.run(messageContent)) {
        if (state.abortController.signal.aborted) {
          break;
        }
        const agentEvent = event;
        if (agentEvent.type === "error") {
          console.error("[AgentBridge] Agent error event:", agentEvent.error);
        }
        if (agentEvent.type === "turn_complete") {
          const stopReason = agentEvent.message.metadata?.stopReason;
          const assistantMessage = agentEvent.message;
          const assistantMessageId = assistantMessage.id;
          if (stopReason === "tool_use") {
            state.currentAssistantMessageId = assistantMessageId;
          } else {
            state.isRunning = false;
            state.currentAssistantMessageId = void 0;
            state.pendingFileChanges.clear();
            const content = assistantMessage.content;
            const messagePreview = typeof content === "string" ? content.slice(0, 100) : "New response";
            const firstUserMessage = state.agent.messages.find((m) => m.role === "user");
            const conversationTitle = firstUserMessage ? typeof firstUserMessage.content === "string" ? firstUserMessage.content.slice(0, 30) : "Chat" : "Chat";
            trayNotificationManager.notifyResponseComplete(
              conversationId,
              conversationTitle,
              messagePreview,
              false
              // isConversationActive - will be determined by tray manager based on activeConversationId
            );
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
          console.log(`[ChangeReview] tool_call_end: toolName=${toolName}, toolId=${toolId}, changeReviewEnabled=${this.changeReviewEnabled}, workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
          if (FILE_MODIFYING_TOOLS.includes(toolName) && workingDir && state.currentAssistantMessageId) {
            try {
              const filePaths = state.pendingFileChanges.get(toolId) || [];
              const fileHistoryManager2 = getFileHistoryManager(workingDir);
              const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
              console.log(`[ChangeReview] Processing tool_call_end for ${toolName}, filePaths=${JSON.stringify(filePaths)}, isError=${result.isError}`);
              if (!result.isError) {
                for (const filePath of filePaths) {
                  await fileHistoryManager2.captureAfterChange(
                    conversationId,
                    state.currentAssistantMessageId,
                    toolId,
                    filePath
                  );
                }
                const changes = await fileHistoryManager2.getMessageChanges(
                  conversationId,
                  state.currentAssistantMessageId
                );
                console.log(`[ChangeReview] getMessageChanges returned ${changes.length} change(s) for messageId=${state.currentAssistantMessageId}`);
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
                  if (this.changeReviewEnabled) {
                    console.log(`[ChangeReview] Change review enabled, processing ${changes.length} change(s) for preview`);
                    const currentToolChanges = changes.filter((c) => c.toolCallId === toolId);
                    console.log(`[ChangeReview] Current tool (${toolId}) has ${currentToolChanges.length} change(s)`);
                    for (const change of currentToolChanges) {
                      const preview = await fileHistoryManager2.getChangePreview(
                        conversationId,
                        state.currentAssistantMessageId,
                        change.toolCallId
                      );
                      console.log(`[ChangeReview] getChangePreview for toolCallId=${change.toolCallId}: ${preview ? `found (${preview.filePath}, +${preview.additions}/-${preview.deletions})` : "null"}`);
                      if (preview) {
                        const pendingChange = {
                          toolCallId: preview.toolCallId,
                          messageId: preview.messageId,
                          conversationId,
                          filePath: preview.filePath,
                          fileName: preview.fileName,
                          toolName: preview.toolName,
                          changeType: preview.changeType,
                          startLine: preview.startLine,
                          endLine: preview.endLine,
                          lineCount: preview.lineCount,
                          beforeContent: change.beforeContent,
                          afterContent: change.afterContent || "",
                          diffContent: preview.diffContent,
                          beforeSnippet: preview.beforeSnippet,
                          afterSnippet: preview.afterSnippet,
                          additions: preview.additions,
                          deletions: preview.deletions,
                          status: "pending",
                          timestamp: preview.timestamp
                        };
                        changeReviewManager2.stageToolCallChange(pendingChange);
                        console.log(`[ChangeReview] Emitting change_preview for ${preview.filePath} (toolId=${change.toolCallId}, messageId=${state.currentAssistantMessageId})`);
                        this.emitEvent(conversationId, {
                          type: "change_preview",
                          conversationId,
                          message: { id: state.currentAssistantMessageId },
                          toolId: change.toolCallId,
                          filePath: preview.filePath,
                          fileName: preview.fileName,
                          toolName: preview.toolName,
                          changeType: preview.changeType,
                          startLine: preview.startLine,
                          endLine: preview.endLine,
                          lineCount: preview.lineCount,
                          diffContent: preview.diffContent,
                          beforeSnippet: preview.beforeSnippet,
                          afterSnippet: preview.afterSnippet,
                          additions: preview.additions,
                          deletions: preview.deletions,
                          status: "pending"
                        });
                      }
                    }
                  } else {
                    console.log(`[ChangeReview] Change review disabled, skipping preview emission`);
                  }
                } else {
                  console.log(`[ChangeReview] No changes found, skipping preview emission`);
                }
              } else {
                console.log(`[ChangeReview] Tool returned error, skipping change capture`);
              }
            } catch (error) {
              console.error("[AgentBridge] Failed to capture after-change state:", error);
            } finally {
              state.pendingFileChanges.delete(toolId);
            }
          } else {
            if (!FILE_MODIFYING_TOOLS.includes(toolName)) {
            } else {
              console.log(`[ChangeReview] Skipping change review: workingDir=${!!workingDir}, messageId=${state.currentAssistantMessageId}`);
            }
          }
        }
        if (agentEvent.type === "error") {
          const rawErr = agentEvent.error;
          const message2 = rawErr?.message || rawErr?.error?.message || (typeof rawErr === "string" ? rawErr : JSON.stringify(rawErr));
          const status = rawErr?.status;
          this.emitEvent(conversationId, {
            type: "error",
            error: { message: message2, ...status != null ? { status } : {} }
          });
          state.isRunning = false;
          state.currentAssistantMessageId = void 0;
          state.pendingFileChanges.clear();
        } else if (agentEvent.type === "tool_call_start" && state.currentAssistantMessageId) {
          this.emitEvent(conversationId, { ...agentEvent, messageId: state.currentAssistantMessageId });
        } else {
          this.emitEvent(conversationId, agentEvent);
        }
      }
    } catch (error) {
      console.error(`[AgentBridge] Agent error in conversation ${conversationId}:`, error);
      console.error("[AgentBridge] Error details:", {
        message: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code,
        type: error.type,
        response: error.response
      });
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
    console.log(`[AgentBridge] switchModel called: conversation=${conversationId}, model=${model}, provider=${providerName}`);
    const state = this.conversations.get(conversationId);
    if (!state) {
      console.error(`[AgentBridge] Conversation ${conversationId} not found`);
      return false;
    }
    try {
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
      const currentSystemPrompt = state.agent.config.systemPrompt || "";
      const basePrompt = currentSystemPrompt.replace(/\n\nYou are in (architect|code|review|security|debug|ask) mode\.?.*/s, "");
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
    if (this.workspacePath) {
      const fileHistoryManager2 = getFileHistoryManager(this.workspacePath);
      const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
      changeReviewManager2.clearConversation(conversationId);
    }
  }
  /**
   * Respond to a pending change review request
   */
  async respondToChangeReview(conversationId, messageId, toolCallId, decision) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return { success: false, error: "No workspace path set for conversation" };
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    if (decision === "accept") {
      const result = await changeReviewManager2.acceptToolCallChange(conversationId, toolCallId);
      if (result.success) {
        const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
        this.emitEvent(conversationId, {
          type: "change_accepted",
          toolId: toolCallId,
          filePath: pendingChange?.filePath || ""
        });
      }
      return result;
    } else {
      const result = await changeReviewManager2.rejectToolCallChange(conversationId, messageId, toolCallId);
      if (result.success) {
        const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
        this.emitEvent(conversationId, {
          type: "change_rejected",
          toolId: toolCallId,
          filePath: pendingChange?.filePath || ""
        });
      }
      return result;
    }
  }
  /**
   * Accept all pending changes for a conversation
   */
  async acceptAllChanges(conversationId) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return { success: false, accepted: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    const result = await changeReviewManager2.acceptAllChanges(conversationId);
    if (result.accepted.length > 0) {
      for (const toolCallId of result.accepted) {
        const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
        this.emitEvent(conversationId, {
          type: "change_accepted",
          toolId: toolCallId,
          filePath: pendingChange?.filePath || ""
        });
      }
    }
    return result;
  }
  /**
   * Reject all pending changes for a conversation
   */
  async rejectAllChanges(conversationId, messageId) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return { success: false, rejected: [], failed: [{ toolCallId: "all", error: "No workspace path set for conversation" }] };
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    const result = await changeReviewManager2.rejectAllChanges(conversationId, messageId);
    if (result.rejected.length > 0) {
      for (const toolCallId of result.rejected) {
        const pendingChange = changeReviewManager2.getPendingChange(conversationId, toolCallId);
        this.emitEvent(conversationId, {
          type: "change_rejected",
          toolId: toolCallId,
          filePath: pendingChange?.filePath || ""
        });
      }
    }
    return result;
  }
  /**
   * Get pending changes for a conversation
   */
  getPendingChanges(conversationId) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return [];
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    return changeReviewManager2.getPendingChanges(conversationId);
  }
  /**
   * Get change summary for a conversation
   */
  getChangeSummary(conversationId) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return { totalPending: 0, totalAccepted: 0, totalRejected: 0 };
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    return changeReviewManager2.getChangeSummary(conversationId);
  }
  /**
   * Check if there are pending changes for a conversation
   */
  hasPendingChanges(conversationId) {
    const workingDir = this.getWorkspacePathForConversation(conversationId);
    if (!workingDir) {
      return false;
    }
    const fileHistoryManager2 = getFileHistoryManager(workingDir);
    const changeReviewManager2 = getChangeReviewManager(fileHistoryManager2);
    return changeReviewManager2.hasPendingChanges(conversationId);
  }
  /**
   * Truncate conversation messages to a specific index
   * Keeps messages from 0 to messageIndex (inclusive)
   * @returns true if successful, false if conversation not found
   */
  truncateMessages(conversationId, messageIndex) {
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
    const truncatedMessages = currentMessages.slice(0, messageIndex + 1);
    state.agent.clearMessages();
    const agentWithAddMessage = state.agent;
    if (typeof agentWithAddMessage.addMessage === "function") {
      for (const msg of truncatedMessages) {
        agentWithAddMessage.addMessage(msg);
      }
    } else {
      const agentWithInternal = state.agent;
      if (agentWithInternal._messages) {
        agentWithInternal._messages.push(...truncatedMessages);
      } else {
        console.error("[AgentBridge] Cannot add messages - no addMessage method or _messages array available");
        return false;
      }
    }
    console.log(`[AgentBridge] Truncated conversation ${conversationId} to ${truncatedMessages.length} messages (removed ${currentMessages.length - truncatedMessages.length})`);
    return true;
  }
  onEvent(callback) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }
  emitEvent(conversationId, event) {
    const eventWithId = { ...event, conversationId };
    const windows = import_electron3.BrowserWindow.getAllWindows();
    if (event.type === "user_message") {
      console.log(`[AgentBridge.emitEvent] user_message: broadcasting to ${windows.length} window(s), ${this.eventListeners.size} listener(s), conversationId=${conversationId}`);
    }
    windows.forEach((window) => {
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
    import_electron3.BrowserWindow.getAllWindows().forEach((window) => {
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