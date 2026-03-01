import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  model: string;
  provider: string;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  isProcessing: boolean;
  planMode: boolean;
  sessionId?: string;
  memoryCount?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  model,
  provider,
  totalCost,
  inputTokens,
  outputTokens,
  isProcessing,
  planMode,
  sessionId,
  memoryCount,
}) => {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      {planMode && (
        <Text color="yellow" bold>
          [PLAN MODE]{' '}
        </Text>
      )}
      <Text dimColor>
        {provider}/{model}
      </Text>
      <Text dimColor> | </Text>
      <Text dimColor>
        {inputTokens.toLocaleString()}↑ {outputTokens.toLocaleString()}↓
      </Text>
      <Text dimColor> | </Text>
      <Text dimColor>
        ${totalCost.toFixed(4)}
      </Text>
      {sessionId && (
        <>
          <Text dimColor> | </Text>
          <Text dimColor>
            sess:{sessionId.substring(0, 8)}
          </Text>
        </>
      )}
      {memoryCount !== undefined && memoryCount > 0 && (
        <>
          <Text dimColor> | </Text>
          <Text dimColor>
            {memoryCount} memories
          </Text>
        </>
      )}
      {isProcessing && (
        <>
          <Text dimColor> | </Text>
          <Text color="yellow">thinking...</Text>
        </>
      )}
    </Box>
  );
};
