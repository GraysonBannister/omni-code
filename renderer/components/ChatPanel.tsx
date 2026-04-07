import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Square, Trash2, Bot, User, Terminal, Plus, X, MessageSquare, Cpu, ChevronDown, ChevronUp, Undo, History, FolderOpen, Files, Layers, Check, ImagePlus, Brain } from 'lucide-react';
import { FileHistoryPopup } from './FileHistoryPopup';
import { MentionPopup, type MentionFile } from './MentionPopup';
import { FileReferenceChip, FileReferenceChipRow, type FileReference } from './FileReferenceChip';
import { ModeSelector, AIMode } from './ModeSelector';
import { PlanningPanel, type ExecutionPlan, type PlanFile } from './PlanningPanel';
import { InlinePlanCard } from './InlinePlanCard';
import { UserInputCard, type UserInputRequest } from './UserInputCard';
import { PermissionCard, type PermissionRequest } from './PermissionCard';
import { CollapsibleToolSummary } from './CollapsibleToolSummary';
import { useAppStore, type ToolCall, type PendingPlan, type PlanningApproach, type PlanStepStatus } from '../stores/appStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ContentBlock } from '../../src/core/message-types.js';
import type { ChangePreviewData } from '../types/changeReview';
import './ChatPanel.css';

interface ImageAttachment {
  mediaType: string;
  data: string;
  previewUrl: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{language || 'text'}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function stripPlanBlock(text: string): string {
  if (!text.includes('<plan>')) return text;
  // Strip preamble + the plan block; preserve any content after </plan>
  return text.replace(/[\s\S]*<plan>[\s\S]*?<\/plan>\n?/g, '').trim();
}

function renderTextContent(content: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  while (remaining.length > 0) {
    const codeBlockMatch = remaining.match(/```(\w+)?\n([\s\S]*?)```/);
    
    if (codeBlockMatch && codeBlockMatch.index !== undefined) {
      // Add text before code block
      if (codeBlockMatch.index > 0) {
        parts.push(
          <p key={`${keyPrefix}-text-${key++}`} className="message-text">
            {remaining.substring(0, codeBlockMatch.index)}
          </p>
        );
      }
      
      // Add code block
      parts.push(
        <CodeBlock
          key={`${keyPrefix}-code-${key++}`}
          code={codeBlockMatch[2].trim()}
          language={codeBlockMatch[1]}
        />
      );
      
      remaining = remaining.substring(codeBlockMatch.index + codeBlockMatch[0].length);
    } else {
      // No more code blocks
      if (remaining.trim()) {
        parts.push(
          <p key={`${keyPrefix}-tail-${key++}`} className="message-text">
            {remaining}
          </p>
        );
      }
      break;
    }
  }

  return parts;
}

function extractTextFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function isToolOnlyMessage(content: string | ContentBlock[] | null | undefined): boolean {
  // Returns true if message contains only tool blocks (no text content)
  if (!Array.isArray(content) || content.length === 0) return false;
  return content.every((block) => block.type === 'tool_use' || block.type === 'tool_result');
}

function hasToolErrorContent(content: string | ContentBlock[] | null | undefined): boolean {
  return Array.isArray(content) && content.some((block) => block.type === 'tool_result' && !!block.isError);
}

function formatToolInput(input: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const truncated = value.length > 60 ? `${value.slice(0, 60)}...` : value;
      parts.push(`${key}: "${truncated}"`);
    } else {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return parts.join(', ');
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getToolStatusDetail(
  tool: {
    toolName: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    input: Record<string, unknown>;
    startedAt?: number;
    phase?: string;
    detail?: string;
  },
  now: number,
): string | undefined {
  if (tool.detail) {
    return tool.detail;
  }

  if (tool.phase === 'waiting_permission') {
    return `Waiting for permission to run ${tool.toolName}.`;
  }

  if (tool.phase === 'validating') {
    return 'Validating tool input.';
  }

  if (tool.status !== 'running' || tool.toolName !== 'Write') {
    return undefined;
  }

  const pathValue = typeof tool.input.file_path === 'string' ? tool.input.file_path : 'file';
  const contentValue = typeof tool.input.content === 'string' ? tool.input.content : '';
  const contentBytes = new TextEncoder().encode(contentValue).length;
  const elapsedMs = tool.startedAt ? now - tool.startedAt : 0;
  const baseMessage = `Writing ${formatByteSize(contentBytes)} to ${pathValue}`;

  if (elapsedMs >= 10000) {
    return `${baseMessage}. Taking longer than expected.`;
  }

  return baseMessage;
}

function inferToolPhase(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('verifying')) return 'verifying';
  if (normalized.includes('writing')) return 'writing';
  if (normalized.includes('permission')) return 'waiting_permission';
  if (normalized.includes('validating')) return 'validating';
  return 'running';
}

// Tool calls are shown in the timeline via CollapsibleToolSummary, not inline
const InlineToolCall: React.FC<{ block: Extract<ContentBlock, { type: 'tool_use' }> }> = () => {
  return null;
};

// Tool results are shown in the timeline, not inline
const InlineToolResult: React.FC<{ block: Extract<ContentBlock, { type: 'tool_result' }>; index: number }> = () => {
  return null;
};

// Collapsible thinking/reasoning section for assistant messages
const ThinkingSection: React.FC<{ thinking: string }> = ({ thinking }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log(`[ThinkingSection] Rendering with thinking length: ${thinking.length}, preview: ${thinking.substring(0, 100)}...`);

  return (
    <div className="thinking-section">
      <button
        className="thinking-header"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide thinking' : 'Show thinking'}
      >
        <Brain size={14} />
        <span>Thinking</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isExpanded && (
        <div className="thinking-content">
          <pre>{thinking}</pre>
        </div>
      )}
    </div>
  );
};

