import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { WelcomeScreen } from './WelcomeScreen.js';
import { StatusBar } from './StatusBar.js';
import { MessageDisplay } from './MessageDisplay.js';
import { PermissionPrompt } from './PermissionPrompt.js';
import type { Agent, AgentEvent } from '../../core/agent-types.js';
import type { UnifiedMessage } from '../../core/message-types.js';
import { getTextContent } from '../../core/message-types.js';

interface REPLProps {
  agent: Agent;
  model: string;
  provider: string;
  onSlashCommand?: (command: string) => Promise<string | void>;
}

export const REPL: React.FC<REPLProps> = ({ agent, model, provider, onSlashCommand }) => {
  const { exit } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [permissionRequest, setPermissionRequest] = useState<{
    toolName: string;
    input: Record<string, unknown>;
    onAllow: () => void;
    onDeny: () => void;
    onAllowAlways: () => void;
  } | null>(null);

  // Handle Ctrl+C to exit
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      if (isProcessing) {
        agent.abort();
      } else {
        exit();
      }
    }
  });

  const handleSubmit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInputValue('');
    setCommandOutput(null);

    // Handle slash commands
    if (trimmed.startsWith('/')) {
      if (onSlashCommand) {
        const result = await onSlashCommand(trimmed);
        if (result) {
          setCommandOutput(result);
        }
      }
      return;
    }

    // Add user message to display
    const userMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setStreamingText('');

    try {
      let currentText = '';
      for await (const event of agent.run(trimmed)) {
        switch (event.type) {
          case 'stream_delta':
            if (event.delta.type === 'text' && event.delta.text) {
              currentText += event.delta.text;
              setStreamingText(currentText);
            }
            break;

          case 'turn_complete':
            setMessages(prev => [...prev, event.message]);
            setStreamingText('');
            currentText = '';
            break;

          case 'tool_call_start':
            // Tool calls are shown via turn_complete message
            break;

          case 'cost_update':
            setTotalCost(event.totalCost);
            break;

          case 'error':
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Error: ${event.error.message}`,
              timestamp: Date.now(),
            }]);
            break;
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${(error as Error).message}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsProcessing(false);
      setStreamingText('');
    }
  }, [agent, onSlashCommand]);

  return (
    <Box flexDirection="column" minHeight={10}>
      <WelcomeScreen model={model} provider={provider} />

      {/* Message history */}
      {messages.map((msg) => (
        <MessageDisplay key={msg.id} message={msg} />
      ))}

      {/* Streaming text */}
      {streamingText && (
        <Box>
          <Text color="magenta" bold>{'● '}</Text>
          <Text>{streamingText}</Text>
          <Text dimColor>▊</Text>
        </Box>
      )}

      {/* Command output */}
      {commandOutput && (
        <Box marginY={1}>
          <Text>{commandOutput}</Text>
        </Box>
      )}

      {/* Permission prompt */}
      {permissionRequest && (
        <PermissionPrompt
          toolName={permissionRequest.toolName}
          input={permissionRequest.input}
          onAllow={permissionRequest.onAllow}
          onDeny={permissionRequest.onDeny}
          onAllowAlways={permissionRequest.onAllowAlways}
        />
      )}

      {/* Input bar */}
      <Box marginTop={1}>
        <Text color="green" bold>{'❯ '}</Text>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
        />
      </Box>

      {/* Status bar */}
      <StatusBar
        model={model}
        provider={provider}
        totalCost={totalCost}
        inputTokens={inputTokens}
        outputTokens={outputTokens}
        isProcessing={isProcessing}
        planMode={agent.config.planMode || false}
      />
    </Box>
  );
};
