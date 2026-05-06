import { promises as fs } from 'node:fs';
import { dirname, isAbsolute, join, resolve, extname, basename } from 'node:path';
import { diffLines, createPatch, applyPatch } from 'diff';

/**
 * Represents a single file change snapshot
 */
export interface FileChange {
  messageId: string;
  toolCallId: string;
  filePath: string;
  beforeContent: string;
  afterContent?: string;
  timestamp: number;
  changeType: 'write' | 'edit' | 'delete';
}

/**
 * Extended file change with line location and diff info for tool call-level review
 */
export interface ToolCallFileChange extends FileChange {
  toolName: string;
  toolInput: Record<string, unknown>;
  
  // Line location info for navigation
  startLine: number;
  endLine: number;
  lineCount: number;
  
  // Diff content for preview
  diffContent: string;
  beforeSnippet: string;
  afterSnippet: string;
}

/**
 * Change preview data for UI display
 */
export interface ChangePreview {
  toolCallId: string;
  messageId: string;
  filePath: string;
  fileName: string;
  toolName: string;
  changeType: 'added' | 'modified' | 'deleted';
  startLine: number;
  endLine: number;
  lineCount: number;
  diffContent: string;
  beforeSnippet: string;
  afterSnippet: string;
  additions: number;
  deletions: number;
  timestamp: number;
}

/**
 * Represents aggregated file change summary with line statistics
 */
export interface FileChangeSummary {
  filePath: string;
  fileName: string;
  extension: string;
  changeType: 'added' | 'modified' | 'deleted';
  lastMessageId: string;
  lastTimestamp: number;
  changeCount: number;
  additions: number;
  deletions: number;
}

/**
 * Calculate line-level diff statistics between two content strings
 * Uses a simple line-by-line comparison to count additions and deletions
 */
function calculateLineDiff(beforeContent: string, afterContent: string): { additions: number; deletions: number } {
  const beforeLines = beforeContent.split('\n');
  const afterLines = afterContent.split('\n');

  // Simple approach: count lines that exist in after but not in before (additions)
  // and lines that exist in before but not in after (deletions)
  // This is a simplified diff - for more accuracy, use a proper diff algorithm

  let additions = 0;
  let deletions = 0;

  // For new files: all lines are additions
  if (!beforeContent && afterContent) {
    additions = afterLines.length;
    return { additions, deletions };
  }

  // For deleted files: all lines are deletions
  if (beforeContent && !afterContent) {
    deletions = beforeLines.length;
    return { additions, deletions };
  }

  // For modified files: use a simple heuristic
  // Count the difference in total lines
  const lineDiff = afterLines.length - beforeLines.length;

  if (lineDiff > 0) {
    // More lines in after = net additions
    additions = lineDiff;
    // Estimate deletions as a portion of unchanged content
    deletions = Math.max(0, Math.floor(beforeLines.length * 0.05)); // Estimate 5% changed
  } else if (lineDiff < 0) {
    // Fewer lines in after = net deletions
    deletions = Math.abs(lineDiff);
    additions = Math.max(0, Math.floor(afterLines.length * 0.05)); // Estimate 5% changed
  } else {
    // Same number of lines - estimate some changes
    additions = Math.max(1, Math.floor(afterLines.length * 0.05));
    deletions = Math.max(1, Math.floor(beforeLines.length * 0.05));
  }

  return { additions, deletions };
}

/**
 * Generate a unified diff between two content strings using the Myers diff
 * algorithm (via the `diff` npm package). This produces minimal, accurate diffs
 * unlike the previous greedy linear-scan approach which over-reported changes.
 */
