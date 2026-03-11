import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Trash2, Bot, User, Terminal, Plus, X, MessageSquare, Cpu, ChevronDown, Undo, History, FolderOpen, Files } from 'lucide-react';
import { FileHistoryPopup } from './FileHistoryPopup';
import { ModeSelector, AIMode } from './ModeSelector';
import { UserInputCard, type UserInputRequest } from './UserInputCard';
import { PermissionCard, type PermissionRequest } from './PermissionCard';
import { CollapsibleToolSummary } from './CollapsibleToolSummary';
import { useAppStore, type ToolCall } from '../stores/appStore';
import type { ContentBlock } from '../../src/core/message-types.js';
import './ChatPanel.css';

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

function isToolResultMessageContent(content: string | ContentBlock[] | null | undefined): boolean {
  return Array.isArray(content) && content.some((block) => block.type === 'tool_result');
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

const MessageContent: React.FC<{ content: string | ContentBlock[] | null | undefined }> = ({ content }) => {
  if (typeof content === 'string') {
    return <>{renderTextContent(content, 'string')}</>;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  return (
    <>
      {content.map((block, index) => {
        if (block.type === 'text') {
          return <React.Fragment key={`block-${index}`}>{renderTextContent(block.text, `block-${index}`)}</React.Fragment>;
        }

        if (block.type === 'tool_use') {
          return (
            <div key={block.id} className="chat-inline-tool-call">
              <Terminal size={14} />
              <span className="chat-inline-tool-call-name">{block.name}</span>
              <span className="chat-inline-tool-call-input">{formatToolInput(block.input)}</span>
            </div>
          );
        }

        if (block.type === 'tool_result') {
          const resultText = typeof block.content === 'string' ? block.content : extractTextFromBlocks(block.content);
          if (!resultText) {
            return null;
          }

          return (
            <div
              key={`tool-result-${index}`}
              className={`chat-tool-result ${block.isError ? 'error' : 'success'}`}
            >
              <div className="chat-tool-result-label">
                <Terminal size={14} />
                <span>{block.isError ? 'Tool error' : 'Tool result'}</span>
              </div>
              <div className="chat-tool-result-content">
                {renderTextContent(resultText, `tool-result-${index}`)}
              </div>
            </div>
          );
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
  | { type: 'tool-single'; data: ToolCall; timestamp: number };

function createTimeline(messages: Message[], toolCalls: ToolCall[]): TimelineItem[] {
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
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [now, setNow] = useState(Date.now());
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [pastChatsPanelOpen, setPastChatsPanelOpen] = useState(false);
  const [messageFileChanges, setMessageFileChanges] = useState<Map<string, FileChange[]>>(new Map());
  const [conversationFileChanges, setConversationFileChanges] = useState<FileChange[]>([]);
  const [pendingUserInput, setPendingUserInput] = useState<UserInputRequest | null>(null);
  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const pastChatsPanelRef = useRef<HTMLDivElement>(null);
  const userInputCardRef = useRef<HTMLDivElement>(null);

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
      '\n\nThis will restore files to their state before this message.'
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

  // Get the model for the active conversation
  const activeModel = activeConversation?.model || currentModel;
  
  // Extract conversation-specific state for the active conversation
  const messages = activeConversation?.messages || [];
  const streamingContent = activeConversation?.streamingContent || '';
  const isProcessing = activeConversation?.isProcessing || false;
  const toolCalls = activeConversation?.toolCalls || [];
  const orchestrationStatus = activeConversation?.orchestrationStatus || null;

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
    const unsubscribe = window.electronAPI!.agent.onEvent((event: unknown) => {
      const agentEvent = event as {
        conversationId: string;
        type: string;
        delta?: { type: string; text?: string };
        message?: unknown;
        toolName?: string;
        toolId?: string;
        input?: Record<string, unknown>;
        result?: { content: string; isError?: boolean };
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

        case 'turn_complete':
          const msg = agentEvent.message as { 
            id: string; 
            role: string; 
            content: string | ContentBlock[];
            timestamp: number;
            metadata?: unknown;
          };
          addMessageToConversation(conversationId, {
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: msg.timestamp,
            metadata: msg.metadata as Record<string, unknown>,
          });
          setConversationStreaming(conversationId, '');
          if ((msg.metadata as Record<string, unknown> | undefined)?.stopReason !== 'tool_use') {
            setConversationProcessing(conversationId, false);
            // Immediately persist the completed response so it survives a quit
            // before the 3-second auto-save debounce fires.
            useAppStore.getState().saveConversation(conversationId).catch(console.error);
          }
          break;

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
          break;

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

        case 'error':
          console.error('Agent error:', agentEvent.error);
          setConversationProcessing(conversationId, false);
          break;
      }
    });

    return () => unsubscribe();
  }, [addMessageToConversation, appendConversationStreaming, setConversationStreaming, setConversationProcessing, setCost, addToolCallToConversation, updateToolCallInConversation, setConversationOrchestrationStatus, loadConversationFileChanges]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isProcessing || !activeConversationId) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message to active conversation
    addMessageToConversation(activeConversationId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    setConversationProcessing(activeConversationId, true);

    try {
      await window.electronAPI!.agent.sendMessage(activeConversationId, userMessage, projectPath || undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
      setConversationProcessing(activeConversationId, false);
    }
  }, [inputValue, isProcessing, activeConversationId, addMessageToConversation, setConversationProcessing, projectPath]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
      </div>

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
          <ModeSelector
              value={(activeConversation?.mode as AIMode) || 'code'}
              onChange={(mode) => setConversationMode(activeConversation?.id || '', mode)}
              disabled={activeConversation?.isProcessing || false}
            />
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
                        .map((model) => (
                          <button
                            key={model.id}
                            className={`chat-model-option ${model.id === activeModel ? 'active' : ''} ${!model.available ? 'disabled' : ''}`}
                            onClick={() => model.available && handleModelSwitch(model.id, model.provider)}
                            disabled={!model.available}
                          >
                            {model.name}
                            {model.id === activeModel && <span className="check">✓</span>}
                          </button>
                        ))}
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
      <div className="chat-messages">
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
        {createTimeline(messages, toolCalls).map((item, index) => {
          if (item.type === 'message') {
            const message = item.data;
            return (
              <div
                key={message.id}
                className={`chat-message ${isToolResultMessageContent(message.content) ? 'tool' : message.role} ${hasToolErrorContent(message.content) ? 'tool-error' : ''}`}
              >
                <div className="chat-message-header">
                  {isToolResultMessageContent(message.content)
                    ? <Terminal size={14} />
                    : message.role === 'user'
                      ? <User size={14} />
                      : <Bot size={14} />}
                  <span>
                    {isToolResultMessageContent(message.content)
                      ? (hasToolErrorContent(message.content) ? 'Tool Error' : 'Tool Output')
                      : message.role === 'user'
                        ? 'You'
                        : 'Assistant'}
                  </span>
                  {message.metadata?.model && (
                    <span className="chat-message-model">
                      {message.metadata.model as string}
                    </span>
                  )}
                </div>
                <div className="chat-message-content">
                  <MessageContent content={message.content} />
                </div>
                {message.role === 'assistant' && (
                  <div className="message-actions">
                    <RollbackButton
                      conversationId={activeConversationId!}
                      messageId={message.id}
                      fileChanges={messageFileChanges.get(message.id) || []}
                      onRollback={handleRollback}
                    />
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
          } else {
            const tool = item.data;
            return (
              <div key={tool.id} className={`chat-tool-call ${tool.status}`}>
                <Terminal size={14} />
                <span className="chat-tool-call-name">{tool.toolName}</span>
                <span className="chat-tool-call-status">{tool.status}</span>
                {!tool.error && !tool.result && getToolStatusDetail(tool, now) && (
                  <span className="chat-tool-call-detail">{getToolStatusDetail(tool, now)}</span>
                )}
                {tool.error && <span className="chat-tool-call-detail">{tool.error}</span>}
                {!tool.error && tool.result && <span className="chat-tool-call-detail">{tool.result}</span>}
              </div>
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
      <div className="chat-input-container">
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
          </div>
        )}
        <textarea
          ref={inputRef}
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
          disabled={isProcessing || !activeConversation}
          rows={1}
        />
        <div className="chat-input-actions">
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
              disabled={!inputValue.trim() || !activeConversation}
              title="Send (Enter)"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
