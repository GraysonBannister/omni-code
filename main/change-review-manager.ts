import type { ChangePreview, FileHistoryManager } from './file-history.js';

/**
 * Status of a pending tool call change
 */
export type ChangeStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Pending tool call change with full context for review
 */
export interface PendingToolCallChange {
  toolCallId: string;
  messageId: string;
  conversationId: string;
  filePath: string;
  fileName: string;
  toolName: string;
  changeType: 'added' | 'modified' | 'deleted';
  
  // Location info for navigation
  startLine: number;
  endLine: number;
  lineCount: number;
  
  // Content for reconstruction
  beforeContent: string;
  afterContent: string;
  diffContent: string;
  beforeSnippet: string;
  afterSnippet: string;
  
  // Stats
  additions: number;
  deletions: number;
  
  // Review state
  status: ChangeStatus;
  timestamp: number;
  reviewedAt?: number;
}

/**
 * Summary of changes for a conversation
 */
export interface ChangeReviewSummary {
  conversationId: string;
  totalPending: number;
  totalAccepted: number;
  totalRejected: number;
  byFile: Map<string, PendingToolCallChange[]>;
}

/**
 * ChangeReviewManager tracks pending tool call changes awaiting user review
 * and handles accept/reject operations with proper file reconstruction
 */
export class ChangeReviewManager {
  // Key: `${conversationId}/${toolCallId}`
  private pendingChanges = new Map<string, PendingToolCallChange>();
  private fileHistoryManager: FileHistoryManager;

  constructor(fileHistoryManager: FileHistoryManager) {
    this.fileHistoryManager = fileHistoryManager;
  }

  /**
   * Stage a tool call change for review
   */
  stageToolCallChange(change: PendingToolCallChange): void {
    const key = `${change.conversationId}/${change.toolCallId}`;
    this.pendingChanges.set(key, change);
    console.log(`[ChangeReviewManager] Staged change ${change.toolCallId} for ${change.filePath}`);
  }

  /**
   * Get all pending changes for a conversation
   */
  getPendingChanges(conversationId: string): PendingToolCallChange[] {
    const changes: PendingToolCallChange[] = [];
    for (const [key, change] of this.pendingChanges.entries()) {
      if (key.startsWith(`${conversationId}/`) && change.status === 'pending') {
        changes.push(change);
      }
    }
    return changes.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get pending changes for a specific file
   */
  getPendingForFile(conversationId: string, filePath: string): PendingToolCallChange[] {
    return this.getPendingChanges(conversationId).filter(
      c => c.filePath === filePath
    );
  }

  /**
   * Get a specific pending change by tool call ID
   */
  getPendingChange(conversationId: string, toolCallId: string): PendingToolCallChange | undefined {
    const key = `${conversationId}/${toolCallId}`;
    return this.pendingChanges.get(key);
  }

  /**
   * Check if a conversation has any pending changes
   */
  hasPendingChanges(conversationId: string): boolean {
    return this.getPendingChanges(conversationId).length > 0;
  }

  /**
   * Get summary of changes for a conversation
   */
  getChangeSummary(conversationId: string): ChangeReviewSummary {
    const allChanges: PendingToolCallChange[] = [];
    const byFile = new Map<string, PendingToolCallChange[]>();

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
      totalPending: allChanges.filter(c => c.status === 'pending').length,
      totalAccepted: allChanges.filter(c => c.status === 'accepted').length,
      totalRejected: allChanges.filter(c => c.status === 'rejected').length,
      byFile,
    };
  }

  /**
   * Accept a specific tool call change
   * Simply marks it as accepted - the change stays in the file
   */
  async acceptToolCallChange(
    conversationId: string,
    toolCallId: string
  ): Promise<{ success: boolean; error?: string }> {
    const key = `${conversationId}/${toolCallId}`;
    const change = this.pendingChanges.get(key);

    if (!change) {
      return { success: false, error: 'Change not found' };
    }

    if (change.status !== 'pending') {
      return { success: false, error: `Change already ${change.status}` };
    }

    // Mark as accepted
    change.status = 'accepted';
    change.reviewedAt = Date.now();
    this.pendingChanges.set(key, change);

    console.log(`[ChangeReviewManager] Accepted change ${toolCallId} for ${change.filePath}`);
    return { success: true };
  }