const MessageContent: React.FC<{ content: string | ContentBlock[] | null | undefined }> = ({ content }) => {
  if (typeof content === 'string') {
    return <>{renderTextContent(stripPlanBlock(content), 'string')}</>;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  return (
    <>
      {content.map((block, index) => {
        if (block.type === 'text') {
          return <React.Fragment key={`block-${index}`}>{renderTextContent(stripPlanBlock(block.text), `block-${index}`)}</React.Fragment>;
        }

        if (block.type === 'tool_use') {
          return <InlineToolCall key={block.id} block={block} />;
        }

        if (block.type === 'tool_result') {
          return <InlineToolResult key={`tool-result-${index}`} block={block} index={index} />;
        }

        if (block.type === 'image') {
          return (
            <p key={`image-${index}`} className="message-text">
              [Image content]
            </p>
          );
        }

        return null;
      })}
    </>
  );
};

const DiffPreviewCard: React.FC<{
  preview: ChangePreviewData;
  onAccept: () => void;
  onReject: () => void;
  onOpenFile?: (filePath: string, lineNumber: number) => void;
}> = ({ preview, onAccept, onReject, onOpenFile }) => {
  const isPending = preview.status === 'pending';
  const [isExpanded, setIsExpanded] = useState(false);
  const allLines = preview.diffContent.split('\n');
  const diffLines = isExpanded ? allLines : allLines.slice(0, 8);
  const hasMore = allLines.length > 8;

  return (
    <div className={`diff-preview-card diff-preview-${preview.status} ${isExpanded ? 'diff-preview-expanded' : ''}`}>
      <div className="diff-preview-header">
        <span
          className="diff-preview-filename clickable"
          onClick={() => onOpenFile?.(preview.filePath, preview.startLine)}
          title="Click to open file"
        >
          {preview.fileName}:{preview.startLine}
        </span>
        <span className="diff-preview-stats">
          {preview.additions > 0 && <span className="diff-stat-add">+{preview.additions}</span>}
          {preview.deletions > 0 && <span className="diff-stat-del">-{preview.deletions}</span>}
        </span>
        {!isPending && (
          <span className={`diff-preview-status diff-status-${preview.status}`}>
            {preview.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
          </span>
        )}
        {hasMore && (
          <button
            className="diff-preview-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      <div className="diff-preview-snippet">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={`diff-line ${
              line.startsWith('+') && !line.startsWith('+++')
                ? 'diff-add'
                : line.startsWith('-') && !line.startsWith('---')
                ? 'diff-del'
                : ''
            }`}
          >
            {line || '\u00a0'}
          </div>
        ))}
        {!isExpanded && hasMore && (
          <div className="diff-line diff-more-indicator">
            ... {allLines.length - 8} more lines
          </div>
        )}
      </div>
      {isPending && (
        <div className="diff-preview-actions">
          <button className="btn-reject-change" onClick={onReject}>Reject</button>
          <button className="btn-accept-change" onClick={onAccept}>Accept</button>
        </div>
      )}
    </div>
  );
};

const ContextIndicator: React.FC<{
  used: number;
  max: number;
}> = ({ used, max }) => {
  if (!max || max <= 0) return null;

  const ratio = Math.min(used / max, 1);
  const pct = Math.round(ratio * 100);
  const colorClass = ratio > 0.9 ? 'error' : ratio > 0.7 ? 'warning' : 'success';

  return (
    <div className="context-indicator">
      <div className="context-bar">
        <div
          className={`context-bar-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="context-text">
        {used.toLocaleString()} / {max.toLocaleString()} tokens ({pct}%)
      </span>
    </div>
  );
};

interface FileChange {
  filePath: string;
  fileName: string;
  extension: string;
  changeType: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  messageId: string;
  timestamp: number;
}

interface FileHistoryItem {
  filePath: string;
  fileName: string;
  extension: string;
  changeType: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  messageId?: string;
}

interface RollbackButtonProps {
  conversationId: string;
  messageId: string;
  fileChanges: FileChange[];
  onRollback: (messageId: string) => void;
}

const RollbackButton: React.FC<RollbackButtonProps> = ({ conversationId, messageId, fileChanges, onRollback }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!fileChanges || fileChanges.length === 0) return null;

  const fileCount = fileChanges.length;

  return (
    <button
      className="rollback-button"
      onClick={() => onRollback(messageId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Rollback ${fileCount} file change${fileCount !== 1 ? 's' : ''}`}
    >
      <Undo size={14} />
      <span className="rollback-text">
        {isHovered ? `Rollback ${fileCount} change${fileCount !== 1 ? 's' : ''}` : `${fileCount} change${fileCount !== 1 ? 's' : ''}`}
      </span>
    </button>
  );
};

// Group consecutive SAFE tools together for collapsible display
type ToolGroup = { type: 'single'; tool: ToolCall } | { type: 'group'; tools: ToolCall[] };

function groupToolCalls(toolCalls: ToolCall[]): ToolGroup[] {
  const groups: ToolGroup[] = [];
  let currentSafeGroup: ToolCall[] = [];

  for (const tool of toolCalls) {
    const isSafe = tool.permissionLevel === 'safe';
    const isCompleted = tool.status === 'completed';
    
    if (isSafe && isCompleted) {
      currentSafeGroup.push(tool);
    } else {
      if (currentSafeGroup.length > 0) {
        groups.push({ type: 'group', tools: currentSafeGroup });
        currentSafeGroup = [];
      }
      groups.push({ type: 'single', tool });
    }
  }

  if (currentSafeGroup.length > 0) {
    groups.push({ type: 'group', tools: currentSafeGroup });
  }

  return groups;
}

// Create unified timeline of messages and tool calls
type TimelineItem = 
  | { type: 'message'; data: Message; timestamp: number }
  | { type: 'tool-group'; data: ToolCall[]; timestamp: number }
  | { type: 'tool-single'; data: ToolCall; timestamp: number }
  | { type: 'plan-card'; data: PendingPlan; timestamp: number };

function createTimeline(
  messages: Message[],
  toolCalls: ToolCall[],
  pendingPlan?: PendingPlan | null,
  planSourceMessageId?: string | null,
): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  
  // Add messages to timeline
  messages.forEach(msg => {
    timeline.push({ 
      type: 'message', 
      data: msg, 
      timestamp: msg.timestamp 
    });
  });
  
  // Add grouped tool calls to timeline
  const groups = groupToolCalls(toolCalls);
  groups.forEach(group => {
    if (group.type === 'group') {
      const firstToolTime = group.tools[0]?.startedAt || 0;
      timeline.push({ 
        type: 'tool-group', 
        data: group.tools, 
        timestamp: firstToolTime 
      });
    } else {
      timeline.push({ 
        type: 'tool-single', 
        data: group.tool, 
        timestamp: group.tool.startedAt || 0 
      });
    }
  });
  
  // Sort by timestamp
  timeline.sort((a, b) => a.timestamp - b.timestamp);

  // Splice in the plan card after its source message
  if (pendingPlan) {
    let idx = planSourceMessageId
      ? timeline.findIndex(item => item.type === 'message' && item.data.id === planSourceMessageId)
      : -1;

    // Fallback: scan backwards for the last assistant message containing a <plan> block
    if (idx < 0) {
      for (let i = timeline.length - 1; i >= 0; i--) {
        const item = timeline[i];
        if (item.type !== 'message') continue;
        const msg = item.data as Message;
        if (msg.role !== 'assistant') continue;
        const text = typeof msg.content === 'string'
          ? msg.content
          : Array.isArray(msg.content)
            ? (msg.content as ContentBlock[])
                .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
                .map(b => b.text)
                .join('')
            : '';
        if (text.includes('<plan>')) {
          idx = i;
          break;
        }
      }
    }

    const insertAt = idx >= 0 ? idx + 1 : timeline.length;
    const sourceTimestamp = idx >= 0 ? timeline[idx].timestamp : Date.now();
    timeline.splice(insertAt, 0, {
      type: 'plan-card',
      data: pendingPlan,
      timestamp: sourceTimestamp + 1,
    });
  }
  
  return timeline;
}

type Message = import('../stores/appStore').Message;

export const ChatPanel: React.FC = () => {
  const {
    // Multi-conversation state
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    closeConversation,
    renameConversation,
    addMessageToConversation,
    setConversationProcessing,
    setConversationStreaming,
    appendConversationStreaming,
    addToolCallToConversation,
    updateToolCallInConversation,
    setConversationOrchestrationStatus,
    clearConversationMessages,
    switchConversationModel,
    updateConversationContext,
    setConversationMode,
    setPlanningApproach,
    setPendingPlan,
    setPlanFilePath,
    updatePendingPlanStepStatus,
    // Past chats state
    pastChats,
    pastChatsLoaded,
    listSavedConversations,
    openPastChat,
    // File history popup state
    fileHistoryPopupVisible,
    fileHistoryPopupPinned,
    hideFileHistoryPopup,
    toggleFileHistoryPopup,
    pinFileHistoryPopup,
    // Global state
    setCost,
    availableModels,
    availableProviders,
    currentModel,
    projectPath,
    files,
    openFolder,
    openRecentWorkspace,
    reviewedToolCallIds,
  } = useAppStore();

  // Get settings for showThinking preference
  const { settings } = useSettingsStore();
  const showThinking = settings?.ai?.showThinking ?? true;

  const [inputValue, setInputValue] = useState('');
  const [now, setNow] = useState(Date.now());
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [pastChatsPanelOpen, setPastChatsPanelOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [messageFileChanges, setMessageFileChanges] = useState<Map<string, FileChange[]>>(new Map());
  const [messageChangePreviews, setMessageChangePreviews] = useState<Map<string, ChangePreviewData[]>>(new Map());
  // Buffer for change previews received before the final assistant message is committed.
  // Flushed into messageChangePreviews when turn_complete with stopReason=end_turn arrives.
  const pendingChangePreviewsRef = useRef<ChangePreviewData[]>([]);
  const [conversationFileChanges, setConversationFileChanges] = useState<FileChange[]>([]);
  const [pendingUserInput, setPendingUserInput] = useState<UserInputRequest | null>(null);
  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null);
  
  // Mention (@ file reference) state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [mentionHighlightedIndex, setMentionHighlightedIndex] = useState(0);
  const [selectedReferences, setSelectedReferences] = useState<FileReference[]>([]);
  const mentionPopupRef = useRef<HTMLDivElement>(null);

  // Image attachment state
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const pastChatsPanelRef = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);
  const userInputCardRef = useRef<HTMLDivElement>(null);

  // Clear stale file change data when switching conversations
  // Restore pending change previews from saved conversation if they exist
  useEffect(() => {
    setMessageFileChanges(new Map());
    setConversationFileChanges([]);
    useAppStore.getState().clearAllFilePendingPreviews();
    useAppStore.getState().clearReviewedToolCallIds();

    // Restore pending change previews from the conversation if available
    if (activeConversationId) {
      const conversation = useAppStore.getState().conversations.find(c => c.id === activeConversationId);
      const savedPreviews = conversation?.pendingChangePreviews;
      if (savedPreviews && savedPreviews.size > 0) {
        setMessageChangePreviews(new Map(savedPreviews));
        console.log(`[ChangeReview] Restored ${savedPreviews.size} message(s) with pending previews`);
      } else {
        setMessageChangePreviews(new Map());
      }
    } else {
      setMessageChangePreviews(new Map());
    }
    pendingChangePreviewsRef.current = [];
  }, [activeConversationId]);

  // Persist messageChangePreviews to conversation when they change
  useEffect(() => {
    if (activeConversationId) {
      useAppStore.getState().setPendingChangePreviews(activeConversationId, messageChangePreviews);
    }
  }, [activeConversationId, messageChangePreviews]);

  // Subscribe to plan file changes (external edits or AI updates)
  useEffect(() => {
    if (!window.electronAPI?.plan?.onFileChanged) return;

    const unsubscribe = window.electronAPI.plan.onFileChanged(({ conversationId, plan: fileData }) => {
      const store = useAppStore.getState();
      const conv = store.conversations.find(c => c.id === conversationId);
      if (!conv?.pendingPlan) return;

      // Merge step statuses from file into in-memory plan
      const updatedStatuses: Record<string, PlanStepStatus> = { ...(conv.pendingPlan.stepStatuses ?? {}) };
      for (const step of fileData.steps) {
        if (step.status !== 'pending') {
          updatedStatuses[step.id] = step.status as PlanStepStatus;
        }
      }
      store.setPendingPlan(conversationId, { ...conv.pendingPlan, stepStatuses: updatedStatuses }, conv.planSourceMessageId ?? undefined);
    });

    return unsubscribe;
  }, []);

  // Scroll to UserInputCard when it appears
  useEffect(() => {
    if (pendingUserInput && userInputCardRef.current) {
      setTimeout(() => {
        userInputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [pendingUserInput]);

  const loadMessageFileChanges = useCallback(async (messageId: string) => {
    if (!activeConversationId || !window.electronAPI) return;

    try {
      const changes = await window.electronAPI.file.getChanges(activeConversationId, messageId);
      setMessageFileChanges(prev => {
        const next = new Map(prev);
        next.set(messageId, changes.changes);
        return next;
      });
    } catch (error) {
      console.error('Failed to load file changes:', error);
    }
  }, [activeConversationId]);

  const handleRollback = useCallback(async (messageId: string) => {
    if (!activeConversationId || !window.electronAPI) return;

    const changes = messageFileChanges.get(messageId);
    if (!changes || changes.length === 0) return;

    const confirmed = window.confirm(
      `Rollback ${changes.length} file change${changes.length !== 1 ? 's' : ''}?\n\n` +
      changes.map(c => `- ${c.filePath} (${c.changeType})`).join('\n') +
      '\n\nThis will restore files to their state before this prompt was sent.'
    );

    if (!confirmed) return;

    try {
      const result = await window.electronAPI.file.restore(activeConversationId, messageId);
      if (result.success) {
        alert(`Successfully restored ${result.restoredFiles.length} file${result.restoredFiles.length !== 1 ? 's' : ''}`);
        // Refresh file changes state
        await loadMessageFileChanges(messageId);
      } else {
        alert(`Failed to restore some files:\n${result.failedFiles.join('\n')}`);
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('Rollback failed. See console for details.');
    }
  }, [activeConversationId, messageFileChanges, loadMessageFileChanges]);

  // Load conversation-level file changes
  const loadConversationFileChanges = useCallback(async () => {
    if (!activeConversationId || !window.electronAPI) return;

    try {
      const result = await window.electronAPI.file.getAllChanges(activeConversationId);
      if (result.changes) {
        setConversationFileChanges(result.changes);
      }
    } catch (error) {
      console.error('Failed to load conversation file changes:', error);
    }
  }, [activeConversationId]);

  // Accept a specific tool call change
  const handleAcceptChange = useCallback(async (convId: string, messageId: string, toolCallId: string) => {
    if (!window.electronAPI) return;
    // Immediately update shared store so the editor status bar also clears.
    useAppStore.getState().markToolCallReviewed(toolCallId, 'accepted');
    try {
      console.log(`[ChangeReview] Accepting change: toolCallId=${toolCallId}`);
      await window.electronAPI.agent.respondToChangeReview(convId, messageId, toolCallId, 'accept');
    } catch (err) {
      console.error('[ChangeReview] Failed to accept change:', err);
    }
  }, []);

  // Reject a specific tool call change
  const handleRejectChange = useCallback(async (convId: string, messageId: string, toolCallId: string) => {
    if (!window.electronAPI) return;
    useAppStore.getState().markToolCallReviewed(toolCallId, 'rejected');
    try {
      console.log(`[ChangeReview] Rejecting change: toolCallId=${toolCallId}`);
      await window.electronAPI.agent.respondToChangeReview(convId, messageId, toolCallId, 'reject');
    } catch (err) {
      console.error('[ChangeReview] Failed to reject change:', err);
    }
  }, []);

  // Accept all pending change reviews for the active conversation
  const handleAcceptAll = useCallback(async () => {
    if (!activeConversationId || !window.electronAPI) return;
    for (const previews of messageChangePreviews.values()) {
      for (const preview of previews) {
        if (preview.status === 'pending' && !reviewedToolCallIds.has(preview.toolCallId)) {
          useAppStore.getState().markToolCallReviewed(preview.toolCallId, 'accepted');
        }
      }
    }
    try {
      await window.electronAPI.agent.acceptAllChanges(activeConversationId);
    } catch (err) {
      console.error('[ChangeReview] Failed to accept all changes:', err);
    }
  }, [activeConversationId, messageChangePreviews, reviewedToolCallIds]);

  // Reject all pending change reviews for the active conversation
  const handleRejectAll = useCallback(async () => {
    if (!activeConversationId || !window.electronAPI) return;
    for (const [msgId, previews] of messageChangePreviews) {
      for (const preview of previews) {
        if (preview.status === 'pending' && !reviewedToolCallIds.has(preview.toolCallId)) {
          useAppStore.getState().markToolCallReviewed(preview.toolCallId, 'rejected');
        }
      }
      try {
        await window.electronAPI.agent.rejectAllChanges(activeConversationId, msgId);
      } catch (err) {
        console.error('[ChangeReview] Failed to reject all changes:', err);
      }
    }
  }, [activeConversationId, messageChangePreviews, reviewedToolCallIds]);

  // True when at least one change preview is still awaiting review
  const hasPendingChanges = useMemo(() => {
    for (const previews of messageChangePreviews.values()) {
      for (const p of previews) {
        if (p.status === 'pending' && !reviewedToolCallIds.has(p.toolCallId)) return true;
      }
    }
    return false;
  }, [messageChangePreviews, reviewedToolCallIds]);

  // Handle file review from the file history panel
  const handleReviewFile = useCallback((filePath: string, messageId?: string) => {
    // Open the file in the editor
    const { openFile } = useAppStore.getState();
    openFile(filePath);
  }, []);

  // Handle review all files
  const handleReviewAll = useCallback(() => {
    // For now, just open the first changed file
    // In the future, this could open a diff view of all changes
    if (conversationFileChanges.length > 0) {
      const { openFile } = useAppStore.getState();
      openFile(conversationFileChanges[0].filePath);
    }
  }, [conversationFileChanges]);

  // Get the active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Flatten files for mention search
  const flattenFiles = useCallback((fileList: typeof files): MentionFile[] => {
    const result: MentionFile[] = [];
    const traverse = (items: typeof files) => {
      for (const item of items) {
        result.push({
          path: item.path,
          name: item.name,
          isDirectory: item.isDirectory,
          extension: item.isDirectory ? undefined : item.name.split('.').pop(),
        });
      }
    };
    traverse(fileList);
    return result;
  }, []);
  
  const allFiles = useMemo(() => flattenFiles(files), [files, flattenFiles]);
  
  // Close mention popup helper (defined early for use in effects)
  const closeMentionPopup = useCallback(() => {
    setMentionQuery(null);
    setMentionStartIndex(-1);
    setMentionHighlightedIndex(0);
  }, []);

  // Filter files based on mention query
  const filteredMentionFiles = useMemo(() => {
    if (!mentionQuery) return allFiles.slice(0, 50);
    const query = mentionQuery.toLowerCase();
    return allFiles
      .filter(f => f.name.toLowerCase().includes(query))
      .slice(0, 50);
  }, [allFiles, mentionQuery]);

  // Get the model for the active conversation
  const activeModel = activeConversation?.model || currentModel;
  
  // Extract conversation-specific state for the active conversation
  const messages = activeConversation?.messages || [];
  const streamingContent = activeConversation?.streamingContent || '';
  const isProcessing = activeConversation?.isProcessing || false;
  const toolCalls = activeConversation?.toolCalls || [];
  const orchestrationStatus = activeConversation?.orchestrationStatus || null;
  const pendingPlan = activeConversation?.pendingPlan ?? null;
  const planSourceMessageId = activeConversation?.planSourceMessageId ?? null;
  const planFilePath = activeConversation?.planFilePath ?? null;
  const planningApproach: PlanningApproach = activeConversation?.planningApproach ?? 'one-shot';

  // Map each user message ID to the next assistant message ID that follows it
  const userToAssistantMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user') {
        const next = messages[i + 1];
        if (next?.role === 'assistant') {
          map.set(messages[i].id, next.id);
        }
      }
    }
    return map;
  }, [messages]);

  useEffect(() => {
    if (!toolCalls.some(tool => tool.status === 'running' && tool.toolName === 'Write')) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [toolCalls]);

  // Create initial conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    }
  }, [conversations.length, createConversation]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modelDropdownOpen]);

  // Load past chats when panel is opened
  useEffect(() => {
    if (pastChatsPanelOpen && !pastChatsLoaded) {
      listSavedConversations();
    }
  }, [pastChatsPanelOpen, pastChatsLoaded, listSavedConversations]);

  // Close past chats panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pastChatsPanelRef.current && !pastChatsPanelRef.current.contains(event.target as Node)) {
        setPastChatsPanelOpen(false);
      }
    };
    if (pastChatsPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pastChatsPanelOpen]);

  // Scan for projects when project picker opens
  useEffect(() => {
    if (!projectPickerOpen || !window.electronAPI) return;
    setProjectsLoading(true);
    (async () => {
      try {
        const { value: recentWorkspaces } = await window.electronAPI!.settings.getRecentWorkspaces();
        const workspaces: string[] = recentWorkspaces || [];

        // Collect unique parent directories to scan for sibling projects
        const parentDirs = new Set<string>();
        for (const ws of workspaces) {
          const parent = ws.split('/').slice(0, -1).join('/');
          if (parent) parentDirs.add(parent);
        }
        // Also add the home directory derived from known workspace paths (e.g. /Users/username)
        const homeParts = workspaces[0]?.split('/') || [];
        if (homeParts.length >= 3) {
          parentDirs.add(`/${homeParts[1]}/${homeParts[2]}`);
        }

        const { projects: scanned } = await window.electronAPI!.project.scan([...parentDirs]);

        // Also directly check each recent workspace for .omnicode (covers non-standard locations)
        const directChecks: string[] = [];
        for (const ws of workspaces) {
          if (!ws.endsWith('.omnicode-workspace')) {
            const { projects: direct } = await window.electronAPI!.project.scan(
              [ws.split('/').slice(0, -1).join('/')]
            );
            directChecks.push(...direct);
          }
        }

        const allProjects = [...new Set([...scanned, ...directChecks])].sort((a, b) =>
          a.split('/').pop()!.localeCompare(b.split('/').pop()!)
        );
        setDiscoveredProjects(allProjects);
      } catch (err) {
        console.error('[ChatPanel] Failed to scan projects:', err);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, [projectPickerOpen]);

  // Close project picker panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectPickerRef.current && !projectPickerRef.current.contains(event.target as Node)) {
        setProjectPickerOpen(false);
      }
    };
    if (projectPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [projectPickerOpen]);
  
  // Close mention popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionPopupRef.current && !mentionPopupRef.current.contains(event.target as Node)) {
        if (mentionQuery !== null) {
          closeMentionPopup();
        }
      }
    };
    if (mentionQuery !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mentionQuery, closeMentionPopup]);

  // Handle model switch for the active conversation
  const handleModelSwitch = useCallback(async (modelId: string, providerName: string) => {
    if (!activeConversationId) return;
    try {
      switchConversationModel(activeConversationId, modelId, providerName);
      setModelDropdownOpen(false);
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  }, [activeConversationId, switchConversationModel]);

  // Check if user is near bottom of scroll container (within 100px threshold)
  const checkIsAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Scroll to bottom when messages change — only if user is already near bottom
  useEffect(() => {
    if (isAtBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, streamingContent]);

  // Handle scroll events to detect when user scrolls up/down
  const handleMessagesScroll = useCallback(() => {
    isAtBottomRef.current = checkIsAtBottom();
  }, [checkIsAtBottom]);

  // Auto-save conversations when dirty (debounced)
  useEffect(() => {
    if (!window.electronAPI?.chatStorage) return;

    // Get auto-save settings from settings store (defaults if not set)
    const autoSave = true; // Default
    const autoSaveIntervalMs = 3000; // Default 3 seconds

    if (!autoSave) return;

    // Find dirty conversations
    const dirtyConversations = conversations.filter(c => c.isDirty);
    if (dirtyConversations.length === 0) return;

    // Debounced save for each dirty conversation
    const timeouts: NodeJS.Timeout[] = [];

    for (const conversation of dirtyConversations) {
      // Capture only the ID to avoid a stale closure over the whole conversation
      // object. At fire time we read the latest state from the store so that any
      // messages added after this effect ran (e.g. the assistant turn_complete)
      // are included in the save.
      const convId = conversation.id;
      const timeout = setTimeout(async () => {
        try {
          const freshState = useAppStore.getState();
          const freshConv = freshState.conversations.find(c => c.id === convId);
          if (!freshConv?.isDirty || !freshState.projectPath) return;
          await window.electronAPI!.chatStorage.saveConversation(
            freshState.projectPath,
            freshConv
          );
          // Mark as saved in the store
          useAppStore.setState(state => ({
            conversations: state.conversations.map(c =>
              c.id === convId ? { ...c, isDirty: false } : c
            ),
          }));
        } catch (error) {
          console.error(`Auto-save failed for conversation ${convId}:`, error);
        }
      }, autoSaveIntervalMs);

      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [conversations]);

  // Periodically update context token count
  useEffect(() => {
    if (!activeConversationId || !window.electronAPI?.agent) return;

    const updateTokenCount = async () => {
      try {
        const count = await window.electronAPI.agent.getTokenCount(activeConversationId);
        updateConversationContext(activeConversationId, count);
      } catch (error) {
        // Silently fail - token count is not critical
      }
    };

    // Update immediately
    updateTokenCount();

    // Update every 5 seconds
    const interval = setInterval(updateTokenCount, 5000);

    return () => clearInterval(interval);
  }, [activeConversationId, updateConversationContext]);

  // Load file changes for visible messages
  useEffect(() => {
    if (!activeConversation || !window.electronAPI) return;

    // Load file changes for all assistant messages
    activeConversation.messages.forEach(msg => {
      if (msg.role === 'assistant' && !messageFileChanges.has(msg.id)) {
        loadMessageFileChanges(msg.id);
      }
    });
  }, [activeConversation, loadMessageFileChanges, messageFileChanges]);

  // Load conversation-level file changes
  useEffect(() => {
    if (!activeConversationId || !window.electronAPI) return;
    loadConversationFileChanges();
  }, [activeConversationId, loadConversationFileChanges]);

  // Check if electronAPI is available
  if (!window.electronAPI) {
    return (
      <div className="chat-panel">
        <div className="chat-header">
          <span className="chat-title">Chat</span>
        </div>
        <div className="chat-welcome">
          <Bot size={48} className="chat-welcome-icon" />
          <h3>Chat Unavailable</h3>
          <p>Chat requires Electron to connect to the AI agent.</p>
        </div>
      </div>
    );
  }

  // Setup agent event listener with conversation routing
  useEffect(() => {
    console.log('[ChangeReview DEBUG] Setting up agent event listener');
    const unsubscribe = window.electronAPI!.agent.onEvent((event: unknown) => {
      const agentEvent = event as {
        conversationId: string;
        type: string;
        delta?: { type: string; text?: string };
        message?: unknown;
        toolName?: string;
        toolId?: string;
        input?: Record<string, unknown>;
        result?: { content: string; isError?: boolean; metadata?: Record<string, unknown> };
        totalCost?: number;
        turnCost?: number;
        error?: { message: string };
        capability?: string;
        description?: string;
        taskId?: string;
        success?: boolean;
        durationMs?: number;
        requestId?: string;
        prompt?: string;
        terminalCommand?: string;
        waitForInput?: boolean;
        placeholder?: string;
        summary?: string;
        messageId?: string;
        fileChanges?: FileChange[];
      };

      const { conversationId } = agentEvent;
      
      if (agentEvent.type === 'user_message' || agentEvent.type === 'turn_complete') {
        console.log(`[ChatPanel] Event received: type=${agentEvent.type}, conversationId=${conversationId}`);
      }

      // Route events to the correct conversation
      switch (agentEvent.type) {
        case 'stream_delta':
          if (agentEvent.delta?.type === 'text' && agentEvent.delta.text) {
            const textChunk = typeof agentEvent.delta.text === 'string'
              ? agentEvent.delta.text
              : String(agentEvent.delta.text);
            appendConversationStreaming(conversationId, textChunk);
          }
          break;

        case 'turn_complete': {
          const msg = agentEvent.message as {
            id: string;
            role: string;
            content: string | ContentBlock[];
            reasoning?: string;
            timestamp: number;
            metadata?: unknown;
          };
          console.log(`[ChatPanel] turn_complete: messageId=${msg.id}, role=${msg.role}, hasReasoning=${!!msg.reasoning}, reasoningLength=${msg.reasoning?.length || 0}`);
          if (msg.reasoning) {
            console.log(`[ChatPanel] Reasoning preview: ${msg.reasoning.substring(0, 200)}...`);
          }
          addMessageToConversation(conversationId, {
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            reasoning: msg.reasoning,
            timestamp: msg.timestamp,
            metadata: msg.metadata as Record<string, unknown>,
          });
          setConversationStreaming(conversationId, '');

          // Detect <plan>...</plan> block in architect mode responses
          const conv = useAppStore.getState().conversations.find(c => c.id === conversationId);
          if (conv?.mode === 'architect') {
            const fullText = typeof msg.content === 'string'
              ? msg.content
              : (msg.content as ContentBlock[])
                  .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
                  .map(b => b.text)
                  .join('');
            const planMatch = fullText.match(/<plan>([\s\S]*?)<\/plan>/);
            if (planMatch) {
              try {
                const parsed: PendingPlan = JSON.parse(planMatch[1].trim());
                useAppStore.getState().setPendingPlan(conversationId, parsed, msg.id);
                // Persist to disk and start file watcher
                if (projectPath && window.electronAPI?.plan?.createFile) {
                  window.electronAPI.plan.createFile(projectPath, parsed, conversationId)
                    .then(result => {
                      if (result.success && result.filePath) {
                        useAppStore.getState().setPlanFilePath(conversationId, result.filePath);
                      }
                    })
                    .catch(err => console.error('[ChatPanel] Failed to create plan file:', err));
                }
              } catch {
                // Malformed plan JSON — ignore
              }
            }
          }

          const stopReason = (msg.metadata as Record<string, unknown> | undefined)?.stopReason;
          if (stopReason !== 'tool_use') {
            setConversationProcessing(conversationId, false);
            // Immediately persist the completed response so it survives a quit
            // before the 3-second auto-save debounce fires.
            useAppStore.getState().saveConversation(conversationId).catch(console.error);
            // Request notification sound for completed response
            window.electronAPI!.notifications.requestSound('response_complete').catch(console.error);

            // Flush any buffered change previews into messageChangePreviews keyed
            // under this final assistant message ID (the one actually rendered in the timeline).
            if (pendingChangePreviewsRef.current.length > 0) {
              const buffered = pendingChangePreviewsRef.current;
              pendingChangePreviewsRef.current = [];
              console.log(`[ChangeReview DEBUG] Flushing ${buffered.length} buffered preview(s) to messageId=${msg.id}`);
              setMessageChangePreviews(prev => {
                const next = new Map(prev);
                const existing = next.get(msg.id) || [];
                const merged = [...existing];
                for (const preview of buffered) {
                  if (!merged.some(p => p.toolCallId === preview.toolCallId)) {
                    merged.push(preview);
                  }
                }
                next.set(msg.id, merged);
                return next;
              });
              // Also register each preview in the app store so the editor can
              // show inline diff decorations for the changed files.
              for (const preview of buffered) {
                useAppStore.getState().setFilePendingPreview(preview.filePath, preview);
              }
            }
          }
          break;
        }

        case 'tool_results_complete':
          {
            const toolResultMsg = agentEvent.message as {
              id: string;
              role: string;
              content: string | ContentBlock[];
              timestamp: number;
            };
            if (toolResultMsg) {
              addMessageToConversation(conversationId, {
                id: toolResultMsg.id,
                role: toolResultMsg.role as 'user' | 'assistant' | 'system',
                content: toolResultMsg.content,
                timestamp: toolResultMsg.timestamp,
              });
            }
          }
          break;

        case 'tool_call_start':
          if (agentEvent.toolId) {
            const toolName = agentEvent.toolName || 'unknown';
            // Fetch tool metadata asynchronously
            if (agentEvent.toolId) {
              window.electronAPI!.tool.getMetadata(toolName).then((metadata: any) => {
                if (metadata && agentEvent.toolId) {
                  updateToolCallInConversation(conversationId, agentEvent.toolId, {
                    permissionLevel: metadata.permissionLevel || 'unknown',
                    category: metadata.category || 'unknown',
                  });
                }
              }).catch(() => {
                // Metadata fetch failed, continue without it
              });
            }
            
            addToolCallToConversation(conversationId, {
              id: agentEvent.toolId,
              toolName,
              input: agentEvent.input || {},
              status: 'running',
              phase: 'validating',
              detail: 'Validating tool input.',
              startedAt: Date.now(),
            });
          }
          break;

        case 'permission_request':
          if (agentEvent.toolId) {
            updateToolCallInConversation(conversationId, agentEvent.toolId, {
              status: 'running',
              phase: 'waiting_permission',
              detail: `Waiting for permission to run ${agentEvent.toolName || 'this tool'}.`,
            });
            setPendingPermission({
              toolId: agentEvent.toolId,
              toolName: agentEvent.toolName || 'Tool',
              input: agentEvent.input || {},
            });
          }
          break;

        case 'permission_granted':
          if (agentEvent.toolId) {
            updateToolCallInConversation(conversationId, agentEvent.toolId, {
              status: 'running',
              phase: 'running',
              detail: 'Permission granted. Running tool.',
            });
          }
          break;

        case 'permission_denied':
          if (agentEvent.toolId) {
            updateToolCallInConversation(conversationId, agentEvent.toolId, {
              status: 'error',
              phase: 'permission_denied',
              error: 'Permission denied by user.',
              completedAt: Date.now(),
            });
          }
          break;

        case 'user_input_request': {
          const targetConversation = useAppStore.getState().conversations.find(c => c.id === conversationId);
          if (!targetConversation?.isProcessing) {
            if (agentEvent.requestId) {
              window.electronAPI!.agent.respondUserInput(agentEvent.requestId, '', true);
            }
            break;
          }
          if (agentEvent.requestId) {
            setPendingUserInput({
              requestId: agentEvent.requestId,
              prompt: agentEvent.prompt as string,
              terminalCommand: agentEvent.terminalCommand as string | undefined,
              waitForInput: agentEvent.waitForInput as boolean,
              placeholder: agentEvent.placeholder as string | undefined,
            });
            // Request notification sound since user attention is needed
            window.electronAPI!.notifications.requestSound('user_input').catch(console.error);
          }
          break;
        }

        case 'user_input_responded':
          // User responded to the input request, nothing to do here
          break;

        case 'user_input_cancelled':
          // User cancelled the input request, nothing to do here
          break;

        case 'tool_call_progress':
          if (agentEvent.toolId) {
            const progressMessage = typeof agentEvent.message === 'string'
              ? agentEvent.message
              : '';
            updateToolCallInConversation(conversationId, agentEvent.toolId, {
              status: 'running',
              phase: inferToolPhase(progressMessage),
              detail: progressMessage,
            });
          }
          break;

        case 'tool_call_end':
          if (agentEvent.toolId) {
            updateToolCallInConversation(conversationId, agentEvent.toolId, {
              status: agentEvent.result?.isError ? 'error' : 'completed',
              phase: agentEvent.result?.isError ? 'error' : 'completed',
              detail: undefined,
              result: agentEvent.result?.content,
              error: agentEvent.result?.isError ? agentEvent.result.content : undefined,
              completedAt: Date.now(),
            });

          }
          break;

        case 'file_change':
          if (agentEvent.messageId && agentEvent.fileChanges) {
            setMessageFileChanges(prev => {
              const next = new Map(prev);
              next.set(agentEvent.messageId!, agentEvent.fileChanges!);
              return next;
            });
            // Also refresh conversation-level file changes
            loadConversationFileChanges();
          }
          // Track plan step progress: match changed files against plan step file lists
          {
            const planConv = useAppStore.getState().conversations.find(c => c.id === conversationId);
            if (planConv?.pendingPlan && planConv.mode === 'code' && agentEvent.fileChanges) {
              for (const fileChange of agentEvent.fileChanges) {
                for (const step of planConv.pendingPlan.steps) {
                  if (step.files?.some(f => fileChange.filePath.endsWith(f))) {
                    useAppStore.getState().updatePendingPlanStepStatus(conversationId, step.id, 'completed');
                    // Persist step status to plan file
                    if (planConv.planFilePath && window.electronAPI?.plan?.updateStep) {
                      window.electronAPI.plan.updateStep(planConv.planFilePath, step.id, 'completed').catch(err =>
                        console.error('[ChatPanel] Failed to update plan step on disk:', err)
                      );
                    }
                  }
                }
              }
            }
          }
          break;

        case 'change_preview': {
          const msgId = (agentEvent as any).message?.id as string | undefined;
          const toolId = (agentEvent as any).toolId as string | undefined;
          console.log(`[ChangeReview] change_preview received: file=${(agentEvent as any).filePath}, toolId=${toolId}, messageId=${msgId}`);
          if (toolId) {
            const preview: ChangePreviewData = {
              toolCallId: toolId,
              messageId: msgId || '', // Keep original messageId for API calls (accept/reject)
              filePath: (agentEvent as any).filePath || '',
              fileName: (agentEvent as any).fileName || '',
              toolName: (agentEvent as any).toolName || '',
              changeType: (agentEvent as any).changeType || 'modified',
              startLine: (agentEvent as any).startLine || 0,
              endLine: (agentEvent as any).endLine || 0,
              diffContent: (agentEvent as any).diffContent || '',
              additions: (agentEvent as any).additions || 0,
              deletions: (agentEvent as any).deletions || 0,
              status: 'pending',
            };
            // Buffer the preview — it will be flushed into messageChangePreviews once
            // the final turn_complete (stopReason=end_turn) arrives and we know the
            // real assistant message ID that appears in the rendered timeline.
            const alreadyBuffered = pendingChangePreviewsRef.current.some(p => p.toolCallId === toolId);
            if (!alreadyBuffered) {
              pendingChangePreviewsRef.current = [...pendingChangePreviewsRef.current, preview];
              console.log(`[ChangeReview DEBUG] Buffered preview: toolId=${toolId}, buffer size=${pendingChangePreviewsRef.current.length}`);
            } else {
              console.log(`[ChangeReview DEBUG] Duplicate preview skipped in buffer: toolId=${toolId}`);
            }
          } else {
            console.warn('[ChangeReview] change_preview missing toolId — event dropped', agentEvent);
          }
          break;
        }

        case 'change_accepted':
        case 'change_rejected': {
          const changedToolId = (agentEvent as any).toolId as string | undefined;
          const newStatus = agentEvent.type === 'change_accepted' ? 'accepted' : 'rejected';
          console.log(`[ChangeReview] ${agentEvent.type} received: toolId=${changedToolId}`);
          if (changedToolId) {
            // Collect affectedFilePath inside the updater then call the Zustand
            // store action OUTSIDE the updater. Calling store.set() inside a
            // React state updater triggers "Cannot update a component while
            // rendering a different component".
            let affectedFilePath: string | undefined;
            setMessageChangePreviews(prev => {
              const next = new Map(prev);
              for (const [mid, previews] of next.entries()) {
                next.set(mid, previews.map(p => {
                  if (p.toolCallId === changedToolId) {
                    affectedFilePath = p.filePath;
                    return { ...p, status: newStatus };
                  }
                  return p;
                }));
              }
              return next;
            });
            if (affectedFilePath) {
              useAppStore.getState().clearFilePendingPreview(affectedFilePath);
            }
          }
          break;
        }

        case 'cost_update':
          if (agentEvent.totalCost !== undefined) {
            setCost(
              agentEvent.totalCost,
              0,
              0
            );
          }
          break;

        case 'orchestration_task_start':
          setConversationOrchestrationStatus(
            conversationId,
            `[${agentEvent.capability}] ${agentEvent.description}`
          );
          break;

        case 'orchestration_task_end':
          if (!agentEvent.success) {
            setConversationOrchestrationStatus(conversationId, `Task ${agentEvent.taskId} failed`);
          }
          break;

        case 'orchestration_complete':
          setConversationOrchestrationStatus(conversationId, null);
          break;

        case 'user_message': {
          console.log('[ChatPanel] user_message event received, conversationId=', conversationId, 'raw event=', JSON.stringify(agentEvent).slice(0, 300));
          const userMsg = agentEvent.message as { id: string; role: string; content: string | ContentBlock[]; timestamp: number; fileReferences?: Array<{ path: string; name: string; isDirectory: boolean; extension?: string }> } | undefined;
          if (!userMsg) {
            console.warn('[ChatPanel] user_message event has no message field, skipping');
            break;
          }
          const existingConv = useAppStore.getState().conversations.find(c => c.id === conversationId);
          console.log('[ChatPanel] user_message: conversation found=', !!existingConv, 'message count=', existingConv?.messages.length ?? 0);
          const alreadyExists = existingConv?.messages.some(m => m.id === userMsg.id);
          console.log('[ChatPanel] user_message: alreadyExists=', alreadyExists, 'msgId=', userMsg.id);
          if (!alreadyExists) {
            const contentStr = typeof userMsg.content === 'string'
              ? userMsg.content
              : Array.isArray(userMsg.content)
                ? (userMsg.content as ContentBlock[]).filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
                : String(userMsg.content);
            console.log('[ChatPanel] user_message: adding to conversation, content preview=', contentStr.slice(0, 100));
            addMessageToConversation(conversationId, {
              id: userMsg.id,
              role: 'user',
              content: contentStr,
              timestamp: userMsg.timestamp,
              fileReferences: userMsg.fileReferences,
            });
            setConversationProcessing(conversationId, true);
          }
          break;
        }

        case 'error':
          console.error('Agent error:', agentEvent.error);
          setConversationProcessing(conversationId, false);
          break;
      }
    });

    return () => {
      console.log('[ChangeReview DEBUG] Cleaning up agent event listener');
      unsubscribe();
    };
  }, [addMessageToConversation, appendConversationStreaming, setConversationStreaming, setConversationProcessing, setCost, addToolCallToConversation, updateToolCallInConversation, setConversationOrchestrationStatus, loadConversationFileChanges]);

  const handleSend = useCallback(async () => {
    if ((!inputValue.trim() && attachedImages.length === 0) || isProcessing || !activeConversationId) return;

    const rawMessage = inputValue.trim();
    setInputValue('');

    // In architect mode with one-shot approach, instruct the agent to plan immediately
    const activeConv = useAppStore.getState().conversations.find(c => c.id === activeConversationId);
    const currentApproach = activeConv?.planningApproach ?? 'one-shot';
    const userMessage = (activeConv?.mode === 'architect' && currentApproach === 'one-shot')
      ? `[Generate the complete plan immediately without asking clarifying questions]\n\n${rawMessage}`
      : rawMessage;

    // Snapshot and clear attached images
    const imagesToSend = [...attachedImages];
    setAttachedImages([]);
    
    // Fetch file contents for references
    const resolvedRefs: FileReference[] = [];
    if (selectedReferences.length > 0 && window.electronAPI) {
      for (const ref of selectedReferences) {
        if (!ref.isDirectory && !ref.content) {
          try {
            const result = await window.electronAPI.file.read(ref.path);
            if (!result.error) {
              resolvedRefs.push({ ...ref, content: result.content });
            } else {
              resolvedRefs.push(ref);
            }
          } catch (e) {
            console.error(`Failed to read file ${ref.path}:`, e);
            resolvedRefs.push(ref);
          }
        } else {
          resolvedRefs.push(ref);
        }
      }
    }
    
    // Clear selected references
    setSelectedReferences([]);

    setConversationProcessing(activeConversationId, true);

    try {
      // Send message with file references and optional images
      await window.electronAPI!.agent.sendMessage(
        activeConversationId, 
        userMessage, 
        projectPath || undefined,
        resolvedRefs.length > 0 ? resolvedRefs : undefined,
        imagesToSend.length > 0 ? imagesToSend.map(img => ({ mediaType: img.mediaType, data: img.data })) : undefined
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setConversationProcessing(activeConversationId, false);
    }
  }, [inputValue, attachedImages, isProcessing, activeConversationId, addMessageToConversation, setConversationProcessing, projectPath, selectedReferences]);

  // ── Plan handlers ─────────────────────────────────────────────────────────

  const handlePlanApprove = useCallback(async () => {
    if (!activeConversationId || !pendingPlan) return;
    // Do NOT clear pendingPlan — it stays as a live progress tracker during execution
    setConversationMode(activeConversationId, 'code');

    // Mark plan file as approved on disk
    const currentPlanFilePath = useAppStore.getState().conversations.find(c => c.id === activeConversationId)?.planFilePath;
    if (currentPlanFilePath && window.electronAPI?.plan?.markApproved) {
      window.electronAPI.plan.markApproved(currentPlanFilePath).catch(err =>
        console.error('[ChatPanel] Failed to mark plan approved:', err)
      );
    }

    const planJson = JSON.stringify(pendingPlan, null, 2);
    const planFileNote = currentPlanFilePath
      ? `\n\nThe plan is also saved at \`.omnicode/plan.json\` — update each step's \`status\` field to \`"in_progress"\` when you start it and \`"completed"\` when done.`
      : '';
    const executionMessage =
      `The following plan has been approved. Please execute it step by step:\n\n\`\`\`json\n${planJson}\n\`\`\`\n\nImplement each step in order. Write clean, well-structured code.${planFileNote}`;
    setConversationProcessing(activeConversationId, true);
    try {
      await window.electronAPI!.agent.sendMessage(
        activeConversationId,
        executionMessage,
        projectPath || undefined,
      );
    } catch (error) {
      console.error('Failed to start plan execution:', error);
      setConversationProcessing(activeConversationId, false);
    }
  }, [activeConversationId, pendingPlan, setConversationMode, setConversationProcessing, projectPath]);

  const handlePlanModify = useCallback(() => {
    if (!activeConversationId) return;
    setPendingPlan(activeConversationId, null);
    setInputValue('Please modify the plan: ');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [activeConversationId, setPendingPlan]);

  const handlePlanReject = useCallback(() => {
    if (!activeConversationId) return;
    setPendingPlan(activeConversationId, null);
  }, [activeConversationId, setPendingPlan]);

  const handlePlanDismiss = useCallback(() => {
    if (!activeConversationId) return;
    setPendingPlan(activeConversationId, null);
  }, [activeConversationId, setPendingPlan]);

  // ── Helper: convert PendingPlan → ExecutionPlan for PlanningPanel ─────────

  const convertToExecutionPlan = useCallback((plan: PendingPlan): ExecutionPlan => ({
    id: 'pending',
    title: plan.title,
    description: plan.goal,
    goal: plan.goal,
    files: plan.files as PlanFile[],
    steps: plan.steps.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      files: s.files,
      status: (plan.stepStatuses?.[s.id] ?? 'pending') as PlanStepStatus,
    })),
    risks: plan.risks,
    questions: plan.questions,
  }), []);

  // ─────────────────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle mention popup keyboard navigation
    if (mentionQuery !== null) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setMentionHighlightedIndex(prev => 
            Math.min(prev + 1, filteredMentionFiles.length - 1)
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setMentionHighlightedIndex(prev => Math.max(prev - 1, 0));
          return;
        case 'Enter':
          e.preventDefault();
          if (filteredMentionFiles.length > 0) {
            const selected = filteredMentionFiles[mentionHighlightedIndex];
            if (selected) {
              handleMentionSelect(selected);
            }
          }
          return;
        case 'Escape':
          e.preventDefault();
          closeMentionPopup();
          return;
      }
    }
    
    // Handle @ key to start mention
    if (e.key === '@' && mentionQuery === null) {
      const textarea = inputRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        // Check if @ is at start or preceded by whitespace
        if (cursorPos === 0 || inputValue[cursorPos - 1]?.trim() === '') {
          setMentionStartIndex(cursorPos);
          setMentionQuery('');
          setMentionHighlightedIndex(0);
        }
      }
    }
    
    // Handle send on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, mentionQuery, filteredMentionFiles, mentionHighlightedIndex, inputValue]);
  
  // Handle input changes for mention detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setInputValue(newValue);
    
    // Update mention query if we're in mention mode
    if (mentionQuery !== null && mentionStartIndex >= 0) {
      // Check if cursor is still after the @
      if (cursorPos <= mentionStartIndex) {
        closeMentionPopup();
        return;
      }
      
      // Extract query text
      const queryText = newValue.substring(mentionStartIndex + 1, cursorPos);
      
      // Check if query contains whitespace (end mention)
      if (/\s/.test(queryText)) {
        closeMentionPopup();
        return;
      }
      
      setMentionQuery(queryText);
      setMentionHighlightedIndex(0);
    }
  }, [mentionQuery, mentionStartIndex]);
  
  // Handle file selection from mention popup
  const handleMentionSelect = useCallback((file: MentionFile) => {
    const textarea = inputRef.current;
    if (!textarea || mentionStartIndex < 0) return;
    
    const cursorPos = textarea.selectionStart;
    const beforeMention = inputValue.substring(0, mentionStartIndex);
    const afterMention = inputValue.substring(cursorPos);
    
    // Insert the file reference
    const newText = `${beforeMention}@${file.name} ${afterMention}`;
    setInputValue(newText);
    
    // Add to selected references
    const newRef: FileReference = {
      path: file.path,
      name: file.name,
      isDirectory: file.isDirectory,
      extension: file.extension,
    };
    setSelectedReferences(prev => [...prev, newRef]);
    
    // Close popup and refocus
    closeMentionPopup();
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = mentionStartIndex + file.name.length + 2; // +2 for @ and space
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [inputValue, mentionStartIndex, closeMentionPopup]);
  
  // Remove a selected reference
  const handleRemoveReference = useCallback((refToRemove: FileReference) => {
    setSelectedReferences(prev => prev.filter(r => r.path !== refToRemove.path));
    // Also remove from input text
    const refText = `@${refToRemove.name}`;
    setInputValue(prev => prev.replace(refText, '').replace(/\s+/g, ' ').trim());
  }, []);

  // Process File objects into ImageAttachment entries
  const processImageFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    for (const file of imageFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;
        // Strip the "data:<mediaType>;base64," prefix
        const [header, data] = dataUrl.split(',');
        const mediaType = header.replace('data:', '').replace(';base64', '');
        setAttachedImages(prev => [...prev, { mediaType, data, previewUrl: dataUrl }]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Hidden file-input upload handler
  const handleImageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processImageFiles(e.target.files);
      e.target.value = '';
    }
  }, [processImageFiles]);

  // Remove a single attached image by index
  const handleImageRemove = useCallback((index: number) => {
    setAttachedImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
  }, []);

  // Drag-and-drop handlers on the input container
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) processImageFiles(e.dataTransfer.files);
  }, [processImageFiles]);

  const handleAbort = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await window.electronAPI!.agent.abort(activeConversationId);
      setConversationProcessing(activeConversationId, false);
    } catch (error) {
      console.error('Failed to abort:', error);
    }
  }, [activeConversationId, setConversationProcessing]);

  const handleUserInputRespond = useCallback(async (requestId: string, response: string, cancelled: boolean) => {
    setPendingUserInput(null);
    try {
      await window.electronAPI!.agent.respondUserInput(requestId, response, cancelled);
    } catch (error) {
      console.error('Failed to respond to user input:', error);
    }
  }, []);

  const handlePermissionRespond = useCallback(async (toolId: string, decision: 'allowAlways' | 'allow' | 'deny') => {
    setPendingPermission(null);
    try {
      await window.electronAPI!.agent.respondPermission(toolId, decision);
    } catch (error) {
      console.error('Failed to respond to permission request:', error);
    }
  }, []);

  const handleClear = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await window.electronAPI!.agent.clearConversation(activeConversationId);
      clearConversationMessages(activeConversationId);
      setMessageChangePreviews(new Map());
      pendingChangePreviewsRef.current = [];
      useAppStore.getState().clearAllFilePendingPreviews();
      useAppStore.getState().clearReviewedToolCallIds();
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  }, [activeConversationId, clearConversationMessages]);

  // Tab management handlers
  const handleNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleCloseConversation = useCallback((conversationId: string, hasMessages: boolean) => {
    if (hasMessages) {
      // Could add confirmation dialog here
      const confirmed = window.confirm('Close this conversation? All messages will be lost.');
      if (!confirmed) return;
    }
    closeConversation(conversationId);
  }, [closeConversation]);

  const handleTabClick = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
  }, [setActiveConversation]);

  // Past chats handlers
  const handleTogglePastChats = useCallback(() => {
    setPastChatsPanelOpen(prev => !prev);
  }, []);

  const handleToggleProjectPicker = useCallback(() => {
    setProjectPickerOpen(prev => !prev);
  }, []);

  const handleSelectProject = useCallback(async (path: string) => {
    await openRecentWorkspace(path);
    setProjectPickerOpen(false);
  }, [openRecentWorkspace]);

  const handleOpenPastChat = useCallback(async (conversationId: string) => {
    const success = await openPastChat(conversationId);
    if (success) {
      setPastChatsPanelOpen(false);
    } else {
      alert('Failed to open past chat. It may have been deleted.');
    }
  }, [openPastChat]);

  return (
    <div className="chat-panel">
      {/* Conversation Tabs */}
      <div className="chat-tabs">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`chat-tab ${conversation.id === activeConversationId ? 'active' : ''}`}
            onClick={() => handleTabClick(conversation.id)}
          >
            <MessageSquare size={12} className="chat-tab-icon" />
            <span className="chat-tab-title">{conversation.title}</span>
            {conversation.isProcessing && <span className="chat-tab-indicator" />}
            <button
              className="chat-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseConversation(conversation.id, conversation.messages.length > 0);
              }}
              title="Close conversation"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          className="chat-tab-new"
          onClick={handleNewConversation}
          title="New conversation (Cmd/Ctrl+T)"
        >
          <Plus size={14} />
        </button>
        {projectPath && (
          <button
            className={`chat-tab-past-chats ${pastChatsPanelOpen ? 'active' : ''}`}
            onClick={handleTogglePastChats}
            title="Past Chats"
          >
            <History size={14} />
          </button>
        )}
        <button
          className={`chat-tab-past-chats ${projectPickerOpen ? 'active' : ''}`}
          onClick={handleToggleProjectPicker}
          title="Switch Project"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Project Picker Panel */}
      {projectPickerOpen && (
        <div className="project-picker-panel" ref={projectPickerRef}>
          <div className="past-chats-header">
            <h3>Switch Project</h3>
            <button
              className="past-chats-close"
              onClick={() => setProjectPickerOpen(false)}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="past-chats-list">
            {projectsLoading ? (
              <div className="past-chats-loading">Scanning for projects...</div>
            ) : discoveredProjects.length === 0 ? (
              <div className="past-chats-empty">
                <FolderOpen size={24} />
                <p>No projects with .omnicode found</p>
              </div>
            ) : (
              discoveredProjects.map((p) => {
                const name = p.split('/').pop() || p;
                const parent = p.split('/').slice(0, -1).join('/');
                const isActive = p === projectPath;
                return (
                  <div
                    key={p}
                    className={`past-chat-item project-picker-item ${isActive ? 'active-project' : ''}`}
                    onClick={() => handleSelectProject(p)}
                    title={p}
                  >
                    <div className="past-chat-info">
                      <span className="past-chat-title">{name}</span>
                      <span className="past-chat-meta">{parent}</span>
                    </div>
                    {isActive && <Check size={14} className="project-picker-check" />}
                  </div>
                );
              })
            )}
          </div>
          <div className="project-picker-footer">
            <button
              className="project-picker-open-btn"
              onClick={async () => {
                setProjectPickerOpen(false);
                await openFolder();
              }}
            >
              <FolderOpen size={14} />
              Open Folder
            </button>
          </div>
        </div>
      )}

      {/* Past Chats Panel */}
      {pastChatsPanelOpen && (
        <div className="past-chats-panel" ref={pastChatsPanelRef}>
          <div className="past-chats-header">
            <h3>Past Chats</h3>
            <button
              className="past-chats-close"
              onClick={() => setPastChatsPanelOpen(false)}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="past-chats-list">
            {!pastChatsLoaded ? (
              <div className="past-chats-loading">Loading...</div>
            ) : pastChats.length === 0 ? (
              <div className="past-chats-empty">
                <FolderOpen size={24} />
                <p>No past chats found</p>
              </div>
            ) : (
              pastChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`past-chat-item ${conversations.some(c => c.id === chat.id) ? 'open' : ''}`}
                  onClick={() => handleOpenPastChat(chat.id)}
                >
                  <div className="past-chat-info">
                    <span className="past-chat-title">{chat.title}</span>
                    <span className="past-chat-meta">
                      {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''} • {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {conversations.some(c => c.id === chat.id) && (
                    <span className="past-chat-status">Open</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <span className="chat-title">
          {activeConversation?.title || 'Chat'}
        </span>
        <div className="chat-header-right">
          {/* Model Selector */}
          {activeConversation && (
            <div className="chat-model-selector" ref={modelDropdownRef}>
              <button
                className="chat-model-selector-button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                title="Change model for this conversation"
              >
                <Cpu size={14} />
                <span>{availableModels.find(m => m.id === activeModel)?.name || activeModel}</span>
                <ChevronDown size={12} />
              </button>
              {modelDropdownOpen && (
                <div className="chat-model-dropdown">
                  {availableProviders.map((provider) => (
                    <div key={provider.name} className="chat-model-group">
                      <div className="chat-model-group-header">
                        {provider.name}
                        {!provider.available && <span className="unavailable">(unconfigured)</span>}
                      </div>
                      {availableModels
                        .filter((m) => m.provider === provider.name)
                        .map((model) => {
                          const isCustomModel = model.id.includes('/') || provider.name.startsWith('custom-');
                          return (
                            <button
                              key={model.id}
                              className={`chat-model-option ${model.id === activeModel ? 'active' : ''} ${!model.available ? 'disabled' : ''}`}
                              onClick={() => model.available && handleModelSwitch(model.id, model.provider)}
                              disabled={!model.available}
                            >
                              <span className="chat-model-name">{model.name}</span>
                              {isCustomModel && <span className="chat-model-badge">Custom</span>}
                              {model.id === activeModel && <span className="check">✓</span>}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="chat-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClear}
              title="Clear conversation"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Messages and File Changes */}
      <div className="chat-main-content">
        {/* Messages */}
      <div ref={messagesContainerRef} className="chat-messages" onScroll={handleMessagesScroll}>
        {!activeConversation && (
          <div className="chat-welcome">
            <Bot size={48} className="chat-welcome-icon" />
            <h3>No Active Conversation</h3>
            <p>Click the + button above to start a new conversation.</p>
          </div>
        )}

        {activeConversation && messages.length === 0 && !streamingContent && (
          <div className="chat-welcome">
            <Bot size={48} className="chat-welcome-icon" />
            <h3>Welcome to Omni Code</h3>
            <p>Ask me to help with coding, debugging, refactoring, or any software engineering task.</p>
            <div className="chat-suggestions">
              <button onClick={() => setInputValue('Explain this codebase')}>Explain this codebase</button>
              <button onClick={() => setInputValue('Refactor the selected code')}>Refactor selected code</button>
              <button onClick={() => setInputValue('Find and fix bugs')}>Find and fix bugs</button>
            </div>
          </div>
        )}

        {/* Unified timeline of messages and tool calls */}
        {createTimeline(messages, toolCalls, pendingPlan, planSourceMessageId).map((item, index) => {
          if (item.type === 'message') {
            const message = item.data;

            // Tool-only messages are shown in the timeline via CollapsibleToolSummary, skip here
            if (isToolOnlyMessage(message.content)) {
              return null;
            }

            return (
              <div
                key={message.id}
                className={`chat-message ${message.role}`}
              >
                <div className="chat-message-header">
                  {message.role === 'user'
                    ? <User size={14} />
                    : <Bot size={14} />}
                  <span>
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {message.metadata?.model && (
                    <span className="chat-message-model">
                      {message.metadata.model as string}
                    </span>
                  )}
                </div>
                <div className="chat-message-content">
                  {message.role === 'user' && message.fileReferences && message.fileReferences.length > 0 && (
                    <FileReferenceChipRow references={message.fileReferences} compact readonly />
                  )}
                  {(() => {
                    if (message.role === 'assistant') {
                      console.log(`[ChatPanel] Rendering assistant message: messageId=${message.id}, showThinking=${showThinking}, hasReasoning=${!!message.reasoning}, reasoningLength=${message.reasoning?.length || 0}`);
                    }
                    return null;
                  })()}
                  {message.role === 'assistant' && showThinking && message.reasoning && (
                    <ThinkingSection thinking={message.reasoning} />
                  )}
                  <MessageContent content={message.content} />
                </div>
                {message.role === 'user' && (() => {
                  const assistantMsgId = userToAssistantMap.get(message.id);
                  const changes = assistantMsgId ? (messageFileChanges.get(assistantMsgId) || []) : [];
                  return changes.length > 0 ? (
                    <div className="message-actions">
                      <RollbackButton
                        conversationId={activeConversationId!}
                        messageId={assistantMsgId!}
                        fileChanges={changes}
                        onRollback={handleRollback}
                      />
                    </div>
                  ) : null;
                })()}
                {message.role === 'assistant' && (messageChangePreviews.get(message.id) || []).length > 0 && (
                  <div className="change-review-previews">
                    {(messageChangePreviews.get(message.id) || []).map((preview) => {
                      // Override the status with the shared store value so that
                      // accepting/rejecting from the editor is immediately reflected here.
                      const effectiveStatus = reviewedToolCallIds.get(preview.toolCallId) ?? preview.status;
                      return (
                        <DiffPreviewCard
                          key={preview.toolCallId}
                          preview={{ ...preview, status: effectiveStatus }}
                          onAccept={() => handleAcceptChange(activeConversationId!, preview.messageId, preview.toolCallId)}
                          onReject={() => handleRejectChange(activeConversationId!, preview.messageId, preview.toolCallId)}
                          onOpenFile={(filePath, lineNumber) => {
                            useAppStore.getState().openFile(filePath);
                            // Note: scrolling to line would require additional editor integration
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else if (item.type === 'tool-group') {
            return (
              <CollapsibleToolSummary
                key={`tool-group-${index}`}
                tools={item.data}
                now={now}
              />
            );
          } else if (item.type === 'tool-single') {
            // Single non-SAFE tool - wrap in CollapsibleToolSummary for consistent minimized display
            const tool = item.data;
            return (
              <CollapsibleToolSummary
                key={`tool-single-${index}-${tool.id}`}
                tools={[tool]}
                now={now}
              />
            );
          } else {
            // plan-card — inline plan card injected after the source message
            return (
              <InlinePlanCard
                key="inline-plan-card"
                plan={convertToExecutionPlan(item.data)}
                onApprove={handlePlanApprove}
                onModify={handlePlanModify}
                onReject={handlePlanReject}
                onDismiss={handlePlanDismiss}
                isExecuting={isProcessing && activeConversation?.mode === 'code'}
                onOpenFile={planFilePath ? () => window.electronAPI?.plan?.openFile(planFilePath) : undefined}
              />
            );
          }
        })}

        {/* Streaming message */}
        {streamingContent && (
          <div className="chat-message assistant streaming">
            <div className="chat-message-header">
              <Bot size={14} />
              <span>Assistant</span>
            </div>
            <div className="chat-message-content">
              <MessageContent content={streamingContent} />
            </div>
          </div>
        )}

        {/* Orchestration status */}
        {orchestrationStatus && (
          <div className="chat-status">
            <Terminal size={14} />
            <span>{orchestrationStatus}</span>
          </div>
        )}

        {/* Inline permission card */}
        {pendingPermission && (
          <PermissionCard
            request={pendingPermission}
            onRespond={handlePermissionRespond}
          />
        )}

        {/* Inline user input card */}
        {pendingUserInput && (
          <div ref={userInputCardRef} className="user-input-card-wrapper">
            <UserInputCard
              request={pendingUserInput}
              onRespond={handleUserInputRespond}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Context Usage Indicator */}
      {activeConversation && activeConversation.maxContextTokens && activeConversation.maxContextTokens > 0 && (
        <ContextIndicator 
          used={activeConversation.contextTokens || 0} 
          max={activeConversation.maxContextTokens} 
        />
      )}

      {/* Input */}
      <div
        className={`chat-input-container${isDragOver ? ' drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden image file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageInputChange}
        />

        {/* Selected File References */}
        {selectedReferences.length > 0 && (
          <div className="chat-input-references">
            <FileReferenceChipRow
              references={selectedReferences}
              onRemove={handleRemoveReference}
              compact
              maxChips={4}
            />
          </div>
        )}
        
        {/* Mention Popup */}
        {mentionQuery !== null && (
          <div ref={mentionPopupRef} className="chat-input-mention-popup">
            <MentionPopup
              files={filteredMentionFiles}
              query={mentionQuery || ''}
              highlightedIndex={mentionHighlightedIndex}
              onSelect={handleMentionSelect}
              onClose={closeMentionPopup}
            />
          </div>
        )}
        
        {/* File History Toggle Toolbar */}
        {conversationFileChanges.length > 0 && (
          <div className="chat-input-toolbar file-history-toolbar">
            <div className="file-history-toggle-container">
              <button
                className={`file-history-toggle-btn ${fileHistoryPopupVisible ? 'active' : ''}`}
                onClick={toggleFileHistoryPopup}
                type="button"
              >
                <Files size={14} />
                <span>{conversationFileChanges.length} Files</span>
                {(() => {
                  const totalAdditions = conversationFileChanges.reduce((sum, f) => sum + f.additions, 0);
                  const totalDeletions = conversationFileChanges.reduce((sum, f) => sum + f.deletions, 0);
                  return (
                    <>
                      {totalAdditions > 0 && (
                        <span className="file-history-toggle-additions">+{totalAdditions}</span>
                      )}
                      {totalDeletions > 0 && (
                        <span className="file-history-toggle-deletions">-{totalDeletions}</span>
                      )}
                    </>
                  );
                })()}
              </button>
              
              {/* File History Popup - positioned below the button */}
              {fileHistoryPopupVisible && (
                <FileHistoryPopup
                  files={conversationFileChanges.map(change => ({
                    filePath: change.filePath,
                    fileName: change.fileName || change.filePath.split('/').pop() || change.filePath,
                    extension: change.extension || change.filePath.split('.').pop() || '',
                    changeType: change.changeType,
                    additions: change.additions,
                    deletions: change.deletions,
                  }))}
                  isPinned={fileHistoryPopupPinned}
                  onClose={hideFileHistoryPopup}
                  onPinToggle={pinFileHistoryPopup}
                  onReviewFile={handleReviewFile}
                  onReviewAll={handleReviewAll}
                />
              )}
            </div>
            {hasPendingChanges && (
              <div className="file-history-toolbar-actions">
                <button className="btn-reject-all" onClick={handleRejectAll} type="button">
                  Reject All
                </button>
                <button className="btn-accept-all" onClick={handleAcceptAll} type="button">
                  Accept All
                </button>
              </div>
            )}
          </div>
        )}
        {/* Attached Image Previews */}
        {attachedImages.length > 0 && (
          <div className="chat-image-previews">
            {attachedImages.map((img, index) => (
              <div key={index} className="chat-image-thumb">
                <img src={img.previewUrl} alt={`attachment ${index + 1}`} />
                <button
                  className="chat-image-remove"
                  onClick={() => handleImageRemove(index)}
                  type="button"
                  title="Remove image"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? 'Processing...' : 'Type a message... Use @ to reference files'}
            disabled={isProcessing || !activeConversation}
            rows={1}
          />
          <div className="chat-input-actions">
            {/* Image upload button */}
            {!isProcessing && (
              <button
                className="btn btn-ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={!activeConversation}
                title="Attach image"
                type="button"
              >
                <ImagePlus size={16} />
              </button>
            )}
            {isProcessing ? (
              <button
                className="btn btn-primary"
                onClick={handleAbort}
                title="Stop"
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={(!inputValue.trim() && attachedImages.length === 0) || !activeConversation}
                title="Send (Enter)"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector - compact popup below input */}
        {activeConversation && (
          <div className="chat-input-mode-bar">
            <span className="mode-bar-label">Mode:</span>
            <ModeSelector
              value={(activeConversation?.mode as AIMode) || 'code'}
                onChange={(mode) => {
                  setConversationMode(activeConversation?.id || '', mode);
                }}
              disabled={activeConversation?.isProcessing || false}
            />
            {/* Planning approach toggle — only visible in architect mode */}
            {activeConversation?.mode === 'architect' && (
              <div className="planning-approach-toggle" title="Choose how the agent plans">
                <button
                  className={`approach-btn${planningApproach === 'one-shot' ? ' active' : ''}`}
                  onClick={() => setPlanningApproach(activeConversation.id, 'one-shot')}
                  disabled={isProcessing}
                  title="Generate the full plan in one response"
                >
                  One-shot
                </button>
                <button
                  className={`approach-btn${planningApproach === 'iterative' ? ' active' : ''}`}
                  onClick={() => setPlanningApproach(activeConversation.id, 'iterative')}
                  disabled={isProcessing}
                  title="Agent asks clarifying questions before planning"
                >
                  Iterative
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