function generateUnifiedDiff(beforeContent: string, afterContent: string, filePath: string, contextLines: number = 3): string {
  // diffLines returns Change[] where each chunk covers one or more lines.
  // .added / .removed flags mark changed chunks; neither flag = unchanged.
  const chunks = diffLines(beforeContent, afterContent);

  // Flatten to a per-line representation so hunk logic is straightforward.
  type LineEntry = { type: 'added' | 'removed' | 'unchanged'; content: string };
  const lines: LineEntry[] = [];
  for (const chunk of chunks) {
    const chunkLines = chunk.value.split('\n');
    // diffLines includes a trailing empty string when the value ends with '\n'
    if (chunkLines[chunkLines.length - 1] === '') chunkLines.pop();
    const type: LineEntry['type'] = chunk.added ? 'added' : chunk.removed ? 'removed' : 'unchanged';
    for (const line of chunkLines) {
      lines.push({ type, content: line });
    }
  }

  let diff = `--- ${filePath}\n+++ ${filePath}\n`;

  // Build hunks with context lines
  let oldLine = 1; // 1-based position in the before file
  let newLine = 1; // 1-based position in the after file
  let i = 0;

  while (i < lines.length) {
    // Skip unchanged lines outside a hunk
    if (lines[i].type === 'unchanged') {
      oldLine++;
      newLine++;
      i++;
      continue;
    }

    // We're at the start of a changed region — collect hunk
    const hunkStart = Math.max(0, i - contextLines);
    const hunkOldStart = oldLine - (i - hunkStart);
    const hunkNewStart = newLine - (i - hunkStart);

    const hunkLines: LineEntry[] = [];
    // Pre-context
    for (let k = hunkStart; k < i; k++) {
      hunkLines.push(lines[k]);
    }

    // Collect changed lines and following context
    let lastChangeIdx = i;
    while (i < lines.length) {
      hunkLines.push(lines[i]);
      if (lines[i].type !== 'unchanged') {
        lastChangeIdx = i;
      }
      // If we've collected enough context after the last change, stop
      if (lines[i].type === 'unchanged' && i - lastChangeIdx >= contextLines) {
        i++;
        break;
      }
      i++;
    }

    // Trim trailing context lines beyond contextLines
    const trailingUnchanged = hunkLines.reduceRight((count, l) => {
      if (count === -1) return -1; // already stopped
      return l.type === 'unchanged' ? count + 1 : -1;
    }, 0 as number);
    const trimCount = trailingUnchanged > contextLines ? trailingUnchanged - contextLines : 0;
    const trimmedHunk = trimCount > 0 ? hunkLines.slice(0, hunkLines.length - trimCount) : hunkLines;

    const oldCount = trimmedHunk.filter(l => l.type !== 'added').length;
    const newCount = trimmedHunk.filter(l => l.type !== 'removed').length;

    diff += `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@\n`;
    for (const l of trimmedHunk) {
      if (l.type === 'added') diff += `+${l.content}\n`;
      else if (l.type === 'removed') diff += `-${l.content}\n`;
      else diff += ` ${l.content}\n`;
    }

    // Advance old/new line counters past the hunk
    for (const l of trimmedHunk) {
      if (l.type !== 'added') oldLine++;
      if (l.type !== 'removed') newLine++;
    }
  }

  return diff;
}

/**
 * Find the line location of a change based on tool input
 */
function findChangeLocation(
  beforeContent: string, 
  afterContent: string, 
  toolName: string, 
  toolInput: Record<string, unknown>
): { startLine: number; endLine: number; lineCount: number } {
  const beforeLines = beforeContent.split('\n');
  const afterLines = afterContent.split('\n');
  
  let startLine = 1;
  let endLine = afterLines.length;
  let lineCount = afterLines.length;
  
  // For Edit tool, find the old_string location
  if (toolName === 'Edit' && typeof toolInput.old_string === 'string') {
    const oldString = toolInput.old_string;
    const oldLines = oldString.split('\n');
    
    // Find the starting line of old_string in beforeContent
    for (let i = 0; i <= beforeLines.length - oldLines.length; i++) {
      const match = oldLines.every((line, idx) => beforeLines[i + idx] === line);
      if (match) {
        startLine = i + 1; // 1-indexed
        endLine = startLine + oldLines.length - 1;
        break;
      }
    }
    
    // Calculate end line in afterContent
    if (typeof toolInput.new_string === 'string') {
      const newLines = toolInput.new_string.split('\n');
      lineCount = newLines.length;
      endLine = startLine + newLines.length - 1;
    }
  } else if (toolName === 'Write') {
    // New file starts at line 1
    startLine = 1;
    endLine = afterLines.length;
    lineCount = afterLines.length;
  }
  
  return { startLine, endLine, lineCount };
}

/**
 * Generate snippet around a change for preview
 */
