import React from 'react';
import { Box, Text } from 'ink';
import { APP_NAME, APP_VERSION } from '../../constants.js';
import { theme } from '../theme.js';

interface WelcomeScreenProps {
  model: string;
  provider: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ model, provider }) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={theme.colors.primary}>
        {APP_NAME} v{APP_VERSION}
      </Text>
      <Text dimColor>
        Multi-LLM AI coding assistant for the terminal
      </Text>
      <Text dimColor>
        Model: <Text color={theme.colors.secondary}>{model}</Text> ({provider})
      </Text>
      <Text dimColor>
        Type a message to get started. Use /help for commands, /model to switch models.
      </Text>
    </Box>
  );
};