  /**
   * Reject a specific tool call change
   * Reconstructs the file without this change while keeping other changes
   */
  async rejectToolCallChange(
    conversationId: string,
    messageId: string,
    toolCallId: string
  ): Promise<{ success: boolean; error?: string }> {
    const key = `${conversationId}/${toolCallId}`;
    const change = this.pendingChanges.get(key);

    if (!change) {
      return { success: false, error: 'Change not found' };
    }

    if (change.status !== 'pending') {
      return { success: false, error: `Change already ${change.status}` };
    }

    const absolutePath = this.fileHistoryManager['resolveFilePath'](change.filePath);
    const { promises: fs } = await import('node:fs');

    // If this was a new file (added), delete it instead of reconstructing
    if (change.changeType === 'added') {
      try {
        await fs.unlink(absolutePath);
        console.log(`[ChangeReviewManager] Deleted newly created file ${change.filePath}`);
      } catch (error) {
        // File might not exist or already deleted - that's ok
        const errorMsg = error instanceof Error ? error.message : String(error);
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`[ChangeReviewManager] Error deleting file ${change.filePath}: ${errorMsg}`);
        }
      }
    } else {
      // Revert the file using FileHistoryManager
      const result = await this.fileHistoryManager.reconstructFileWithoutToolCall(
        conversationId,
        messageId,
        toolCallId
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Write the reconstructed content
      const { dirname } = await import('node:path');
      
      try {
        await fs.mkdir(dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, result.content, 'utf8');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Failed to write file: ${errorMsg}` };
      }
    }

    // Mark as rejected
    change.status = 'rejected';
    change.reviewedAt = Date.now();
    this.pendingChanges.set(key, change);

    console.log(`[ChangeReviewManager] Rejected change ${toolCallId} for ${change.filePath}`);
    return { success: true };
  }

  /**
   * Accept all pending changes for a conversation
   */
  async acceptAllChanges(conversationId: string): Promise<{
    success: boolean;
    accepted: string[];
    failed: Array<{ toolCallId: string; error: string }>;
  }> {
    const pending = this.getPendingChanges(conversationId);
    const accepted: string[] = [];
    const failed: Array<{ toolCallId: string; error: string }> = [];

    for (const change of pending) {
      const result = await this.acceptToolCallChange(conversationId, change.toolCallId);
      if (result.success) {
        accepted.push(change.toolCallId);
      } else {
        failed.push({ toolCallId: change.toolCallId, error: result.error || 'Unknown error' });
      }
    }

    return {
      success: failed.length === 0,
      accepted,
      failed,
    };
  }

  /**
   * Reject all pending changes for a conversation
   */
  async rejectAllChanges(
    conversationId: string,
    messageId: string
  ): Promise<{
    success: boolean;
    rejected: string[];
    failed: Array<{ toolCallId: string; error: string }>;
  }> {
    const pending = this.getPendingChanges(conversationId);
    const rejected: string[] = [];
    const failed: Array<{ toolCallId: string; error: string }> = [];

    for (const change of pending) {
      const result = await this.rejectToolCallChange(conversationId, messageId, change.toolCallId);
      if (result.success) {
        rejected.push(change.toolCallId);
      } else {
        failed.push({ toolCallId: change.toolCallId, error: result.error || 'Unknown error' });
      }
    }

    return {
      success: failed.length === 0,
      rejected,
      failed,
    };
  }

  /**
   * Clear all changes for a conversation
   */
  clearConversation(conversationId: string): void {
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
  static fromPreview(preview: ChangePreview, beforeContent: string, afterContent: string): PendingToolCallChange {
    return {
      toolCallId: preview.toolCallId,
      messageId: preview.messageId,
      conversationId: preview.conversationId || '',
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
      status: 'pending',
      timestamp: preview.timestamp,
    };
  }
}

// Singleton instance
let changeReviewManager: ChangeReviewManager | null = null;

export function getChangeReviewManager(fileHistoryManager: FileHistoryManager): ChangeReviewManager {
  if (!changeReviewManager) {
    changeReviewManager = new ChangeReviewManager(fileHistoryManager);
  }
  return changeReviewManager;
}

export function clearChangeReviewManager(): void {
  changeReviewManager = null;
}