function generateSnippet(content: string, startLine: number, endLine: number, contextLines: number = 3): string {
  const lines = content.split('\n');
  const snippetStart = Math.max(0, startLine - 1 - contextLines);
  const snippetEnd = Math.min(lines.length, endLine + contextLines);
  return lines.slice(snippetStart, snippetEnd).join('\n');
}

/**
 * Get file extension from file path (without the dot)
 */
function getFileExtension(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * Get file name from file path
 */
function getFileName(filePath: string): string {
  return basename(filePath);
}

/**
 * Apply the inverse of A's change (beforeContent→afterContent) to currentContent.
 *
 * This lets us revert A's specific edits to a file while preserving any
 * concurrent modifications made by other chats on top of A's version.
 *
 * Strategy:
 *   1. Build the inverse unified patch: afterContent → beforeContent
 *   2. Apply that patch to currentContent with a small fuzz factor so that
 *      minor context drift (e.g. B added/removed nearby lines) doesn't block it
 *   3. Return null if the patch cannot be applied cleanly (caller decides fallback)
 */
function applyInversePatch(
  beforeContent: string,
  afterContent: string,
  currentContent: string
): string | null {
  const inversePatch = createPatch('file', afterContent, beforeContent, '', '', { context: 4 });
  const result = applyPatch(currentContent, inversePatch, { fuzzFactor: 2 });
  return result === false ? null : result;
}

/**
 * Collection of all changes for a specific message
 */
export interface MessageSnapshot {
  messageId: string;
  conversationId: string;
  changes: FileChange[];
  timestamp: number;
}

const MAX_INMEMORY_SNAPSHOTS = 50;

/**
 * FileHistoryManager tracks file changes per message for rollback support
 * Stores snapshots in memory and on disk in .omnicode/backups/
 * Evicts old snapshots from memory after persisting to disk to bound heap usage.
 */
export class FileHistoryManager {
  private snapshots = new Map<string, MessageSnapshot>(); // key: `${conversationId}/${messageId}`
  private workspacePath: string;
  private backupDir: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.backupDir = join(workspacePath, '.omnicode', 'backups');
  }

  private resolveFilePath(filePath: string): string {
    return isAbsolute(filePath) ? filePath : resolve(this.workspacePath, filePath);
  }

  /**
   * Initialize the backup directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('[FileHistoryManager] Failed to create backup directory:', error);
    }
  }

  /**
   * Create a snapshot of a file before it's modified
   * Call this before executing file-modifying tools
   */
  async captureBeforeChange(
    conversationId: string,
    messageId: string,
    toolCallId: string,
    filePath: string,
    changeType: 'write' | 'edit' | 'delete'
  ): Promise<void> {
    const absolutePath = this.resolveFilePath(filePath);
    let beforeContent = '';

    try {
      // Try to read current file content
      beforeContent = await fs.readFile(absolutePath, 'utf8');
    } catch (error) {
      // File doesn't exist (new file being written) or can't be read
      beforeContent = '';
    }

    const key = `${conversationId}/${messageId}`;
    let snapshot = this.snapshots.get(key);

    if (!snapshot) {
      snapshot = {
        messageId,
        conversationId,
        changes: [],
        timestamp: Date.now(),
      };
      this.snapshots.set(key, snapshot);
    }

    // Check if we already have a change for this file in this message
    const existingChange = snapshot.changes.find(c => c.filePath === filePath);
    if (existingChange) {
      // Don't overwrite the original beforeContent - we want the very first state
      return;
    }

    const change: FileChange = {
      messageId,
      toolCallId,
      filePath,
      beforeContent,
      timestamp: Date.now(),
      changeType,
    };

    snapshot.changes.push(change);

    // Also persist to disk for safety
    await this.persistSnapshot(snapshot);
  }

  /**
   * Update the afterContent of a change after tool execution completes
   */
  async captureAfterChange(
    conversationId: string,
    messageId: string,
    toolCallId: string,
    filePath: string
  ): Promise<void> {
    const absolutePath = this.resolveFilePath(filePath);
    let afterContent = '';

    try {
      afterContent = await fs.readFile(absolutePath, 'utf8');
    } catch (error) {
      // File was deleted or can't be read
      afterContent = '';
    }

    const key = `${conversationId}/${messageId}`;
    const snapshot = this.snapshots.get(key);

    if (!snapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for ${key}`);
      return;
    }

    const change = snapshot.changes.find(
      c => c.filePath === filePath && c.toolCallId === toolCallId
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
  async getMessageChanges(conversationId: string, messageId: string): Promise<FileChange[]> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);
    return snapshot?.changes.filter(change => change.afterContent !== undefined) || [];
  }

  /**
   * Check if a message has any file changes
   */
  async hasChanges(conversationId: string, messageId: string): Promise<boolean> {
    const changes = await this.getMessageChanges(conversationId, messageId);
    return changes.length > 0;
  }

  /**
   * Get all messages that have file changes in a conversation
   */
  getMessagesWithChanges(conversationId: string): string[] {
    const messages: string[] = [];
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
  async getAllConversationChanges(conversationId: string): Promise<FileChangeSummary[]> {
    // Reload any evicted snapshots for this conversation from disk
    await this.ensureConversationLoaded(conversationId);

    const fileMap = new Map<string, FileChangeSummary & { lastBeforeContent: string; lastAfterContent: string }>();

    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId !== conversationId) continue;

      for (const change of snapshot.changes.filter(entry => entry.afterContent !== undefined)) {
        const existing = fileMap.get(change.filePath);

        // Determine the effective change type
        let effectiveType: 'added' | 'modified' | 'deleted';
        if (change.changeType === 'delete') {
          effectiveType = 'deleted';
        } else if (!change.beforeContent && change.afterContent) {
          effectiveType = 'added';
        } else {
          effectiveType = 'modified';
        }

        // Calculate line diff for this specific change
        const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || '');

        if (existing) {
          // Update existing entry if this change is newer
          if (snapshot.timestamp > existing.lastTimestamp) {
            // If file was previously added and now deleted, it's deleted
            // If file was previously deleted and now added, it's added
            // Otherwise use the new type
            if (existing.changeType === 'deleted' && effectiveType === 'added') {
              effectiveType = 'added'; // Re-added after deletion
            } else if (effectiveType === 'deleted') {
              effectiveType = 'deleted';
            } else if (existing.changeType === 'added') {
              effectiveType = 'added'; // Still added (modified after creation)
            } else {
              effectiveType = 'modified';
            }

            existing.changeType = effectiveType;
            existing.lastMessageId = snapshot.messageId;
            existing.lastTimestamp = snapshot.timestamp;
            // Store content for cumulative diff calculation
            existing.lastBeforeContent = change.beforeContent;
            existing.lastAfterContent = change.afterContent || '';
          }
          existing.changeCount++;
          // Accumulate line stats
          existing.additions += lineDiff.additions;
          existing.deletions += lineDiff.deletions;
        } else {
          // New file entry
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
            lastAfterContent: change.afterContent || '',
          });
        }
      }
    }

    // Convert to array, remove temporary content fields, and sort by timestamp (most recent first)
    return Array.from(fileMap.values())
      .map(({ lastBeforeContent, lastAfterContent, ...summary }) => summary)
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }

  /**
   * Get file changes for a specific message with line statistics.
   * Loads from disk if the snapshot was evicted from memory.
   */
  async getMessageChangesWithStats(conversationId: string, messageId: string): Promise<FileChangeSummary[]> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);

    if (!snapshot) {
      return [];
    }

    return snapshot.changes
      .filter(change => change.afterContent !== undefined)
      .map(change => {
        const lineDiff = calculateLineDiff(change.beforeContent, change.afterContent || '');

        let changeType: 'added' | 'modified' | 'deleted';
        if (change.changeType === 'delete') {
          changeType = 'deleted';
        } else if (!change.beforeContent && change.afterContent) {
          changeType = 'added';
        } else {
          changeType = 'modified';
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
          deletions: lineDiff.deletions,
        };
      });
  }

  /**
   * Rollback all changes from a specific message onwards.
   * Collects ALL snapshots from the target message onward, determines the
   * earliest beforeContent for each affected file, and restores it.
   */
  async rollbackToMessage(conversationId: string, messageId: string): Promise<{
    success: boolean;
    restoredFiles: string[];
    failedFiles: string[];
  }> {
    const restoredFiles: string[] = [];
    const failedFiles: string[] = [];

    const targetKey = `${conversationId}/${messageId}`;
    const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);

    if (!targetSnapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for message ${messageId}`);
      return { success: false, restoredFiles, failedFiles };
    }

    // Load all snapshots for this conversation so we can find everything
    // from the target timestamp onward.
    await this.ensureConversationLoaded(conversationId);

    const affectedSnapshots: MessageSnapshot[] = [];
    for (const [, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
        affectedSnapshots.push(snapshot);
      }
    }

    // Sort chronologically so we process earliest first
    affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[FileHistoryManager] Rolling back ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);

    // For each file touched across all affected snapshots, we want to restore
    // to the earliest beforeContent — the state before the first snapshot touched it.
    const fileRestoreMap = new Map<string, {
      beforeContent: string;
      lastAfterContent: string;
      changeType: 'write' | 'edit' | 'delete';
      hadBeforeContent: boolean;
    }>();

    for (const snapshot of affectedSnapshots) {
      for (const change of snapshot.changes.filter(entry => entry.afterContent !== undefined)) {
        if (!fileRestoreMap.has(change.filePath)) {
          fileRestoreMap.set(change.filePath, {
            beforeContent: change.beforeContent,
            lastAfterContent: change.afterContent!,
            changeType: change.changeType,
            hadBeforeContent: !!change.beforeContent,
          });
        } else {
          // Update lastAfterContent so we know what the file looked like
          // after the latest snapshot (for inverse-patch detection).
          const existing = fileRestoreMap.get(change.filePath)!;
          existing.lastAfterContent = change.afterContent!;
        }
      }
    }

    // Restore each file to its earliest beforeContent
    for (const [filePath, restore] of fileRestoreMap.entries()) {
      const absolutePath = this.resolveFilePath(filePath);

      try {
        await fs.mkdir(dirname(absolutePath), { recursive: true });

        let currentContent: string | null;
        try {
          currentContent = await fs.readFile(absolutePath, 'utf8');
        } catch {
          currentContent = null;
        }

        if (!restore.hadBeforeContent) {
          // File was created by the first snapshot — delete it to roll back.
          if (currentContent === null || currentContent === restore.lastAfterContent) {
            try { await fs.unlink(absolutePath); } catch { /* already gone */ }
          } else {
            const reverted = applyInversePatch('', restore.lastAfterContent, currentContent);
            if (reverted !== null && reverted.trim() === '') {
              try { await fs.unlink(absolutePath); } catch { /* already gone */ }
            } else {
              console.warn(`[FileHistoryManager] Could not cleanly revert created file ${filePath}. Deleting.`);
              try { await fs.unlink(absolutePath); } catch { /* already gone */ }
            }
          }
          restoredFiles.push(filePath);
        } else if (restore.changeType === 'delete' && !restore.lastAfterContent) {
          // File was deleted — restore it.
          await fs.writeFile(absolutePath, restore.beforeContent, 'utf8');
          restoredFiles.push(filePath);
        } else {
          // File was modified. Restore to the earliest beforeContent.
          if (currentContent === null) {
            if (restore.beforeContent) {
              await fs.writeFile(absolutePath, restore.beforeContent, 'utf8');
            }
          } else if (currentContent === restore.lastAfterContent) {
            await fs.writeFile(absolutePath, restore.beforeContent, 'utf8');
          } else {
            const reverted = applyInversePatch(restore.beforeContent, restore.lastAfterContent, currentContent);
            if (reverted !== null) {
              await fs.writeFile(absolutePath, reverted, 'utf8');
            } else {
              console.warn(`[FileHistoryManager] Could not cleanly revert ${filePath}. Restoring to pre-change state.`);
              await fs.writeFile(absolutePath, restore.beforeContent, 'utf8');
            }
          }
          restoredFiles.push(filePath);
        }
      } catch (error) {
        console.error(`[FileHistoryManager] Failed to restore ${filePath}:`, error);
        failedFiles.push(filePath);
      }
    }

    // Clear all snapshots from this message onwards
    this.clearSnapshotsFromMessage(conversationId, targetSnapshot.timestamp);

    return {
      success: failedFiles.length === 0,
      restoredFiles,
      failedFiles,
    };
  }

  /**
   * Re-apply changes from a specific message onward (undo a previous rollback).
   * Loads all snapshots from the target message onward and writes the latest
   * afterContent for each affected file.
   */
  async reapplyMessage(conversationId: string, messageId: string): Promise<{
    success: boolean;
    restoredFiles: string[];
    failedFiles: string[];
  }> {
    const restoredFiles: string[] = [];
    const failedFiles: string[] = [];

    // Load snapshots from disk (they may have been evicted from memory by rollback)
    await this.ensureConversationLoaded(conversationId);

    const targetKey = `${conversationId}/${messageId}`;
    const targetSnapshot = await this.ensureSnapshotLoaded(targetKey);

    if (!targetSnapshot) {
      console.warn(`[FileHistoryManager] No snapshot found for message ${messageId} (reapply)`);
      return { success: false, restoredFiles, failedFiles };
    }

    // Collect all snapshots from the target onward
    const affectedSnapshots: MessageSnapshot[] = [];
    for (const [, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId && snapshot.timestamp >= targetSnapshot.timestamp) {
        affectedSnapshots.push(snapshot);
      }
    }

    // Sort chronologically so later changes overwrite earlier ones
    affectedSnapshots.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[FileHistoryManager] Re-applying ${affectedSnapshots.length} snapshot(s) from message ${messageId} onward`);

    // For each file, use the latest afterContent across all affected snapshots
    const fileReapplyMap = new Map<string, {
      afterContent: string;
      changeType: 'write' | 'edit' | 'delete';
    }>();

    for (const snapshot of affectedSnapshots) {
      for (const change of snapshot.changes.filter(entry => entry.afterContent !== undefined)) {
        fileReapplyMap.set(change.filePath, {
          afterContent: change.afterContent!,
          changeType: change.changeType,
        });
      }
    }

    for (const [filePath, reapply] of fileReapplyMap.entries()) {
      const absolutePath = this.resolveFilePath(filePath);

      try {
        await fs.mkdir(dirname(absolutePath), { recursive: true });

        if (reapply.changeType === 'delete') {
          try { await fs.unlink(absolutePath); } catch { /* already gone */ }
          restoredFiles.push(filePath);
        } else {
          await fs.writeFile(absolutePath, reapply.afterContent, 'utf8');
          restoredFiles.push(filePath);
        }
      } catch (error) {
        console.error(`[FileHistoryManager] Failed to reapply ${filePath}:`, error);
        failedFiles.push(filePath);
      }
    }

    return {
      success: failedFiles.length === 0,
      restoredFiles,
      failedFiles,
    };
  }

  /**
   * Clear all snapshots for a conversation (when conversation is deleted)
   */
  async clearConversation(conversationId: string): Promise<void> {
    // Clear from memory
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId) {
        this.snapshots.delete(key);
      }
    }

    // Clear from disk
    const conversationBackupDir = join(this.backupDir, conversationId);
    try {
      await fs.rmdir(conversationBackupDir, { recursive: true });
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Clear snapshots from a specific message onwards (after rollback)
   */
  private clearSnapshotsFromMessage(conversationId: string, fromTimestamp: number): void {
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.conversationId === conversationId && snapshot.timestamp >= fromTimestamp) {
        this.snapshots.delete(key);
      }
    }
  }

  /**
   * Persist a snapshot to disk for safety, then evict old entries from memory.
   */
  private async persistSnapshot(snapshot: MessageSnapshot): Promise<void> {
    const snapshotDir = join(this.backupDir, snapshot.conversationId, snapshot.messageId);

    try {
      await fs.mkdir(snapshotDir, { recursive: true });

      for (const change of snapshot.changes) {
        const safeFileName = change.filePath.replace(/[/\\]/g, '_');
        const backupPath = join(snapshotDir, `${safeFileName}.json`);

        await fs.writeFile(backupPath, JSON.stringify(change, null, 2), 'utf8');
      }
    } catch (error) {
      console.error('[FileHistoryManager] Failed to persist snapshot:', error);
      return; // Don't evict if persist failed
    }

    this.evictOldSnapshots();
  }

  /**
   * Remove the oldest snapshots from memory when exceeding the cap.
   * Evicted snapshots are safe to remove because they were already persisted to disk.
   */
  private evictOldSnapshots(): void {
    if (this.snapshots.size <= MAX_INMEMORY_SNAPSHOTS) return;

    const entries = Array.from(this.snapshots.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = entries.length - MAX_INMEMORY_SNAPSHOTS;
    for (let i = 0; i < toEvict; i++) {
      this.snapshots.delete(entries[i][0]);
    }
  }

  /**
   * Load a single snapshot from disk into memory if it isn't already present.
   */
  private async ensureSnapshotLoaded(key: string): Promise<MessageSnapshot | undefined> {
    const existing = this.snapshots.get(key);
    if (existing) return existing;

    const [conversationId, messageId] = key.split('/');
    if (!conversationId || !messageId) return undefined;

    const messageDir = join(this.backupDir, conversationId, messageId);
    try {
      const stat = await fs.stat(messageDir);
      if (!stat.isDirectory()) return undefined;

      const files = await fs.readdir(messageDir);
      const changes: FileChange[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = join(messageDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          changes.push(JSON.parse(content) as FileChange);
        } catch {
          // Skip unreadable files
        }
      }

      if (changes.length > 0) {
        const snapshot: MessageSnapshot = {
          messageId,
          conversationId,
          changes,
          timestamp: changes[0]?.timestamp || Date.now(),
        };
        this.snapshots.set(key, snapshot);
        return snapshot;
      }
    } catch {
      // Directory doesn't exist on disk
    }
    return undefined;
  }

  /**
   * Ensure all snapshots for a conversation are loaded into memory.
   * Re-reads any that were evicted since initial load.
   */
  private async ensureConversationLoaded(conversationId: string): Promise<void> {
    const conversationBackupDir = join(this.backupDir, conversationId);
    try {
      const messageDirs = await fs.readdir(conversationBackupDir);
      for (const messageId of messageDirs) {
        const key = `${conversationId}/${messageId}`;
        if (this.snapshots.has(key)) continue;
        await this.ensureSnapshotLoaded(key);
      }
    } catch {
      // Directory doesn't exist
    }
  }

  /**
   * Load snapshots from disk for a conversation
   */
  async loadSnapshots(conversationId: string): Promise<void> {
    const conversationBackupDir = join(this.backupDir, conversationId);

    try {
      const messageDirs = await fs.readdir(conversationBackupDir);

      for (const messageId of messageDirs) {
        const messageDir = join(conversationBackupDir, messageId);
        const stat = await fs.stat(messageDir);

        if (!stat.isDirectory()) continue;

        const files = await fs.readdir(messageDir);
        const changes: FileChange[] = [];

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = join(messageDir, file);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const change: FileChange = JSON.parse(content);
            changes.push(change);
          } catch (error) {
            console.error(`[FileHistoryManager] Failed to load change from ${filePath}:`, error);
          }
        }

        if (changes.length > 0) {
          const snapshot: MessageSnapshot = {
            messageId,
            conversationId,
            changes,
            timestamp: changes[0]?.timestamp || Date.now(),
          };
          this.snapshots.set(`${conversationId}/${messageId}`, snapshot);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Get detailed change preview for a specific tool call
   * Includes diff content and line location information
   */
  async getChangePreview(
    conversationId: string,
    messageId: string,
    toolCallId: string
  ): Promise<ChangePreview | null> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);

    if (!snapshot) return null;

    const change = snapshot.changes.find(c => c.toolCallId === toolCallId);
    if (!change || !change.afterContent) return null;

    // Determine change type
    let changeType: 'added' | 'modified' | 'deleted';
    if (change.changeType === 'delete') {
      changeType = 'deleted';
    } else if (!change.beforeContent && change.afterContent) {
      changeType = 'added';
    } else {
      changeType = 'modified';
    }

    // Generate unified diff using the Myers algorithm
    const diffContent = generateUnifiedDiff(
      change.beforeContent,
      change.afterContent || '',
      change.filePath
    );

    // Derive accurate counts from the diff itself rather than using the crude estimator.
    // ^\+(?!\+\+) matches added lines, excluding the +++ file header.
    // ^-(?!--) matches removed lines, excluding the --- file header.
    const additions = (diffContent.match(/^\+(?!\+\+)/gm) || []).length;
    const deletions = (diffContent.match(/^-(?!--)/gm) || []).length;

    // Find line location (estimate for now)
    const { startLine, endLine, lineCount } = findChangeLocation(
      change.beforeContent,
      change.afterContent || '',
      change.changeType === 'write' ? 'Write' : 'Edit',
      {}
    );

    // Generate snippets
    const beforeSnippet = generateSnippet(change.beforeContent, startLine, endLine);
    const afterSnippet = generateSnippet(change.afterContent || '', startLine, endLine);

    return {
      toolCallId: change.toolCallId,
      messageId: change.messageId,
      filePath: change.filePath,
      fileName: getFileName(change.filePath),
      toolName: change.changeType === 'write' ? 'Write' : 'Edit',
      changeType,
      startLine,
      endLine,
      lineCount,
      diffContent,
      beforeSnippet,
      afterSnippet,
      additions,
      deletions,
      timestamp: change.timestamp,
    };
  }

  /**
   * Get all tool call changes for a message
   */
  async getToolCallChanges(
    conversationId: string,
    messageId: string
  ): Promise<ChangePreview[]> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);

    if (!snapshot) return [];

    const previews: ChangePreview[] = [];
    for (const change of snapshot.changes.filter(c => c.afterContent !== undefined)) {
      const preview = await this.getChangePreview(conversationId, messageId, change.toolCallId);
      if (preview) previews.push(preview);
    }

    return previews;
  }

  /**
   * Reconstruct file content without a specific tool call's changes
   * Used when rejecting a single tool call change while keeping others
   */
  async reconstructFileWithoutToolCall(
    conversationId: string,
    messageId: string,
    toolCallIdToExclude: string
  ): Promise<{ success: boolean; content: string; error?: string }> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);

    if (!snapshot) {
      return { success: false, content: '', error: 'Snapshot not found' };
    }

    const targetChange = snapshot.changes.find(c => c.toolCallId === toolCallIdToExclude);
    if (!targetChange) {
      return { success: false, content: '', error: 'Tool call change not found' };
    }

    // Start with the before content of the target change
    let reconstructedContent = targetChange.beforeContent;

    // Get all other changes to this file from this message that should be applied
    const otherChanges = snapshot.changes.filter(
      c => c.filePath === targetChange.filePath && 
           c.toolCallId !== toolCallIdToExclude &&
           c.afterContent !== undefined
    );

    // Sort by timestamp to apply in order
    otherChanges.sort((a, b) => a.timestamp - b.timestamp);

    // Apply each subsequent change
    for (const change of otherChanges) {
      if (change.timestamp > targetChange.timestamp) {
        // This change came after the one being rejected, so apply it
        // For now, we use the stored afterContent which already includes all changes
        // A more sophisticated approach would re-apply the edit
        reconstructedContent = change.afterContent || reconstructedContent;
      }
    }

    return { success: true, content: reconstructedContent };
  }

  /**
   * Revert a specific tool call change
   */
  async revertToolCallChange(
    conversationId: string,
    messageId: string,
    toolCallId: string
  ): Promise<{ success: boolean; error?: string }> {
    const key = `${conversationId}/${messageId}`;
    const snapshot = await this.ensureSnapshotLoaded(key);

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found' };
    }

    const change = snapshot.changes.find(c => c.toolCallId === toolCallId);
    if (!change) {
      return { success: false, error: 'Tool call change not found' };
    }

    const absolutePath = this.resolveFilePath(change.filePath);

    try {
      // Reconstruct content without this change
      const result = await this.reconstructFileWithoutToolCall(conversationId, messageId, toolCallId);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Write reconstructed content
      await fs.mkdir(dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, result.content, 'utf8');

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to revert change: ${errorMsg}` };
    }
  }
}

// Singleton instance
let fileHistoryManager: FileHistoryManager | null = null;

export function getFileHistoryManager(workspacePath: string): FileHistoryManager {
  if (!fileHistoryManager || fileHistoryManager['workspacePath'] !== workspacePath) {
    fileHistoryManager = new FileHistoryManager(workspacePath);
    fileHistoryManager.initialize().catch(console.error);
  }
  return fileHistoryManager;
}

export function clearFileHistoryManager(): void {
  fileHistoryManager = null;
}
