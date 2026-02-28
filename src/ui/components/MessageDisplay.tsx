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
        {text && (
          <Box>
            <Text color="magenta" bold>
              {'● '}
            </Text>
            <Text>{text}</Text>
          </Box>
        )}
        {toolCalls.map((tc) => (
          <Box key={tc.id} marginLeft={2}>
            <Text color="yellow">
              {'⚡ '}{tc.name}
            </Text>
            <Text dimColor>
              {' '}({formatToolInput(tc.input)})
            </Text>
          </Box>
        ))}
      </Box>
    );
  }

  return null;
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
