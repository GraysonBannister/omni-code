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
  contextTokens?: number;
  maxContextTokens?: number;
}

const CONTEXT_BAR_WIDTH = 12;

function renderContextBar(used: number, max: number): React.ReactElement {
  const ratio = Math.min(used / max, 1);
  const filled = Math.round(ratio * CONTEXT_BAR_WIDTH);
  const empty = CONTEXT_BAR_WIDTH - filled;
  const pct = Math.round(ratio * 100);
  const color = ratio > 0.9 ? 'red' : ratio > 0.7 ? 'yellow' : 'green';

  return (
    <Text>
      <Text color={color}>{'█'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(empty)}</Text>
      <Text dimColor> {pct}%</Text>
    </Text>
  );
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
  contextTokens,
  maxContextTokens,
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
      {contextTokens !== undefined && maxContextTokens !== undefined && maxContextTokens > 0 && (
        <>
          <Text dimColor> | </Text>
          {renderContextBar(contextTokens, maxContextTokens)}
        </>
      )}
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
