import React from 'react';
import { Box, Text, useInput } from 'ink';

interface PermissionPromptProps {
  toolName: string;
  input: Record<string, unknown>;
  onAllow: () => void;
  onDeny: () => void;
  onAllowAlways: () => void;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  toolName,
  input,
  onAllow,
  onDeny,
  onAllowAlways,
}) => {
  useInput((key) => {
    if (key === 'y' || key === 'Y') onAllow();
    else if (key === 'n' || key === 'N') onDeny();
    else if (key === 'a' || key === 'A') onAllowAlways();
  });

  // Format input for display, truncating long values
  const formatInput = (obj: Record<string, unknown>): string => {
    const entries = Object.entries(obj).map(([k, v]) => {
      const val = typeof v === 'string'
        ? (v.length > 100 ? v.substring(0, 100) + '...' : v)
        : JSON.stringify(v);
      return `  ${k}: ${val}`;
    });
    return entries.join('\n');
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      marginY={1}
    >
      <Text bold color="yellow">
        Permission Request
      </Text>
      <Text>
        Tool: <Text bold>{toolName}</Text>
      </Text>
      <Text dimColor>{formatInput(input)}</Text>
      <Box marginTop={1}>
        <Text>
          <Text color="green">[y]</Text> Allow  {' '}
          <Text color="red">[n]</Text> Deny  {' '}
          <Text color="cyan">[a]</Text> Always allow
        </Text>
      </Box>
    </Box>
  );
};
