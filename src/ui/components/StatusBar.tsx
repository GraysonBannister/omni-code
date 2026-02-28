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
}

export const StatusBar: React.FC<StatusBarProps> = ({
  model,
  provider,
  totalCost,
  inputTokens,
  outputTokens,
  isProcessing,
  planMode,
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
      {isProcessing && (
        <>
          <Text dimColor> | </Text>
          <Text color="yellow">thinking...</Text>
        </>
      )}
    </Box>
  );
};
