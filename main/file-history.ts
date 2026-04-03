import { promises as fs } from 'node:fs';
import { dirname, isAbsolute, join, resolve, extname, basename } from 'node:path';

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
   * Rollback all changes from a specific message onwards
   * This restores files to their state before the specified message was processed
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

    // Restore each file to its before state
    for (const change of targetSnapshot.changes.filter(entry => entry.afterContent !== undefined)) {
      const absolutePath = this.resolveFilePath(change.filePath);

      try {
        // Ensure directory exists
        await fs.mkdir(dirname(absolutePath), { recursive: true });

        if (change.changeType === 'delete') {
          // If the change was a delete, we need to restore the file
          if (change.beforeContent) {
            await fs.writeFile(absolutePath, change.beforeContent, 'utf8');
            restoredFiles.push(change.filePath);
          }
        } else if (change.changeType === 'write' && !change.beforeContent) {
          // New file was created, delete it to rollback
          try {
            await fs.unlink(absolutePath);
            restoredFiles.push(change.filePath);
          } catch (error) {
            // File might already be deleted
            restoredFiles.push(change.filePath);
          }
        } else {
          // File was modified, restore original content
          await fs.writeFile(absolutePath, change.beforeContent, 'utf8');
          restoredFiles.push(change.filePath);
        }
      } catch (error) {
        console.error(`[FileHistoryManager] Failed to restore ${change.filePath}:`, error);
        failedFiles.push(change.filePath);
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
