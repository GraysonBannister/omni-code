import React from 'react';
import { Box, Text } from 'ink';
import type { UnifiedMessage } from '../../core/message-types.js';
import { getTextContent, getToolUseBlocks } from '../../core/message-types.js';

interface MessageDisplayProps {
  message: UnifiedMessage;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  if (message.role === 'user') {
    const text = getTextContent(message);
    // Don't display tool result messages to the user
    if (typeof message.content !== 'string' && !text) return null;

    return (
      <Box marginY={0}>
        <Text color="blue" bold>
          {'> '}
        </Text>
        <Text>{text}</Text>
      </Box>
    );
  }

  if (message.role === 'assistant') {
    const text = getTextContent(message);
    const toolCalls = getToolUseBlocks(message);

    return (
      <Box flexDirection="column" marginY={0}>
        {/* Reasoning/thinking display */}
        {message.reasoning && (
          <Box marginLeft={2} paddingX={1} borderStyle="single" borderColor="gray">
            <Text dimColor italic>
              {'💭 '}
              {message.reasoning.length > 500
                ? message.reasoning.substring(0, 500) + '...'
                : message.reasoning}
            </Text>
          </Box>
        )}

        {text && (
          <Box>
            <Text color="magenta" bold>
              {'● '}
            </Text>
            <Text>{text}</Text>
          </Box>
        )}
        {toolCalls.map((tc) => {
          const inputStr = formatToolInput(tc.input);
          // Check if tool result contains diff output
          return (
            <Box key={tc.id} marginLeft={2}>
              <Text color="yellow">
                {'⚡ '}{tc.name}
              </Text>
              <Text dimColor>
                {' '}({inputStr})
              </Text>
            </Box>
          );
        })}
      </Box>
    );
  }

  return null;
};

/** Render diff output with color highlighting */
export const DiffDisplay: React.FC<{ diff: string }> = ({ diff }) => {
  const lines = diff.split('\n');
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        if (line.startsWith('+++') || line.startsWith('---')) {
          return <Text key={i} bold>{line}</Text>;
        }
        if (line.startsWith('diff --git') || line.startsWith('index ')) {
          return <Text key={i} bold dimColor>{line}</Text>;
        }
        if (line.startsWith('@@')) {
          return <Text key={i} color="cyan">{line}</Text>;
        }
        if (line.startsWith('+')) {
          return <Text key={i} color="green">{line}</Text>;
        }
        if (line.startsWith('-')) {
          return <Text key={i} color="red">{line}</Text>;
        }
        return <Text key={i}>{line}</Text>;
      })}
    </Box>
  );
};

function formatToolInput(input: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const truncated = value.length > 60 ? value.substring(0, 60) + '...' : value;
      parts.push(`${key}: "${truncated}"`);
    } else {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return parts.join(', ');
}
