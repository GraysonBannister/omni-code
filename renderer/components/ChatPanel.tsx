import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Trash2, Bot, User, Terminal } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
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
          return resultText
            ? <React.Fragment key={`tool-result-${index}`}>{renderTextContent(resultText, `tool-result-${index}`)}</React.Fragment>
            : null;
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

export const ChatPanel: React.FC = () => {
  const {
    messages,
    streamingContent,
    isProcessing,
    toolCalls,
    orchestrationStatus,
    addMessage,
    setIsProcessing,
    setStreamingContent,
    appendStreamingContent,
    clearMessages,
    setCost,
    addToolCall,
    updateToolCall,
    setOrchestrationStatus,
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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

  // Setup agent event listener
  useEffect(() => {
    const unsubscribe = window.electronAPI!.agent.onEvent((event: unknown) => {
      const agentEvent = event as {
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
        summary?: string;
      };

      switch (agentEvent.type) {
        case 'stream_delta':
          if (agentEvent.delta?.type === 'text' && agentEvent.delta.text) {
            // Ensure we only append valid strings
            const textChunk = typeof agentEvent.delta.text === 'string' 
              ? agentEvent.delta.text 
              : String(agentEvent.delta.text);
            appendStreamingContent(textChunk);
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
          addMessage({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: msg.timestamp,
            metadata: msg.metadata as Record<string, unknown>,
          });
          setStreamingContent('');
          setIsProcessing(false);
          break;

        case 'tool_call_start':
          if (agentEvent.toolId) {
            addToolCall({
              id: agentEvent.toolId,
              toolName: agentEvent.toolName || 'unknown',
              input: agentEvent.input || {},
              status: 'running',
            });
          }
          break;

        case 'tool_call_end':
          if (agentEvent.toolId) {
            updateToolCall(agentEvent.toolId, {
              status: agentEvent.result?.isError ? 'error' : 'completed',
              result: agentEvent.result?.content,
              error: agentEvent.result?.isError ? agentEvent.result.content : undefined,
            });
          }
          break;

        case 'cost_update':
          if (agentEvent.totalCost !== undefined) {
            setCost(
              agentEvent.totalCost,
              0, // inputTokens would come from metadata
              0  // outputTokens would come from metadata
            );
          }
          break;

        case 'orchestration_task_start':
          setOrchestrationStatus(
            `[${agentEvent.capability}] ${agentEvent.description}`
          );
          break;

        case 'orchestration_task_end':
          if (!agentEvent.success) {
            setOrchestrationStatus(`Task ${agentEvent.taskId} failed`);
          }
          break;

        case 'orchestration_complete':
          setOrchestrationStatus(null);
          break;

        case 'error':
          console.error('Agent error:', agentEvent.error);
          setIsProcessing(false);
          break;
      }
    });

    return () => unsubscribe();
  }, [addMessage, appendStreamingContent, setStreamingContent, setIsProcessing, setCost, addToolCall, updateToolCall, setOrchestrationStatus]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    setIsProcessing(true);

    try {
      await window.electronAPI!.agent.sendMessage(userMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, addMessage, setIsProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleAbort = useCallback(async () => {
    try {
      await window.electronAPI!.agent.abort();
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to abort:', error);
    }
  }, [setIsProcessing]);

  const handleClear = useCallback(async () => {
    try {
      await window.electronAPI!.agent.clearConversation();
      clearMessages();
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  }, [clearMessages]);

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-title">Chat</span>
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

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !streamingContent && (
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

        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.role}`}
          >
            <div className="chat-message-header">
              {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
              {message.metadata?.model && (
                <span className="chat-message-model">
                  {message.metadata.model as string}
                </span>
              )}
            </div>
            <div className="chat-message-content">
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}

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

        {/* Tool calls */}
        {toolCalls.filter(t => t.status === 'running').map((tool) => (
          <div key={tool.id} className="chat-tool-call">
            <Terminal size={14} />
            <span>{tool.toolName}...</span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
          disabled={isProcessing}
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
              disabled={!inputValue.trim()}
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
