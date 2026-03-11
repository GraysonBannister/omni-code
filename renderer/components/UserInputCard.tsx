import React, { useState, useRef, useEffect, memo } from 'react';
import { MessageSquare, Terminal, Copy, Check, X } from 'lucide-react';
import './UserInputCard.css';

export interface UserInputRequest {
  requestId: string;
  prompt: string;
  terminalCommand?: string;
  waitForInput: boolean;
  placeholder?: string;
}

interface Props {
  request: UserInputRequest;
  onRespond: (requestId: string, response: string, cancelled: boolean) => void;
}

export const UserInputCard: React.FC<Props> = memo(({ request, onRespond }) => {
  const { requestId, prompt, terminalCommand, waitForInput, placeholder } = request;
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (waitForInput) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [waitForInput]);

  const handleSubmit = () => {
    onRespond(requestId, response, false);
  };

  const handleCancel = () => {
    onRespond(requestId, '', true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter creates a new line (default textarea behavior)
  };

  const copyCommand = async () => {
    if (terminalCommand) {
      await navigator.clipboard.writeText(terminalCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="user-input-card">
      <div className="user-input-card-header">
        <MessageSquare size={14} />
        <span>Agent is waiting for your input</span>
        <button className="user-input-card-close" onClick={handleCancel} title="Cancel">
          <X size={12} />
        </button>
      </div>

      <div className="user-input-card-prompt">{prompt}</div>

      {terminalCommand && (
        <div className="user-input-card-command">
          <div className="user-input-card-command-label">
            <Terminal size={12} />
            <span>Run in your terminal:</span>
          </div>
          <div className="user-input-card-command-block">
            <code>{terminalCommand}</code>
            <button
              className="user-input-card-copy"
              onClick={copyCommand}
              title="Copy command"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {waitForInput && (
        <textarea
          ref={textareaRef}
          className="user-input-card-textarea"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type your response...'}
          rows={3}
        />
      )}

      <div className="user-input-card-actions">
        <button className="user-input-card-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="user-input-card-btn-submit" onClick={handleSubmit}>
          {waitForInput ? 'Submit (Enter)' : 'Done'}
        </button>
      </div>
    </div>
  );
});

UserInputCard.displayName = 'UserInputCard';
